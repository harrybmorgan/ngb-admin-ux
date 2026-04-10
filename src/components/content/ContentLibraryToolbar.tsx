import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FloatLabel,
  ToggleGroup,
  ToggleGroupItem,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { ChevronDown, LayoutGrid, List, Upload } from 'lucide-react'
import {
  CONTENT_LIBRARY_STATUSES,
  CONTENT_LIBRARY_TYPES,
  type ContentLibraryStatus,
  type ContentLibraryType,
} from '@/data/contentLibraryMockData'
import { contentTypeLabel } from './contentLibraryTypeUi'

export type ContentViewMode = 'table' | 'grid'

const STATUS_LABEL: Record<ContentLibraryStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  scheduled: 'Scheduled',
}

function selectedTypeSummary(filters: Record<ContentLibraryType, boolean>): string {
  const names = CONTENT_LIBRARY_TYPES.filter((t) => filters[t]).map((t) => `${contentTypeLabel(t)}s`)
  if (names.length === 0) return 'None'
  if (names.length === CONTENT_LIBRARY_TYPES.length) return 'All types'
  return names.join(', ')
}

function selectedStatusSummary(filters: Record<ContentLibraryStatus, boolean>): string {
  const names = CONTENT_LIBRARY_STATUSES.filter((s) => filters[s]).map((s) => STATUS_LABEL[s])
  if (names.length === 0) return 'None'
  if (names.length === CONTENT_LIBRARY_STATUSES.length) return 'All statuses'
  return names.join(', ')
}

export interface ContentLibraryToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  view: ContentViewMode
  onViewChange: (view: ContentViewMode) => void
  onUploadClick: () => void
  typeFilters: Record<ContentLibraryType, boolean>
  onTypeFilterChange: (type: ContentLibraryType, checked: boolean) => void
  statusFilters: Record<ContentLibraryStatus, boolean>
  onStatusFilterChange: (status: ContentLibraryStatus, checked: boolean) => void
}

export function ContentLibraryToolbar({
  query,
  onQueryChange,
  view,
  onViewChange,
  onUploadClick,
  typeFilters,
  onTypeFilterChange,
  statusFilters,
  onStatusFilterChange,
}: ContentLibraryToolbarProps) {
  const typeSummary = selectedTypeSummary(typeFilters)
  const statusSummary = selectedStatusSummary(statusFilters)

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <FloatLabel
        label="Search"
        containerClassName="w-full min-w-0"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 min-h-9 min-w-[8.5rem] max-w-[min(100%,18rem)] justify-between gap-2 px-3 font-normal"
                title={`Type: ${typeSummary}`}
                aria-label={`Type filter, showing ${typeSummary}`}
              >
                <span className="min-w-0 truncate text-left">Type · {typeSummary}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Content type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CONTENT_LIBRARY_TYPES.map((t) => (
                <DropdownMenuCheckboxItem
                  key={t}
                  checked={typeFilters[t]}
                  onCheckedChange={(checked) => onTypeFilterChange(t, checked === true)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {contentTypeLabel(t)}s
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 min-h-9 min-w-[10rem] max-w-[min(100%,20rem)] justify-between gap-2 px-3 font-normal"
                title={`Status: ${statusSummary}`}
                aria-label={`Status filter, showing ${statusSummary}`}
              >
                <span className="min-w-0 truncate text-left">Status · {statusSummary}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Publication status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CONTENT_LIBRARY_STATUSES.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilters[s]}
                  onCheckedChange={(checked) => onStatusFilterChange(s, checked === true)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {STATUS_LABEL[s]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => {
              if (v === 'table' || v === 'grid') onViewChange(v)
            }}
            variant="outline"
            size="sm"
            className="h-9 shrink-0 justify-start p-0.5"
          >
            <ToggleGroupItem value="table" aria-label="Table view" className="h-8 w-9 px-0">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 w-9 px-0">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button type="button" size="sm" className="h-9 min-h-9 gap-2 px-3" onClick={onUploadClick}>
            <Upload className="h-4 w-4 shrink-0" />
            Upload
          </Button>
        </div>
      </div>
    </div>
  )
}
