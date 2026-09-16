# Database

Two files, run in order, in the Supabase SQL editor (or via `supabase db push`
if you use the CLI).

## `migrations/0001_init.sql`

The whole schema:

* `profiles` mirroring `auth.users`, with an `admin` / `staff` role. A trigger
  creates the row on sign-up and makes **the first account an admin**, so the
  school can bootstrap without SQL.
* Expenses: `expense_categories`, `vendors`, `expenses`. A trigger bumps a
  vendor's `usage_count` on every expense, which is what makes the quick-select
  chips learn.
* People: `classes`, `students`, `parents`, `student_parents`, `parent_notes`.
* Fees: `terms`, `fee_invoices`, `fee_payments`. A partial unique index enforces
  "at most one current term" in the database rather than in application code.
* Staff: `staff`, `leave_records`.
* Row-level security on every table, plus the `student-photos` storage bucket
  and its policies.

### The policies worth knowing about

* **Salaries are admin-only at the database level.** The `expenses` SELECT policy
  is `is_admin() OR category_key <> 'salaries'`. A staff account cannot read
  those rows even by querying the API directly — the UI hiding them is a
  courtesy, not the control.
* **Nobody can promote themselves.** `profiles_update_self` requires the new row
  to keep the caller's current role; only an admin can change a role.
* **Setting fees vs. recording payments are split.** Staff record payments (that
  is the secretary's job); only an admin writes `fee_invoices`, because deciding
  what a family owes is the director's call.

## `seed.sql`

Starter reference data only — classes, a current term, and the vendor chips the
school named. It deliberately creates no students, parents or expenses: real
records should be the school's own from day one.

Safe to re-run; every insert is `on conflict do nothing`.

## Money and dates

Money columns are `bigint` cents with a `> 0` check. Business dates are `date`,
defaulting to `(now() at time zone 'Africa/Nairobi')::date` so a late-evening
entry in another timezone still files under the right school day. Only
`created_at` / `updated_at` are `timestamptz`.
