import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarPlus, Download, Phone, Plus, Trash2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { addDays, daysBetween, formatDate, formatRelativeDay, todayIso } from '@/lib/dates'
import { downloadCsv } from '@/lib/csv'
import {
  useCreateLeave, useCreateStaff, useDeleteLeave, useLeave, useStaff,
} from '@/data/queries'
import { annualLeaveUsed, leaveDays, onLeaveOn, upcomingLeave } from '@/data/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Fab } from '@/components/ui/Button'
import {
  Avatar, CardSkeleton, EmptyState, Pill, SectionTitle,
} from '@/components/ui/primitives'
import { Segmented } from '@/components/ui/Segmented'
import { ChoiceChips, Field, Select, TextArea, TextInput } from '@/components/ui/fields'
import { ConfirmDialog, Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthProvider'
import type { LeaveRecord, LeaveType, StaffMember } from '@/data/types'

const LEAVE_TYPES: Array<{ value: LeaveType; label: string; emoji: string; tone: 'sky' | 'warn' | 'muted' }> = [
  { value: 'annual', label: 'Annual leave', emoji: '🏝️', tone: 'sky' },
  { value: 'sick', label: 'Sick day', emoji: '🤒', tone: 'warn' },
  { value: 'other', label: 'Other', emoji: '📋', tone: 'muted' },
]

const leaveMeta = (type: LeaveType) => LEAVE_TYPES.find((t) => t.value === type) ?? LEAVE_TYPES[2]

export default function StaffPage() {
  const { can } = useAuth()
  const staff = useStaff()
  const leave = useLeave()
  const [params, setParams] = useSearchParams()

  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [addingLeave, setAddingLeave] = useState(false)
  const [addingStaff, setAddingStaff] = useState(false)

  const today = todayIso()
  const team = staff.data ?? []
  const records = leave.data ?? []

  const focusedId = params.get('member')
  const focused = team.find((m) => m.id === focusedId) ?? null

  const offToday = useMemo(() => onLeaveOn(records, today), [records, today])
  const coming = useMemo(() => upcomingLeave(records, today, 45), [records, today])

  const memberById = useMemo(
    () => new Map(team.map((m) => [m.id, m] as const)),
    [team],
  )

  function exportCsv() {
    downloadCsv('iris-fields-leave', records, [
      { header: 'Staff member', value: (r) => memberById.get(r.staffId)?.fullName ?? '' },
      { header: 'Type', value: (r) => leaveMeta(r.type).label },
      { header: 'From', value: (r) => r.startDate },
      { header: 'To', value: (r) => r.endDate },
      { header: 'Days', value: (r) => leaveDays(r) },
      { header: 'Note', value: (r) => r.notes ?? '' },
    ])
  }

  if (staff.isLoading) {
    return <div className="space-y-4"><CardSkeleton rows={2} /><CardSkeleton rows={4} /></div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff Leave"
        emoji="🗓️"
        subtitle={
          offToday.length === 0
            ? 'Everyone is in today'
            : `${offToday.length} ${offToday.length === 1 ? 'person is' : 'people are'} off today`
        }
        action={
          can('staff.logLeave') ? (
            <Button className="hidden lg:inline-flex" icon={<CalendarPlus className="h-5 w-5" />} onClick={() => setAddingLeave(true)}>
              Log leave
            </Button>
          ) : undefined
        }
      />

      {team.length === 0 ? (
        <EmptyState
          emoji="🧑‍🏫"
          title="No staff on the register yet"
          body="Add the teachers, the cook, the driver — anyone whose days off you want to keep track of."
          action={
            can('staff.manageRegister') ? (
              <Button size="lg" icon={<UserPlus className="h-5 w-5" />} onClick={() => setAddingStaff(true)}>
                Add the first person
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* --------------------------------------------------- who is off */}
          <section
            className={cn(
              'rounded-blob px-6 py-6 shadow-soft',
              offToday.length === 0 ? 'bg-good-soft' : 'bg-white ring-1 ring-sand-200',
            )}
          >
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-sand-400">
              Today · {formatDate(today, 'long')}
            </p>

            {offToday.length === 0 ? (
              <p className="mt-2 font-display text-xl font-extrabold text-good-ink">
                Everyone is in today 🎉
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {offToday.map((record) => {
                  const member = memberById.get(record.staffId)
                  const meta = leaveMeta(record.type)
                  return (
                    <li key={record.id} className="flex items-center gap-3.5">
                      <Avatar name={member?.fullName ?? '?'} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-sand-900">{member?.fullName}</p>
                        <p className="truncate text-sm text-sand-500">
                          {member?.roleTitle}
                          {record.endDate !== record.startDate &&
                            ` · back ${formatRelativeDay(addDays(record.endDate, 1)).toLowerCase()}`}
                        </p>
                      </div>
                      <Pill tone={meta.tone}>
                        <span aria-hidden="true">{meta.emoji}</span> {meta.label}
                      </Pill>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <Segmented
            ariaLabel="View"
            options={[
              { value: 'today' as const, label: 'The team' },
              { value: 'history' as const, label: 'All leave' },
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === 'today' ? (
            <>
              {coming.length > 0 && (
                <section className="card">
                  <SectionTitle hint="Next 45 days">Coming up</SectionTitle>
                  <ul className="space-y-2">
                    {coming.map((record) => {
                      const member = memberById.get(record.staffId)
                      const meta = leaveMeta(record.type)
                      return (
                        <li key={record.id} className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3">
                          <span aria-hidden="true" className="text-lg">{meta.emoji}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-extrabold text-sand-800">{member?.fullName}</span>
                            <span className="block truncate text-sm text-sand-500">
                              {formatDate(record.startDate, 'medium')}
                              {record.endDate !== record.startDate && ` – ${formatDate(record.endDate, 'medium')}`}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-extrabold text-sand-400">
                            in {daysBetween(today, record.startDate)}d
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}

              <section>
                <SectionTitle
                  hint={`${team.filter((m) => m.isActive).length} people`}
                  action={
                    can('staff.manageRegister') ? (
                      <Button size="sm" variant="soft" icon={<UserPlus className="h-4 w-4" />} onClick={() => setAddingStaff(true)}>
                        Add
                      </Button>
                    ) : undefined
                  }
                >
                  The team
                </SectionTitle>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {team.map((member) => (
                    <StaffCard
                      key={member.id}
                      member={member}
                      records={records}
                      isOffToday={offToday.some((r) => r.staffId === member.id)}
                      highlighted={focused?.id === member.id}
                      onClear={() => setParams({})}
                    />
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <section>
              <SectionTitle
                hint={`${records.length} records`}
                action={
                  <Button size="sm" variant="soft" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
                    Export
                  </Button>
                }
              >
                Every leave record
              </SectionTitle>
              <LeaveHistory records={records} members={memberById} canDelete={can('staff.logLeave')} />
            </section>
          )}
        </>
      )}

      {can('staff.logLeave') && team.length > 0 && (
        <Fab label="Log leave" icon={<Plus className="h-5 w-5" />} onClick={() => setAddingLeave(true)} className="lg:hidden" />
      )}

      {addingLeave && (
        <LogLeaveSheet open={addingLeave} onClose={() => setAddingLeave(false)} presetStaffId={focused?.id} />
      )}
      {addingStaff && <StaffForm open={addingStaff} onClose={() => setAddingStaff(false)} />}
    </div>
  )
}

/* ------------------------------------------------------------- staff card */

function StaffCard({
  member, records, isOffToday, highlighted, onClear,
}: {
  member: StaffMember
  records: LeaveRecord[]
  isOffToday: boolean
  highlighted: boolean
  onClear: () => void
}) {
  const used = annualLeaveUsed(records, member.id)
  const sickDays = records
    .filter((r) => r.staffId === member.id && r.type === 'sick')
    .reduce((total, r) => total + leaveDays(r), 0)

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={highlighted ? onClear : undefined}
      className={cn(
        'rounded-3xl border bg-white p-4 shadow-soft transition-all',
        highlighted ? 'border-iris-400 ring-2 ring-iris-200' : 'border-sand-200/80',
      )}
    >
      <div className="flex items-start gap-3.5">
        <Avatar name={member.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[1.05rem] font-extrabold text-sand-900">
            {member.fullName}
          </p>
          <p className="truncate text-sm font-semibold text-sand-500">{member.roleTitle || 'Staff'}</p>
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="tnum mt-1 flex items-center gap-1.5 text-sm font-bold text-iris-600 hover:text-iris-700"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {member.phone}
            </a>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {isOffToday && <Pill tone="warn">Off today</Pill>}
            {!member.isActive && <Pill tone="muted">No longer here</Pill>}
            {member.annualLeaveDays !== null ? (
              <Pill tone={used >= member.annualLeaveDays ? 'bad' : 'sky'}>
                {used}/{member.annualLeaveDays} leave days
              </Pill>
            ) : (
              used > 0 && <Pill tone="sky">{used} leave days</Pill>
            )}
            {sickDays > 0 && <Pill tone="muted">{sickDays} sick days</Pill>}
          </div>
        </div>
      </div>
    </motion.li>
  )
}

/* ---------------------------------------------------------- leave history */

function LeaveHistory({
  records, members, canDelete,
}: {
  records: LeaveRecord[]
  members: Map<string, StaffMember>
  canDelete: boolean
}) {
  const deleteLeave = useDeleteLeave()
  const [pending, setPending] = useState<LeaveRecord | null>(null)
  const { notify } = useToast()

  if (records.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-lg font-extrabold text-sand-800">No leave recorded yet</p>
        <p className="mt-1 text-sm text-sand-500">Log a sick day or some annual leave and it will show up here.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="card divide-y divide-sand-100 overflow-hidden p-0">
        {records.map((record) => {
          const member = members.get(record.staffId)
          const meta = leaveMeta(record.type)
          const days = leaveDays(record)
          return (
            <li key={record.id} className="group flex items-center gap-3.5 px-4 py-3.5">
              <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sand-50 text-lg">
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-sand-800">{member?.fullName ?? 'Unknown'}</p>
                <p className="truncate text-sm text-sand-500">
                  {meta.label} · {formatDate(record.startDate, 'medium')}
                  {record.endDate !== record.startDate && ` – ${formatDate(record.endDate, 'medium')}`}
                </p>
                {record.notes && <p className="truncate text-sm text-sand-400">{record.notes}</p>}
              </div>
              <span className="shrink-0 text-sm font-extrabold text-sand-500">
                {days} {days === 1 ? 'day' : 'days'}
              </span>
              {canDelete && (
                <button
                  onClick={() => setPending(record)}
                  aria-label="Delete leave record"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sand-300 transition-colors hover:bg-sand-100 hover:text-bad-base"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        busy={deleteLeave.isPending}
        onConfirm={async () => {
          if (!pending) return
          await deleteLeave.mutateAsync(pending.id)
          notify('Leave record deleted.', 'info')
          setPending(null)
        }}
        title="Delete this leave record?"
        body="It will be removed from the log and from that person's totals."
      />
    </>
  )
}

/* ------------------------------------------------------------- log leave */

function LogLeaveSheet({
  open, onClose, presetStaffId,
}: { open: boolean; onClose: () => void; presetStaffId?: string }) {
  const { data: team = [] } = useStaff()
  const createLeave = useCreateLeave()
  const { notify } = useToast()

  const today = todayIso()
  const [staffId, setStaffId] = useState(presetStaffId ?? '')
  const [type, setType] = useState<LeaveType>('sick')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [multiDay, setMultiDay] = useState(false)
  const [notes, setNotes] = useState('')

  const member = team.find((m) => m.id === staffId)
  const days = multiDay ? Math.max(daysBetween(startDate, endDate) + 1, 1) : 1

  async function submit() {
    if (!staffId) return
    try {
      await createLeave.mutateAsync({
        staffId,
        type,
        startDate,
        endDate: multiDay ? endDate : startDate,
        notes: notes.trim() || null,
      })
      notify(`Leave logged for ${member?.fullName.split(' ')[0] ?? 'them'}.`)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not log that leave.', 'error')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log some leave"
      description="A sick day, annual leave, or anything else that keeps someone out."
      footer={
        <Button block size="lg" disabled={!staffId} loading={createLeave.isPending} onClick={() => void submit()}>
          Save {days} {days === 1 ? 'day' : 'days'}
        </Button>
      }
    >
      <div className="space-y-5 pb-4">
        <Field label="Who?" required>
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">Choose someone…</option>
            {team.filter((m) => m.isActive).map((m) => (
              <option key={m.id} value={m.id}>{m.fullName} — {m.roleTitle}</option>
            ))}
          </Select>
        </Field>

        <Field label="What kind?" required>
          <ChoiceChips
            ariaLabel="Leave type"
            columns={3}
            options={LEAVE_TYPES.map((t) => ({ value: t.value, label: t.label, emoji: t.emoji }))}
            value={type}
            onChange={(next) => setType(next as LeaveType)}
          />
        </Field>

        <Field label={multiDay ? 'First day' : 'Which day?'}>
          <TextInput
            type="date"
            value={startDate}
            onChange={(e) => {
              const next = e.target.value || today
              setStartDate(next)
              if (next > endDate) setEndDate(next)
            }}
          />
        </Field>

        {multiDay ? (
          <Field label="Last day">
            <TextInput
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value || startDate)}
            />
          </Field>
        ) : (
          <button
            onClick={() => setMultiDay(true)}
            className="flex items-center gap-2 text-sm font-extrabold text-iris-600 hover:text-iris-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            It's more than one day
          </button>
        )}

        <Field label="Note" hint="Optional">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Back on Monday. Lilian is covering Nursery."
          />
        </Field>
      </div>
    </Sheet>
  )
}

/* ------------------------------------------------------------ staff form */

function StaffForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createStaff = useCreateStaff()
  const { notify } = useToast()
  const [draft, setDraft] = useState<Omit<StaffMember, 'id'>>({
    fullName: '',
    roleTitle: '',
    phone: null,
    email: null,
    startDate: todayIso(),
    isActive: true,
    annualLeaveDays: null,
  })
  const [trackAllowance, setTrackAllowance] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!draft.fullName.trim()) {
      setError('Please add their name.')
      return
    }
    try {
      await createStaff.mutateAsync({
        ...draft,
        annualLeaveDays: trackAllowance ? draft.annualLeaveDays ?? 21 : null,
      })
      notify(`${draft.fullName} added to the team.`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that person.')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add someone to the team"
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button block loading={createStaff.isPending} onClick={() => void submit()}>Add</Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <Field label="Full name" required>
          <TextInput
            value={draft.fullName}
            onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
            placeholder="Lilian Akinyi"
          />
        </Field>
        <Field label="Role">
          <TextInput
            value={draft.roleTitle}
            onChange={(e) => setDraft({ ...draft, roleTitle: e.target.value })}
            placeholder="Class Teacher — Nursery"
          />
        </Field>
        <Field label="Phone" hint="Optional">
          <TextInput
            type="tel"
            inputMode="tel"
            value={draft.phone ?? ''}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value || null })}
            placeholder="+254 7…"
          />
        </Field>
        <Field label="Started">
          <TextInput
            type="date"
            value={draft.startDate ?? ''}
            onChange={(e) => setDraft({ ...draft, startDate: e.target.value || null })}
          />
        </Field>

        <div className="rounded-2xl bg-sand-50 p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={trackAllowance}
              onChange={(e) => setTrackAllowance(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 rounded-md border-2 border-sand-300 text-iris-500 focus:ring-iris-300"
            />
            <span>
              <span className="block font-extrabold text-sand-800">Track an annual leave allowance</span>
              <span className="mt-0.5 block text-sm text-sand-500">
                Leave this off to simply keep a log of days taken, which is how most small schools do it.
              </span>
            </span>
          </label>
          {trackAllowance && (
            <Field label="Days per year" className="mt-4">
              <TextInput
                type="number"
                min={0}
                value={draft.annualLeaveDays ?? 21}
                onChange={(e) => setDraft({ ...draft, annualLeaveDays: Number(e.target.value) })}
              />
            </Field>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-bad-soft px-4 py-3 text-sm font-bold text-bad-ink">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
