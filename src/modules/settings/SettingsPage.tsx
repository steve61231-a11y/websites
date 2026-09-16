import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Archive, ArchiveRestore, Database, Plus, RotateCcw, Sparkles, Trash2, Users,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, todayIso } from '@/lib/dates'
import {
  useClasses, useCreateClass, useCreateTerm, useCreateVendor, useDeleteClass,
  useProfiles, useSetVendorArchived, useStudents, useTerms, useUpdateProfileRole,
  useUpdateTerm, useVendors,
} from '@/data/queries'
import { resetDemoData } from '@/data'
import { CATEGORY_LIST, categoryToken } from '@/brand/categories'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Avatar, CardSkeleton, Pill, SectionTitle } from '@/components/ui/primitives'
import { Field, Select, TextInput } from '@/components/ui/fields'
import { ConfirmDialog, Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthProvider'
import { ROLE_DESCRIPTION, ROLE_LABEL } from '@/auth/permissions'
import type { ExpenseCategoryKey, Role } from '@/data/types'

export default function SettingsPage() {
  const { can, profile, setDemoRole, isDemo } = useAuth()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        emoji="⚙️"
        subtitle="The lists the rest of the app picks from."
      />

      {isDemo && <DemoPanel role={profile?.role ?? 'admin'} onRoleChange={setDemoRole} />}

      <VendorSettings />
      <ClassSettings />
      {can('fees.setInvoice') && <TermSettings />}
      {can('settings.manageUsers') && <UserSettings />}

      <section className="card">
        <SectionTitle hint="Where this information lives">Your data</SectionTitle>
        <div className="flex items-start gap-3.5 rounded-2xl bg-sand-50 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-iris-500 shadow-soft">
            <Database className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-[0.95rem] leading-relaxed text-sand-600">
            {isDemo ? (
              <>
                This is <strong className="text-sand-800">demo mode</strong>. Everything you see is
                sample data stored only in this browser — nothing is sent anywhere, and nothing here
                is the real school's records. Add your Supabase keys to switch to the real database.
              </>
            ) : (
              <>
                Connected to <strong className="text-sand-800">Supabase</strong>. Records are stored in
                your own Postgres database with row-level security, so each person only sees what their
                role allows — the rules are enforced by the database, not just hidden in the app.
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ demo */

function DemoPanel({ role, onRoleChange }: { role: Role; onRoleChange: (role: Role) => void }) {
  const [confirming, setConfirming] = useState(false)
  const { notify } = useToast()

  return (
    <section className="card border-gold-300 bg-gold-50">
      <SectionTitle hint="Only shown while no database is connected">
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold-600" aria-hidden="true" />
          Demo controls
        </span>
      </SectionTitle>

      <p className="mb-4 text-[0.95rem] leading-relaxed text-sand-600">
        Try the app as either role to see exactly what each person can and cannot reach. In the real
        system this is set per user account and enforced by the database.
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {(['admin', 'staff'] as const).map((r) => (
          <button
            key={r}
            onClick={() => onRoleChange(r)}
            className={cn(
              'rounded-2xl border-2 p-4 text-left transition-all',
              role === r ? 'border-iris-500 bg-white shadow-soft' : 'border-transparent bg-white/60 hover:bg-white',
            )}
          >
            <span className="flex items-center gap-2 font-extrabold text-sand-900">
              {ROLE_LABEL[r]}
              {role === r && <Pill tone="iris">Viewing as this</Pill>}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-sand-500">{ROLE_DESCRIPTION[r]}</span>
          </button>
        ))}
      </div>

      <Button
        variant="soft"
        className="mt-4"
        icon={<RotateCcw className="h-4 w-4" />}
        onClick={() => setConfirming(true)}
      >
        Reset the demo data
      </Button>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          resetDemoData()
          notify('Demo data reset. Reloading…', 'info')
          setTimeout(() => window.location.reload(), 600)
        }}
        title="Reset the demo?"
        body="Everything you have added or changed in the demo will be wiped and the original sample school restored."
        confirmLabel="Reset"
      />
    </section>
  )
}

/* --------------------------------------------------------------- vendors */

function VendorSettings() {
  const { data: vendors = [], isLoading } = useVendors()
  const createVendor = useCreateVendor()
  const archiveVendor = useSetVendorArchived()
  const { notify } = useToast()

  const [category, setCategory] = useState<ExpenseCategoryKey>('supermarket')
  const [name, setName] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const forCategory = useMemo(
    () =>
      vendors
        .filter((v) => v.categoryKey === category && (showArchived || !v.isArchived))
        .sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name)),
    [vendors, category, showArchived],
  )

  async function add() {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await createVendor.mutateAsync({ categoryKey: category, name: trimmed })
      setName('')
      notify(`${trimmed} added to ${categoryToken(category).label}.`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add that.', 'error')
    }
  }

  if (isLoading) return <CardSkeleton rows={3} />

  return (
    <section className="card">
      <SectionTitle hint="The one-tap shortcuts on the Add Expense screen">
        Shops & suppliers
      </SectionTitle>

      <div className="scroll-x mb-4 flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_LIST.map((token) => (
          <button
            key={token.key}
            onClick={() => setCategory(token.key)}
            style={category === token.key ? { backgroundColor: token.color, borderColor: token.color } : undefined}
            className={cn(
              'flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3.5 text-sm font-extrabold transition-colors',
              category === token.key
                ? 'text-white'
                : 'border-sand-200 bg-white text-sand-600 hover:border-iris-300',
            )}
          >
            <span aria-hidden="true">{token.emoji}</span>
            {token.short}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void add()}
          placeholder={`Add a ${categoryToken(category).short.toLowerCase()} supplier…`}
        />
        <Button className="shrink-0" disabled={!name.trim()} loading={createVendor.isPending} onClick={() => void add()}>
          Add
        </Button>
      </div>

      {forCategory.length === 0 ? (
        <p className="rounded-2xl bg-sand-50 px-4 py-6 text-center text-sm font-semibold text-sand-500">
          No shortcuts for {categoryToken(category).label} yet. Add one above, or just type a name
          when logging an expense — it gets remembered automatically.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {forCategory.map((vendor) => (
            <li
              key={vendor.id}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3.5 py-2.5',
                vendor.isArchived ? 'bg-sand-100/60' : 'bg-sand-50',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate font-extrabold', vendor.isArchived ? 'text-sand-400 line-through' : 'text-sand-800')}>
                  {vendor.name}
                </span>
                <span className="block text-xs font-semibold text-sand-400">
                  used {vendor.usageCount} {vendor.usageCount === 1 ? 'time' : 'times'}
                </span>
              </span>
              <button
                onClick={() => void archiveVendor.mutateAsync({ id: vendor.id, archived: !vendor.isArchived })}
                aria-label={vendor.isArchived ? `Restore ${vendor.name}` : `Hide ${vendor.name}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sand-400 transition-colors hover:bg-white hover:text-iris-600"
              >
                {vendor.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setShowArchived((v) => !v)}
        className="mt-3 text-sm font-extrabold text-iris-600 hover:text-iris-700"
      >
        {showArchived ? 'Hide' : 'Show'} hidden shops
      </button>
    </section>
  )
}

/* --------------------------------------------------------------- classes */

function ClassSettings() {
  const { data: classes = [] } = useClasses()
  const { data: students = [] } = useStudents()
  const createClass = useCreateClass()
  const deleteClass = useDeleteClass()
  const { notify } = useToast()

  const [name, setName] = useState('')
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null)

  async function add() {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await createClass.mutateAsync(trimmed)
      setName('')
      notify(`${trimmed} added.`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add that class.', 'error')
    }
  }

  return (
    <section className="card">
      <SectionTitle hint="Used when adding or moving a child">Classes</SectionTitle>

      <div className="mb-4 flex gap-2">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void add()}
          placeholder="e.g. Pre-Unit"
        />
        <Button className="shrink-0" disabled={!name.trim()} loading={createClass.isPending} onClick={() => void add()}>
          Add
        </Button>
      </div>

      <ul className="space-y-1.5">
        {classes.map((cls) => {
          const count = students.filter((s) => s.classId === cls.id && s.status === 'active').length
          return (
            <li key={cls.id} className="flex items-center gap-3 rounded-2xl bg-sand-50 px-3.5 py-2.5">
              <span className="min-w-0 flex-1 truncate font-extrabold text-sand-800">{cls.name}</span>
              <Pill tone="muted">{count} {count === 1 ? 'child' : 'children'}</Pill>
              <button
                onClick={() => setPending({ id: cls.id, name: cls.name })}
                aria-label={`Delete ${cls.name}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sand-400 transition-colors hover:bg-white hover:text-bad-base"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          )
        })}
        {classes.length === 0 && (
          <p className="rounded-2xl bg-sand-50 px-4 py-6 text-center text-sm font-semibold text-sand-500">
            No classes yet. Add the first one above.
          </p>
        )}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        busy={deleteClass.isPending}
        onConfirm={async () => {
          if (!pending) return
          await deleteClass.mutateAsync(pending.id)
          notify(`${pending.name} deleted.`, 'info')
          setPending(null)
        }}
        title={`Delete ${pending?.name ?? 'this class'}?`}
        body="Children in this class stay on the register — they simply become unassigned, and you can move them afterwards."
      />
    </section>
  )
}

/* ----------------------------------------------------------------- terms */

function TermSettings() {
  const { data: terms = [] } = useTerms()
  const createTerm = useCreateTerm()
  const updateTerm = useUpdateTerm()
  const { notify } = useToast()
  const [adding, setAdding] = useState(false)

  return (
    <section className="card">
      <SectionTitle
        hint="Fees are tracked per term"
        action={
          <Button size="sm" variant="soft" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
            Add term
          </Button>
        }
      >
        Terms
      </SectionTitle>

      {terms.length === 0 ? (
        <p className="rounded-2xl bg-sand-50 px-4 py-6 text-center text-sm font-semibold text-sand-500">
          No terms set up yet. Add one to start tracking school fees.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {terms.map((term) => (
            <li
              key={term.id}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-2xl px-3.5 py-3',
                term.isCurrent ? 'bg-iris-50 ring-1 ring-inset ring-iris-200' : 'bg-sand-50',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold text-sand-900">{term.name}</span>
                <span className="block text-sm text-sand-500">
                  {formatDate(term.startDate, 'medium')} – {formatDate(term.endDate, 'medium')}
                </span>
              </span>
              {term.isCurrent ? (
                <Pill tone="iris">Current term</Pill>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void updateTerm.mutateAsync({ id: term.id, patch: { isCurrent: true } })}
                >
                  Make current
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <AddTermSheet
        open={adding}
        onClose={() => setAdding(false)}
        onSave={async (term) => {
          await createTerm.mutateAsync(term)
          notify(`${term.name} added.`)
          setAdding(false)
        }}
        busy={createTerm.isPending}
      />
    </section>
  )
}

function AddTermSheet({
  open, onClose, onSave, busy,
}: {
  open: boolean
  onClose: () => void
  onSave: (term: { name: string; startDate: string; endDate: string; isCurrent: boolean }) => Promise<void>
  busy: boolean
}) {
  const today = todayIso()
  const [name, setName] = useState(`Term 1 ${today.slice(0, 4)}`)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [isCurrent, setIsCurrent] = useState(true)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a term"
      size="sm"
      footer={
        <Button
          block
          disabled={!name.trim() || endDate < startDate}
          loading={busy}
          onClick={() => void onSave({ name: name.trim(), startDate, endDate, isCurrent })}
        >
          Add term
        </Button>
      }
    >
      <div className="space-y-4 pb-4">
        <Field label="Name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Term 2 2026" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts">
            <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Ends">
            <TextInput type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-3 rounded-2xl bg-sand-50 p-4">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="h-5 w-5 rounded-md border-2 border-sand-300 text-iris-500 focus:ring-iris-300"
          />
          <span className="font-extrabold text-sand-800">Make this the current term</span>
        </label>
      </div>
    </Sheet>
  )
}

/* ----------------------------------------------------------------- users */

function UserSettings() {
  const { data: profiles = [], isLoading } = useProfiles()
  const updateRole = useUpdateProfileRole()
  const { profile: me } = useAuth()
  const { notify } = useToast()

  if (isLoading) return <CardSkeleton rows={2} />

  return (
    <section className="card">
      <SectionTitle hint="Who can sign in, and what they can see">People with logins</SectionTitle>

      <ul className="space-y-2">
        {profiles.map((person) => (
          <motion.li
            key={person.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-sand-50 p-3"
          >
            <Avatar name={person.fullName} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-extrabold text-sand-900">
                {person.fullName}
                {person.id === me?.id && <span className="ml-1.5 text-sm font-bold text-sand-400">(you)</span>}
              </span>
              <span className="block truncate text-sm text-sand-500">{person.email}</span>
            </span>
            <Select
              value={person.role}
              aria-label={`Role for ${person.fullName}`}
              disabled={person.id === me?.id}
              onChange={async (e) => {
                try {
                  await updateRole.mutateAsync({ id: person.id, role: e.target.value as Role })
                  notify(`${person.fullName} is now ${ROLE_LABEL[e.target.value as Role]}.`)
                } catch (err) {
                  notify(err instanceof Error ? err.message : 'Could not change that role.', 'error')
                }
              }}
              className="h-11 w-auto min-w-[8rem] text-sm"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </Select>
          </motion.li>
        ))}
      </ul>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-sand-50 p-4">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-sand-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-sand-500">
          New people join by creating an account on the sign-in screen. They start as{' '}
          <strong className="text-sand-700">Staff</strong> — change them to Admin here if they need to
          see salaries and set fees. You cannot change your own role.
          {' '}
          <Link to="/staff" className="font-extrabold text-iris-600">Manage the staff register</Link>{' '}
          separately — not everyone on the team needs a login.
        </p>
      </div>
    </section>
  )
}
