import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { toast } from 'sonner'
import { AlertTriangle, Calendar, CircleAlert, Download, FileText, SlidersHorizontal } from 'lucide-react'
import { CombinedOverviewDashboard } from '@/components/reports/CombinedOverviewDashboard'
import { ReportClaimFilterBar } from '@/components/reports/ReportClaimFilterBar'
import { ReportClaimTable } from '@/components/reports/ReportClaimTable'
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
} from '@/lib/reportCustomization'
import {
  DATE_RANGE_OPTIONS,
  PLAN_FILTER_OPTIONS,
  filterClaimRows,
  maxSubmitDate,
  type ClaimStatusFilterValue,
} from '@/lib/reportClaimModel'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12

const ALL_REPORT_FILTERS = ['dateRange', 'claimStatus', 'plan'] as const

function formatReportLastRun(isoDate: string, timeLabel: string): string {
  const parts = isoDate.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return `${isoDate} · ${timeLabel}`
  }
  const [y, mo, d] = parts
  const date = new Date(y, mo - 1, d)
  const dateStr = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
  return `${dateStr} at ${timeLabel}`
}

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [dateRange, setDateRange] = useState<(typeof DATE_RANGE_OPTIONS)[number]>(DATE_RANGE_OPTIONS[0]!)
  const [claimStatusFilter, setClaimStatusFilter] = useState<ClaimStatusFilterValue>('all')
  const [planFilter, setPlanFilter] = useState<string>(PLAN_FILTER_OPTIONS[0]!)
  const [page, setPage] = useState(1)

  const customization = useMemo(
    () => (reportId ? loadReportCustomization(reportId) : loadReportCustomization('')),
    [reportId, location.key],
  )

  const report = useMemo(
    () => REPORT_LIBRARY.find((r) => r.id === reportId) ?? null,
    [reportId],
  )

  const reportAsOf = useMemo(() => maxSubmitDate(REPORT_DETAIL_CLAIM_ROWS), [])

  const tableColumns = useMemo(
    () => resolveColumnHeaders(customization.columns),
    [customization.columns],
  )

  const { title: reportTitle, description: reportDescription } = useMemo(() => {
    if (!report) return { title: '', description: '' }
    return resolveReportPresentation(report, customization)
  }, [report, customization])

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

  const resetFilters = () => {
    setDateRange(DATE_RANGE_OPTIONS[0]!)
    setClaimStatusFilter('all')
    setPlanFilter(PLAN_FILTER_OPTIONS[0]!)
    setPage(1)
    toast.message('Filters reset.')
  }

  const openClaim = (row: ReportDetailClaimRow) => {
    toast.message(`Claim ${row.claimNumber} — detail view is not available in this prototype.`)
  }

  const isCombinedOverview = reportId === COMBINED_OVERVIEW_REPORT_ID

  const showRunStatusBanner =
    report &&
    report.status !== 'Success' &&
    report.statusDetailMessage != null &&
    report.statusDetailMessage.length > 0

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
              <BreadcrumbPage>{reportTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#14182c]">{reportTitle}</h1>
            <p className="text-sm leading-relaxed text-[#5f6a94]">{reportDescription}</p>
            <p className="text-xs tabular-nums text-[#9aa3bd]">
              Last run: {formatReportLastRun(report.updated, report.updatedTime)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {!isCombinedOverview && (
              <Button type="button" variant="outline" className="rounded-xl gap-2" asChild>
                <Link to={`/reports/${reportId}/customize`}>
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Customize
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              aria-label="View report"
              onClick={() => toast.message('Report document preview is not available in this prototype.')}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              aria-label="Schedule or change period"
              onClick={() => toast.message('Calendar scheduling is not available in this prototype.')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              aria-label="Download"
              onClick={() => toast.message('Download started (prototype).')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showRunStatusBanner && report.statusDetailMessage ? (
          <div
            role="alert"
            className={cn(
              'flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed shadow-sm',
              report.status === 'Error'
                ? 'border-red-200 bg-red-50 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100'
                : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100',
            )}
          >
            {report.status === 'Error' ? (
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                aria-hidden
              />
            ) : (
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500"
                aria-hidden
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold">
                {report.status === 'Error' ? 'Last run completed with errors' : 'Last run completed with warnings'}
              </p>
              <p className="mt-1 text-[13px] opacity-95">{report.statusDetailMessage}</p>
            </div>
          </div>
        ) : null}

        {isCombinedOverview ? (
          <CombinedOverviewDashboard />
        ) : (
          <>
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
              onReset={resetFilters}
            />

            <ReportClaimTable rows={pageRows} columns={tableColumns} onRowClick={openClaim} />

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
          </>
        )}
      </main>
      <AdminFooter />
      </AdminDockablePageShell>
    </div>
  )
}
