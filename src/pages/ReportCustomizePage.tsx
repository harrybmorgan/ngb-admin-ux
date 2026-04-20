import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Pencil } from 'lucide-react'
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

const PAGE_SIZE = 12

const ALL_REPORT_FILTERS = ['dateRange', 'claimStatus', 'plan'] as const

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
  const [page, setPage] = useState(1)
  const [descriptionEditing, setDescriptionEditing] = useState(false)
  const descriptionBackupRef = useRef<string>('')

  useEffect(() => {
    if (!reportId || !report) return
    const loaded = loadReportCustomization(reportId)
    const { title, description } = resolveReportPresentation(report, loaded)
    setDraft({
      ...loaded,
      displayName: title,
      displayDescription: description,
    })
    setDescriptionEditing(false)
  }, [reportId, report])

  useEffect(() => {
    if (reportId === COMBINED_OVERVIEW_REPORT_ID) {
      navigate(`/reports/${COMBINED_OVERVIEW_REPORT_ID}`, { replace: true })
    }
  }, [reportId, navigate])

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

  const total = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, safePage])

  const tableColumns = useMemo(() => resolveColumnHeaders(draft.columns), [draft.columns])

  const resetPreviewFilters = () => {
    setDateRange(DATE_RANGE_OPTIONS[0]!)
    setClaimStatusFilter('all')
    setPlanFilter(PLAN_FILTER_OPTIONS[0]!)
    setPage(1)
    toast.message('Preview filters reset.')
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
      displayDescription: draft.displayDescription?.trim() ?? '',
      enabledFilters: [...ALL_REPORT_FILTERS],
    })
    toast.success('Report customization saved.')
    navigate(`/reports/${reportId}`)
  }

  const openClaim = (row: ReportDetailClaimRow) => {
    toast.message(`Claim ${row.claimNumber} — detail view is not available in this prototype.`)
  }

  const resolvedDescription =
    report && draft.displayDescription !== undefined ? draft.displayDescription : report?.description ?? ''

  const startDescriptionEdit = () => {
    if (!report) return
    const current =
      draft.displayDescription !== undefined ? draft.displayDescription : report.description
    descriptionBackupRef.current = current
    setDraft((d) => ({ ...d, displayDescription: current }))
    setDescriptionEditing(true)
  }

  const saveDescriptionEdit = () => {
    setDescriptionEditing(false)
  }

  const cancelDescriptionEdit = () => {
    setDraft((d) => ({ ...d, displayDescription: descriptionBackupRef.current }))
    setDescriptionEditing(false)
  }

  const previewLabels = useMemo(() => {
    if (!report) return { title: '', description: '' }
    return resolveReportPresentation(report, draft)
  }, [report, draft])

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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
          <div className="min-w-0 space-y-4">
            <Card className="border-[#e8ecf4] shadow-sm">
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

          </div>

          <div className="min-w-0 space-y-4 lg:sticky lg:top-24">
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
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="report-preview-desc" className="text-xs font-medium text-[#5f6a94]">
                    Description
                  </Label>
                  {!descriptionEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 gap-1.5 rounded-lg px-2 text-[#3958c3]"
                      onClick={startDescriptionEdit}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </Button>
                  )}
                </div>
                {descriptionEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      id="report-preview-desc"
                      value={draft.displayDescription ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, displayDescription: e.target.value }))}
                      placeholder="Short description for this report"
                      rows={4}
                      className="min-h-[5rem] resize-y rounded-xl border-[#d0d7e6] text-sm leading-relaxed text-[#374056]"
                      aria-label="Report description"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        intent="primary"
                        className="rounded-xl"
                        onClick={saveDescriptionEdit}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={cancelDescriptionEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-[#374056]">{resolvedDescription.trim() || '—'}</p>
                )}
              </div>
            </div>

            <ReportClaimFilterBar
              enabledFilters={ALL_REPORT_FILTERS}
              dateRange={dateRange}
              onDateRangeChange={(v) => {
                setDateRange(v)
                setPage(1)
              }}
              claimStatusFilter={claimStatusFilter}
              onClaimStatusFilterChange={(v) => {
                setClaimStatusFilter(v)
                setPage(1)
              }}
              planFilter={planFilter}
              onPlanFilterChange={(v) => {
                setPlanFilter(v)
                setPage(1)
              }}
              onReset={resetPreviewFilters}
            />

            {draft.defaultView === 'table' ? (
              <ReportClaimTable rows={pageRows} columns={tableColumns} onRowClick={openClaim} />
            ) : (
              <ReportClaimChart rows={filteredRows} />
            )}

            {draft.defaultView === 'table' && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#5f6a94]">
                  Showing {pageRows.length} of {total} claims
                </p>
                <ButtonGroup className="rounded-xl border border-[#d0d7e6] p-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-lg px-3"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="solid"
                    intent="primary"
                    size="sm"
                    className="pointer-events-none rounded-lg px-3"
                  >
                    {safePage}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-lg px-3"
                    disabled={safePage >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                  </Button>
                </ButtonGroup>
              </div>
            )}
          </div>
        </div>
      </main>
      <AdminFooter />
      </AdminDockablePageShell>
    </div>
  )
}
