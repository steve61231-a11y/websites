import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/fields'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { useCreateParent, useUpdateParent } from '@/data/queries'
import type { Parent, ParentDraft } from '@/data/types'

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
  const [draft, setDraft] = useState<ParentDraft>(() => ({
    fullName: parent?.fullName ?? '',
    phone: parent?.phone ?? '',
    email: parent?.email ?? null,
  }))
  const [error, setError] = useState<string | null>(null)

  const busy = createParent.isPending || updateParent.isPending

  async function submit() {
    if (!draft.fullName.trim()) {
      setError('Please add their name.')
      return
    }
    setError(null)
    try {
      if (parent) {
        await updateParent.mutateAsync({ id: parent.id, patch: draft })
        notify('Details saved.')
      } else {
        const created = await createParent.mutateAsync(draft)
        notify(`${created.fullName} added.`)
        onCreated?.(created)
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
      title={parent ? `Edit ${parent.fullName}` : 'Add a parent or guardian'}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button block loading={busy} onClick={() => void submit()}>
            {parent ? 'Save changes' : 'Add'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
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

        {error && (
          <p role="alert" className="rounded-2xl bg-bad-soft px-4 py-3 text-sm font-bold text-bad-ink">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
