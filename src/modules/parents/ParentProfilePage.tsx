import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, MessageSquarePlus, Pencil, Phone, Trash2 } from 'lucide-react'
import { formatDate, formatRelativeDay, todayIso } from '@/lib/dates'
import { formatKes } from '@/lib/money'
import {
  useAddParentNote, useDeleteParent, useDeleteParentNote, useInvoices, useLinks,
  useParentNotes, useParents, usePayments, useStudents, useTerms,
} from '@/data/queries'
import {
  childrenOf, currentTerm, FEE_STATUS_META, feeBalance, fullName,
} from '@/data/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import {
  Avatar, CardSkeleton, EmptyState, Pill, SectionTitle,
} from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { DateField, Field, TextArea } from '@/components/ui/fields'
import { useToast } from '@/components/ui/Toast'
import { ParentForm } from './ParentForm'
import { useAuth } from '@/auth/AuthProvider'

export default function ParentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can } = useAuth()
  const { notify } = useToast()

  const parents = useParents()
  const students = useStudents()
  const links = useLinks()
  const notes = useParentNotes()
  const terms = useTerms()
  const invoices = useInvoices()
  const payments = usePayments()

  const deleteParent = useDeleteParent()

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const parent = (parents.data ?? []).find((p) => p.id === id)
  const kids = parent ? childrenOf(parent.id, students.data ?? [], links.data ?? []) : []
  const term = currentTerm(terms.data ?? [])

  const familyBalance = useMemo(() => {
    if (!term) return 0
    return kids.reduce((total, kid) => {
      const b = feeBalance(kid.id, term.id, invoices.data ?? [], payments.data ?? [])
      return total + Math.max(b.balanceCents, 0)
    }, 0)
  }, [kids, term, invoices.data, payments.data])

  const timeline = useMemo(
    () => (notes.data ?? []).filter((n) => n.parentId === id),
    [notes.data, id],
  )

  if (parents.isLoading) {
    return <div className="space-y-4"><CardSkeleton rows={3} /><CardSkeleton rows={3} /></div>
  }

  if (!parent) {
    return (
      <EmptyState
        emoji="🔍"
        title="We can't find that parent"
        body="They may have been removed. Go back to the list and try again."
        action={<Button onClick={() => navigate('/parents')}>Back to parents</Button>}
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={parent.fullName}
        backTo="/parents"
        subtitle={kids.length === 0 ? 'No children linked yet' : `${kids.map((k) => k.firstName).join(', ')}`}
        action={
          can('parents.manage') ? (
            <Button variant="soft" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              <span className="hidden sm:inline">Edit</span>
            </Button>
          ) : undefined
        }
      />

      {/* ------------------------------------------------------ contact card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-wrap items-center gap-4"
      >
        <Avatar name={parent.fullName} size="xl" />
        <div className="min-w-0 flex-1 space-y-2">
          {parent.phone && (
            <a
              href={`tel:${parent.phone}`}
              className="flex items-center gap-3 rounded-2xl bg-sand-50 px-4 py-3 transition-colors hover:bg-sand-100"
            >
              <Phone className="h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
              <span className="tnum truncate font-extrabold text-sand-800">{parent.phone}</span>
              <span className="ml-auto shrink-0 text-sm font-extrabold text-iris-600">Call</span>
            </a>
          )}
          {parent.email && (
            <a
              href={`mailto:${parent.email}`}
              className="flex items-center gap-3 rounded-2xl bg-sand-50 px-4 py-3 transition-colors hover:bg-sand-100"
            >
              <Mail className="h-5 w-5 shrink-0 text-iris-500" aria-hidden="true" />
              <span className="truncate font-bold text-sand-700">{parent.email}</span>
            </a>
          )}
          {can('fees.view') && familyBalance > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-warn-soft px-4 py-3">
              <span aria-hidden="true" className="text-lg">🏫</span>
              <span className="text-sm font-extrabold text-warn-ink">
                {formatKes(familyBalance)} outstanding across the family
              </span>
            </div>
          )}
        </div>
      </motion.section>

      {/* ---------------------------------------------------------- children */}
      <section className="card">
        <SectionTitle>Their children</SectionTitle>
        {kids.length === 0 ? (
          <p className="rounded-2xl bg-sand-50 px-4 py-6 text-center text-sm font-semibold text-sand-500">
            No children linked yet. Open a child's profile and use “Link” to connect them.
          </p>
        ) : (
          <ul className="space-y-2">
            {kids.map((kid) => {
              const balance = term
                ? feeBalance(kid.id, term.id, invoices.data ?? [], payments.data ?? [])
                : null
              const meta = balance ? FEE_STATUS_META[balance.status] : null
              return (
                <li key={kid.id}>
                  <Link
                    to={`/students/${kid.id}`}
                    className="flex items-center gap-3.5 rounded-2xl bg-sand-50 p-3 transition-colors hover:bg-sand-100"
                  >
                    <Avatar name={fullName(kid)} src={kid.photoUrl} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-extrabold text-sand-900">{fullName(kid)}</span>
                      <span className="block truncate text-sm text-sand-500">{kid.className ?? 'No class'}</span>
                    </span>
                    {meta && can('fees.view') && (
                      <Pill tone={meta.tone === 'muted' ? 'muted' : meta.tone}>
                        <span aria-hidden="true">{meta.icon}</span> {meta.label}
                      </Pill>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* -------------------------------------------------- conversation log */}
      <CommunicationLog parentId={parent.id} notes={timeline} canWrite={can('parents.manage')} />

      {can('parents.manage') && (
        <div className="pt-2">
          <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
            Remove {parent.fullName.split(' ')[0]}
          </Button>
        </div>
      )}

      {editing && <ParentForm open={editing} onClose={() => setEditing(false)} parent={parent} />}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        busy={deleteParent.isPending}
        onConfirm={async () => {
          try {
            await deleteParent.mutateAsync(parent.id)
            notify(`${parent.fullName} removed.`, 'info')
            navigate('/parents')
          } catch (err) {
            notify(err instanceof Error ? err.message : 'Could not remove that parent.', 'error')
          }
        }}
        title={`Remove ${parent.fullName}?`}
        body="Their notes and links to children will be deleted. The children themselves stay on the register."
        confirmLabel="Remove"
      />
    </div>
  )
}

/* --------------------------------------------------------------- timeline */

/**
 * The running log of conversations with a family. Kept as a timeline rather
 * than a single "notes" box so you can see that you already called them on
 * Tuesday — which is exactly the thing people forget.
 */
function CommunicationLog({
  parentId, notes, canWrite,
}: {
  parentId: string
  notes: ReturnType<typeof useParentNotes>['data'] extends (infer T)[] | undefined ? T[] : never
  canWrite: boolean
}) {
  const addNote = useAddParentNote()
  const deleteNote = useDeleteParentNote()
  const { notify } = useToast()

  const [composing, setComposing] = useState(false)
  const [body, setBody] = useState('')
  const [noteDate, setNoteDate] = useState(todayIso())

  async function submit() {
    if (!body.trim()) return
    try {
      await addNote.mutateAsync({ parentId, body, noteDate })
      setBody('')
      setComposing(false)
      notify('Note added.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save that note.', 'error')
    }
  }

  return (
    <section className="card">
      <SectionTitle
        hint="Calls, messages, anything worth remembering"
        action={
          canWrite && !composing ? (
            <Button size="sm" variant="soft" icon={<MessageSquarePlus className="h-4 w-4" />} onClick={() => setComposing(true)}>
              Add note
            </Button>
          ) : undefined
        }
      >
        Conversations
      </SectionTitle>

      {composing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-5 space-y-4 overflow-hidden rounded-2xl bg-sand-50 p-4"
        >
          <Field label="What happened?">
            <TextArea
              autoFocus
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Called about the fee balance — will pay by Friday."
            />
          </Field>
          <Field label="When?">
            <DateField value={noteDate} onChange={setNoteDate} max={todayIso()} />
          </Field>
          <div className="flex gap-3">
            <Button variant="ghost" block onClick={() => { setComposing(false); setBody('') }}>
              Cancel
            </Button>
            <Button block disabled={!body.trim()} loading={addNote.isPending} onClick={() => void submit()}>
              Save note
            </Button>
          </div>
        </motion.div>
      )}

      {notes.length === 0 && !composing ? (
        <p className="rounded-2xl bg-sand-50 px-4 py-8 text-center text-sm font-semibold text-sand-500">
          Nothing logged yet. Add a note after a call or a chat at pickup and it will live here.
        </p>
      ) : (
        <ol className="relative space-y-4 pl-6">
          <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-0.5 rounded-full bg-sand-200" />
          {notes.map((note, i) => (
            <motion.li
              key={note.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <span
                aria-hidden="true"
                className="absolute -left-6 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white ring-2 ring-iris-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-iris-500" />
              </span>
              <div className="group rounded-2xl bg-sand-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-sand-400">
                    {formatRelativeDay(note.noteDate)} · {formatDate(note.noteDate, 'medium')}
                  </p>
                  {canWrite && (
                    <button
                      onClick={() => void deleteNote.mutateAsync(note.id)}
                      aria-label="Delete note"
                      className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-sand-300 opacity-0 transition-opacity hover:bg-white hover:text-bad-base focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[0.95rem] leading-relaxed text-sand-800">{note.body}</p>
                {note.createdByName && (
                  <p className="mt-1.5 text-xs font-bold text-sand-400">— {note.createdByName}</p>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  )
}
