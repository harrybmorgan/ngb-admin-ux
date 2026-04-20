import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

function publishMenuLabel(item: ContentLibraryItem) {
  if (item.status === 'published') return 'Unpublish'
  if (item.status === 'scheduled') return 'Publish now'
  return 'Publish'
}

export interface ContentLibraryGridProps {
  items: ContentLibraryItem[]
  onPreview: (item: ContentLibraryItem) => void
  onEdit: (item: ContentLibraryItem) => void
  onDuplicate: (item: ContentLibraryItem) => void
  onPublishToggle: (item: ContentLibraryItem) => void
  onDeleteRequest: (item: ContentLibraryItem) => void
}

export function ContentLibraryGrid({
  items,
  onPreview,
  onEdit,
  onDuplicate,
  onPublishToggle,
  onDeleteRequest,
}: ContentLibraryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ContentTypeIcon type={item.type} />
                <span className="text-xs font-medium uppercase tracking-wide">{contentTypeLabel(item.type)}</span>
              </div>
              <Badge intent={statusBadgeIntent(item.status)}>{item.status}</Badge>
            </div>
            <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
            <CardDescription className="line-clamp-3">{item.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            <p className="text-xs text-muted-foreground">{item.format}</p>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <Button
              type="button"
              size="md"
              onClick={() => onPreview(item)}
              className="shrink-0"
              aria-label={`Preview ${item.title}`}
            >
              Preview
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label={`More actions for ${item.title}`}>
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
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
