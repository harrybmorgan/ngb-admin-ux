import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  ButtonGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Building2, Calendar, Download, FileText, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import {
  COMBINED_OVERVIEW_MONTHLY_ROWS,
  type CombinedOverviewMonthlyRow,
} from '@/data/adminMockData'
import { DATE_RANGE_OPTIONS } from '@/lib/reportClaimModel'
import { cn } from '@/lib/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const TIMEFRAME_OPTIONS = [...DATE_RANGE_OPTIONS]
const DIVISION_OPTIONS = ['All Divisions', 'Engineering', 'Sales', 'Marketing'] as const
const PLAN_OPTIONS = [
  'All Plans',
  'PPO Gold',
  'HMO Standard',
  'COBRA PPO',
  'Dental PPO',
  'Vision',
  'HDHP + HSA',
] as const
const CATEGORY_OPTIONS = ['All categories', 'Medical', 'Dental', 'Vision'] as const

const ENROLLMENT_TREND_DATA = [
  { month: 'Sep', memberBenefits: 182, contributionsFunding: 22, claimsSpending: 96 },
  { month: 'Oct', memberBenefits: 205, contributionsFunding: 21, claimsSpending: 102 },
  { month: 'Nov', memberBenefits: 238, contributionsFunding: 20, claimsSpending: 110 },
  { month: 'Dec', memberBenefits: 268, contributionsFunding: 20, claimsSpending: 118 },
  { month: 'Jan', memberBenefits: 298, contributionsFunding: 19, claimsSpending: 128 },
  { month: 'Feb', memberBenefits: 322, contributionsFunding: 20, claimsSpending: 136 },
]

const DISTRIBUTION_DATA = [
  { name: 'Member & Benefits', active: 10, pending: 1 },
  { name: 'Contributions & Funding', active: 4, pending: 2 },
  { name: 'Claims & Spending', active: 9, pending: 0 },
]

const PAGE_SIZE = 10

const chartActions = (label: string) => (
  <div className="flex shrink-0 gap-1">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-lg"
      aria-label={`${label} — document`}
      onClick={() => toast.message('Report document preview is not available in this prototype.')}
    >
      <FileText className="h-4 w-4 text-[#5f6a94]" />
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-lg"
      aria-label={`${label} — schedule`}
      onClick={() => toast.message('Scheduling is not available in this prototype.')}
    >
      <Calendar className="h-4 w-4 text-[#5f6a94]" />
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-lg"
      aria-label={`${label} — download`}
      onClick={() => toast.message('Download started (prototype).')}
    >
      <Download className="h-4 w-4 text-[#5f6a94]" />
    </Button>
  </div>
)

type CombinedOverviewDashboardProps = {
  /** Subtitle under the main combined report title */
  periodLabel?: string
}

