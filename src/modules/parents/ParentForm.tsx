import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Field, SearchInput, Select, TextInput } from '@/components/ui/fields'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import {
  useCreateParent, useLinkParent, useLinks, useStudents, useUnlinkParent, useUpdateParent,
} from '@/data/queries'
import { fullName } from '@/data/selectors'
import type { Parent, ParentDraft, Relationship } from '@/data/types'

const RELATIONSHIPS: Array<{ value: Relationship; label: string }> = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
]

/**
 * Adding or editing a parent.
 *
 * The children are picked here rather than afterwards on each child's page: a
 * parent exists *because* of their children, and making someone save a parent,
 * navigate to a student and link back is three screens for one thought.
 */
export function ParentForm({
  open, onClose, parent, onCreated,
}: {
  open: boolean
  onClose: () => void
  parent?: Parent
  onCreated?: (parent: Parent) => void
}) {
  const { notify } = useToast()
  const createParent = useCreateParent()
  const updateParent = useUpdateParent()
  const linkParent = useLinkParent()
  const unlinkParent = useUnlinkParent()
  const { data: students = [] } = useStudents()
  const { data: links = [] } = useLinks()

  const [draft, setDraft] = useState<ParentDraft>(() => ({
    fullName: parent?.fullName ?? '',
    phone: parent?.phone ?? '',
    email: parent?.email ?? null,
  }))
  const [relationship, setRelationship] = useState<Relationship>('mother')
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<string[]>(
    () => links.filter((l) => l.parentId === parent?.id).map((l) => l.studentId),
  )
  const [error, setError] = useState<string | null>(null)

  const busy = createParent.isPending || updateParent.isPending || linkParent.isPending

  const roster = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students
      .filter((s) => s.status === 'active')
      .filter((s) => (q ? fullName(s).toLowerCase().includes(q) : true))
      .sort((a, b) => fullName(a).localeCompare(fullName(b)))
  }, [students, search])

  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  async function submit() {
    if (!draft.fullName.trim()) {
      setError('Please add their name.')
      return
    }
    setError(null)
    try {
      const saved = parent
        ? await updateParent.mutateAsync({ id: parent.id, patch: draft })
        : await createParent.mutateAsync(draft)

      const already = links.filter((l) => l.parentId === saved.id).map((l) => l.studentId)
      for (const studentId of picked) {
        if (already.includes(studentId)) continue
        await linkParent.mutateAsync({
          studentId,
          parentId: saved.id,
          relationship,
          // First guardian on a child becomes the one you ring.
          isPrimaryContact: !links.some((l) => l.studentId === studentId),
        })
      }
      for (const studentId of already) {
        if (!picked.includes(studentId)) await unlinkParent.mutateAsync({ studentId, parentId: saved.id })
      }

      notify(
        parent
          ? 'Details saved.'
          : `${saved.fullName} added${picked.length > 0 ? ` and linked to ${picked.length} ${picked.length === 1 ? 'child' : 'children'}` : ''}.`,
      )
      onCreated?.(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save those details.')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={parent ? `Edit ${parent.fullName}` : 'Add a parent or guardian'}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button block loading={busy} onClick={() => void submit()}>
            {parent ? 'Save changes' : 'Add'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-4">
        <Field label="Full name" required htmlFor="parent-name">
          <TextInput
            id="parent-name"
            value={draft.fullName}
            onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
            placeholder="Grace Wanjiru"
            autoComplete="off"
          />
        </Field>

        <Field label="Phone number" hint="The one you would actually call" htmlFor="parent-phone">
          <TextInput
            id="parent-phone"
            type="tel"
            inputMode="tel"
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            placeholder="+254 7…"
          />
        </Field>

        <Field label="Email" hint="Optional" htmlFor="parent-email">
          <TextInput
            id="parent-email"
            type="email"
            value={draft.email ?? ''}
            onChange={(e) => setDraft({ ...draft, email: e.target.value || null })}
            placeholder="grace@example.co.ke"
          />
        </Field>

        {/* ----------------------------------------------------- children */}
        <div className="rounded-3xl bg-white p-4 shadow-soft">
          <p className="font-display text-base font-extrabold text-sand-900">Their children</p>
          <p className="mb-3 text-sm text-sand-500">
            Tick every child of theirs — brothers and sisters share the same parent.
          </p>

          {picked.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {picked.map((id) => {
                const child = students.find((s) => s.id === id)
                if (!child) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-iris-50 px-3 py-1.5 text-sm font-extrabold text-iris-700"
                  >
                    {fullName(child)}
                    <button
                      onClick={() => toggle(id)}
                      aria-label={`Unlink ${fullName(child)}`}
                      className="grid h-5 w-5 place-items-center rounded-full hover:bg-iris-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          {students.length > 6 && (
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search a child…"
              className="mb-2.5"
            />
          )}

          <div className="max-h-56 space-y-1.5 overflow-y-auto">
            {roster.map((child) => {
              const on = picked.includes(child.id)
              return (
                <button
                  key={child.id}
                  onClick={() => toggle(child.id)}
                  aria-pressed={on}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-colors',
                    on ? 'border-iris-500 bg-iris-50' : 'border-sand-200 bg-white hover:border-iris-300',
                  )}
                >
                  <Avatar name={fullName(child)} src={child.photoUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-sand-800">{fullName(child)}</span>
                    <span className="block truncate text-sm text-sand-500">{child.className ?? 'No class'}</span>
                  </span>
                  {on && <Check className="h-5 w-5 shrink-0 text-iris-600" aria-hidden="true" />}
                </button>
              )
            })}
            {roster.length === 0 && (
              <p className="px-3 py-6 text-center text-sm font-semibold text-sand-400">
                {students.length === 0 ? 'No children on the register yet.' : 'No child matches that name.'}
              </p>
            )}
          </div>

          {picked.length > 0 && (
            <Field label="They are the children's…" className="mt-4">
              <Select value={relationship} onChange={(e) => setRelationship(e.target.value as Relationship)}>
                {RELATIONSHIPS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
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
