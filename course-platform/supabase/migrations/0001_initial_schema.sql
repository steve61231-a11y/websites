-- Phase 2 schema. Not used by the Phase 1 demo (which runs on sample data),
-- but the demo's data shapes map 1:1 onto these tables.

create type user_role as enum ('student', 'instructor', 'admin');
create type course_status as enum ('draft', 'coming_soon', 'published', 'archived');
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type enrollment_status as enum ('active', 'revoked', 'expired');
create type question_type as enum ('multiple_choice', 'true_false', 'scenario');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  email text not null unique,
  avatar_url text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  code text not null unique,               -- used in certificate numbers, e.g. PHOTO
  title text not null,
  description text not null default '',
  thumbnail_url text,
  price integer not null,                  -- minor units (KES cents)
  currency text not null default 'KES',
  status course_status not null default 'draft',
  instructor_id uuid references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  description text not null default '',
  position integer not null,
  created_at timestamptz not null default now(),
  unique (course_id, position)
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules on delete cascade,
  title text not null,
  description text not null default '',
  video_asset_id text,                     -- provider asset id; never a public URL
  duration_seconds integer not null default 0,
  transcript text,
  position integer not null,
  is_preview boolean not null default false,
  created_at timestamptz not null default now(),
  unique (module_id, position)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles,
  email text not null,
  course_id uuid not null references courses,
  paystack_reference text not null unique, -- idempotency for duplicate webhooks
  amount integer not null,
  currency text not null,
  status payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_id uuid not null references courses,
  payment_id uuid references payments,     -- null when granted by an admin
  status enrollment_status not null default 'active',
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,                  -- null = lifetime
  unique (user_id, course_id)
);

create table lesson_progress (
  user_id uuid not null references profiles on delete cascade,
  lesson_id uuid not null references lessons on delete cascade,
  progress_seconds integer not null default 0,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null unique references modules on delete cascade,
  title text not null,
  passing_score numeric(3,2) not null default 0.75
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes on delete cascade,
  prompt text not null,
  scenario text,
  question_type question_type not null,
  explanation text not null default '',
  position integer not null
);

create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions on delete cascade,
  answer text not null,
  is_correct boolean not null default false,
  position integer not null
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  quiz_id uuid not null references quizzes on delete cascade,
  answers jsonb not null,
  score integer not null,
  total integer not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_id uuid not null references courses,
  certificate_number text not null unique,
  full_name text not null,                 -- name as printed, frozen at issue
  issued_at timestamptz not null default now(),
  certificate_url text,
  unique (user_id, course_id)
);

-- Row Level Security -------------------------------------------------------
-- Students read only their own rows. Every write that matters (payments,
-- enrollments, quiz grading, certificates) happens in server functions using
-- the service role, so there are deliberately no student insert policies on them.

alter table profiles enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table payments enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;
alter table quiz_attempts enable row level security;
alter table certificates enable row level security;

create function has_active_enrollment(target_course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments
    where user_id = auth.uid() and course_id = target_course and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

create policy "own profile" on profiles for select using (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- Public catalog: course pages and outlines are visible; lesson content is not.
create policy "public courses" on courses for select using (status in ('published', 'coming_soon'));
create policy "public modules" on modules for select
  using (exists (select 1 from courses c where c.id = course_id and c.status = 'published'));
create policy "enrolled lessons" on lessons for select using (
  is_preview or has_active_enrollment((select m.course_id from modules m where m.id = module_id))
);

create policy "own payments" on payments for select using (user_id = auth.uid());
create policy "own enrollments" on enrollments for select using (user_id = auth.uid());

create policy "own progress" on lesson_progress for select using (user_id = auth.uid());
create policy "record own progress" on lesson_progress for insert with check (
  user_id = auth.uid() and has_active_enrollment(
    (select m.course_id from lessons l join modules m on m.id = l.module_id where l.id = lesson_id))
);
create policy "update own progress" on lesson_progress for update using (user_id = auth.uid());

create policy "enrolled quizzes" on quizzes for select using (
  has_active_enrollment((select m.course_id from modules m where m.id = module_id))
);
create policy "enrolled questions" on quiz_questions for select using (
  has_active_enrollment((select m.course_id from quizzes q join modules m on m.id = q.module_id where q.id = quiz_id))
);
-- quiz_answers has no student policy: correctness never leaves the server.
-- Clients read options through a view or function that omits is_correct.

create policy "own attempts" on quiz_attempts for select using (user_id = auth.uid());
create policy "own certificates" on certificates for select using (user_id = auth.uid());
