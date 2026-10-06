import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera, Cake, CalendarCheck, Pencil, Phone, Plus, Trash2, UserPlus, Wallet,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { ageInYears, formatDate } from '@/lib/dates'
import { formatKes } from '@/lib/money'
import {
  useCharges, useDeleteCharge, useDeleteStudent, useFeeItems, useLinks, useLinkParent,
  useParents, usePayments, useStudents, useTerms, useUnlinkParent, useUploadStudentPhoto,
} from '@/data/queries'
import {
  currentTerm, FEE_STATUS_META, feeBalance, fullName, guardiansOf,
} from '@/data/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import {
  Avatar, CardSkeleton, EmptyState, Pill, SectionTitle,
} from '@/components/ui/primitives'
import { ConfirmDialog, Sheet } from '@/components/ui/Sheet'
import { Field, Select } from '@/components/ui/fields'
import { useToast } from '@/components/ui/Toast'
import { StudentForm } from './StudentForm'
import { RecordPaymentSheet } from '@/modules/fees/RecordPaymentSheet'
import { BillBuilder } from '@/modules/fees/BillBuilder'
import { useAuth } from '@/auth/AuthProvider'
import { paymentMethodLabel } from '@/brand/categories'
import type { Relationship } from '@/data/types'

const RELATIONSHIPS: Array<{ value: Relationship; label: string }> = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
]

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can } = useAuth()
  const { notify } = useToast()

  const students = useStudents()
  const parents = useParents()
  const links = useLinks()
  const terms = useTerms()
  const charges = useCharges()
  const feeItems = useFeeItems()
  const payments = usePayments()

  const uploadPhoto = useUploadStudentPhoto()
  const deleteStudent = useDeleteStudent()
  const deleteCharge = useDeleteCharge()
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [linking, setLinking] = useState(false)
  const [payingFees, setPayingFees] = useState(false)
  const [buildingBill, setBuildingBill] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pendingLineDelete, setPendingLineDelete] = useState<string | null>(null)

  const student = (students.data ?? []).find((s) => s.id === id)
  const term = currentTerm(terms.data ?? [])

  const balance = useMemo(
    () => (student
      ? feeBalance(student.id, term?.id ?? null, charges.data ?? [], payments.data ?? [], feeItems.data ?? [])
      : null),
    [student, term, charges.data, payments.data, feeItems.data],
  )

  const history = useMemo(
    () => (payments.data ?? []).filter((p) => p.studentId === id),
    [payments.data, id],
  )

  const guardians = student ? guardiansOf(student.id, parents.data ?? [], links.data ?? []) : []

  if (students.isLoading) {
    return <div className="space-y-4"><CardSkeleton rows={3} /><CardSkeleton rows={3} /></div>
  }

  if (!student) {
    return (
      <EmptyState
        emoji="🔍"
        title="We can't find that child"
        body="They may have been removed. Go back to the list and try again."
        action={<Button onClick={() => navigate('/students')}>Back to students</Button>}
      />
    )
  }

  async function onPhotoPicked(file: File | undefined) {
    if (!file || !student) return
    try {
      await uploadPhoto.mutateAsync({ studentId: student.id, file })
      notify('Photo updated.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not upload that photo.', 'error')
    }
  }

  const statusMeta = balance ? FEE_STATUS_META[balance.status] : null

  return (
    <div className="space-y-5">
      <PageHeader
        title={fullName(student)}
        backTo="/students"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {student.className ?? 'No class yet'}
            {student.dateOfBirth && (
              <>
                <span aria-hidden="true">·</span>
                {ageInYears(student.dateOfBirth)} years old
              </>
            )}
          </span>
        }
        action={
          can('students.manage') ? (
            <Button variant="soft" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              <span className="hidden sm:inline">Edit</span>
            </Button>
          ) : undefined
        }
      />

      {/* -------------------------------------------------------- identity */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-wrap items-center gap-5"
      >
        <div className="relative">
          <Avatar name={fullName(student)} src={student.photoUrl} size="xl" />
          {can('students.manage') && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-iris-500 text-white shadow-glow transition-transform hover:scale-105"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPhotoPicked(e.target.files?.[0])}
              />
            </>
          )}
        </div>

        {/* min-w forces this onto its own row beside a phone-width avatar
            rather than squeezing two facts into ~150px. */}
        <dl className="grid min-w-[15rem] flex-1 grid-cols-2 gap-3 text-sm">
          <Fact icon={<Cake className="h-4 w-4" />} label="Born">
            {student.dateOfBirth ? formatDate(student.dateOfBirth, 'medium') : 'Not recorded'}
          </Fact>
          <Fact icon={<CalendarCheck className="h-4 w-4" />} label="Joined">
            {formatDate(student.enrollmentDate, 'medium')}
          </Fact>
        </dl>

        {student.allergies.length > 0 && (
          <div className="w-full rounded-2xl bg-bad-soft p-4">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-bad-ink">
              ⚠ Allergies & medical
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {student.allergies.map((a) => (
                <span key={a} className="rounded-full bg-white/70 px-3 py-1 text-sm font-extrabold text-bad-ink">
                  {a}
                </span>
              ))}
            </div>
            {student.medicalNotes && (
              <p className="mt-2.5 text-sm font-semibold leading-relaxed text-bad-ink/90">
                {student.medicalNotes}
              </p>
            )}
          </div>
        )}

        {student.emergencyContactName && (
          <a
            href={`tel:${student.emergencyContactPhone ?? ''}`}
            className="flex w-full items-center gap-3 rounded-2xl bg-sand-50 p-4 transition-colors hover:bg-sand-100"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sky-600 shadow-soft">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-sand-400">
                In an emergency, call
              </span>
              <span className="block truncate font-extrabold text-sand-800">
                {student.emergencyContactName}
              </span>
              <span className="tnum block truncate text-sm font-bold text-sand-500">
                {student.emergencyContactPhone}
              </span>
            </span>
          </a>
        )}
      </motion.section>

      {/* ------------------------------------------------------------ fees */}
      {can('fees.view') && (
        <section className="card">
          <SectionTitle
            hint={term?.name ?? 'No term set up yet'}
            action={
              can('fees.setInvoice') ? (
                <Button size="sm" variant="soft" icon={<Plus className="h-4 w-4" />} onClick={() => setBuildingBill(true)}>
                  Set fees
                </Button>
              ) : undefined
            }
          >
            School fees
          </SectionTitle>

          {!balance || balance.lines.length === 0 ? (
            <div className="rounded-2xl bg-sand-50 px-4 py-8 text-center">
              <p className="font-display text-base font-extrabold text-sand-800">
                No fees set for {student.firstName} yet
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-sand-500">
                Add what they owe this term — tuition, and anything else like transport or
                stationery — and every payment will be tracked against it.
              </p>
              {can('fees.setInvoice') && (
                <Button className="mt-4" onClick={() => setBuildingBill(true)}>Set their fees</Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <FeeFigure label="Total billed" value={formatKes(balance.dueCents)} />
                <FeeFigure label="Paid so far" value={formatKes(balance.paidCents)} tone="good" />
                <FeeFigure
                  label="Balance"
                  value={formatKes(balance.balanceCents)}
                  tone={balance.balanceCents > 0 ? 'bad' : 'good'}
                />
              </div>

              <ul className="mt-4 space-y-1.5">
                {balance.lines.map((line) => {
                  const meta = FEE_STATUS_META[line.status]
                  const pct = line.charge.amountCents > 0
                    ? Math.min(line.paidCents / line.charge.amountCents, 1)
                    : 0
                  return (
                    <li key={line.charge.id} className="rounded-2xl bg-sand-50 p-3.5">
                      <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="shrink-0 text-xl">
                          {line.item?.emoji ?? '📌'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-extrabold text-sand-800">
                            {line.item?.label ?? line.charge.itemKey}
                            {line.charge.quantity !== null && (
                              <span className="ml-1.5 font-bold text-sand-400">
                                × {line.charge.quantity} days
                              </span>
                            )}
                          </p>
                          <p className="tnum truncate text-sm text-sand-500">
                            {formatKes(line.paidCents)} of {formatKes(line.charge.amountCents)}
                            {line.balanceCents > 0 && ` · ${formatKes(line.balanceCents)} to go`}
                          </p>
                        </div>
                        <Pill tone={meta.tone === 'muted' ? 'muted' : meta.tone}>
                          <span aria-hidden="true">{meta.icon}</span> {meta.label}
                        </Pill>
                        {can('fees.setInvoice') && (
                          <button
                            onClick={() => setPendingLineDelete(line.charge.id)}
                            aria-label={`Remove ${line.item?.label ?? 'line'}`}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sand-300 transition-colors hover:bg-white hover:text-bad-base"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {line.charge.amountCents > 0 && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(pct * 100, 2)}%`,
                              backgroundColor: pct >= 1 ? '#17845A' : '#B0730A',
                            }}
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {statusMeta && (
                  <Pill tone={statusMeta.tone === 'muted' ? 'muted' : statusMeta.tone}>
                    <span aria-hidden="true">{statusMeta.icon}</span> {statusMeta.label}
                  </Pill>
                )}
                {balance.dueDate && balance.balanceCents > 0 && (
                  <span className="text-sm font-semibold text-sand-500">
                    Due {formatDate(balance.dueDate, 'medium')}
                  </span>
                )}
                {can('fees.recordPayment') && (
                  <Button
                    size="sm"
                    className="ml-auto"
                    icon={<Wallet className="h-4 w-4" />}
                    onClick={() => setPayingFees(true)}
                  >
                    Record a payment
                  </Button>
                )}
              </div>

              {history.length > 0 && (
                <ul className="mt-5 divide-y divide-sand-100 rounded-2xl bg-sand-50/70">
                  {history.map((p) => {
                    const line = balance.lines.find((l) => l.charge.id === p.chargeId)
                    return (
                      <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                        <span aria-hidden="true" className="text-lg">{line?.item?.emoji ?? '🧾'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-sand-800">
                            {formatDate(p.paidOn, 'medium')}
                            {line?.item && (
                              <span className="ml-1.5 font-bold text-sand-400">{line.item.label}</span>
                            )}
                          </span>
                          <span className="block truncate text-xs font-semibold text-sand-500">
                            {paymentMethodLabel(p.method)}
                            {p.reference && ` · ${p.reference}`}
                          </span>
                        </span>
                        <span className="tnum shrink-0 font-display text-base font-extrabold text-good-ink">
                          +{formatKes(p.amountCents, { prefix: false })}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      )}

      {/* ------------------------------------------------------- guardians */}
      <section className="card">
        <SectionTitle
          action={
            can('parents.manage') ? (
              <Button size="sm" variant="soft" icon={<UserPlus className="h-4 w-4" />} onClick={() => setLinking(true)}>
                Link
              </Button>
            ) : undefined
          }
        >
          Family
        </SectionTitle>

        {guardians.length === 0 ? (
          <p className="rounded-2xl bg-sand-50 px-4 py-6 text-center text-sm font-semibold text-sand-500">
            No parent or guardian linked yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {guardians.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/parents/${g.id}`}
                  className="flex items-center gap-3.5 rounded-2xl bg-sand-50 p-3 transition-colors hover:bg-sand-100"
                >
                  <Avatar name={g.fullName} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-sand-900">{g.fullName}</span>
                    <span className="block truncate text-sm capitalize text-sand-500">
                      {g.relationship}
                      {g.phone && ` · ${g.phone}`}
                    </span>
                  </span>
                  {g.isPrimaryContact && <Pill tone="gold">Main contact</Pill>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {can('students.manage') && (
        <div className="pt-2">
          <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
            Remove {student.firstName} from the school
          </Button>
        </div>
      )}

      {editing && <StudentForm open={editing} onClose={() => setEditing(false)} student={student} />}

      {linking && (
        <LinkGuardianSheet studentId={student.id} open={linking} onClose={() => setLinking(false)} />
      )}

      {payingFees && (
        <RecordPaymentSheet
          open={payingFees}
          onClose={() => setPayingFees(false)}
          presetStudentId={student.id}
        />
      )}

      {buildingBill && (
        <BillBuilder open={buildingBill} onClose={() => setBuildingBill(false)} student={student} />
      )}

      <ConfirmDialog
        open={pendingLineDelete !== null}
        onClose={() => setPendingLineDelete(null)}
        busy={deleteCharge.isPending}
        onConfirm={async () => {
          if (!pendingLineDelete) return
          await deleteCharge.mutateAsync(pendingLineDelete)
          notify('Fee line removed. Any payments against it are kept.', 'info')
          setPendingLineDelete(null)
        }}
        title="Remove this fee line?"
        body="It stops counting towards what the family owes. Payments already recorded against it are kept and become unallocated."
        confirmLabel="Remove"
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        busy={deleteStudent.isPending}
        onConfirm={async () => {
          try {
            await deleteStudent.mutateAsync(student.id)
            notify(`${student.firstName} has been removed.`, 'info')
            navigate('/students')
          } catch (err) {
            notify(err instanceof Error ? err.message : 'Could not remove that child.', 'error')
          }
        }}
        title={`Remove ${fullName(student)}?`}
        body="Their fee records and family links will be deleted too. If they have simply left the school, it is better to set their status to “Left” instead — that keeps the history."
        confirmLabel="Remove"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */

function Fact({
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-sand-50 px-3.5 py-2.5">
      <dt className="flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-sand-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-bold text-sand-800">{children}</dd>
    </div>
  )
}

function FeeFigure({
  label, value, tone = 'ink',
}: { label: string; value: string; tone?: 'ink' | 'good' | 'bad' }) {
  return (
    <div className="rounded-2xl bg-sand-50 px-4 py-3.5">
      <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-sand-400">{label}</p>
      <p
        className={cn(
          'tnum mt-1 font-display text-xl font-extrabold leading-none',
          tone === 'good' && 'text-good-ink',
          tone === 'bad' && 'text-bad-ink',
          tone === 'ink' && 'text-sand-900',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function LinkGuardianSheet({
  studentId, open, onClose,
}: { studentId: string; open: boolean; onClose: () => void }) {
  const { data: parents = [] } = useParents()
  const { data: links = [] } = useLinks()
  const linkParent = useLinkParent()
  const unlinkParent = useUnlinkParent()
  const { notify } = useToast()

  const [parentId, setParentId] = useState('')
  const [relationship, setRelationship] = useState<Relationship>('mother')

  const linked = links.filter((l) => l.studentId === studentId)
  const available = parents.filter((p) => !linked.some((l) => l.parentId === p.id))

  async function submit() {
    if (!parentId) return
    try {
      await linkParent.mutateAsync({
        studentId,
        parentId,
        relationship,
        isPrimaryContact: linked.length === 0,
      })
      notify('Linked to the family.')
      setParentId('')
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not link that parent.', 'error')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Link a parent or guardian"
      description="Parents are shared across siblings — link the same person to each of their children."
      size="sm"
      footer={
        <Button block disabled={!parentId} loading={linkParent.isPending} onClick={() => void submit()}>
          Link them
        </Button>
      }
    >
      <div className="space-y-4 pb-4">
        {available.length === 0 ? (
          <p className="rounded-2xl bg-sand-50 px-4 py-6 text-center text-sm font-semibold text-sand-500">
            Every parent on record is already linked to this child.{' '}
            <Link to="/parents" className="font-extrabold text-iris-600">Add a new parent</Link> first.
          </p>
        ) : (
          <>
            <Field label="Who?">
              <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">Choose a parent…</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </Select>
            </Field>
            <Field label="Relationship to the child">
              <Select value={relationship} onChange={(e) => setRelationship(e.target.value as Relationship)}>
                {RELATIONSHIPS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>
          </>
        )}

        {linked.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-extrabold text-sand-700">Already linked</p>
            <ul className="space-y-2">
              {linked.map((l) => {
                const parent = parents.find((p) => p.id === l.parentId)
                if (!parent) return null
                return (
                  <li key={l.parentId} className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3">
                    <Avatar name={parent.fullName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-sand-800">{parent.fullName}</span>
                      <span className="block text-xs capitalize text-sand-500">{l.relationship}</span>
                    </span>
                    <button
                      onClick={() => void unlinkParent.mutateAsync({ studentId, parentId: l.parentId })}
                      aria-label={`Unlink ${parent.fullName}`}
                      className="grid h-9 w-9 place-items-center rounded-xl text-sand-400 hover:bg-white hover:text-bad-base"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  )
}
