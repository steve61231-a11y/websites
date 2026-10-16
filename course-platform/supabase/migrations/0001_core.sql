-- THE PROD: core tables. The course content (lessons, notes, quizzes, prices)
-- lives in the code (src/lib/content), so the database only holds what
-- belongs to people: accounts, payments, progress, certificates.
--
-- Rules of the house:
--  * Students can read their own rows (RLS), and nothing else.
--  * Every write goes through our server (service role), which re-checks it.
--  * Money rows are idempotent: a Paystack reference is processed once.

create type user_role as enum ('student', 'instructor', 'admin');
create type payment_status as enum ('pending', 'success', 'failed', 'abandoned', 'refunded');
create type payment_kind as enum ('course', 'session');
create type enrollment_status as enum ('active', 'revoked');

-- Profiles ----------------------------------------------------------------
-- watermark_id: a small stable number (1-65535) hidden in the a/b pattern of
-- every video segment the student streams. scripts/video/trace-leak.ts reads
-- it back from a leaked copy; look the student up here.
create sequence watermark_id_seq as integer minvalue 1 maxvalue 65535 no cycle;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  email text not null unique,
  role user_role not null default 'student',
  watermark_id integer not null unique default nextval('watermark_id_seq') check (watermark_id between 1 and 65535),
  created_at timestamptz not null default now()
);
alter sequence watermark_id_seq owned by profiles.watermark_id;

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
revoke all on function handle_new_user() from public, anon, authenticated; -- only the trigger runs it

-- Payments ----------------------------------------------------------------
-- amount is in whole KES (15000 = KES 15,000). Paystack wants x100; the
-- server converts. `item` is the course slug or the session topic id.
create table payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  kind payment_kind not null,
  item text not null,
  email text not null,
  name text not null,
  amount integer not null check (amount > 0),
  currency text not null default 'KES',
  status payment_status not null default 'pending',
  paystack_id text,
  channel text,
  paid_at timestamptz,
  user_id uuid references profiles on delete set null,
  meta jsonb not null default '{}',
  fulfilling_at timestamptz, -- claimed by a worker (webhook), see claim_fulfillment
  fulfilled_at timestamptz,  -- access granted and emails sent
  seq bigint generated always as identity, -- receipt number: R-2026-000123
  created_at timestamptz not null default now()
);
create index payments_email_idx on payments (lower(email));

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_slug text not null,
  payment_id uuid references payments, -- null when granted by an admin
  status enrollment_status not null default 'active',
  purchased_at timestamptz not null default now(),
  unique (user_id, course_slug)
);

create table lesson_progress (
  user_id uuid not null references profiles on delete cascade,
  course_slug text not null,
  lesson_code text not null, -- the client's numbering, e.g. "2.3"
  position_seconds integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_slug, lesson_code)
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_slug text not null,
  quiz_key text not null, -- the quiz id in the course content
  answers jsonb not null, -- { questionId: optionId }
  score integer not null,
  total integer not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);
create index quiz_attempts_user_idx on quiz_attempts (user_id, course_slug, quiz_key);

create sequence certificate_seq start 1;

create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_slug text not null,
  number text not null unique,
  full_name text not null, -- as printed, frozen at issue
  issued_at timestamptz not null default now(),
  unique (user_id, course_slug)
);

-- Row Level Security --------------------------------------------------------
alter table profiles enable row level security;
alter table payments enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table quiz_attempts enable row level security;
alter table certificates enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid());
create policy "own payments" on payments for select using (user_id = auth.uid());
create policy "own enrollments" on enrollments for select using (user_id = auth.uid());
create policy "own progress" on lesson_progress for select using (user_id = auth.uid());
create policy "own attempts" on quiz_attempts for select using (user_id = auth.uid());
create policy "own certificates" on certificates for select using (user_id = auth.uid());
-- No insert/update/delete policies anywhere: only the server (service role)
-- writes. Students cannot change their role, watermark id, progress or payments.

-- Server-only helpers ---------------------------------------------------------
-- Claim a paid order for fulfilment (access + emails) exactly once, even if
-- Paystack sends the webhook twice at the same moment. A claim older than two
-- minutes is treated as a crashed worker and can be taken again.
create function claim_fulfillment(p_reference text) returns setof payments
language sql security definer set search_path = public as $$
  update payments set fulfilling_at = now()
  where reference = p_reference and status = 'success' and fulfilled_at is null
    and (fulfilling_at is null or fulfilling_at < now() - interval '2 minutes')
  returning *;
$$;

create function user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

create function next_certificate_number(p_code text) returns text
language sql security definer set search_path = public as $$
  select 'CERT-' || to_char(now(), 'YYYY') || '-' || upper(p_code) || '-' || lpad(nextval('certificate_seq')::text, 6, '0');
$$;

revoke all on function claim_fulfillment(text) from public, anon, authenticated;
revoke all on function user_id_by_email(text) from public, anon, authenticated;
revoke all on function next_certificate_number(text) from public, anon, authenticated;
grant execute on function claim_fulfillment(text) to service_role;
grant execute on function user_id_by_email(text) to service_role;
grant execute on function next_certificate_number(text) to service_role;
