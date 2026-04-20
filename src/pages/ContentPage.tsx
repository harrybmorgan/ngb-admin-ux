import { useMemo, useState } from 'react'
import { Button, toast } from '@wexinc-healthbenefits/ben-ui-kit'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminDockablePageShell } from '@/components/layout/AdminDockablePageShell'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { ContentDeleteDialog } from '@/components/content/ContentDeleteDialog'
import { ContentLibraryGrid } from '@/components/content/ContentLibraryGrid'
import { ContentLibraryTable } from '@/components/content/ContentLibraryTable'
import { ContentLibraryToolbar, type ContentViewMode } from '@/components/content/ContentLibraryToolbar'
import { ContentUploadDialog, type NewContentPayload } from '@/components/content/ContentUploadDialog'
import {
  CONTENT_LIBRARY_MOCK,
  type ContentLibraryItem,
  type ContentLibraryStatus,
  type ContentLibraryType,
} from '@/data/contentLibraryMockData'

const defaultTypeFilters = (): Record<ContentLibraryType, boolean> => ({
  document: true,
  video: true,
  tutorial: true,
})

const defaultStatusFilters = (): Record<ContentLibraryStatus, boolean> => ({
  published: true,
  draft: true,
  scheduled: true,
})

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${parseFloat((bytes / k ** i).toFixed(i > 0 ? 1 : 0))} ${sizes[i]}`
}

export default function ContentPage() {
  const [items, setItems] = useState<ContentLibraryItem[]>(() => [...CONTENT_LIBRARY_MOCK])
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ContentViewMode>('table')
  const [typeFilters, setTypeFilters] = useState(defaultTypeFilters)
  const [statusFilters, setStatusFilters] = useState(defaultStatusFilters)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ContentLibraryItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (!typeFilters[item.type] || !statusFilters[item.status]) return false
      if (!q) return true
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    })
  }, [items, typeFilters, statusFilters, query])

  const clearFilters = () => {
    setTypeFilters(defaultTypeFilters())
    setStatusFilters(defaultStatusFilters())
    setQuery('')
  }

  const onTypeFilterChange = (type: ContentLibraryType, checked: boolean) => {
    setTypeFilters((prev) => ({ ...prev, [type]: checked }))
  }

  const onStatusFilterChange = (status: ContentLibraryStatus, checked: boolean) => {
    setStatusFilters((prev) => ({ ...prev, [status]: checked }))
  }

  const handlePreview = (item: ContentLibraryItem) => {
    toast.info(`Preview: ${item.title}`)
  }

  const handleEdit = (item: ContentLibraryItem) => {
    toast.info(`Edit: ${item.title}`)
  }

  const handleDuplicate = (item: ContentLibraryItem) => {
    const copy: ContentLibraryItem = {
      ...item,
      id: `cl-${Date.now()}`,
      title: `${item.title} (copy)`,
      status: 'draft',
      scheduledFor: undefined,
      updatedAt: new Date().toLocaleDateString(undefined, { dateStyle: 'medium' }),
    }
    setItems((prev) => [...prev, copy])
    toast.success('Duplicate added as draft.')
  }

  const handlePublishToggle = (item: ContentLibraryItem) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id) return i
        if (i.status === 'published') return { ...i, status: 'draft' as const }
        if (i.status === 'scheduled') return { ...i, status: 'published' as const, scheduledFor: undefined }
        return { ...i, status: 'published' as const }
      }),
    )
    toast.success('Content status updated.')
  }

  const handleDeleteRequest = (item: ContentLibraryItem) => {
    setDeleteTarget(item)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleteTarget(null)
    toast.success('Content removed.')
  }

  const handleUploadSubmit = (payload: NewContentPayload) => {
    const updatedAt = new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })
    const formatFromType =
      payload.type === 'video' ? 'Stream' : payload.type === 'tutorial' ? 'Guide' : '—'
    const format =
      payload.file != null ? formatFileSize(payload.file.size) : formatFromType
    const newItem: ContentLibraryItem = {
      id: `cl-${Date.now()}`,
      title: payload.title,
      description: payload.description || '—',
      type: payload.type,
      status: payload.statusChoice === 'draft' ? 'draft' : 'scheduled',
      scheduledFor:
        payload.statusChoice === 'scheduled' && payload.scheduledDate
          ? payload.scheduledDate.toISOString()
          : undefined,
      updatedAt,
      format,
    }
    setItems((prev) => [...prev, newItem])
    toast.success('Content added to library.')
  }

  const listProps = {
    onPreview: handlePreview,
    onEdit: handleEdit,
    onDuplicate: handleDuplicate,
    onPublishToggle: handlePublishToggle,
    onDeleteRequest: handleDeleteRequest,
  }

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <AdminDockablePageShell>
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground">
            Documents, videos, and tutorials you can publish to the employee portal.
          </p>
        </div>

        <div className="w-full min-w-0 space-y-4">
          <ContentLibraryToolbar
            query={query}
            onQueryChange={setQuery}
            view={view}
            onViewChange={setView}
            onUploadClick={() => setUploadOpen(true)}
            typeFilters={typeFilters}
            onTypeFilterChange={onTypeFilterChange}
            statusFilters={statusFilters}
            onStatusFilterChange={onStatusFilterChange}
          />

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-16 text-center">
              <h2 className="text-lg font-semibold">No content matches your filters</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Try adjusting filters or search, or upload new content.
              </p>
              <Button type="button" className="mt-6" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : view === 'table' ? (
            <ContentLibraryTable items={filtered} {...listProps} />
          ) : (
            <ContentLibraryGrid items={filtered} {...listProps} />
          )}
        </div>
      </main>

      <ContentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onSubmit={handleUploadSubmit} />
      <ContentDeleteDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o)
          if (!o) setDeleteTarget(null)
        }}
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />

      <AdminFooter />
      </AdminDockablePageShell>
    </div>
  )
}
