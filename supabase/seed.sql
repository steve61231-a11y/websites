-- ============================================================================
-- Starter reference data — safe to run on a fresh project.
--
-- This seeds only the *lists the school picks from* (classes, the current term,
-- the vendor quick-select chips). It deliberately creates no students, parents
-- or expenses: real records should be the school's own from day one.
-- ============================================================================

-- The school's classes. Daycare is kept separate from KG1 even though the
-- children sit together, because daycare is billed per day attended (600) and
-- the rest are billed per term.
insert into public.classes (name, sort_order) values
  ('Daycare', 10),
  ('KG1',     20),
  ('KG2',     30),
  ('PP1',     40),
  ('PP2',     50)
on conflict (name) do update set sort_order = excluded.sort_order;

-- A term to hang the first invoices off. Adjust the dates in Settings.
insert into public.terms (name, start_date, end_date, is_current) values
  ('Term 1 ' || extract(year from now())::text,
   make_date(extract(year from now())::int, 1, 6),
   make_date(extract(year from now())::int, 4, 4),
   true)
on conflict (name) do nothing;

-- Vendor chips. These are the ones the school named; everything else the app
-- learns on its own the first time a vendor is typed into "Other…".
insert into public.vendors (category_key, name) values
  ('fuel',        'Ruby''s'),
  ('fuel',        'B Energy'),
  ('supermarket', 'Naivas'),
  ('supermarket', 'Quickmart'),
  ('groceries',   'Local Market'),
  ('groceries',   'Mama Mboga'),
  ('water',       'Nairobi Water'),
  ('water',       'Water Bowser'),
  ('repairs',     'Fundi — plumbing'),
  ('repairs',     'Fundi — electrical')
on conflict (category_key, name) do nothing;

insert into public.app_settings (key, value) values
  ('school', '{"schoolName": "Iris Fields School"}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
