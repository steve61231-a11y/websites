-- ============================================================================
-- Instalments, and a real price for transport.
--
-- From the school's own notes:
--   Stationery  4,500 a year, or 1,500 a term across the three terms
--   Transport   10,000 — a list price, not a blank, though it is routinely
--               adjusted down for a child who lives close
-- ============================================================================

alter table public.fee_items
  add column instalment_amount_cents bigint
    check (instalment_amount_cents is null or instalment_amount_cents > 0);

comment on column public.fee_items.instalment_amount_cents is
  'What one instalment costs when the school lets a parent spread the item across the terms. Null = only ever paid in one go.';

-- Stationery can be spread over the three terms.
update public.fee_items
   set instalment_amount_cents = 150000
 where key = 'stationery';

-- Transport has a standard rate after all; it is negotiable, not priceless.
update public.fee_items
   set default_amount_cents = 1000000,
       is_negotiated        = false
 where key = 'transport';
