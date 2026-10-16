-- Protected-video playback log and paid 1:1 session bookings. Both are
-- written only by the server (service role); students never read them.

create table video_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_slug text not null,
  video_code text not null, -- the client's numbering, e.g. "2.3"
  created_at timestamptz not null default now(),
  ip inet,
  user_agent text
);
create index video_sessions_user_time on video_sessions (user_id, created_at desc);
create index video_sessions_user_video_time on video_sessions (user_id, course_slug, video_code, created_at desc);
alter table video_sessions enable row level security; -- no policies: server only

-- 1:1 sessions. The time itself is chosen on Cal.com (Duncan's calendar);
-- this row records who paid for which topic and links the two.
create type booking_status as enum ('paid', 'scheduled', 'cancelled');

create table bookings (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references payments,
  user_id uuid references profiles on delete set null,
  topic text not null,
  name text not null,
  email text not null,
  phone text not null default '',
  notes text not null default '',
  status booking_status not null default 'paid',
  cal_booking_uid text, -- set when Cal.com reports the booking
  starts_at timestamptz,
  meet_url text,
  created_at timestamptz not null default now()
);
create index bookings_email_idx on bookings (lower(email));
alter table bookings enable row level security; -- no policies: server only
