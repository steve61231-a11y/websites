import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChoiceChips, Field, Select, TextArea, TextInput } from '@/components/ui/fields'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { useClasses, useCreateStudent, useUpdateStudent } from '@/data/queries'
import { todayIso } from '@/lib/dates'
import type { Student, StudentDraft, StudentStatus } from '@/data/types'

const STATUS_OPTIONS = [
  { value: 'active' as const, label: 'Enrolled', emoji: '🎒' },
  { value: 'graduated' as const, label: 'Graduated', emoji: '🎓' },
  { value: 'withdrawn' as const, label: 'Left', emoji: '👋' },
]

/** Common allergies, offered as one-tap tags so nobody has to spell "anaphylaxis". */
const ALLERGY_SUGGESTIONS = ['Peanut allergy', 'Dairy', 'Eggs', 'Gluten', 'Bee stings', 'Asthma']

const emptyDraft = (): StudentDraft => ({
  firstName: '',
  lastName: '',
  dateOfBirth: null,
  photoUrl: null,
  classId: null,
  enrollmentDate: todayIso(),
  status: 'active',
  emergencyContactName: null,
  emergencyContactPhone: null,
  allergies: [],
  medicalNotes: null,
})

const fromStudent = (student: Student): StudentDraft => ({
  firstName: student.firstName,
  lastName: student.lastName,
  dateOfBirth: student.dateOfBirth,
  photoUrl: student.photoUrl,
  classId: student.classId,
  enrollmentDate: student.enrollmentDate,
  status: student.status,
  emergencyContactName: student.emergencyContactName,
  emergencyContactPhone: student.emergencyContactPhone,
  allergies: student.allergies,
  medicalNotes: student.medicalNotes,
})

export function StudentForm({
  open, onClose, student, onCreated,
}: {
  open: boolean
  onClose: () => void
  student?: Student
  onCreated?: (student: Student) => void
}) {
  const { notify } = useToast()
  const { data: classes = [] } = useClasses()
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const [draft, setDraft] = useState<StudentDraft>(() => (student ? fromStudent(student) : emptyDraft()))
  const [allergyInput, setAllergyInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const set = (patch: Partial<StudentDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const busy = createStudent.isPending || updateStudent.isPending

  function addAllergy(value: string) {
    const tag = value.trim()
    if (!tag || draft.allergies.includes(tag)) return
    set({ allergies: [...draft.allergies, tag] })
    setAllergyInput('')
  }

  async function submit() {
    if (!draft.firstName.trim()) {
      setError("Please add the child's first name.")
      return
    }
    setError(null)
    try {
      if (student) {
        await updateStudent.mutateAsync({ id: student.id, patch: draft })
        notify(`${draft.firstName}'s details saved.`)
      } else {
        const created = await createStudent.mutateAsync(draft)
        notify(`${created.firstName} is enrolled. Welcome! 🎒`)
        onCreated?.(created)
        setDraft(emptyDraft())
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save those details.')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={student ? `Edit ${student.firstName}` : 'Add a child'}
      description={student ? undefined : 'Only the first name is required — the rest can wait.'}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button block loading={busy} onClick={() => void submit()}>
            {student ? 'Save changes' : 'Add child'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required htmlFor="first-name">
            <TextInput
              id="first-name"
              value={draft.firstName}
              onChange={(e) => set({ firstName: e.target.value })}
              placeholder="Amani"
              autoComplete="off"
            />
          </Field>
          <Field label="Last name" htmlFor="last-name">
            <TextInput
              id="last-name"
              value={draft.lastName}
              onChange={(e) => set({ lastName: e.target.value })}
              placeholder="Wanjiru"
              autoComplete="off"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Class" htmlFor="class">
            <Select
              id="class"
              value={draft.classId ?? ''}
              onChange={(e) => set({ classId: e.target.value || null })}
            >
              <option value="">Not assigned yet</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date of birth" htmlFor="dob">
            <TextInput
              id="dob"
              type="date"
              max={todayIso()}
              value={draft.dateOfBirth ?? ''}
              onChange={(e) => set({ dateOfBirth: e.target.value || null })}
            />
          </Field>
        </div>

        <Field label="Started at the school" htmlFor="enrolled">
          <TextInput
            id="enrolled"
            type="date"
            value={draft.enrollmentDate}
            onChange={(e) => set({ enrollmentDate: e.target.value || todayIso() })}
          />
        </Field>

        <Field label="Status">
          <ChoiceChips
            ariaLabel="Status"
            columns={3}
            size="sm"
            options={STATUS_OPTIONS}
            value={draft.status}
            onChange={(status) => set({ status: status as StudentStatus })}
          />
        </Field>

        <div className="rounded-3xl bg-white p-4 shadow-soft">
          <p className="mb-3 font-display text-base font-extrabold text-sand-900">In an emergency</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Who do we call?" htmlFor="ec-name">
              <TextInput
                id="ec-name"
                value={draft.emergencyContactName ?? ''}
                onChange={(e) => set({ emergencyContactName: e.target.value || null })}
                placeholder="Grace Wanjiru"
              />
            </Field>
            <Field label="Phone number" htmlFor="ec-phone">
              <TextInput
                id="ec-phone"
                type="tel"
                inputMode="tel"
                value={draft.emergencyContactPhone ?? ''}
                onChange={(e) => set({ emergencyContactPhone: e.target.value || null })}
                placeholder="+254 7…"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-soft">
          <p className="mb-1 font-display text-base font-extrabold text-sand-900">Allergies & medical</p>
          <p className="mb-3 text-sm text-sand-500">The kitchen and the teachers both see these.</p>

          {draft.allergies.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {draft.allergies.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full bg-bad-soft px-3 py-1.5 text-sm font-extrabold text-bad-ink"
                >
                  {tag}
                  <button
                    onClick={() => set({ allergies: draft.allergies.filter((a) => a !== tag) })}
                    aria-label={`Remove ${tag}`}
                    className="grid h-5 w-5 place-items-center rounded-full hover:bg-white/60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            {ALLERGY_SUGGESTIONS.filter((s) => !draft.allergies.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addAllergy(s)}
                className="flex min-h-[38px] items-center gap-1 rounded-xl border-2 border-dashed border-sand-300 px-3 text-sm font-bold text-sand-500 transition-colors hover:border-iris-300 hover:text-iris-600"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <TextInput
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addAllergy(allergyInput)
                }
              }}
              placeholder="Something else…"
            />
            <Button variant="soft" className="shrink-0" onClick={() => addAllergy(allergyInput)}>
              Add
            </Button>
          </div>

          <Field label="Notes" className="mt-4">
            <TextArea
              value={draft.medicalNotes ?? ''}
              onChange={(e) => set({ medicalNotes: e.target.value || null })}
              placeholder="e.g. Carries an inhaler in her bag."
            />
          </Field>
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
