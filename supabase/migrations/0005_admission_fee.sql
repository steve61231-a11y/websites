-- ============================================================================
-- The admission fee, confirmed by the school: 2,500, flat across every class.
--
-- It is separate from tuition — the per-class figures (32k/34k/36k/37k) are
-- tuition and meals — and it is charged only when a child first joins.
-- ============================================================================

update public.fee_items
   set default_amount_cents = 250000,
       class_amounts        = '{}'::jsonb
 where key = 'admission';
