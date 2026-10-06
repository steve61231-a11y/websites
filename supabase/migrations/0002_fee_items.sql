-- ============================================================================
-- Fees become line items.
--
-- 0001 modelled a term's fees as one lump sum per student. The school actually
-- bills several separate things — tuition & meals, admission, stationery,
-- insurance, uniform, transport, daycare days — each with its own cycle, its
-- own amount and its own settled/outstanding state. A family can be fully paid
-- up on tuition and still owe for transport, and the office needs to see that.
--
-- Safe to run after 0001 whether or not it holds data: existing invoices are
-- migrated across to a 'tuition' line rather than dropped.
-- ============================================================================

-- How often a thing is charged.
create type public.fee_cycle as enum (
  'term',   -- every term: tuition, transport
  'year',   -- once a school year: stationery, insurance
  'once',   -- once, on joining: admission, uniform
  'daily'   -- days attended x a rate: daycare
);

-- ------------------------------------------------------------- price list --

create table public.fee_items (
  key                  text primary key,
  label                text        not null,
  emoji                text        not null default '📌',
  cycle                fee_cycle   not null,
  -- Flat default in cents. Null when the price depends on the class.
  default_amount_cents bigint      check (default_amount_cents is null or default_amount_cents >= 0),
  -- { "<class uuid>": <cents> } — wins over default_amount_cents.
  class_amounts        jsonb       not null default '{}'::jsonb,
  -- Optional items are never raised automatically; somebody chooses them.
  is_optional          boolean     not null default false,
  -- Charged when a child first joins, not again every term.
  is_admission_only    boolean     not null default false,
  -- Empty = applies to everyone. Uniform is PP1/PP2 only.
  limited_to_class_ids uuid[]      not null default '{}',
  -- No list price at all; agreed family by family (transport).
  is_negotiated        boolean     not null default false,
  sort_order           int         not null default 100,
  is_archived          boolean     not null default false,
  updated_at           timestamptz not null default now()
);

comment on table public.fee_items is
  'The school price list. Amounts are DEFAULTS only — what a family is actually charged lives on fee_charges, because in practice nearly everything gets negotiated.';

create trigger fee_items_touch before update on public.fee_items
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------- what is charged --

create table public.fee_charges (
  id           uuid   primary key default gen_random_uuid(),
  student_id   uuid   not null references public.students (id) on delete cascade,
  item_key     text   not null references public.fee_items (key) on delete restrict,
  -- Null for annual and one-off lines, which belong to no single term.
  term_id      uuid   references public.terms (id) on delete cascade,
  amount_cents bigint not null check (amount_cents >= 0),
  due_date     date,
  -- For 'daily' lines: how many days this covers.
  quantity     numeric(8,2) check (quantity is null or quantity >= 0),
  notes        text,
  -- Written off or not applicable: settled, not owing.
  is_waived    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index fee_charges_student_idx on public.fee_charges (student_id);
create index fee_charges_term_idx on public.fee_charges (term_id);

create trigger fee_charges_touch before update on public.fee_charges
  for each row execute function public.touch_updated_at();

-- A payment can now say which line it settles.
alter table public.fee_payments
  add column charge_id uuid references public.fee_charges (id) on delete set null;

create index fee_payments_charge_idx on public.fee_payments (charge_id);

comment on column public.fee_payments.charge_id is
  'Which line this money settles. Null means not allocated yet — it still counts towards what the family has paid.';

-- ----------------------------------------------------------- the real list --

-- Classes first: the school runs Daycare, KG1, KG2, PP1 and PP2.
insert into public.classes (name, sort_order) values
  ('Daycare', 10), ('KG1', 20), ('KG2', 30), ('PP1', 40), ('PP2', 50)
on conflict (name) do update set sort_order = excluded.sort_order;

-- Tuition and admission vary by class, so their per-class amounts are filled in
-- from the classes table rather than hard-coded against uuids.
insert into public.fee_items
  (key, label, emoji, cycle, default_amount_cents, class_amounts,
   is_optional, is_admission_only, limited_to_class_ids, is_negotiated, sort_order)
values
  ('tuition', 'Tuition & meals', '🍽️', 'term', null,
   coalesce((
     select jsonb_object_agg(c.id::text, v.amount)
     from (values ('KG1', 3200000), ('KG2', 3400000), ('PP1', 3600000), ('PP2', 3700000))
          as v(name, amount)
     join public.classes c on c.name = v.name
   ), '{}'::jsonb),
   false, false,
   coalesce((select array_agg(id) from public.classes where name in ('KG1','KG2','PP1','PP2')), '{}'),
   false, 10),

  -- 600 a day. A line's amount is days attended x this rate.
  ('daycare', 'Daycare days', '🧸', 'daily', 60000, '{}'::jsonb,
   false, false,
   coalesce((select array_agg(id) from public.classes where name = 'Daycare'), '{}'),
   false, 20),

  -- Amount still to be confirmed by the school; set it in Settings.
  ('admission', 'Admission fee', '📝', 'once', 0, '{}'::jsonb, false, true, '{}', false, 30),

  ('stationery', 'Stationery', '✏️', 'year', 450000, '{}'::jsonb, false, false, '{}', false, 40),
  ('insurance', 'Insurance', '🛡️', 'year', 150000, '{}'::jsonb, false, true, '{}', false, 50),

  ('uniform', 'Uniform', '👕', 'once', 1000000, '{}'::jsonb, true, false,
   coalesce((select array_agg(id) from public.classes where name in ('PP1','PP2')), '{}'),
   false, 60),

  -- Depends how far the child lives, so it carries no list price.
  ('transport', 'Transport', '🚐', 'term', null, '{}'::jsonb, true, false, '{}', true, 70)
on conflict (key) do nothing;

-- ------------------------------------------------------------- the old data --

-- Carry any existing lump-sum invoice across as a tuition line, so nothing is
-- lost, then retire the old table.
insert into public.fee_charges (student_id, item_key, term_id, amount_cents, due_date, notes, created_at)
select i.student_id, 'tuition', i.term_id, i.amount_due_cents, i.due_date, i.notes, i.created_at
from public.fee_invoices i;

drop table if exists public.fee_invoices;

-- ================================= Row-Level Security ======================

alter table public.fee_items   enable row level security;
alter table public.fee_charges enable row level security;

-- Everyone signed in reads the price list; only an admin sets prices.
create policy fee_items_read on public.fee_items
  for select to authenticated using (true);
create policy fee_items_write on public.fee_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Same split as before: staff record what was paid, an admin decides what is
-- owed. Raising a charge is deciding what is owed.
create policy fee_charges_read on public.fee_charges
  for select to authenticated using (true);
create policy fee_charges_write on public.fee_charges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
