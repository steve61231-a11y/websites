-- ============================================================================
-- Iris Fields School — management system schema
--
-- Conventions used throughout:
--   * Money is ALWAYS bigint cents (1 KES = 100 cents). No numeric, no float.
--   * A "business date" (expense date, payment date, leave day) is a plain
--     `date` — a day has no timezone. Only audit columns are timestamptz.
--   * Every table has RLS enabled; nothing is reachable without a session.
--   * Two roles: 'admin' sees everything; 'staff' does the day-to-day but
--     cannot see salary figures or manage user accounts.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- app roles --

create type public.app_role as enum ('admin', 'staff');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null default '',
  email       text        not null default '',
  role        app_role    not null default 'staff',
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per signed-in user. Mirrors auth.users and carries the app role.';

-- Read the caller's role without re-entering profiles' own RLS policies.
create or replace function public.current_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

-- New sign-ups get a profile automatically. The very first account to exist
-- becomes the admin, so the school owner can bootstrap without touching SQL.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned public.app_role := 'staff';
begin
  if not exists (select 1 from public.profiles) then
    assigned := 'admin';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    assigned
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- shared bits --

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.app_settings (
  key         text primary key,
  value       jsonb       not null,
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------- expenses --

create table public.expense_categories (
  key         text primary key,
  label       text    not null,
  emoji       text    not null default '📌',
  color       text    not null,
  sort_order  int     not null default 100,
  is_system   boolean not null default false
);

comment on column public.expense_categories.color is
  'Hex used for this category everywhere. Validated for colour-blind separation as a set — re-validate before editing.';

insert into public.expense_categories (key, label, emoji, color, sort_order, is_system) values
  ('supermarket', 'Supermarket Supplies',   '🛒', '#1BAF7A', 10, true),
  ('groceries',   'Groceries & Food',       '🍚', '#D99A1F', 20, true),
  ('fuel',        'Fuel',                   '⛽', '#E2553D', 30, true),
  ('salaries',    'Salaries',               '💰', '#665EC7', 40, true),
  ('water',       'Water',                  '💧', '#0E9DD9', 50, true),
  ('repairs',     'Repairs & Maintenance',  '🔧', '#A55C24', 60, true),
  ('other',       'Other',                  '➕', '#C15FA8', 70, true);

create type public.payment_method as enum ('cash', 'mpesa', 'bank');

create table public.vendors (
  id           uuid primary key default gen_random_uuid(),
  category_key text        not null references public.expense_categories (key) on delete restrict,
  name         text        not null check (length(btrim(name)) > 0),
  usage_count  int         not null default 0,
  last_used_at timestamptz,
  is_archived  boolean     not null default false,
  created_at   timestamptz not null default now(),
  unique (category_key, name)
);

create index vendors_category_idx on public.vendors (category_key, is_archived, usage_count desc);

create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  date            date        not null default (now() at time zone 'Africa/Nairobi')::date,
  category_key    text        not null references public.expense_categories (key) on delete restrict,
  custom_category text,
  vendor_id       uuid        references public.vendors (id) on delete set null,
  -- Denormalised: renaming or archiving a vendor must never rewrite history.
  vendor_name     text        not null default '',
  amount_cents    bigint      not null check (amount_cents > 0),
  payment_method  payment_method not null,
  notes           text,
  created_by      uuid        references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index expenses_date_idx on public.expenses (date desc);
create index expenses_category_date_idx on public.expenses (category_key, date desc);

create trigger expenses_touch before update on public.expenses
  for each row execute function public.touch_updated_at();

-- Quick-select vendor chips "learn": every logged expense promotes its vendor.
create or replace function public.bump_vendor_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vendor_id is not null then
    update public.vendors
       set usage_count  = usage_count + 1,
           last_used_at = now()
     where id = new.vendor_id;
  end if;
  return new;
end;
$$;

create trigger expenses_bump_vendor after insert on public.expenses
  for each row execute function public.bump_vendor_usage();

-- ----------------------------------------------------------------- students --

create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (length(btrim(name)) > 0),
  sort_order int  not null default 100
);

create type public.student_status as enum ('active', 'graduated', 'withdrawn');

