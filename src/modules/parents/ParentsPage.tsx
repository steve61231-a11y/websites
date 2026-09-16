import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, MessageSquare, Phone, Plus } from 'lucide-react'
import { downloadCsv } from '@/lib/csv'
import { useLinks, useParentNotes, useParents, useStudents } from '@/data/queries'
import { childrenOf, fullName } from '@/data/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Fab } from '@/components/ui/Button'
import {
  Avatar, CardSkeleton, EmptyState, Pill, StaggerItem, StaggerList,
} from '@/components/ui/primitives'
import { SearchInput } from '@/components/ui/fields'
import { ParentForm } from './ParentForm'
import { useAuth } from '@/auth/AuthProvider'

export default function ParentsPage() {
  const { can } = useAuth()
  const parents = useParents()
  const students = useStudents()
  const links = useLinks()
  const notes = useParentNotes()

  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)

  const all = parents.data ?? []

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all
      .filter((p) => {
        if (!q) return true
        if (p.fullName.toLowerCase().includes(q)) return true
        if (p.phone.toLowerCase().includes(q)) return true
        // Searching a child's name finds their family — people ask for
        // "Baraka's mum", not "Mr Otieno".
        return childrenOf(p.id, students.data ?? [], links.data ?? []).some((s) =>
          fullName(s).toLowerCase().includes(q),
        )
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [all, search, students.data, links.data])

  function exportCsv() {
    downloadCsv('iris-fields-parents', visible, [
      { header: 'Name', value: (p) => p.fullName },
      { header: 'Phone', value: (p) => p.phone },
      { header: 'Email', value: (p) => p.email ?? '' },
      {
        header: 'Children',
        value: (p) => childrenOf(p.id, students.data ?? [], links.data ?? []).map(fullName).join('; '),
      },
    ])
  }

  if (parents.isLoading) {
    return <div className="space-y-4"><CardSkeleton rows={1} /><CardSkeleton rows={5} /></div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Parents"
        emoji="👪"
        subtitle={`${all.length} ${all.length === 1 ? 'family' : 'families'}`}
        action={
          can('parents.manage') ? (
            <Button className="hidden lg:inline-flex" icon={<Plus className="h-5 w-5" />} onClick={() => setAdding(true)}>
              Add parent
            </Button>
          ) : undefined
        }
      />

      {all.length === 0 ? (
        <EmptyState
          emoji="👪"
          title="No families yet"
          body="Add a parent or guardian, then link them to their children. Every conversation you have with them can be kept here too."
          action={
            can('parents.manage') ? (
              <Button size="lg" icon={<Plus className="h-5 w-5" />} onClick={() => setAdding(true)}>
                Add the first parent
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Search a parent or their child…" />

          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-sand-500">
              {visible.length} {visible.length === 1 ? 'family' : 'families'}
            </p>
            <Button size="sm" variant="soft" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
              Export
            </Button>
          </div>

          <StaggerList className="grid gap-3 sm:grid-cols-2">
            {visible.map((parent) => {
              const kids = childrenOf(parent.id, students.data ?? [], links.data ?? [])
              const noteCount = (notes.data ?? []).filter((n) => n.parentId === parent.id).length
              return (
                <StaggerItem key={parent.id}>
                  <Link
                    to={`/parents/${parent.id}`}
                    className="flex h-full items-start gap-3.5 rounded-3xl border border-sand-200/80 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <Avatar name={parent.fullName} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[1.05rem] font-extrabold text-sand-900">
                        {parent.fullName}
                      </p>
                      {parent.phone && (
                        <p className="tnum mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold text-sand-500">
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {parent.phone}
                        </p>
                      )}
                      <p className="mt-1 truncate text-sm text-sand-400">
                        {kids.length === 0
                          ? 'No children linked yet'
                          : kids.map((k) => k.firstName).join(', ')}
                      </p>
                      {noteCount > 0 && (
                        <Pill tone="iris" className="mt-2">
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                          {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                        </Pill>
                      )}
                    </div>
                  </Link>
                </StaggerItem>
              )
            })}
          </StaggerList>
        </>
      )}

      {can('parents.manage') && (
        <Fab label="Add parent" icon={<Plus className="h-5 w-5" />} onClick={() => setAdding(true)} className="lg:hidden" />
      )}

      {adding && <ParentForm open={adding} onClose={() => setAdding(false)} />}
    </div>
  )
}
