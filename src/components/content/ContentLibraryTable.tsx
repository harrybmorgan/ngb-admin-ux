import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { MoreHorizontal } from 'lucide-react'
import type { ContentLibraryItem } from '@/data/contentLibraryMockData'
import { ContentTypeIcon, contentTypeLabel } from './contentLibraryTypeUi'

function statusBadgeIntent(status: ContentLibraryItem['status']) {
  switch (status) {
    case 'published':
      return 'success' as const
    case 'draft':
      return 'secondary' as const
    case 'scheduled':
      return 'info' as const
  }
}

function formatScheduledDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return '—'
  }
}

function publishMenuLabel(item: ContentLibraryItem) {
  if (item.status === 'published') return 'Unpublish'
  if (item.status === 'scheduled') return 'Publish now'
  return 'Publish'
}

export interface ContentLibraryTableProps {
  items: ContentLibraryItem[]
  onPreview: (item: ContentLibraryItem) => void
  onEdit: (item: ContentLibraryItem) => void
  onDuplicate: (item: ContentLibraryItem) => void
  onPublishToggle: (item: ContentLibraryItem) => void
  onDeleteRequest: (item: ContentLibraryItem) => void
}

export function ContentLibraryTable({
  items,
  onPreview,
  onEdit,
  onDuplicate,
  onPublishToggle,
  onDeleteRequest,
}: ContentLibraryTableProps) {
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-md border border-border">
      <Table className="w-full min-w-[720px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[32%] min-w-0">Title</TableHead>
            <TableHead className="w-[14%]">Type</TableHead>
            <TableHead className="w-[12%]">Status</TableHead>
            <TableHead className="w-[12%]">Updated</TableHead>
            <TableHead className="w-[14%]">Scheduled</TableHead>
            <TableHead className="w-[72px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="min-w-0 font-medium">
                <span className="block truncate" title={item.title}>
                  {item.title}
                </span>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <ContentTypeIcon type={item.type} />
                  {contentTypeLabel(item.type)}
                </span>
              </TableCell>
              <TableCell>
                <Badge intent={statusBadgeIntent(item.status)}>{item.status}</Badge>
              </TableCell>
              <TableCell>{item.updatedAt}</TableCell>
              <TableCell>{formatScheduledDate(item.scheduledFor)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Actions for ${item.title}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPreview(item)}>Preview</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(item)}>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPublishToggle(item)}>{publishMenuLabel(item)}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteRequest(item)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