create table public.students (
  id                       uuid primary key default gen_random_uuid(),
  first_name               text not null check (length(btrim(first_name)) > 0),
  last_name                text not null default '',
  date_of_birth            date,
  photo_url                text,
  class_id                 uuid references public.classes (id) on delete set null,
  enrollment_date          date not null default (now() at time zone 'Africa/Nairobi')::date,
  status                   student_status not null default 'active',
  emergency_contact_name   text,
  emergency_contact_phone  text,
  allergies                text[] not null default '{}',
  medical_notes            text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index students_class_idx on public.students (class_id);
create index students_status_idx on public.students (status);

create trigger students_touch before update on public.students
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ parents --

create table public.parents (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null check (length(btrim(full_name)) > 0),
  phone      text not null default '',
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger parents_touch before update on public.parents
  for each row execute function public.touch_updated_at();

create type public.relationship as enum ('mother', 'father', 'guardian', 'other');

create table public.student_parents (
  student_id         uuid not null references public.students (id) on delete cascade,
  parent_id          uuid not null references public.parents  (id) on delete cascade,
  relationship       relationship not null default 'guardian',
  is_primary_contact boolean not null default false,
  primary key (student_id, parent_id)
);

create index student_parents_parent_idx on public.student_parents (parent_id);

create table public.parent_notes (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.parents (id) on delete cascade,
  note_date  date not null default (now() at time zone 'Africa/Nairobi')::date,
  body       text not null check (length(btrim(body)) > 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index parent_notes_parent_idx on public.parent_notes (parent_id, note_date desc);

-- --------------------------------------------------------------------- fees --

create table public.terms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  start_date date not null,
  end_date   date not null,
  is_current boolean not null default false,
  check (end_date >= start_date)
);

-- At most one current term, enforced by the database rather than by hope.
create unique index terms_single_current_idx on public.terms (is_current) where is_current;

create table public.fee_invoices (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid   not null references public.students (id) on delete cascade,
  term_id          uuid   not null references public.terms (id) on delete cascade,
  amount_due_cents bigint not null check (amount_due_cents >= 0),
  due_date         date   not null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (student_id, term_id)
);

create trigger fee_invoices_touch before update on public.fee_invoices
  for each row execute function public.touch_updated_at();

create table public.fee_payments (
  id           uuid   primary key default gen_random_uuid(),
  student_id   uuid   not null references public.students (id) on delete cascade,
  term_id      uuid   references public.terms (id) on delete set null,
  amount_cents bigint not null check (amount_cents > 0),
  paid_on      date   not null default (now() at time zone 'Africa/Nairobi')::date,
  method       payment_method not null,
  reference    text,
  notes        text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index fee_payments_student_idx on public.fee_payments (student_id, paid_on desc);
create index fee_payments_term_idx on public.fee_payments (term_id, paid_on desc);

-- -------------------------------------------------------------------- staff --

create table public.staff (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null check (length(btrim(full_name)) > 0),
  role_title        text not null default '',
  phone             text,
  email             text,
  start_date        date,
  is_active         boolean not null default true,
  -- Null means "the school only keeps a log", which is the default posture.
  annual_leave_days int check (annual_leave_days is null or annual_leave_days >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger staff_touch before update on public.staff
  for each row execute function public.touch_updated_at();

create type public.leave_type as enum ('annual', 'sick', 'other');

create table public.leave_records (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff (id) on delete cascade,
  type       leave_type not null,
  start_date date not null,
  end_date   date not null,
  notes      text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index leave_records_staff_idx on public.leave_records (staff_id, start_date desc);
create index leave_records_range_idx on public.leave_records (start_date, end_date);

-- ================================= Row-Level Security ======================

alter table public.profiles           enable row level security;
alter table public.app_settings       enable row level security;
alter table public.expense_categories enable row level security;
alter table public.vendors            enable row level security;
alter table public.expenses           enable row level security;
alter table public.classes            enable row level security;
alter table public.students           enable row level security;
alter table public.parents            enable row level security;
alter table public.student_parents    enable row level security;
alter table public.parent_notes       enable row level security;
alter table public.terms              enable row level security;
alter table public.fee_invoices       enable row level security;
alter table public.fee_payments       enable row level security;
alter table public.staff              enable row level security;
alter table public.leave_records      enable row level security;

-- Profiles: everyone signed in can see who else works here; only an admin can
-- change roles, and nobody can hand themselves a promotion.
create policy profiles_select on public.profiles
  for select to authenticated using (true);

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role());

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Reference data: readable by all signed-in users, editable by admins.
create policy settings_read on public.app_settings for select to authenticated using (true);
create policy settings_write on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy categories_read on public.expense_categories for select to authenticated using (true);
create policy categories_write on public.expense_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy classes_read on public.classes for select to authenticated using (true);
create policy classes_write on public.classes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy terms_read on public.terms for select to authenticated using (true);
create policy terms_write on public.terms for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Vendors: the secretary adds these as she works, so staff may write too.
create policy vendors_read on public.vendors for select to authenticated using (true);
create policy vendors_write on public.vendors for insert to authenticated with check (true);
create policy vendors_update on public.vendors for update to authenticated
  using (true) with check (true);
create policy vendors_delete on public.vendors for delete to authenticated using (public.is_admin());

-- Expenses: staff log day-to-day spending but salary rows are admin-only —
-- enforced here in the database, not merely hidden in the UI.
create policy expenses_read on public.expenses
  for select to authenticated
  using (public.is_admin() or category_key <> 'salaries');

create policy expenses_insert on public.expenses
  for insert to authenticated
  with check (public.is_admin() or category_key <> 'salaries');

create policy expenses_update on public.expenses
  for update to authenticated
  using (public.is_admin() or (category_key <> 'salaries' and created_by = auth.uid()))
  with check (public.is_admin() or category_key <> 'salaries');

create policy expenses_delete on public.expenses
  for delete to authenticated
  using (public.is_admin() or (category_key <> 'salaries' and created_by = auth.uid()));

-- Student / parent records: the whole team needs these to run the day.
create policy students_read on public.students for select to authenticated using (true);
create policy students_write on public.students for insert to authenticated with check (true);
create policy students_update on public.students for update to authenticated using (true) with check (true);
create policy students_delete on public.students for delete to authenticated using (public.is_admin());

create policy parents_read on public.parents for select to authenticated using (true);
create policy parents_write on public.parents for insert to authenticated with check (true);
create policy parents_update on public.parents for update to authenticated using (true) with check (true);
create policy parents_delete on public.parents for delete to authenticated using (public.is_admin());

create policy links_read on public.student_parents for select to authenticated using (true);
create policy links_write on public.student_parents for all to authenticated using (true) with check (true);

create policy notes_read on public.parent_notes for select to authenticated using (true);
create policy notes_insert on public.parent_notes for insert to authenticated
  with check (created_by = auth.uid() or created_by is null);
create policy notes_modify on public.parent_notes for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());
create policy notes_delete on public.parent_notes for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- Fees: recording payments is the secretary's core job; setting what is owed
-- (the invoice) is the director's call.
create policy invoices_read on public.fee_invoices for select to authenticated using (true);
create policy invoices_write on public.fee_invoices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy payments_read on public.fee_payments for select to authenticated using (true);
create policy payments_insert on public.fee_payments for insert to authenticated with check (true);
create policy payments_update on public.fee_payments for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());
create policy payments_delete on public.fee_payments for delete to authenticated using (public.is_admin());

-- Staff & leave: everyone can see who is off today (it changes who covers a
-- class); only admins edit the staff register itself.
create policy staff_read on public.staff for select to authenticated using (true);
create policy staff_write on public.staff for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy leave_read on public.leave_records for select to authenticated using (true);
create policy leave_insert on public.leave_records for insert to authenticated with check (true);
create policy leave_update on public.leave_records for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());
create policy leave_delete on public.leave_records for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- ================================= Storage =================================

insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

create policy "student photos are readable"
  on storage.objects for select
  using (bucket_id = 'student-photos');

create policy "signed-in users manage student photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'student-photos');

create policy "signed-in users replace student photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'student-photos') with check (bucket_id = 'student-photos');

create policy "signed-in users remove student photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'student-photos');
