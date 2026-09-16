import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { ageInYears, formatDate } from '@/lib/dates'
import { formatKes } from '@/lib/money'
import { downloadCsv } from '@/lib/csv'
import {
  useClasses, useInvoices, useLinks, useParents, usePayments, useStudents, useTerms,
} from '@/data/queries'
import {
  currentTerm, FEE_STATUS_META, feeBalancesForTerm, fullName, guardiansOf,
} from '@/data/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Fab } from '@/components/ui/Button'
import {
  Avatar, CardSkeleton, EmptyState, Pill, StaggerItem, StaggerList,
} from '@/components/ui/primitives'
import { SearchInput } from '@/components/ui/fields'
import { Segmented } from '@/components/ui/Segmented'
import { StudentForm } from './StudentForm'
import { useAuth } from '@/auth/AuthProvider'

export default function StudentsPage() {
  const { can } = useAuth()
  const students = useStudents()
  const classes = useClasses()
  const terms = useTerms()
  const invoices = useInvoices()
  const payments = usePayments()
  const parents = useParents()
  const links = useLinks()

  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState<string>('all')
  const [adding, setAdding] = useState(false)

  const term = currentTerm(terms.data ?? [])
  const all = students.data ?? []

  const balances = useMemo(
    () => feeBalancesForTerm(all, term?.id ?? null, invoices.data ?? [], payments.data ?? []),
    [all, term, invoices.data, payments.data],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all
      .filter((s) => (classId === 'all' ? true : s.classId === classId))
      .filter((s) => {
        if (!q) return true
        if (fullName(s).toLowerCase().includes(q)) return true
        // Searching a parent's name should find their children — that is how
        // people actually think about "the Otieno boy".
        return guardiansOf(s.id, parents.data ?? [], links.data ?? []).some((g) =>
          g.fullName.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active') ||
        fullName(a).localeCompare(fullName(b)))
  }, [all, classId, search, parents.data, links.data])

  const classOptions = useMemo(
    () => [
      { value: 'all', label: `All (${all.filter((s) => s.status === 'active').length})` },
      ...(classes.data ?? []).map((c) => ({
        value: c.id,
        label: `${c.name} (${all.filter((s) => s.classId === c.id && s.status === 'active').length})`,
      })),
    ],
    [classes.data, all],
  )

  function exportCsv() {
    downloadCsv('iris-fields-students', visible, [
      { header: 'First name', value: (s) => s.firstName },
      { header: 'Last name', value: (s) => s.lastName },
      { header: 'Class', value: (s) => s.className ?? '' },
      { header: 'Date of birth', value: (s) => s.dateOfBirth ?? '' },
      { header: 'Enrolled', value: (s) => s.enrollmentDate },
      { header: 'Status', value: (s) => s.status },
      { header: 'Guardians', value: (s) =>
        guardiansOf(s.id, parents.data ?? [], links.data ?? []).map((g) => `${g.fullName} (${g.relationship})`).join('; ') },
      { header: 'Emergency contact', value: (s) => s.emergencyContactName ?? '' },
      { header: 'Emergency phone', value: (s) => s.emergencyContactPhone ?? '' },
      { header: 'Allergies', value: (s) => s.allergies.join('; ') },
      { header: 'Fee balance (KES)', value: (s) => ((balances.get(s.id)?.balanceCents ?? 0) / 100).toFixed(2) },
    ])
  }

  if (students.isLoading) {
    return <div className="space-y-4"><CardSkeleton rows={1} /><CardSkeleton rows={5} /></div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        emoji="👨‍👩‍👧‍👦"
        subtitle={`${all.filter((s) => s.status === 'active').length} children enrolled`}
        action={
          can('students.manage') ? (
            <Button className="hidden lg:inline-flex" icon={<Plus className="h-5 w-5" />} onClick={() => setAdding(true)}>
              Add child
            </Button>
          ) : undefined
        }
      />

      {all.length === 0 ? (
        <EmptyState
          emoji="🎒"
          title="No children yet"
          body="Add the first child and their profile will start collecting everything — class, guardians, allergies and fee balance."
          action={
            can('students.manage') ? (
              <Button size="lg" icon={<Plus className="h-5 w-5" />} onClick={() => setAdding(true)}>
                Add the first child
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Search a child or a parent…" />

          {classOptions.length > 1 && (
            <Segmented ariaLabel="Class" options={classOptions} value={classId} onChange={setClassId} size="sm" />
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-sand-500">
              {visible.length} {visible.length === 1 ? 'child' : 'children'}
            </p>
            <Button size="sm" variant="soft" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
              Export
            </Button>
          </div>

          {visible.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="font-display text-lg font-extrabold text-sand-800">Nobody matches that</p>
              <p className="mt-1 text-sm text-sand-500">Try a different name or clear the class filter.</p>
            </div>
          ) : (
            <StaggerList className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((student) => {
                const balance = balances.get(student.id)
                const meta = balance ? FEE_STATUS_META[balance.status] : null
                const guardians = guardiansOf(student.id, parents.data ?? [], links.data ?? [])
                return (
                  <StaggerItem key={student.id}>
                    <Link
                      to={`/students/${student.id}`}
                      className="flex h-full items-start gap-3.5 rounded-3xl border border-sand-200/80 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                    >
                      <Avatar name={fullName(student)} src={student.photoUrl} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[1.05rem] font-extrabold text-sand-900">
                          {fullName(student)}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-sand-500">
                          {student.className ?? 'No class yet'}
                          {student.dateOfBirth && ` · ${ageInYears(student.dateOfBirth)} yrs`}
                        </p>
                        {guardians[0] && (
                          <p className="mt-0.5 truncate text-sm text-sand-400">{guardians[0].fullName}</p>
                        )}

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {student.status !== 'active' && (
                            <Pill tone="muted">{student.status === 'graduated' ? 'Graduated' : 'Left'}</Pill>
                          )}
                          {student.allergies.slice(0, 1).map((a) => (
                            <Pill key={a} tone="bad">⚠ {a}</Pill>
                          ))}
                          {meta && can('fees.view') && balance && (
                            <Pill tone={meta.tone === 'muted' ? 'muted' : meta.tone}>
                              <span aria-hidden="true">{meta.icon}</span>
                              {balance.status === 'paid' || balance.status === 'no-invoice'
                                ? meta.label
                                : `${formatKes(balance.balanceCents, { prefix: false })} due`}
                            </Pill>
                          )}
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>
                )
              })}
            </StaggerList>
          )}

          {term && (
            <p className="pt-1 text-center text-xs font-semibold text-sand-400">
              Fee status shown for {term.name} · {formatDate(term.startDate, 'short')} – {formatDate(term.endDate, 'short')}
            </p>
          )}
        </>
      )}

      {can('students.manage') && (
        <Fab label="Add child" icon={<Plus className="h-5 w-5" />} onClick={() => setAdding(true)} className="lg:hidden" />
      )}

      {adding && <StudentForm open={adding} onClose={() => setAdding(false)} />}
    </div>
  )
}
