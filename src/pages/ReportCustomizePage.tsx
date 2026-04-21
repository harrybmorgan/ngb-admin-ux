import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { ReportClaimChart } from '@/components/reports/ReportClaimChart'
import { ReportClaimFilterBar } from '@/components/reports/ReportClaimFilterBar'
import { ReportClaimTable } from '@/components/reports/ReportClaimTable'
import { ReportColumnEditorList } from '@/components/reports/ReportColumnEditorList'
import { ReportViewToggle } from '@/components/reports/ReportViewToggle'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminDockablePageShell } from '@/components/layout/AdminDockablePageShell'
import { AdminFooter } from '@/components/layout/AdminFooter'
import {
  COMBINED_OVERVIEW_REPORT_ID,
  REPORT_DETAIL_CLAIM_ROWS,
  REPORT_LIBRARY,
  type ReportDetailClaimRow,
} from '@/data/adminMockData'
import {
  loadReportCustomization,
  resolveColumnHeaders,
  resolveReportPresentation,
  saveReportCustomization,
  type ReportCustomization,
} from '@/lib/reportCustomization'
import {
  DATE_RANGE_OPTIONS,
  PLAN_FILTER_OPTIONS,
  filterClaimRows,
  maxSubmitDate,
  type ClaimStatusFilterValue,
} from '@/lib/reportClaimModel'
import {
  addSavedFilterPreset,
  loadSavedFilterPresets,
  type SavedFilterPreset,
} from '@/lib/reportCustomizeSavedFilters'

const PAGE_SIZE = 12

/** Max length for the report description on the customize preview (stored with customization). */
const REPORT_DESCRIPTION_MAX_CHARS = 60

const ALL_REPORT_FILTERS = ['dateRange', 'claimStatus', 'plan'] as const

/** Skeleton rows for the table preview — cell values are not shown (`placeholderRows` on `ReportClaimTable`). */
function makeCustomizePreviewRows(count: number): ReportDetailClaimRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `customize-preview-${i}`,
    methodFiled: '',
    employerName: '',
    submitDate: '',
    claimNumber: '',
    planType: 'medical_flex',
    planDisplayName: '',
    claimStatus: 'paid',
    claimProcessingStatus: '',
  }))
}

