-- KK Fit Hub seed data (PRD 14.1, 17 Phase 0).
-- Keep in step with content/activities.ts and content/site.ts.
-- The owner is invited with `npm run invite -- --owner <email> "<full name>"`
-- (Supabase Auth invitations cannot be created from SQL).

insert into public.activities (slug, name, one_liner, outcomes, age_range, status, recruiting, glyph, sort_order)
values
  -- CONFIRM: karate age range (open item 6); recruiting flags per discipline.
  ('kenpo-karate', 'Kenpo Karate', 'Discipline, focus and fitness through martial arts.',
   '{Discipline,Focus,Fitness,Confidence,Safety}', 'Primary to university', 'available', true, 'karate', 1),
  -- CONFIRM: launching-soon outcomes are drawn from each one-liner.
  ('chess', 'Chess', 'Strategy, patience and sharper thinking.',
   '{Strategy,Patience,"Sharper thinking"}', null, 'soon', true, 'chess', 2),
  ('skating', 'Skating', 'Balance, coordination and courage.',
   '{Balance,Coordination,Courage}', null, 'soon', true, 'skating', 3),
  ('ballet', 'Ballet', 'Poise, strength and artistry.',
   '{Poise,Strength,Artistry}', null, 'soon', true, 'ballet', 4),
  ('modern-dance', 'Modern Dance', 'Expression, rhythm and teamwork.',
   '{Expression,Rhythm,Teamwork}', null, 'soon', true, 'dance', 5),
  ('music', 'Music', 'Creativity, practice and performance.',
   '{Creativity,Practice,Performance}', null, 'soon', true, 'music', 6),
  ('coding-robotics', 'Coding & Robotics', 'Problem-solving for a digital future.',
   '{Problem-solving,"Building and testing ideas","Skills for a digital future"}', null, 'soon', true, 'coding', 7)
on conflict (slug) do nothing;

insert into public.site_settings (
  phones, whatsapp_e164, email, socials, counties, response_time_text,
  start_term_options, required_checks, email_alerts_enabled, alert_recipients
)
values (
  '{+254722524438,+254750370935}',
  '+254722524438',            -- CONFIRM: which number is on WhatsApp (open item 5)
  null,                       -- CONFIRM: organisation email (open item 12)
  '{}',                       -- CONFIRM: social accounts (open item 15)
  '{Nairobi,Kiambu,Kajiado,Machakos,Nakuru,"Homa Bay"}', -- CONFIRM: Homa Bay (open item 3)
  '2 working days',           -- CONFIRM: response time (open item 5)
  '{"Term 1 2027","Term 2 2027","Term 3 2027","As soon as possible","Not sure"}',
  '{interview,live_demo,good_conduct,references}', -- CONFIRM: first aid required or desirable (open item 8)
  false,
  '{}'
)
on conflict (singleton) do nothing;
