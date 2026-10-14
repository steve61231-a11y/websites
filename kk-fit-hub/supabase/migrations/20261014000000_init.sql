-- KK Fit Hub v1 schema (PRD section 14).
-- Tables, sequences, triggers, row-level security, storage buckets and the
-- service-role-only functions used by public server actions.

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.staff_role as enum ('owner', 'staff');
create type public.activity_status as enum ('available', 'soon', 'hidden');
create type public.inquiry_type as enum ('demo', 'interest', 'general');
create type public.inquiry_status as enum (
  'new', 'contacted', 'demo_scheduled', 'proposal_sent', 'won', 'lost', 'closed'
);
create type public.application_status as enum (
  'new', 'shortlisted', 'in_vetting', 'approved', 'on_hold', 'declined'
);
create type public.check_type as enum (
  'interview', 'live_demo', 'good_conduct', 'references', 'first_aid'
);
create type public.check_result as enum ('pending', 'passed', 'failed', 'waived');
create type public.file_kind as enum ('certificate', 'first_aid', 'good_conduct', 'other');
create type public.note_entity as enum ('inquiry', 'application');

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  role public.staff_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  one_liner text not null,
  description text,
  outcomes text[] not null default '{}',
  age_range text,
  status public.activity_status not null default 'soon',
  recruiting boolean not null default false,
  glyph text not null default 'karate',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.inquiry_ref_seq start with 1001;
create sequence public.application_ref_seq start with 101;

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('KK-' || nextval('public.inquiry_ref_seq')::text),
  type public.inquiry_type not null,
  status public.inquiry_status not null default 'new',
  contact_name text not null,
  contact_role text,
  school_name text,
  county text,
  county_other text,
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+254[17][0-9]{8}$'),
  email text,
  institution_type text,
  sector text,
  learners_band text,
  grades text[] not null default '{}',
  preferred_days text[] not null default '{}',
  preferred_time text,
  start_term text,
  contact_pref text,
  message text,
  source text,
  utm jsonb not null default '{}',
  consent_at timestamptz not null,
  consent_version text not null,
  assigned_to uuid references public.profiles (id) on delete set null,
  next_action text,
  next_action_due date,
  lost_reason text,
  details_added_at timestamptz,
  idempotency_key uuid unique,
  anonymised_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_phone_present check (anonymised_at is not null or phone_e164 is not null),
  constraint inquiries_lost_reason check (status <> 'lost' or nullif(trim(lost_reason), '') is not null)
);
create index inquiries_status_idx on public.inquiries (status, created_at desc);
create index inquiries_due_idx on public.inquiries (next_action_due) where next_action_due is not null;

create table public.inquiry_activities (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (inquiry_id, activity_id)
);
create index inquiry_activities_activity_idx on public.inquiry_activities (activity_id);

create table public.open_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  activity_id uuid references public.activities (id) on delete set null,
  counties text[] not null default '{}',
  employment_type text,
  description text,
  is_open boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default (
    'KKC-' || lpad(nextval('public.application_ref_seq')::text, 4, '0')
  ),
  status public.application_status not null default 'new',
  full_name text not null,
  phone_e164 text not null check (phone_e164 ~ '^\+254[17][0-9]{8}$'),
  email text not null,
  county text not null,
  is_adult boolean not null check (is_adult),
  heard_from text,
  main_activity_id uuid references public.activities (id) on delete set null,
  main_activity_other text,
  years_practising integer not null check (years_practising between 0 and 80),
  years_coaching integer not null check (years_coaching between 0 and 80),
  highest_rank text not null,
  experience text not null,
  video_url text,
  first_aid text not null check (first_aid in ('current', 'expired', 'none')),
  good_conduct text not null check (good_conduct in ('current', 'can_get', 'need_help')),
  availability text[] not null default '{}',
  work_preference text not null,
  counties text[] not null default '{}',
  extra_notes text,
  open_role_id uuid references public.open_roles (id) on delete set null,
  consent_at timestamptz not null,
  consent_version text not null,
  source text,
  utm jsonb not null default '{}',
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  decline_reason text,
  delete_after date,
  idempotency_key uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_status_idx on public.applications (status, created_at desc);

create table public.application_activities (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (application_id, activity_id)
);