export default function ReportCustomizePage() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()

  const report = useMemo(
    () => (reportId ? REPORT_LIBRARY.find((r) => r.id === reportId) ?? null : null),
    [reportId],
  )

  const [draft, setDraft] = useState<ReportCustomization>(() =>
    reportId ? loadReportCustomization(reportId) : loadReportCustomization(''),
  )

  const [dateRange, setDateRange] = useState<(typeof DATE_RANGE_OPTIONS)[number]>(DATE_RANGE_OPTIONS[0]!)
  const [claimStatusFilter, setClaimStatusFilter] = useState<ClaimStatusFilterValue>('all')
  const [planFilter, setPlanFilter] = useState<string>(PLAN_FILTER_OPTIONS[0]!)
  const [savedFilterPresets, setSavedFilterPresets] = useState<SavedFilterPreset[]>([])
  const [saveFiltersDialogOpen, setSaveFiltersDialogOpen] = useState(false)
  const [saveFilterTitle, setSaveFilterTitle] = useState('')
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!reportId || !report) return
    const loaded = loadReportCustomization(reportId)
    const { title, description } = resolveReportPresentation(report, loaded)
    setDraft({
      ...loaded,
      displayName: title,
      displayDescription: description.slice(0, REPORT_DESCRIPTION_MAX_CHARS),
    })
  }, [reportId, report])

  useEffect(() => {
    if (reportId === COMBINED_OVERVIEW_REPORT_ID) {
      navigate(`/reports/${COMBINED_OVERVIEW_REPORT_ID}`, { replace: true })
    }
  }, [reportId, navigate])

  useEffect(() => {
    if (!reportId) return
    setSavedFilterPresets(loadSavedFilterPresets(reportId))
  }, [reportId])

  const reportAsOf = useMemo(() => maxSubmitDate(REPORT_DETAIL_CLAIM_ROWS), [])

  const filteredRows = useMemo(() => {
    return filterClaimRows(REPORT_DETAIL_CLAIM_ROWS, {
      planFilter,
      claimStatusFilter,
      dateRange,
      reportAsOf,
      enabledFilters: ALL_REPORT_FILTERS,
    })
  }, [planFilter, claimStatusFilter, dateRange, reportAsOf])

  const customizePreviewRows = useMemo(() => makeCustomizePreviewRows(PAGE_SIZE), [])

  const tableColumns = useMemo(() => resolveColumnHeaders(draft.columns), [draft.columns])

  const resetPreviewFilters = () => {
    setDateRange(DATE_RANGE_OPTIONS[0]!)
    setClaimStatusFilter('all')
    setPlanFilter(PLAN_FILTER_OPTIONS[0]!)
    toast.message('Preview filters reset.')
  }

  const applySavedFilterPreset = (preset: SavedFilterPreset) => {
    setDateRange(preset.dateRange)
    setClaimStatusFilter(preset.claimStatusFilter)
    setPlanFilter(preset.planFilter)
    toast.success(`Applied saved filters: ${preset.title}`)
  }

  const handleSaveCurrentFiltersAsPreset = () => {
    if (!reportId) return
    const title = saveFilterTitle.trim()
    if (!title) {
      toast.error('Enter a title for this filter set.')
      return
    }
    addSavedFilterPreset(reportId, {
      title,
      dateRange,
      claimStatusFilter,
      planFilter,
    })
    setSavedFilterPresets(loadSavedFilterPresets(reportId))
    setSaveFiltersDialogOpen(false)
    setSaveFilterTitle('')
    toast.success('Filter set saved.')
  }

  const handleSave = () => {
    if (!reportId) return
    if (!draft.columns.some((c) => c.enabled)) {
      toast.error('Turn on at least one column.')
      return
    }
    const name = draft.displayName?.trim()
    if (!name) {
      toast.error('Enter a report name.')
      return
    }
    saveReportCustomization(reportId, {
      ...draft,
      displayName: name,
      displayDescription: (draft.displayDescription?.trim() ?? '').slice(0, REPORT_DESCRIPTION_MAX_CHARS),
      enabledFilters: [...ALL_REPORT_FILTERS],
    })
    toast.success('Report customization saved.')
    navigate(`/reports/${reportId}`)
  }

  const openClaim = (row: ReportDetailClaimRow) => {
    toast.message(`Claim ${row.claimNumber} — detail view is not available in this prototype.`)
  }

  const previewLabels = useMemo(() => {
    if (!report) return { title: '', description: '' }
    return resolveReportPresentation(report, draft)
  }, [report, draft])

  const descriptionValue = useMemo(() => {
    const raw =
      draft.displayDescription !== undefined ? draft.displayDescription : (report?.description ?? '')
    return raw.slice(0, REPORT_DESCRIPTION_MAX_CHARS)
  }, [draft.displayDescription, report?.description])

  useLayoutEffect(() => {
    const el = descriptionTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [descriptionValue])

  if (!reportId || !report) {
    return (
      <div className="admin-app-bg flex min-h-screen flex-col font-sans">
        <AdminNavigation />
        <AdminDockablePageShell>
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-muted-foreground">This report could not be found.</p>
            <Button type="button" className="mt-4" onClick={() => navigate('/reports')}>
              Back to Reporting &amp; Analytics
            </Button>
          </main>
          <AdminFooter />
        </AdminDockablePageShell>
      </div>
    )
  }

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <AdminDockablePageShell>
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/reports">Reporting &amp; Analytics</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/reports/${reportId}`}>{previewLabels.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Customize</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[#14182c]">Customize report</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/reports/${reportId}`)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" intent="primary" onClick={handleSave}>
              Save &amp; return
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#14182c]">Preview report</h2>
            </div>
            <ReportViewToggle
              value={draft.defaultView}
              onChange={(v) => setDraft((d) => ({ ...d, defaultView: v }))}
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="report-preview-name" className="sr-only">
                Report name
              </Label>
              <Input
                id="report-preview-name"
                value={draft.displayName !== undefined ? draft.displayName : report.name}
                onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                placeholder="Report name"
                className="h-auto border-0 border-b border-[#e8ecf4] bg-transparent px-0 py-1 text-2xl font-bold tracking-tight text-[#14182c] shadow-none placeholder:text-[#9aa3bd] focus-visible:border-[#3958c3] focus-visible:ring-0 sm:text-3xl"
                aria-label="Report name"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="report-preview-desc" className="text-xs font-medium text-[#5f6a94]">
                  Description
                </Label>
                <span className="text-xs tabular-nums text-[#9aa3bd]" aria-live="polite">
                  {descriptionValue.length}/{REPORT_DESCRIPTION_MAX_CHARS}
                </span>
              </div>
              <Textarea
                ref={descriptionTextareaRef}
                id="report-preview-desc"
                value={descriptionValue}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    displayDescription: e.target.value.slice(0, REPORT_DESCRIPTION_MAX_CHARS),
                  }))
                }
                placeholder="Short description for this report"
                rows={1}
                maxLength={REPORT_DESCRIPTION_MAX_CHARS}
                className="min-h-0 w-full resize-none overflow-hidden border-0 border-b border-[#e8ecf4] bg-transparent px-0 py-1 text-sm leading-relaxed text-[#374056] shadow-none placeholder:text-[#9aa3bd] focus-visible:border-[#3958c3] focus-visible:ring-0"
                aria-label="Report description"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[#14182c]">Preview filters</span>
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl gap-2"
                      aria-haspopup="menu"
                    >
                      Saved filters
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[min(100vw-2rem,280px)]">
                    <DropdownMenuLabel className="font-normal text-[#5f6a94]">Saved filter sets</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {savedFilterPresets.length === 0 ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        No saved filters yet
                      </DropdownMenuItem>
                    ) : (
                      savedFilterPresets.map((preset) => (
                        <DropdownMenuItem key={preset.id} onClick={() => applySavedFilterPreset(preset)}>
                          {preset.title}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setSaveFilterTitle('')
                    setSaveFiltersDialogOpen(true)
                  }}
                >
                  Save current filters
                </Button>
              </div>
            </div>

            <ReportClaimFilterBar
              enabledFilters={ALL_REPORT_FILTERS}
              dateRange={dateRange}
              onDateRangeChange={(v) => {
                setDateRange(v)
              }}
              claimStatusFilter={claimStatusFilter}
              onClaimStatusFilterChange={(v) => {
                setClaimStatusFilter(v)
              }}
              planFilter={planFilter}
              onPlanFilterChange={(v) => {
                setPlanFilter(v)
              }}
              onReset={resetPreviewFilters}
            />
          </div>

          <Dialog
            open={saveFiltersDialogOpen}
            onOpenChange={(open) => {
              setSaveFiltersDialogOpen(open)
              if (!open) setSaveFilterTitle('')
            }}
          >
            <DialogContent size="md" className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Save filter set</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-[#5f6a94]">
                  Name this set of preview filters (date range, claim status, and plan). You can apply it later from
                  Saved filters.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="save-filter-set-title" className="text-sm font-medium text-[#14182c]">
                    Title
                  </Label>
                  <Input
                    id="save-filter-set-title"
                    className="rounded-xl border-[#d0d7e6]"
                    placeholder="e.g. Q1 medical review"
                    value={saveFilterTitle}
                    onChange={(e) => setSaveFilterTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveCurrentFiltersAsPreset()
                      }
                    }}
                    aria-label="Title for saved filter set"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setSaveFiltersDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" intent="primary" className="rounded-xl" onClick={handleSaveCurrentFiltersAsPreset}>
                  Save filter set
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
            <Card className="border-[#e8ecf4] shadow-sm lg:sticky lg:top-24">
              <CardHeader className="space-y-1 p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Columns</CardTitle>
                <CardDescription className="text-xs leading-snug">
                  Reorder columns or clear a checkbox to exclude a field (excluded fields move to the bottom). Drag the grip handle to change order among included columns.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <ReportColumnEditorList
                  columns={draft.columns}
                  onChange={(columns) => setDraft((d) => ({ ...d, columns }))}
                />
              </CardContent>
            </Card>

            <div className="min-w-0 space-y-4">
              {draft.defaultView === 'table' ? (
                <ReportClaimTable
                  rows={customizePreviewRows}
                  columns={tableColumns}
                  onRowClick={openClaim}
                  placeholderRows
                />
              ) : (
                <ReportClaimChart rows={filteredRows} />
              )}

              {draft.defaultView === 'table' && (
                <p className="text-sm text-[#5f6a94]">
                  Preview shows column layout only. Save the report to view live data on the report detail page.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <AdminFooter />
      </AdminDockablePageShell>
    </div>
  )
}
