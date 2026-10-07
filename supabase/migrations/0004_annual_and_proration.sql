-- ============================================================================
-- Two corrections from the school, and mid-term joiners.
--
--   * Insurance is an annual premium, so continuing children pay it again each
--     year. It had been modelled as a joining-only item. The admission fee is
--     the only thing a continuing child never pays again.
--   * "If a parent joins later, we prorate the amount as per where the term is.
--     Tuition fee, stationery is done the same, transport too."
-- ============================================================================

update public.fee_items
   set is_admission_only = false
 where key = 'insurance';

alter table public.fee_items
  add column is_proratable boolean not null default false;

comment on column public.fee_items.is_proratable is
  'Scaled down when a child joins part-way through a term. True for tuition, stationery and transport; false for things that do not divide — admission, uniform, the insurance premium.';

update public.fee_items
   set is_proratable = true
 where key in ('tuition', 'stationery', 'transport');

-- A charge records what it was prorated from, so the figure can be explained to
-- a parent months later rather than looking like an arbitrary number.
alter table public.fee_charges
  add column full_amount_cents bigint
    check (full_amount_cents is null or full_amount_cents >= 0),
  add column prorated_from date;

comment on column public.fee_charges.full_amount_cents is
  'The undiscounted price this line was prorated down from. Null when the line was charged in full.';