create table public.application_referees (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  name text not null,
  phone_e164 text not null,
  relationship text,
  created_at timestamptz not null default now()
);

create table public.application_files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  kind public.file_kind not null,
  storage_path text not null unique,
  original_name text not null,
  mime text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create table public.vetting_checks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  check_type public.check_type not null,
  result public.check_result not null default 'pending',
  recorded_by uuid references public.profiles (id) on delete set null,
  recorded_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, check_type)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  entity_type public.note_entity not null,
  entity_id uuid not null,
  body text not null check (length(trim(body)) between 1 and 5000),
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index notes_entity_idx on public.notes (entity_type, entity_id, created_at desc);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  from_value text,
  to_value text,
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id, created_at desc);
create index activity_log_created_idx on public.activity_log (created_at desc);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text not null,
  author_role text,
  organisation text,
  photo_path text,
  permission_confirmed boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_publish_needs_permission check (not published or permission_confirmed)
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  logo_path text,
  permission_confirmed boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_publish_needs_permission check (not published or permission_confirmed)
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  phones text[] not null default '{}',
  whatsapp_e164 text not null,
  email text,
  socials jsonb not null default '{}',
  counties text[] not null default '{}',
  response_time_text text not null,
  start_term_options text[] not null default '{}',
  required_checks public.check_type[] not null default '{interview,live_demo,good_conduct,references}',
  email_alerts_enabled boolean not null default false,
  alert_recipients text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

-- Only the public fields of site_settings. security_invoker keeps RLS and the
-- column grants below in force.
create view public.public_settings
with (security_invoker = true) as
select phones, whatsapp_e164, email, socials, counties, response_time_text, start_term_options
from public.site_settings;

-- updated_at triggers
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger activities_updated_at before update on public.activities
  for each row execute function public.set_updated_at();
create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();
create trigger open_roles_updated_at before update on public.open_roles
  for each row execute function public.set_updated_at();
create trigger applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();
create trigger vetting_checks_updated_at before update on public.vetting_checks
  for each row execute function public.set_updated_at();
create trigger testimonials_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();
create trigger partners_updated_at before update on public.partners
  for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers (security definer, stable)
-- ---------------------------------------------------------------------------
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active
  );
$$;

-- The owner must also have completed two-factor sign-in (aal2), PRD 14.4.
create function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active and p.role = 'owner'
  ) and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

