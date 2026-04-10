import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FloatLabel,
  Input,
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
} from '@wexinc-healthbenefits/ben-ui-kit'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { REPORT_LIBRARY } from '@/data/adminMockData'

const PINNED_REPORTS_STORAGE_KEY = 'ngb-admin-ux-pinned-report-ids'
const DEFAULT_PINNED_IDS = ['r1', 'r2', 'r3', 'r4'] as const

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

type ServiceMetric = {
  label: string
  value: string
  /** When set, shows a green up arrow and this percentage to the right of the value. */
  trendPercent?: string
}

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
    service: 'Benefit Admin',
    metrics: [
      { label: 'Active Enrollments', value: '248', trendPercent: '3.1%' },
      { label: 'Pending Approvals', value: '12' },
      { label: 'Participation Rate', value: '85%' },
    ],
  },
  {
    service: 'COBRA/Direct Bill',
    metrics: [
      { label: 'Active COBRA Plans', value: '26', trendPercent: '2.4%' },
      { label: 'Pending Payments', value: '3' },
      { label: 'Monthly Billing', value: '$32,180' },
    ],
  },
  {
    service: 'Accounts/Payments',
    metrics: [
      { label: 'Active Accounts', value: '189', trendPercent: '5.6%' },
      { label: 'Total Balance', value: '$1.2M' },
      { label: 'Avg. Contribution', value: '$425' },
    ],
  },
]

export default function ReportsPage() {
  const [nl, setNl] = useState('')
  const [reportSearch, setReportSearch] = useState('')
  const [authorFilter, setAuthorFilter] = useState('all')
  const [serviceFocusFilter, setServiceFocusFilter] = useState('all')

  const [pinnedReportIds, setPinnedReportIds] = useState<string[]>(loadPinnedReportIds)
  const [managePinnedOpen, setManagePinnedOpen] = useState(false)
  const [reportDetailOpen, setReportDetailOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null)

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

  const filteredReportLibrary = useMemo(() => {
    const q = reportSearch.trim().toLowerCase()
    return REPORT_LIBRARY.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q)
      const matchesAuthor = authorFilter === 'all' || r.author === authorFilter
      const matchesService = serviceFocusFilter === 'all' || r.service === serviceFocusFilter
      return matchesSearch && matchesAuthor && matchesService
    })
  }, [reportSearch, authorFilter, serviceFocusFilter])

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reporting & Analytics</h1>
          {/* <p className="text-sm text-muted-foreground">
            Natural language report ideas, your service dashboard, and a searchable report library.
          </p> */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your AI Assistant
            </CardTitle>
            <CardDescription>
            Ask questions in natural language to gain insights into your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={nl}
              onChange={(e) => setNl(e.target.value)}
              placeholder='Ask a question about your benefits data...'
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={!nl.trim()}>
                Ask
              </Button>
            </div>
          </CardContent>
        </Card>

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
                    onClick={() =>
                      document.getElementById('report-library')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  >
                    View Report Libraries
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pinned-reports" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pinned reports</h2>
              <p className="text-sm text-muted-foreground">
                Top reports for quick access. Click a card to view details.
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
                    onClick={() => {
                      setSelectedReport(r)
                      setReportDetailOpen(true)
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base leading-snug">{r.name}</CardTitle>
                      <CardDescription>
                        {r.service} · {r.author}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        Last updated {r.updated} at {r.updatedTime}
                      </p>
                      <p className="mt-3 text-sm font-medium text-primary">View details →</p>
                    </CardContent>
                  </button>
                </Card>
              ))}
            </div>
          )}
        </section>

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
              {REPORT_LIBRARY.map((r) => (
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

        <Sheet
          open={reportDetailOpen}
          onOpenChange={(open) => {
            setReportDetailOpen(open)
            if (!open) setSelectedReport(null)
          }}
        >
          <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-lg">
            {selectedReport && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedReport.name}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Author</span>
                    <span>{selectedReport.author}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Service focus</span>
                    <span>{selectedReport.service}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Last updated</span>
                    <span>
                      {selectedReport.updated} at {selectedReport.updatedTime}
                    </span>
                  </div>
                  <p className="rounded-md border border-border bg-muted/30 p-3 text-muted-foreground">
                    Summary, filters, and export options for this report would appear here. This is a prototype view.
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-4 sm:mt-0">
                  <Button type="button" variant="outline">
                    Download PDF
                  </Button>
                  <Button type="button" variant="outline">
                    Download CSV
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        <Card id="report-library">
          <CardHeader>
            <CardTitle>Report library</CardTitle>
            <CardDescription>Search, filter by author and service focus, download CSV or PDF (mock).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <FloatLabel
                label="Search reports"
                containerClassName="w-full"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReportLibrary.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.author}</TableCell>
                    <TableCell>{r.service}</TableCell>
                    <TableCell>
                      {r.updated} · {r.updatedTime}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm">
                        Download
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
      </main>
      <AdminFooter />
    </div>
  )
}
