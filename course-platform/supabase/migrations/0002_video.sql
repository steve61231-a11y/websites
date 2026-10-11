-- Protected video. Keys and segment names are derived from VIDEO_SECRET, so
-- nothing about the videos themselves is stored here: only who each student
-- is in the invisible watermark, and a log of playback sessions.

-- Watermark id ------------------------------------------------------------
-- A small, stable number per student (1–65535), hidden in the a/b pattern of
-- every video segment they stream. scripts/video/trace-leak.ts reads it back
-- from a leaked copy; look the student up here.

create sequence watermark_id_seq as integer minvalue 1 maxvalue 65535 no cycle;

alter table profiles
  add column watermark_id integer unique default nextval('watermark_id_seq')
  check (watermark_id between 1 and 65535);

alter sequence watermark_id_seq owned by profiles.watermark_id;

-- Existing rows get an id from the default when the column is added; this
-- also covers a row that somehow kept a null.
update profiles set watermark_id = nextval('watermark_id_seq') where watermark_id is null;
alter table profiles alter column watermark_id set not null;

-- Students may update their own profile (name, avatar) but never their
-- watermark id, the same way 0001 protects role. The service role bypasses RLS.
drop policy "update own profile" on profiles;
create policy "update own profile" on profiles for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from profiles where id = auth.uid())
    and watermark_id = (select watermark_id from profiles where id = auth.uid())
  );

-- Playback sessions ---------------------------------------------------------
-- One row per POST /api/video/session. Written by the server with the
-- service role; used for the rate limits (60 per student per hour, 30 per
-- student per video per 10 minutes) and to spot account sharing.

create table video_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_id uuid not null references courses on delete cascade,
  video_code text not null,                -- the client's numbering, e.g. "2.3"
  created_at timestamptz not null default now(),
  ip inet,
  user_agent text
);

create index video_sessions_user_time on video_sessions (user_id, created_at desc);
create index video_sessions_user_video_time on video_sessions (user_id, course_id, video_code, created_at desc);

-- Row Level Security: enabled with no policies, so only the service role
-- (server code) can read or write. Students never see this table.
alter table video_sessions enable row level security;