-- ---------------------------------------------------------------------------
-- Audit log (append-only, written by triggers only)
-- ---------------------------------------------------------------------------
create function public.log_event(
  p_entity_type text, p_entity_id uuid, p_action text, p_from text, p_to text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.activity_log (entity_type, entity_id, action, from_value, to_value, actor_id)
  values (p_entity_type, p_entity_id, p_action, p_from, p_to, auth.uid());
$$;

-- Generic change logger. TG_ARGV[0] is the entity type; the remaining
-- arguments are the columns whose changes are recorded.
create function public.log_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_col text;
  v_old jsonb;
  v_new jsonb;
  i integer;
begin
  if tg_op = 'INSERT' then
    perform public.log_event(tg_argv[0], new.id, 'created', null, null);
    return new;
  elsif tg_op = 'DELETE' then
    perform public.log_event(tg_argv[0], old.id, 'deleted', null, null);
    return old;
  end if;

  v_old := to_jsonb(old);
  v_new := to_jsonb(new);
  for i in 1 .. tg_nargs - 1 loop
    v_col := tg_argv[i];
    if (v_old -> v_col) is distinct from (v_new -> v_col) then
      perform public.log_event(
        tg_argv[0], new.id, v_col,
        left(v_old ->> v_col, 500), left(v_new ->> v_col, 500)
      );
    end if;
  end loop;
  return new;
end;
$$;

create trigger inquiries_log after insert or update or delete on public.inquiries
  for each row execute function public.log_changes(
    'inquiry', 'status', 'assigned_to', 'next_action', 'next_action_due', 'lost_reason', 'details_added_at', 'anonymised_at'
  );
create trigger applications_log after insert or update or delete on public.applications
  for each row execute function public.log_changes(
    'application', 'status', 'decline_reason', 'delete_after'
  );
create trigger activities_log after insert or update or delete on public.activities
  for each row execute function public.log_changes(
    'activity', 'name', 'one_liner', 'status', 'recruiting', 'age_range', 'sort_order'
  );
create trigger open_roles_log after insert or update or delete on public.open_roles
  for each row execute function public.log_changes('open_role', 'title', 'is_open');
create trigger profiles_log after insert or update or delete on public.profiles
  for each row execute function public.log_changes('profile', 'role', 'active');
create trigger testimonials_log after insert or update or delete on public.testimonials
  for each row execute function public.log_changes('testimonial', 'published', 'permission_confirmed');
create trigger partners_log after insert or update or delete on public.partners
  for each row execute function public.log_changes('partner', 'published', 'permission_confirmed');
create trigger site_settings_log after update on public.site_settings
  for each row execute function public.log_changes(
    'settings', 'phones', 'whatsapp_e164', 'email', 'socials', 'counties', 'response_time_text',
    'start_term_options', 'required_checks', 'email_alerts_enabled', 'alert_recipients'
  );

create function public.log_note()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_event(new.entity_type::text, new.entity_id, 'note_added', null, left(new.body, 120));
  return new;
end;
$$;
create trigger notes_log after insert on public.notes
  for each row execute function public.log_note();

-- ---------------------------------------------------------------------------
-- Vetting checks: created with each application; recorded with who and when
-- ---------------------------------------------------------------------------
create function public.create_vetting_checks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.vetting_checks (application_id, check_type)
  select new.id, t from unnest(enum_range(null::public.check_type)) as t;
  return new;
end;
$$;
create trigger applications_create_checks after insert on public.applications
  for each row execute function public.create_vetting_checks();

create function public.guard_vetting_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.application_id <> old.application_id or new.check_type <> old.check_type then
    raise exception 'A vetting check cannot be moved' using errcode = '42501';
  end if;
  if new.result is distinct from old.result or new.note is distinct from old.note then
    -- Waiving a check is an owner decision and needs a note (PRD 14.2).
    if new.result = 'waived' and (not public.is_owner() or nullif(trim(new.note), '') is null) then
      raise exception 'Only the owner can waive a check, and a note is required' using errcode = '42501';
    end if;
    new.recorded_by := auth.uid();
    new.recorded_at := now();
    perform public.log_event(
      'application', new.application_id, 'check:' || new.check_type::text,
      old.result::text, new.result::text
    );
  end if;
  return new;
end;
$$;
create trigger vetting_checks_guard before update on public.vetting_checks
  for each row execute function public.guard_vetting_check();

-- ---------------------------------------------------------------------------
-- Approval guard: the database is the real guard (PRD 14.2 rule 6)
-- ---------------------------------------------------------------------------
create function public.guard_application_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_required public.check_type[];
  v_missing text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status in ('approved', 'declined') or old.status in ('approved', 'declined') then
    if not public.is_owner() then
      raise exception 'Only the owner can approve or decline an application' using errcode = '42501';
    end if;
  end if;

  if new.status = 'approved' then
    select required_checks into v_required from public.site_settings limit 1;
    select string_agg(t::text, ', ') into v_missing
    from unnest(coalesce(v_required, '{}')) as t
    where not exists (
      select 1 from public.vetting_checks c
      where c.application_id = new.id and c.check_type = t and c.result in ('passed', 'waived')
    );
    if v_missing is not null then
      raise exception 'Required checks not passed: %', v_missing using errcode = '23514';
    end if;
    new.decided_by := auth.uid();
    new.decided_at := now();
    new.decline_reason := null;
    new.delete_after := null;
  elsif new.status = 'declined' then
    if nullif(trim(new.decline_reason), '') is null then
      raise exception 'A decline reason is required' using errcode = '23514';
    end if;
    new.decided_by := auth.uid();
    new.decided_at := now();
    -- CONFIRM: retention periods with a lawyer (records 12 months after decline).
    new.delete_after := (now() + interval '12 months')::date;
  else
    new.decided_by := null;
    new.decided_at := null;
    new.delete_after := null;
  end if;
  return new;
end;
$$;
create trigger applications_status_guard before update on public.applications
  for each row execute function public.guard_application_status();

-- Inquiries: closing as lost requires a reason (enforced by a check constraint).

-- ---------------------------------------------------------------------------
-- Rate limiting (sliding window, one-minute buckets). Service role only.
-- ---------------------------------------------------------------------------
create function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, date_trunc('minute', now()), 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1;

  select coalesce(sum(count), 0) into v_total
  from public.rate_limits
  where key = p_key and window_start > now() - make_interval(secs => p_window_seconds);

  -- Opportunistic clean-up of old buckets.
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return v_total <= p_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public submissions. Called only by server actions with the service role,
-- after validation, bot checks and rate limits. Atomic and idempotent.
-- ---------------------------------------------------------------------------
create function public.submit_inquiry(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_ref text;
  v_key uuid := (p ->> 'idempotency_key')::uuid;
begin
  insert into public.inquiries (
    type, contact_name, contact_role, school_name, county, county_other, phone_e164, email,
    message, source, utm, consent_at, consent_version, idempotency_key
  ) values (
    (p ->> 'type')::public.inquiry_type,
    p ->> 'contact_name',
    nullif(p ->> 'contact_role', ''),
    nullif(p ->> 'school_name', ''),
    nullif(p ->> 'county', ''),
    nullif(p ->> 'county_other', ''),
    p ->> 'phone_e164',
    nullif(p ->> 'email', ''),
    nullif(p ->> 'message', ''),
    nullif(p ->> 'source', ''),
    coalesce(p -> 'utm', '{}'::jsonb),
    now(),
    p ->> 'consent_version',
    v_key
  )
  on conflict (idempotency_key) do nothing
  returning id, ref into v_id, v_ref;

  if v_id is null then
    select id, ref into v_id, v_ref from public.inquiries where idempotency_key = v_key;
    return jsonb_build_object('id', v_id, 'ref', v_ref, 'duplicate', true);
  end if;

  insert into public.inquiry_activities (inquiry_id, activity_id)
  select v_id, a.id
  from public.activities a
  where a.slug in (select jsonb_array_elements_text(coalesce(p -> 'activities', '[]'::jsonb)))
  on conflict do nothing;

  return jsonb_build_object('id', v_id, 'ref', v_ref, 'duplicate', false);
end;
$$;

-- Step 2 of a request: the visitor proves ownership with the idempotency key
-- they generated, within 24 hours of the request.
create function public.add_inquiry_details(p_ref text, p_key uuid, p jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.inquiries set
    institution_type = nullif(p ->> 'institution_type', ''),
    sector = nullif(p ->> 'sector', ''),
    learners_band = nullif(p ->> 'learners_band', ''),
    grades = coalesce(array(select jsonb_array_elements_text(p -> 'grades')), '{}'),
    preferred_days = coalesce(array(select jsonb_array_elements_text(p -> 'preferred_days')), '{}'),
    preferred_time = nullif(p ->> 'preferred_time', ''),
    start_term = nullif(p ->> 'start_term', ''),
    contact_pref = nullif(p ->> 'contact_pref', ''),
    message = coalesce(nullif(p ->> 'message', ''), message),
    details_added_at = now()
  where ref = p_ref
    and idempotency_key = p_key
    and created_at > now() - interval '24 hours'
    and anonymised_at is null;
  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

create function public.submit_application(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (p ->> 'id')::uuid;
  v_ref text;
  v_key uuid := (p ->> 'idempotency_key')::uuid;
  v_existing record;
begin
  select id, ref into v_existing from public.applications where idempotency_key = v_key;
  if found then
    return jsonb_build_object('id', v_existing.id, 'ref', v_existing.ref, 'duplicate', true);
  end if;

  insert into public.applications (
    id, full_name, phone_e164, email, county, is_adult, heard_from, main_activity_id,
    main_activity_other, years_practising, years_coaching, highest_rank, experience, video_url,
    first_aid, good_conduct, availability, work_preference, counties, extra_notes, open_role_id,
    consent_at, consent_version, source, utm, idempotency_key
  ) values (
    v_id,
    p ->> 'full_name',
    p ->> 'phone_e164',
    p ->> 'email',
    p ->> 'county',
    (p ->> 'is_adult')::boolean,
    nullif(p ->> 'heard_from', ''),
    (select a.id from public.activities a where a.slug = p ->> 'main_activity'),
    nullif(p ->> 'main_activity_other', ''),
    (p ->> 'years_practising')::integer,
    (p ->> 'years_coaching')::integer,
    p ->> 'highest_rank',
    p ->> 'experience',
    nullif(p ->> 'video_url', ''),
    p ->> 'first_aid',
    p ->> 'good_conduct',
    coalesce(array(select jsonb_array_elements_text(p -> 'availability')), '{}'),
    p ->> 'work_preference',
    coalesce(array(select jsonb_array_elements_text(p -> 'counties')), '{}'),
    nullif(p ->> 'extra_notes', ''),
    (select r.id from public.open_roles r where r.id::text = p ->> 'open_role_id' and r.is_open),
    now(),
    p ->> 'consent_version',
    nullif(p ->> 'source', ''),
    coalesce(p -> 'utm', '{}'::jsonb),
    v_key
  )
  returning ref into v_ref;

  insert into public.application_activities (application_id, activity_id)
  select v_id, a.id from public.activities a
  where a.slug in (select jsonb_array_elements_text(coalesce(p -> 'other_activities', '[]'::jsonb)))
  on conflict do nothing;

  insert into public.application_referees (application_id, name, phone_e164, relationship)
  select v_id, r ->> 'name', r ->> 'phone_e164', nullif(r ->> 'relationship', '')
  from jsonb_array_elements(coalesce(p -> 'referees', '[]'::jsonb)) as r
  limit 2;

  insert into public.application_files (application_id, kind, storage_path, original_name, mime, size_bytes)
  select v_id, (f ->> 'kind')::public.file_kind, f ->> 'storage_path', f ->> 'original_name',
         f ->> 'mime', (f ->> 'size_bytes')::integer
  from jsonb_array_elements(coalesce(p -> 'files', '[]'::jsonb)) as f
  limit 7;

  return jsonb_build_object('id', v_id, 'ref', v_ref, 'duplicate', false);
end;
$$;

-- Function privileges: public submission helpers are for the service role only.
revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.submit_inquiry(jsonb) from public, anon, authenticated;
revoke execute on function public.add_inquiry_details(text, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.submit_application(jsonb) from public, anon, authenticated;
revoke execute on function public.log_event(text, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.submit_inquiry(jsonb) to service_role;
grant execute on function public.add_inquiry_details(text, uuid, jsonb) to service_role;
grant execute on function public.submit_application(jsonb) to service_role;
grant execute on function public.is_staff() to anon, authenticated, service_role;
grant execute on function public.is_owner() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row-level security: enabled on every table, no exceptions
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_activities enable row level security;
alter table public.open_roles enable row level security;
alter table public.applications enable row level security;
alter table public.application_activities enable row level security;
alter table public.application_referees enable row level security;
alter table public.application_files enable row level security;
alter table public.vetting_checks enable row level security;
alter table public.notes enable row level security;
alter table public.activity_log enable row level security;
alter table public.testimonials enable row level security;
alter table public.partners enable row level security;
alter table public.site_settings enable row level security;
alter table public.rate_limits enable row level security;

-- profiles: staff see the team; owner manages it.
create policy "staff read profiles" on public.profiles
  for select to authenticated using (public.is_staff() or id = auth.uid());
create policy "owner inserts profiles" on public.profiles
  for insert to authenticated with check (public.is_owner());
create policy "owner updates profiles" on public.profiles
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes profiles" on public.profiles
  for delete to authenticated using (public.is_owner());

-- activities: public read unless hidden; owner edits.
create policy "public reads visible activities" on public.activities
  for select to anon, authenticated using (status <> 'hidden' or public.is_staff());
create policy "owner inserts activities" on public.activities
  for insert to authenticated with check (public.is_owner());
create policy "owner updates activities" on public.activities
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes activities" on public.activities
  for delete to authenticated using (public.is_owner());

-- open roles: public read when open; staff manage; owner deletes.
create policy "public reads open roles" on public.open_roles
  for select to anon, authenticated using (is_open or public.is_staff());
create policy "staff insert roles" on public.open_roles
  for insert to authenticated with check (public.is_staff());
create policy "staff update roles" on public.open_roles
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "owner deletes roles" on public.open_roles
  for delete to authenticated using (public.is_owner());

-- inquiries: staff read and update; owner deletes. No anonymous access.
create policy "staff read inquiries" on public.inquiries
  for select to authenticated using (public.is_staff());
create policy "staff update inquiries" on public.inquiries
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "owner deletes inquiries" on public.inquiries
  for delete to authenticated using (public.is_owner());

create policy "staff read inquiry activities" on public.inquiry_activities
  for select to authenticated using (public.is_staff());

-- applications and their children
create policy "staff read applications" on public.applications
  for select to authenticated using (public.is_staff());
create policy "staff update applications" on public.applications
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "owner deletes applications" on public.applications
  for delete to authenticated using (public.is_owner());

create policy "staff read application activities" on public.application_activities
  for select to authenticated using (public.is_staff());
create policy "staff read referees" on public.application_referees
  for select to authenticated using (public.is_staff());
create policy "staff read files" on public.application_files
  for select to authenticated using (public.is_staff());
create policy "owner deletes files" on public.application_files
  for delete to authenticated using (public.is_owner());

create policy "staff read checks" on public.vetting_checks
  for select to authenticated using (public.is_staff());
create policy "staff update checks" on public.vetting_checks
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- notes: staff read and add their own; owner deletes.
create policy "staff read notes" on public.notes
  for select to authenticated using (public.is_staff());
create policy "staff add notes" on public.notes
  for insert to authenticated with check (public.is_staff() and author_id = auth.uid());
create policy "owner deletes notes" on public.notes
  for delete to authenticated using (public.is_owner());

-- activity log: read-only for staff; written only by triggers.
create policy "staff read log" on public.activity_log
  for select to authenticated using (public.is_staff());

-- testimonials and partners: public sees published + permission confirmed.
create policy "public reads published testimonials" on public.testimonials
  for select to anon, authenticated
  using ((published and permission_confirmed) or public.is_staff());
create policy "owner inserts testimonials" on public.testimonials
  for insert to authenticated with check (public.is_owner());
create policy "owner updates testimonials" on public.testimonials
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes testimonials" on public.testimonials
  for delete to authenticated using (public.is_owner());

create policy "public reads published partners" on public.partners
  for select to anon, authenticated
  using ((published and permission_confirmed) or public.is_staff());
create policy "owner inserts partners" on public.partners
  for insert to authenticated with check (public.is_owner());
create policy "owner updates partners" on public.partners
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes partners" on public.partners
  for delete to authenticated using (public.is_owner());

-- site settings: anonymous visitors read only the public columns (via the
-- public_settings view); staff read all; owner edits.
create policy "anon reads public settings" on public.site_settings
  for select to anon using (true);
create policy "staff read settings" on public.site_settings
  for select to authenticated using (public.is_staff());
create policy "owner updates settings" on public.site_settings
  for update to authenticated using (public.is_owner()) with check (public.is_owner());

revoke all on public.site_settings from anon;
grant select (phones, whatsapp_e164, email, socials, counties, response_time_text, start_term_options)
  on public.site_settings to anon;
grant select on public.public_settings to anon, authenticated;

-- rate_limits: no policies; service role only.
revoke all on public.rate_limits from anon, authenticated;

-- Anonymous visitors never write anywhere.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke usage, select, update on all sequences in schema public from anon, authenticated;
-- The activity log is append-only, and only triggers append.
revoke insert, update, delete, truncate on public.activity_log from authenticated;

-- ---------------------------------------------------------------------------
-- Storage (PRD 14.3)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('applicant-files', 'applicant-files', false, 10485760,
   array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']),
  ('public-media', 'public-media', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do nothing;

-- applicant-files: private, no anonymous policies. Staff may read so that the
-- admin can create short-lived signed links.
create policy "staff read applicant files" on storage.objects
  for select to authenticated using (bucket_id = 'applicant-files' and public.is_staff());

create policy "public reads public media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'public-media');
create policy "staff write public media" on storage.objects
  for insert to authenticated with check (bucket_id = 'public-media' and public.is_staff());
create policy "staff update public media" on storage.objects
  for update to authenticated using (bucket_id = 'public-media' and public.is_staff());
create policy "staff delete public media" on storage.objects
  for delete to authenticated using (bucket_id = 'public-media' and public.is_staff());
