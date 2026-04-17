import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FloatLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { toast } from 'sonner'
import { ArrowUpRight, BarChart3, Bell, ChevronRight, Download, Sparkles } from 'lucide-react'
import { AdminAiChatInput } from '@/components/dashboard/AdminAiChatInput'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { WexAiSparkleMark } from '@/components/ui/WexAiSparkleMark'
import { REPORT_LIBRARY, type ReportLibraryItemStatus } from '@/data/adminMockData'
import { relativeUpdatedFromIsoDate } from '@/lib/relativeUpdatedDate'
import { cn } from '@/lib/utils'

const PINNED_REPORTS_STORAGE_KEY = 'ngb-admin-ux-pinned-report-ids'
/** Includes Combined Overview Dashboard (`r7`) for quick access to the cross-service view. */
const DEFAULT_PINNED_IDS = ['r7', 'r1', 'r2', 'r3', 'r4'] as const

function loadPinnedReportIds(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_REPORTS_STORAGE_KEY)
    if (!raw) return [...DEFAULT_PINNED_IDS]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_PINNED_IDS]
    const ids = parsed.filter((x): x is string => typeof x === 'string')
    return ids.length > 0 ? ids : [...DEFAULT_PINNED_IDS]
  } catch {
    return [...DEFAULT_PINNED_IDS]
  }
}

type ReportRow = (typeof REPORT_LIBRARY)[number]

/** Most recently run first (ISO date on `updated`, then `updatedTime`). */
function compareReportsByLastRun(a: ReportRow, b: ReportRow): number {
  const byDate = b.updated.localeCompare(a.updated)
  if (byDate !== 0) return byDate
  return b.updatedTime.localeCompare(a.updatedTime)
}

type ServiceMetric = {
  label: string
  value: string
  /** When set, shows a green up arrow and this percentage to the right of the value. */
  trendPercent?: string
}

/** Match DashboardPage “Data & reports” surfaces */
const cardSurface =
  'overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-[0_3px_9px_rgba(43,49,78,0.04),0_6px_18px_rgba(43,49,78,0.06)] transition-shadow'

const outlineSpark =
  'rounded-xl border-[#3958c3] font-medium text-[#3958c3] hover:bg-[#3958c3]/5'

const reportLibraryStatusClass: Record<ReportLibraryItemStatus, string> = {
  Success:
    'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-500/25',
  Warning:
    'bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-500/25',
  Error: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-600/15 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-500/25',
}

const keyInsights = [
  {
    reportId: 'r6',
    text: 'Life-event volume is up 18% vs last month — most are dependent adds tied to your new medical tier.',
  },
  {
    reportId: 'r1',
    text: 'Claims filed via web portal are up this month; compare against import and mobile in Claims by Source.',
  },
  {
    reportId: 'r2',
    text: 'COBRA notices and premium subsidy reports are the most opened items by your team this week.',
  },
  {
    reportId: 'r3',
    text: 'HSA and FSA enrollment is trending up in Accounts Payments; consider highlighting contribution limits in your next employer update.',
  },
] as const

/** Prototype: recent notifications tied to reports in the library. */
const reportAlerts = [
  {
    id: 'alert-1',
    reportId: 'r1',
    title: 'Filing mix shifted',
    detail: 'Claims by Source — unusual volume from email submission vs last week.',
    when: 'Today · 9:14 AM',
  },
  {
    id: 'alert-2',
    reportId: 'r2',
    title: 'Batch send completed',
    detail: 'COBRA notice delivery log — 14 queued notices went out successfully.',
    when: 'Yesterday · 4:02 PM',
  },
  {
    id: 'alert-3',
    reportId: 'r6',
    title: 'Export ready',
    detail: 'Full Plan Enrollments — your scheduled CSV is available to download.',
    when: 'Apr 12 · 8:05 AM',
  },
] as const

const kpis: { service: string; metrics: ServiceMetric[] }[] = [
  {
    service: 'Overall Summary',
    metrics: [
      { label: 'Total Active Enrollments', value: '325', trendPercent: '4.2%' },
      { label: 'Active Total Montly Premium', value: '$487,350', trendPercent: '1.8%' },
      { label: 'Processing Status', value: '98.5%' },
    ],
  },
  {
    service: 'Member & Benefits',
    metrics: [
      { label: 'Active Enrollments', value: '248', trendPercent: '3.1%' },
      { label: 'Pending Approvals', value: '12' },
      { label: 'Participation Rate', value: '85%' },
    ],
  },
  {
    service: 'Contributions & Funding',
    metrics: [
      { label: 'Active COBRA Plans', value: '26', trendPercent: '2.4%' },
      { label: 'Pending Payments', value: '3' },
      { label: 'Monthly Billing', value: '$32,180' },
    ],
  },
  {
    service: 'Claims & Spending',
    metrics: [
      { label: 'Active Accounts', value: '189', trendPercent: '5.6%' },
      { label: 'Total Balance', value: '$1.2M' },
      { label: 'Avg. Contribution', value: '$425' },
    ],
  },
]

