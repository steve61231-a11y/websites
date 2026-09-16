# Iris Fields School — management system

Expenses, students, parents, school fees and staff leave for a small kindergarten
in Nairobi. One login, one dashboard, every module cross-referencing the others.

Built for a school secretary on a phone, in a busy classroom, who has never used
a "dashboard" before — and for a director who needs the money side to be exact.

<p align="center">
  <img src="public/logo-mark.svg" width="96" alt="Iris Fields School" />
</p>

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

With no configuration at all the app starts in **demo mode**: a full sample
school (12 children, 10 families, six months of expenses, a term of fees, a
staff rota) stored only in your browser. Nothing is sent anywhere and nothing
can be broken. It exists so the system can be opened and shown to someone before
any keys are issued.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Types only |

### Connecting the real database

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/0001_init.sql` in the SQL editor — tables, roles,
   row-level security policies, triggers and the photo storage bucket.
3. Run `supabase/seed.sql` for the starter lists (classes, a first term, the
   vendor quick-select chips). It creates no children, parents or expenses.
4. Copy `.env.example` to `.env.local` and fill in:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. Restart the dev server. The login screen switches from the demo card to real
   email/password and magic-link sign-in.

**The first account to sign up becomes the Admin** — a trigger assigns it — so
the school owner can bootstrap without touching SQL. Everyone after that starts
as Staff, and an Admin can promote them in Settings.

---

## How it is put together

```
src/
  brand/        logo (traced from the official artwork) + category tokens
  lib/          money, dates, CSV, small hooks — no React state, all pure
  data/         types → repo interface → two implementations → query hooks
  auth/         Supabase Auth, roles, capability checks
  components/   ui kit, charts, app shell
  modules/      one folder per module: expenses, students, parents, fees, staff, settings
supabase/
  migrations/   the schema, RLS policies and storage rules
  seed.sql      starter reference data
```

### The data seam

`src/data/repo.ts` defines one interface. Two things implement it:

* `supabaseRepo` — the real backend (Postgres + Auth + RLS + Storage).
* `localRepo` — the demo store, backed by `localStorage`.

`src/data/index.ts` picks between them on one line, based on whether Supabase
keys exist. Every screen is written against the interface, so nothing in the UI
knows or cares which one is live.

Collections are loaded whole and cached by TanStack Query. The school has about
a dozen children and a few hundred expenses a year; paginating that would cost
more in complexity than it saves, and holding full lists is what lets a
student's page show their fee balance without a round trip.

### Rules that are not negotiable in this codebase

**Money is always an integer number of cents.** `Cents` in `src/lib/money.ts`,
`bigint` in Postgres. No floats in state, in the database, or in a chart.
Formatting happens at the edge, never in storage.

**A business date is a plain `YYYY-MM-DD`.** An expense date, a payment date and
a leave day have no timezone — they are calendar days. "Today" always means today
in `Africa/Nairobi` regardless of where the browser thinks it is, which is why
every calendar question goes through `src/lib/dates.ts` and never through a bare
`new Date()`. Only audit columns (`created_at`) are true instants.

**Permissions live in two places, deliberately.** `src/auth/permissions.ts`
decides what the UI renders; the RLS policies in the migration decide what the
database will actually return. Hiding a button is a courtesy — the policy is the
boundary. Staff cannot read salary expense rows even by crafting a request.

**Derived answers live in `src/data/selectors.ts`.** "What does this child owe?"
is computed in exactly one place, so the fees page, the student profile and the
dashboard can never disagree.

### Roles

| | Admin | Staff |
|---|---|---|
| Log expenses | ✓ | ✓ |
| See salary expenses | ✓ | — |
| Students, parents, notes | ✓ | ✓ |
| Record fee payments | ✓ | ✓ |
| Set what a term costs | ✓ | — |
| Log staff leave | ✓ | ✓ |
| Manage the staff register | ✓ | — |
| Manage users and roles | ✓ | — |

In demo mode you can switch between the two from Settings to see exactly what
each person can reach.

---

## Design notes

**Brand.** The three hues are lifted from the school's own logo artwork —
`#665EC7` iris, `#00AEEF` sky, `#F1D058` gold — and the mark itself is traced
vector, not a bitmap. The hand-lettered wordmark is used as artwork only; UI text
is Nunito, because readability on a phone beats personality in a form label.

**Minimal typing, maximum tapping.** Categories are tiles. Vendors are chips that
reorder themselves around how often the school actually uses them. Payment
methods are chips. Dates default to today with one-tap "Today"/"Yesterday".
Free text is always the escape hatch, never the default.

**The amount keypad.** Digits append right-to-left like a till or an M-Pesa
prompt — type `4 5 2 0 0`, watch `KES 452.00` build up. There is no decimal point
to miss and no way to typo a stray `.` into a ten-fold error.

**Charts.** The expense category palette was validated with a colour-blindness
checker against the app's light chart surface: it passes the lightness band,
chroma floor, CVD separation (worst adjacent pair ΔE 8.6 protan) and
normal-vision floor (worst 16.2). Three hues sit under 3:1 contrast on white, so
every chart ships direct labels, a legend and a per-category icon — identity is
never carried by colour alone. Re-run the checker before changing a category
colour or inserting one into the middle of the order. Charts render on a fixed
light surface (`color-scheme: light`), which is what the palette was validated
against; adding a dark theme means re-stepping the palette for the dark surface,
not flipping it.

---

## Things deliberately left out of v1

* **Notifications.** The dashboard surfaces overdue fees and today's absences as
  a gentle strip. Push or SMS reminders would need a decision about who gets
  them and how often, which is a conversation with the school, not a default.
* **Attendance.** Not asked for, and a daily register is a different interaction
  from anything here — it wants its own design pass rather than being bolted
  onto the students list.
* **A dark theme.** The chart palette is validated for the light surface; doing
  dark properly means re-stepping it, not inverting it.
