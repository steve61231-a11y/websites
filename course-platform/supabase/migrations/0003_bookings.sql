-- Phase 2: paid 1:1 sessions. Only the server (service role) touches this
-- table: the browser never reads or writes bookings directly.

create type booking_status as enum ('held', 'confirmed', 'cancelled');

create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete set null,
  topic text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  name text not null,
  email text not null,
  phone text not null,
  notes text not null default '',
  status booking_status not null default 'held',
  -- A held slot is theirs while they pay. The server deletes expired holds
  -- before it inserts a new one for the same time.
  hold_expires_at timestamptz,
  paystack_reference text unique, -- idempotency for duplicate webhooks
  amount integer,
  google_event_id text,
  meet_url text,
  created_at timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at)
);

-- Two people can never hold or confirm the same start time.
create unique index bookings_one_per_slot on bookings (starts_at) where status in ('held', 'confirmed');
create index bookings_email_idx on bookings (email);

alter table bookings enable row level security; -- no policies: service role only