export default function ReportsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [nl, setNl] = useState('')
  const [reportSearch, setReportSearch] = useState('')
  const [authorFilter, setAuthorFilter] = useState('all')
  const [serviceFocusFilter, setServiceFocusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [pinnedReportIds, setPinnedReportIds] = useState<string[]>(loadPinnedReportIds)
  const [managePinnedOpen, setManagePinnedOpen] = useState(false)

  const openReport = (id: string) => {
    navigate(`/reports/${id}`)
  }

  useEffect(() => {
    localStorage.setItem(PINNED_REPORTS_STORAGE_KEY, JSON.stringify(pinnedReportIds))
  }, [pinnedReportIds])

  const pinnedReports = useMemo(() => {
    return pinnedReportIds
      .map((id) => REPORT_LIBRARY.find((r) => r.id === id))
      .filter((r): r is ReportRow => r != null)
  }, [pinnedReportIds])

  const togglePinnedId = (id: string) => {
    setPinnedReportIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const reportAuthors = useMemo(() => {
    const set = new Set(REPORT_LIBRARY.map((r) => r.author))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [])

  const reportServiceFocuses = useMemo(() => {
    const set = new Set(REPORT_LIBRARY.map((r) => r.service))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [])

  const reportCategories = useMemo(() => {
    const set = new Set(REPORT_LIBRARY.map((r) => r.category))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [])

  /** Full library ordered by most recent run (same ordering as the Report Library table). */
  const reportLibraryByLastRun = useMemo(
    () => [...REPORT_LIBRARY].sort(compareReportsByLastRun),
    [],
  )

  const filteredReportLibrary = useMemo(() => {
    const q = reportSearch.trim().toLowerCase()
    return reportLibraryByLastRun.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      const matchesAuthor = authorFilter === 'all' || r.author === authorFilter
      const matchesService = serviceFocusFilter === 'all' || r.service === serviceFocusFilter
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
      return matchesSearch && matchesAuthor && matchesService && matchesCategory
    })
  }, [reportSearch, authorFilter, serviceFocusFilter, categoryFilter, reportLibraryByLastRun])

  /** Top four most recently run (overview card). */
  const overviewRecentReports = useMemo(() => reportLibraryByLastRun.slice(0, 4), [reportLibraryByLastRun])

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        </div>

        <div className="space-y-8">
          <div
            className={cn(
              'rounded-[18px] bg-gradient-to-r from-[#7c6ad8] via-[#c06ba8] to-[#e85d4c] p-px shadow-[0_4px_20px_rgba(43,49,78,0.08)]',
              'transition-shadow duration-300 hover:shadow-[0_8px_26px_rgba(43,49,78,0.11)]',
            )}
          >
            <div className="spark-hero-root relative flex flex-col overflow-hidden rounded-[17px]">
              <div className="spark-hero-bg-base" aria-hidden />
              <div className="spark-hero-bg-layer-a" aria-hidden />
              <div className="spark-hero-bg-layer-b" aria-hidden />

              <div className="spark-hero-content flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-[0_1.057px_3.17px_rgba(2,13,36,0.2),0_0_0.528px_rgba(2,13,36,0.3)]"
                    style={{
                      backgroundImage:
                        'linear-gradient(133.514deg, rgb(37, 20, 111) 2.4625%, rgb(200, 16, 46) 100%)',
                    }}
                    aria-hidden
                  >
                    <WexAiSparkleMark size="14px" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-lg font-semibold leading-snug tracking-tight text-[#14182c] sm:text-xl">
                      Reporting assistant
                    </h2>
                    <p className="text-sm leading-relaxed text-[#5f6a94]">
                    Explore reports, understand what's happening, and identify next steps.
                    </p>
                  </div>
                </div>

                <div className="min-h-0 w-full pt-1">
                  <AdminAiChatInput
                    value={nl}
                    onChange={setNl}
                    onMicClick={() => toast.message('Voice input is not enabled in this prototype.')}
                    onSendClick={() => {
                      toast.message(
                        nl.trim()
                          ? 'Search and assistant features are not enabled in this prototype.'
                          : 'Type a question to get started (prototype).',
                      )
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <section>
            <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
              <Card className={cn(cardSurface, 'group/card flex h-full min-h-0 flex-col hover:shadow-md')}>
                <CardHeader className="flex flex-row items-start gap-2.5 space-y-0 px-5 pb-1.5 pt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 transition-transform group-hover/card:scale-110 dark:bg-amber-950/40 dark:text-amber-400">
                    <Bell className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <CardTitle className="text-sm font-bold leading-tight text-[#14182c] sm:text-base sm:leading-snug">
                      Recent alerts
                    </CardTitle>
                    <CardDescription className="text-xs leading-snug text-[#5f6a94] sm:text-sm sm:leading-5">
                      Updates and actions related to your reports
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-3 px-5 pb-4">
                  <ul className="flex flex-col gap-1.5">
                    {reportAlerts.map((a) => {
                      const rowClass =
                        'flex w-full items-center justify-between gap-2 rounded-lg border border-[#e8ecf4] bg-[#f8f9fc] px-3 py-2 text-left transition-colors hover:border-amber-500/30 hover:bg-amber-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35 focus-visible:ring-offset-2 dark:hover:bg-amber-950/20'
                      return (
                        <li key={a.id}>
                          <button
                            type="button"
                            className={cn(rowClass, 'group/alert')}
                            onClick={() => openReport(a.reportId)}
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#14182c] group-hover/alert:text-amber-900 dark:group-hover/alert:text-amber-200">
                                {a.title}
                              </span>
                              <span className="mt-0.5 block text-xs leading-snug text-[#5f6a94]">{a.detail}</span>
                              <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-[#9aa3bd]">
                                {a.when}
                              </span>
                            </span>
                            <ChevronRight
                              className="h-4 w-4 shrink-0 self-start text-[#9aa3bd] transition-transform group-hover/alert:translate-x-0.5 group-hover/alert:text-amber-700 dark:group-hover/alert:text-amber-400"
                              aria-hidden
                            />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn('mt-auto w-full rounded-xl sm:w-auto', outlineSpark)}
                    onClick={() => setActiveTab('report-library')}
                  >
                    View more alerts
                  </Button>
                </CardContent>
              </Card>

              <Card className={cn(cardSurface, 'group/card flex h-full min-h-0 flex-col hover:shadow-md')}>
                <CardHeader className="flex flex-row items-start gap-2.5 space-y-0 px-5 pb-1.5 pt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-transform group-hover/card:scale-110">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <CardTitle className="text-sm font-bold leading-tight text-[#14182c] sm:text-base sm:leading-snug">
                      WEX Insights
                    </CardTitle>
                    <CardDescription className="text-xs leading-snug text-[#5f6a94] sm:text-sm sm:leading-5">
                      Tailored for your benefits program
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-1">
                  <ul className="space-y-5 text-[13px] leading-snug text-[#374056] sm:space-y-6 sm:text-[14px] sm:leading-[1.5]">
                    {keyInsights.map((insight, idx) => {
                      const sourceReport = REPORT_LIBRARY.find((r) => r.id === insight.reportId)
                      const label = sourceReport
                        ? `Open report: ${sourceReport.name}`
                        : 'Open source report'
                      return (
                        <li key={`${insight.reportId}-${idx}`}>
                          <button
                            type="button"
                            className="group/insight flex w-full gap-2.5 rounded-lg border border-transparent p-1.5 text-left transition-colors hover:border-[#3958c3]/25 hover:bg-[#f0f3ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/35 focus-visible:ring-offset-2"
                            onClick={() => openReport(insight.reportId)}
                            aria-label={label}
                          >
                            <Sparkles
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3958c3] transition-transform group-hover/insight:scale-110 sm:h-4 sm:w-4"
                              aria-hidden
                            />
                            <span className="min-w-0">{insight.text}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>

              <Card className={cn(cardSurface, 'group/card flex h-full min-h-0 flex-col hover:shadow-md')}>
                <CardHeader className="flex flex-row items-start gap-2.5 space-y-0 px-5 pb-1.5 pt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-transform group-hover/card:scale-110">
                    <BarChart3 className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <CardTitle className="text-sm font-bold leading-tight text-[#14182c] sm:text-base sm:leading-snug">
                      Your most recent reports
                    </CardTitle>
                    <CardDescription className="text-xs leading-snug text-[#5f6a94] sm:text-sm sm:leading-5">
                      Ordered by last update in your library — open for details.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-4">
                  <ul className="flex min-h-0 flex-1 flex-col justify-between gap-2">
                    {overviewRecentReports.map((r) => {
                      const rowClass =
                        'flex w-full items-center justify-between gap-2 rounded-lg border border-[#e8ecf4] bg-[#f8f9fc] px-3 py-2.5 text-left transition-colors hover:border-[#3958c3]/35 hover:bg-[#f0f3ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/35 focus-visible:ring-offset-2'
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            className={cn(rowClass, 'group/row')}
                            onClick={() => openReport(r.id)}
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#14182c] group-hover/row:text-[#3958c3]">
                                {r.name}
                              </span>
                              <span className="mt-0.5 block text-xs text-[#5f6a94]">
                                {r.service} · Updated {relativeUpdatedFromIsoDate(r.updated)}
                              </span>
                            </span>
                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-[#9aa3bd] transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-[#3958c3]"
                              aria-hidden
                            />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn('mt-auto w-full rounded-xl sm:w-auto', outlineSpark)}
                    onClick={() => setActiveTab('report-library')}
                  >
                    View all reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap gap-1 sm:w-auto">
            <TabsTrigger value="overview">Services Overview</TabsTrigger>
            <TabsTrigger value="report-library">Report Library</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-8">
            <section>
              <h2 className="mb-4 text-lg font-semibold">Services dashboard</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((k) => (
                  <Card key={k.service}>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base">{k.service}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-7">
                      {k.metrics.map((m) => (
                        <div key={m.label} className="flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                          <div className="flex flex-wrap items-baseline gap-1">
                            <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                            {m.trendPercent != null && m.trendPercent !== '' && (
                              <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-green-600 dark:text-green-500">
                                <ArrowUpRight className="h-4 w-4" aria-hidden />
                                {m.trendPercent}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => setActiveTab('report-library')}
                      >
                        View Report Libraries
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="report-library" className="mt-6 space-y-8">
            <div id="report-library" className="space-y-8">
        <section id="pinned-reports" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pinned reports</h2>
              <p className="text-sm text-muted-foreground">
                Reports you've saved for quick access. Click a card to view details.
              </p>
            </div>
            <Button
              type="button"
              intent="primary"
              variant="ghost"
              className="w-fit shrink-0"
              onClick={() => setManagePinnedOpen(true)}
            >
              Manage pinned reports
            </Button>
          </div>

          {pinnedReports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No pinned reports yet. Use <strong className="font-medium text-foreground">Manage pinned reports</strong>{' '}
                to choose which reports appear here.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pinnedReports.map((r) => (
                <Card
                  key={r.id}
                  className="border-primary/30 bg-gradient-to-b from-primary/5 to-transparent shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => openReport(r.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base leading-snug">{r.name}</CardTitle>
                      <CardDescription>
                        {r.service} · {r.author}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        Last updated {relativeUpdatedFromIsoDate(r.updated)}
                      </p>
                      <p className="mt-3 text-sm font-medium text-primary">Open report</p>
                    </CardContent>
                  </button>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Report library</CardTitle>
            <CardDescription>
              Explore available reports. Use search, category, author, and service focus filters to narrow results before
              downloading.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <FloatLabel
                label="Search by report name, topic, or keyword"
                containerClassName="w-full"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="w-full min-w-[160px] sm:w-52">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Category</span>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {reportCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full min-w-[160px] sm:w-52">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Author</span>
                  <Select value={authorFilter} onValueChange={setAuthorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Author" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All authors</SelectItem>
                      {reportAuthors.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full min-w-[160px] sm:w-52">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Service focus</span>
                  <Select value={serviceFocusFilter} onValueChange={setServiceFocusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Service focus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All services</SelectItem>
                      {reportServiceFocuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Service focus</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReportLibrary.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openReport(r.id)}
                  >
                    <TableCell className="max-w-[min(100%,28rem)] align-top">
                      <span className="block font-medium leading-snug text-foreground">{r.name}</span>
                      <span className="mt-1 block text-sm font-normal leading-snug text-muted-foreground">
                        {r.description}
                      </span>
                    </TableCell>
                    <TableCell>{r.author}</TableCell>
                    <TableCell>{r.service}</TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          reportLibraryStatusClass[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell>{relativeUpdatedFromIsoDate(r.updated)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Download ${r.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toast.message(`Download for “${r.name}” is not enabled in this prototype.`)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredReportLibrary.length === 0 && (
              <p className="text-sm text-muted-foreground">No reports match your filters.</p>
            )}

            <div className="flex justify-start pt-2">
              <Button type="button" variant="outline">
                View More Reports
              </Button>
            </div>
          </CardContent>
        </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Sheet open={managePinnedOpen} onOpenChange={setManagePinnedOpen}>
          <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Manage pinned reports</SheetTitle>
            </SheetHeader>
            <p className="text-sm text-muted-foreground">
              Select reports to show in <strong className="font-medium text-foreground">Pinned reports</strong>. You can
              pin as many as you need.
            </p>
            <ul className="flex flex-col gap-2 border-t border-border pt-4">
              {reportLibraryByLastRun.map((r) => (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                    <Checkbox
                      checked={pinnedReportIds.includes(r.id)}
                      onCheckedChange={() => togglePinnedId(r.id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.author} · {r.service}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <Button type="button" className="mt-auto w-full sm:mt-0" onClick={() => setManagePinnedOpen(false)}>
              Done
            </Button>
          </SheetContent>
        </Sheet>

      </main>
      <AdminFooter />
    </div>
  )
}