export function CombinedOverviewDashboard({ periodLabel = 'February 2026 · Standard Pre-Built View' }: CombinedOverviewDashboardProps) {
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORY_OPTIONS)[number]>('All categories')
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAME_OPTIONS)[number]>(TIMEFRAME_OPTIONS[0]!)
  const [division, setDivision] = useState<(typeof DIVISION_OPTIONS)[number]>('All Divisions')
  const [plan, setPlan] = useState<(typeof PLAN_OPTIONS)[number]>('All Plans')
  const [page, setPage] = useState(1)

  const filteredRows = useMemo(() => {
    return COMBINED_OVERVIEW_MONTHLY_ROWS.filter((r) => {
      const catOk =
        categoryFilter === 'All categories' || r.benefitCategory === categoryFilter
      const divOk = division === 'All Divisions' || r.division === division
      const planOk = plan === 'All Plans' || r.plan === plan
      return catOk && divOk && planOk
    })
  }, [categoryFilter, division, plan])

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, division, plan])

  const total = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, safePage])

  const resetFilters = () => {
    setCategoryFilter('All categories')
    setTimeframe(TIMEFRAME_OPTIONS[0]!)
    setDivision('All Divisions')
    setPlan('All Plans')
    setPage(1)
    toast.message('Filters reset.')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#14182c]">Combined Enrollment Trends</p>
            {chartActions('Combined Enrollment Trends')}
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ENROLLMENT_TREND_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5f6a94' }} axisLine={{ stroke: '#e8ecf4' }} />
                <YAxis domain={[0, 340]} tick={{ fontSize: 12, fill: '#5f6a94' }} axisLine={{ stroke: '#e8ecf4' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e8ecf4', fontSize: 13 }}
                  formatter={(value: number | string, name: string) => [value, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => <span className="text-[#374056]">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="memberBenefits"
                  name="Member & Benefits"
                  stroke="#1a2b4a"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="contributionsFunding"
                  name="Contributions & Funding"
                  stroke="#c41e3a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="claimsSpending"
                  name="Claims & Spending"
                  stroke="#7c6ad8"
                  strokeWidth={2}
                  strokeDasharray="2 6"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#14182c]">Enrollment Distribution by Service</p>
            {chartActions('Enrollment Distribution by Service')}
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DISTRIBUTION_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5f6a94' }} axisLine={{ stroke: '#e8ecf4' }} interval={0} />
                <YAxis allowDecimals={false} domain={[0, 12]} tick={{ fontSize: 12, fill: '#5f6a94' }} axisLine={{ stroke: '#e8ecf4' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e8ecf4', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="active" name="Active Enrollments" stackId="a" fill="#1a2b4a" radius={[0, 0, 0, 0]} maxBarSize={48} />
                <Bar dataKey="pending" name="Pending Enrollments" stackId="a" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full min-w-[160px] sm:w-52">
              <span className="mb-1 block text-xs font-medium text-[#5f6a94]">Category</span>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as (typeof CATEGORY_OPTIONS)[number])}>
                <SelectTrigger className="rounded-xl border-[#d0d7e6]">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 shrink-0 text-[#5f6a94]" aria-hidden />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full min-w-[160px] sm:w-52">
              <span className="mb-1 block text-xs font-medium text-[#5f6a94]">Timeframe</span>
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as (typeof TIMEFRAME_OPTIONS)[number])}>
                <SelectTrigger className="rounded-xl border-[#d0d7e6]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-[#5f6a94]" aria-hidden />
                    <SelectValue placeholder="Timeframe" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full min-w-[160px] sm:w-52">
              <span className="mb-1 block text-xs font-medium text-[#5f6a94]">Division</span>
              <Select value={division} onValueChange={(v) => setDivision(v as (typeof DIVISION_OPTIONS)[number])}>
                <SelectTrigger className="rounded-xl border-[#d0d7e6]">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-[#5f6a94]" aria-hidden />
                    <SelectValue placeholder="Division" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {DIVISION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full min-w-[160px] sm:w-52">
              <span className="mb-1 block text-xs font-medium text-[#5f6a94]">Plan</span>
              <Select value={plan} onValueChange={(v) => setPlan(v as (typeof PLAN_OPTIONS)[number])}>
                <SelectTrigger className="rounded-xl border-[#d0d7e6]">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-[#5f6a94]" aria-hidden />
                    <SelectValue placeholder="Plan" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full rounded-xl border-[#d0d7e6] lg:w-auto" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8ecf4] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#e8ecf4] px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-[#14182c]">Combined Monthly Benefits Report</h2>
            <p className="text-xs text-[#5f6a94]">{periodLabel}</p>
          </div>
          {chartActions('Combined Monthly Benefits Report')}
        </div>
        <div className="overflow-x-auto pl-4 sm:pl-5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#5f6a94]">
                  Employee
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#5f6a94]">
                  Employee ID
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#5f6a94]">
                  Division
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#5f6a94]">
                  Plan
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#3958c3]">
                  Member &amp; Benefits
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#7c6ad8]">
                  Contributions &amp; Funding
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#059669]">
                  Claims &amp; Spending
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#5f6a94]">
                  Coverage level
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#5f6a94]">
                  Effective date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r: CombinedOverviewMonthlyRow) => (
                <TableRow
                  key={r.id}
                  className="border-b border-[#eef1f7] last:border-0"
                  onClick={() => toast.message(`Employee ${r.employee} — detail not available in this prototype.`)}
                >
                  <TableCell className="font-medium text-[#14182c]">{r.employee}</TableCell>
                  <TableCell className="tabular-nums text-[#374056]">{r.employeeId}</TableCell>
                  <TableCell className="text-[#374056]">{r.division}</TableCell>
                  <TableCell className="text-[#374056]">{r.plan}</TableCell>
                  <TableCell className="text-[#3958c3]">{r.memberBenefits}</TableCell>
                  <TableCell className="text-[#7c6ad8]">{r.contributionsFunding}</TableCell>
                  <TableCell className="text-[#059669]">{r.claimsSpending}</TableCell>
                  <TableCell className="text-[#374056]">{r.coverageLevel}</TableCell>
                  <TableCell className="tabular-nums text-[#374056]">{r.effectiveDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#e8ecf4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-[#5f6a94]">
            Showing {pageRows.length} of {total} results
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
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                type="button"
                variant={n === safePage ? 'solid' : 'ghost'}
                intent={n === safePage ? 'primary' : undefined}
                size="sm"
                className={cn('rounded-lg px-3', n === safePage && 'pointer-events-none')}
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
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
      </div>
    </div>
  )
}
