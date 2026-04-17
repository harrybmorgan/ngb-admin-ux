import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
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
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Filter,
  MoreHorizontal,
  Pencil,
  Search,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/** Figma Communications dash — outer "Communactions Dash" (24px pad, 32px gap). */
const commCommunicationsDash =
  'flex w-full flex-col gap-8 rounded-lg border border-[#E4E6E9] bg-white p-6'
/** Inner History Card on Automations — border #D1D6D8, 16px pad, 24px gap. */
const commAutomationInnerCard =
  'flex w-full flex-col gap-6 rounded-lg border border-[#d1d6d8] bg-white p-4'
const commAutoTh =
  'whitespace-nowrap px-4 py-2 text-left text-sm font-semibold leading-6 text-[#1d2c38]'
const commAutoTd = 'px-4 py-3 text-sm font-normal leading-6 text-[#12181d]'
const commAutoTrHead = 'border-[#E4E6E9] bg-[#fbfbfb] hover:bg-[#fbfbfb]'
const commAutoTr = 'border-[#E4E6E9] bg-white transition-colors hover:bg-[#f7f8fc]/80'
const commTableWrap = 'overflow-x-auto'
const commTableBase =
  '[&_td]:border-x-0 [&_th]:border-x-0 [&_tbody_tr]:border-[#E4E6E9] [&_thead_tr]:border-[#E4E6E9]'

type TopMode = 'self-service' | 'automations'

type ScheduledRow = {
  id: string
  communication: string
  type: string
  scheduleDate: string
}

type SentStatus = 'in-progress' | 'complete' | 'failed'

type SentRow = {
  id: string
  communication: string
  type: string
  employeeSent: number | null
  employeeTotal: number | null
  sendDate: string | null
  status: SentStatus
}

const SCHEDULED_ROWS: ScheduledRow[] = [
  {
    id: 's1',
    communication: 'Communication Name',
    type: 'Enrollment Window',
    scheduleDate: '01/01/2024, 3:30 PM',
  },
  {
    id: 's2',
    communication: 'Communication Name',
    type: 'Enrollment Window',
    scheduleDate: '01/01/2024, 3:30 PM',
  },
  {
    id: 's3',
    communication: 'Communication Name',
    type: 'Enrollment Window',
    scheduleDate: '01/01/2024, 3:30 PM',
  },
]

const SENT_SEED: Omit<SentRow, 'id'>[] = [
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/01/2024, 3:30 PM', status: 'complete' },
  {
    communication: 'Full Time Employee Benefit Class Total Compensation Statement',
    type: 'Total Compensation Statement',
    employeeSent: 126,
    employeeTotal: 129,
    sendDate: '01/01/2024, 3:30 PM',
    status: 'complete',
  },
  {
    communication: 'Example of a Very Long Communication Name That Truncates',
    type: 'Evidence of Insurability',
    employeeSent: 0,
    employeeTotal: 129,
    sendDate: '01/01/2024, 3:30 PM',
    status: 'failed',
  },
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: null, employeeTotal: null, sendDate: null, status: 'in-progress' },
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/01/2024, 3:30 PM', status: 'complete' },
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/01/2024, 3:30 PM', status: 'complete' },
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/01/2024, 3:30 PM', status: 'complete' },
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/01/2024, 3:30 PM', status: 'complete' },
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/01/2024, 3:30 PM', status: 'complete' },
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/01/2024, 3:30 PM', status: 'complete' },
  { communication: 'Communication Name', type: 'Enrollment Window', employeeSent: 120, employeeTotal: 129, sendDate: '01/02/2024, 9:00 AM', status: 'complete' },
  { communication: 'Q1 Benefits reminder', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/03/2024, 11:15 AM', status: 'complete' },
  { communication: 'Dependent verification', type: 'Evidence of Insurability', employeeSent: 45, employeeTotal: 50, sendDate: '01/04/2024, 2:00 PM', status: 'complete' },
  { communication: 'HSA contribution notice', type: 'Enrollment Window', employeeSent: null, employeeTotal: null, sendDate: null, status: 'in-progress' },
  { communication: 'COBRA election window', type: 'Enrollment Window', employeeSent: 12, employeeTotal: 12, sendDate: '01/05/2024, 8:00 AM', status: 'complete' },
  { communication: 'Wellness incentive', type: 'Total Compensation Statement', employeeSent: 0, employeeTotal: 200, sendDate: '01/05/2024, 4:30 PM', status: 'failed' },
  { communication: 'Dental plan update', type: 'Enrollment Window', employeeSent: 88, employeeTotal: 88, sendDate: '01/06/2024, 10:00 AM', status: 'complete' },
  { communication: '401(k) match explainer', type: 'Total Compensation Statement', employeeSent: 129, employeeTotal: 129, sendDate: '01/06/2024, 1:45 PM', status: 'complete' },
  { communication: 'Life event acknowledgment', type: 'Evidence of Insurability', employeeSent: 30, employeeTotal: 32, sendDate: '01/07/2024, 9:30 AM', status: 'complete' },
  { communication: 'Open enrollment wrap-up', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/07/2024, 5:00 PM', status: 'complete' },
  { communication: 'Premium change notice', type: 'Enrollment Window', employeeSent: null, employeeTotal: null, sendDate: null, status: 'in-progress' },
  { communication: 'FSA carryover rules', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/08/2024, 7:00 AM', status: 'complete' },
  { communication: 'Telehealth launch', type: 'Enrollment Window', employeeSent: 125, employeeTotal: 129, sendDate: '01/08/2024, 12:00 PM', status: 'complete' },
  { communication: 'ID card reissue', type: 'Enrollment Window', employeeSent: 40, employeeTotal: 40, sendDate: '01/09/2024, 3:20 PM', status: 'complete' },
  { communication: 'Summit Ridge OE kickoff', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/10/2024, 6:00 AM', status: 'complete' },
  { communication: 'Summit Ridge OE reminder', type: 'Enrollment Window', employeeSent: 128, employeeTotal: 129, sendDate: '01/10/2024, 6:00 PM', status: 'complete' },
  { communication: 'Summit Ridge OE last day', type: 'Enrollment Window', employeeSent: 129, employeeTotal: 129, sendDate: '01/11/2024, 11:59 PM', status: 'complete' },
  { communication: 'Broker digest — errors', type: 'Total Compensation Statement', employeeSent: 0, employeeTotal: 15, sendDate: '01/12/2024, 9:00 AM', status: 'failed' },
  { communication: 'New hire packet', type: 'Enrollment Window', employeeSent: 22, employeeTotal: 22, sendDate: '01/12/2024, 2:15 PM', status: 'complete' },
  { communication: 'Compliance archive export', type: 'Evidence of Insurability', employeeSent: 1, employeeTotal: 1, sendDate: '01/13/2024, 4:00 AM', status: 'complete' },
  { communication: 'Year-end tax forms notice', type: 'Total Compensation Statement', employeeSent: 129, employeeTotal: 129, sendDate: '01/14/2024, 8:00 AM', status: 'complete' },
  { communication: 'Smoking attestation', type: 'Evidence of Insurability', employeeSent: 90, employeeTotal: 90, sendDate: '01/15/2024, 10:30 AM', status: 'complete' },
  { communication: 'Retiree medical transition', type: 'Enrollment Window', employeeSent: 8, employeeTotal: 8, sendDate: '01/15/2024, 3:00 PM', status: 'complete' },
  { communication: 'ACH payroll hold', type: 'Enrollment Window', employeeSent: null, employeeTotal: null, sendDate: null, status: 'in-progress' },
  { communication: 'Summit Ridge — leadership only', type: 'Total Compensation Statement', employeeSent: 12, employeeTotal: 12, sendDate: '01/16/2024, 7:45 AM', status: 'complete' },
  { communication: 'Summit Ridge — all staff', type: 'Enrollment Window', employeeSent: 500, employeeTotal: 500, sendDate: '01/16/2024, 7:46 AM', status: 'complete' },
  { communication: 'Summit Ridge — contractors', type: 'Enrollment Window', employeeSent: 42, employeeTotal: 45, sendDate: '01/17/2024, 1:00 PM', status: 'complete' },
]

const ALL_SENT: SentRow[] = SENT_SEED.map((row, i) => ({ ...row, id: `sent-${i}` }))

type AutomationStatus = 'scheduled' | 'active' | 'inactive'

type AutomationRow = {
  id: string
  name: string
  type: string
  configuredBy: string
  status: AutomationStatus
  startDate: string
}

const AUTOMATION_TYPES = ['Benefit Class Change', 'Confirmation', 'Enrollment Window', 'Life event', 'COBRA notice'] as const
const CONFIGURERS = ['Amy Hohneker', 'Alice Smith', 'Jordan Lee', 'Pat Garcia', 'Sam Rivera'] as const

const ALL_AUTOMATIONS: AutomationRow[] = Array.from({ length: 38 }, (_, i) => {
  const status: AutomationStatus = i % 5 === 0 ? 'scheduled' : i % 5 === 1 || i % 5 === 2 ? 'active' : 'inactive'
  const name =
    i === 0
      ? 'Full Time to Part Time'
      : i === 1
        ? 'Example of a Very Long Communication Name that Should Truncate With Ellipsis in the Table Cell'
        : `Payroll class sync ${i + 1}`
  const month = String((i % 12) + 1).padStart(2, '0')
  const day = String((i % 27) + 1).padStart(2, '0')
  const hour24 = 8 + (i % 12)
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  const h12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24
  const minute = (i * 7) % 60
  const minStr = String(minute).padStart(2, '0')
  return {
    id: `auto-${i}`,
    name,
    type: AUTOMATION_TYPES[i % AUTOMATION_TYPES.length]!,
    configuredBy: CONFIGURERS[i % CONFIGURERS.length]!,
    status,
    startDate: `${month}/${day}/2024, ${h12}:${minStr}${ampm}`,
  }
})

function sentStatusBadge(status: SentStatus) {
  if (status === 'complete') {
    return (
      <Badge intent="success" className="rounded-full border-0 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
        Complete
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge className="rounded-full border-0 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-900">
        Failed
      </Badge>
    )
  }
  return (
    <Badge className="rounded-full border-0 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
      In Progress
    </Badge>
  )
}

function scheduledBadge() {
  return (
    <Badge intent="info" className="rounded-full border-0 bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-950">
      Scheduled
    </Badge>
  )
}

function EmployeeCountCell({ row }: { row: SentRow }) {
  if (row.status === 'in-progress' || row.employeeSent === null || row.employeeTotal === null) {
    return <span className="text-[#8b94b8]">—</span>
  }
  const warn = row.employeeSent < row.employeeTotal || row.employeeSent === 0
  const text = (
    <span className={cn('tabular-nums', warn && 'text-[#14182c]')}>
      {row.employeeSent} / {row.employeeTotal}
    </span>
  )
  if (!warn) return text
  return (
    <span className="inline-flex items-center gap-1.5">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
      {text}
    </span>
  )
}

function RowActionsMenu(label: string) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${label}`}>
          <MoreHorizontal className="h-4 w-4 text-[#5f6a94]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => toast.message('View details (prototype).')}>View details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('Edit (prototype).')}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('Duplicate (prototype).')}>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => toast.message('Cancel / delete (prototype).')}>
          Cancel send
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function automationStatusBadge(status: AutomationStatus) {
  if (status === 'active') {
    return (
      <Badge className="rounded-full border-0 bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-900">
        Active
      </Badge>
    )
  }
  if (status === 'inactive') {
    return (
      <Badge className="rounded-full border-0 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
        Inactive
      </Badge>
    )
  }
  return (
    <Badge intent="info" className="rounded-full border-0 bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-950">
      Scheduled
    </Badge>
  )
}

function AutomationRowActionsMenu(label: string) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${label}`}>
          <MoreHorizontal className="h-4 w-4 text-[#5f6a94]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => toast.message('View automation (prototype).')}>View details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('Edit automation (prototype).')}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('Duplicate automation (prototype).')}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('Deactivate (prototype).')}>Deactivate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => toast.message('Delete automation (prototype).')}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PaginationIconButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full text-[#5f6a94]"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function TablePaginationBar({
  currentPage,
  pageCount,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: {
  currentPage: number
  pageCount: number
  onPageChange: (p: number) => void
  pageSize: string
  onPageSizeChange: (v: string) => void
}) {
  const safePage = Math.min(currentPage, pageCount)
  return (
    <div className="flex w-full flex-col items-center justify-between gap-4 border-t border-[#E4E6E9] py-4 sm:flex-row">
      <div className="flex items-center gap-1">
        <PaginationIconButton label="First page" disabled={safePage <= 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="h-4 w-4" />
        </PaginationIconButton>
        <PaginationIconButton label="Previous page" disabled={safePage <= 1} onClick={() => onPageChange(Math.max(1, safePage - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </PaginationIconButton>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              'flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-medium transition-colors',
              p === safePage ? 'bg-[#dbeafe] text-[#1e40af]' : 'text-[#5f6a94] hover:bg-muted/60',
            )}
            aria-label={`Page ${p}`}
            aria-current={p === safePage ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <PaginationIconButton label="Next page" disabled={safePage >= pageCount} onClick={() => onPageChange(Math.min(pageCount, safePage + 1))}>
          <ChevronRight className="h-4 w-4" />
        </PaginationIconButton>
        <PaginationIconButton label="Last page" disabled={safePage >= pageCount} onClick={() => onPageChange(pageCount)}>
          <ChevronsRight className="h-4 w-4" />
        </PaginationIconButton>
      </div>
      <div className="flex items-center gap-2 text-sm text-[#5f6a94]">
        <Select value={pageSize} onValueChange={onPageSizeChange}>
          <SelectTrigger className="h-9 w-[72px] rounded-lg border-[#E4E6E9]" aria-label="Items per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span>items per page</span>
      </div>
    </div>
  )
}

function CommunicationsSearchFilter({
  value,
  onChange,
  placeholder,
  filterAriaLabel,
  searchAriaLabel,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
  filterAriaLabel: string
  searchAriaLabel: string
}) {
  return (
    <div className="flex w-full max-w-full shrink-0 sm:max-w-[368px]">
      <Button
        type="button"
        variant="outline"
        className="h-10 shrink-0 rounded-l-lg rounded-r-none border border-[#a5aeb4] border-r-0 bg-[#fbfbfb] px-0 text-[#515f6b] shadow-none hover:bg-[#f5f5f5]"
        aria-label={filterAriaLabel}
        onClick={() => toast.message('Filters (prototype).')}
      >
        <span className="flex h-full items-center justify-center px-3 py-3">
          <Filter className="h-4 w-4" aria-hidden />
        </span>
      </Button>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#243746]" aria-hidden />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-l-none rounded-r-lg border border-[#a5aeb4] bg-white pl-9 text-sm text-[#12181d] placeholder:text-[#8b94b8] focus-visible:z-10"
          aria-label={searchAriaLabel}
        />
      </div>
    </div>
  )
}

function AutomatedCommunicationsSection() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('10')
  const pageSizeNum = Number.parseInt(pageSize, 10) || 10

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_AUTOMATIONS
    return ALL_AUTOMATIONS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.configuredBy.toLowerCase().includes(q),
    )
  }, [query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSizeNum))
  const safePage = Math.min(page, pageCount)
  const pageStart = (safePage - 1) * pageSizeNum
  const rows = filtered.slice(pageStart, pageStart + pageSizeNum)

  return (
    <Card className={commAutomationInnerCard}>
      <div className="flex w-full justify-end">
        <CommunicationsSearchFilter
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="Search by Automation name"
          filterAriaLabel="Filter automations"
          searchAriaLabel="Search automations by name"
        />
      </div>
      <CardContent className="w-full min-w-0 p-0">
        <div className={commTableWrap}>
          <Table className={cn('min-w-[880px]', commTableBase)}>
            <TableHeader>
              <TableRow className={cn(commAutoTrHead, 'hover:bg-transparent')}>
                <TableHead className={commAutoTh}>Automation Name</TableHead>
                <TableHead className={commAutoTh}>Type</TableHead>
                <TableHead className={commAutoTh}>Configured By</TableHead>
                <TableHead className={commAutoTh}>
                  <span className="inline-flex items-center gap-1">
                    Status
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </span>
                </TableHead>
                <TableHead className={commAutoTh}>
                  <span className="inline-flex items-center gap-1">
                    Start Date (CT)
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </span>
                </TableHead>
                <TableHead className={cn(commAutoTh, 'w-[56px] text-center')}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className={commAutoTr}>
                  <TableCell className={cn('max-w-[220px]', commAutoTd)}>
                    <span className="block truncate font-normal text-[#12181d]" title={row.name}>
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell className={commAutoTd}>{row.type}</TableCell>
                  <TableCell className={commAutoTd}>{row.configuredBy}</TableCell>
                  <TableCell className={commAutoTd}>{automationStatusBadge(row.status)}</TableCell>
                  <TableCell className={cn('whitespace-nowrap', commAutoTd)}>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 shrink-0 text-[#8b94b8]" aria-hidden />
                      {row.startDate}
                    </span>
                  </TableCell>
                  <TableCell className={cn(commAutoTd, 'text-center')}>{AutomationRowActionsMenu(row.name)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePaginationBar
          currentPage={page}
          pageCount={pageCount}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(v) => {
            setPageSize(v)
            setPage(1)
          }}
        />
      </CardContent>
    </Card>
  )
}

export function CommunicationsOnDemandDashboard() {
  const [topMode, setTopMode] = useState<TopMode>('self-service')
  const [scheduledQuery, setScheduledQuery] = useState('')
  const [sentQuery, setSentQuery] = useState('')
  const [sentPage, setSentPage] = useState(1)
  const [pageSize, setPageSize] = useState('10')
  const pageSizeNum = Number.parseInt(pageSize, 10) || 10

  const filteredSent = useMemo(() => {
    const q = sentQuery.trim().toLowerCase()
    if (!q) return ALL_SENT
    return ALL_SENT.filter(
      (r) => r.communication.toLowerCase().includes(q) || r.type.toLowerCase().includes(q),
    )
  }, [sentQuery])

  const filteredScheduled = useMemo(() => {
    const q = scheduledQuery.trim().toLowerCase()
    if (!q) return SCHEDULED_ROWS
    return SCHEDULED_ROWS.filter(
      (r) => r.communication.toLowerCase().includes(q) || r.type.toLowerCase().includes(q),
    )
  }, [scheduledQuery])

  const totalSent = filteredSent.length
  const pageCount = Math.max(1, Math.ceil(totalSent / pageSizeNum))
  const safePage = Math.min(sentPage, pageCount)
  const pageStart = (safePage - 1) * pageSizeNum
  const sentPageRows = filteredSent.slice(pageStart, pageStart + pageSizeNum)

  if (topMode === 'automations') {
    return (
      <div className="space-y-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/communications">Communications</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">Automations</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className={commCommunicationsDash}>
          <div className="flex w-full justify-end border-b border-[#E4E6E9]">
            <ModeToggle mode={topMode} onChange={setTopMode} />
          </div>
          <div className="flex min-h-10 w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold leading-8 tracking-tight text-[#14182c]">Automated Communications</h1>
            <Button
              type="button"
              intent="primary"
              className="w-full shrink-0 rounded-lg px-4 py-2 text-sm font-medium shadow-sm sm:w-auto"
              onClick={() => toast.message('Add new automation (prototype).')}
            >
              Add New Automation
            </Button>
          </div>
          <AutomatedCommunicationsSection />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/communications">Communications</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-foreground">On-Demand</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className={commCommunicationsDash}>
        <div className="flex w-full justify-end border-b border-[#E4E6E9]">
          <ModeToggle mode={topMode} onChange={setTopMode} />
        </div>
        <div className="flex min-h-10 w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold leading-8 tracking-tight text-[#14182c]">Self Service Communications</h1>
          <Button
            type="button"
            intent="primary"
            className="w-full shrink-0 rounded-lg px-4 py-2 text-sm font-medium shadow-sm sm:w-auto"
            onClick={() => toast.message('Add new communication (prototype).')}
          >
            Add New Communication
          </Button>
        </div>

        <Card className={commAutomationInnerCard}>
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold leading-8 tracking-tight text-[#1d2c38]">Scheduled Communications</h2>
            <CommunicationsSearchFilter
              value={scheduledQuery}
              onChange={setScheduledQuery}
              placeholder="Search Scheduled Communications"
              filterAriaLabel="Filter scheduled communications"
              searchAriaLabel="Search scheduled communications"
            />
          </div>
          <CardContent className="w-full min-w-0 p-0">
            <div className={commTableWrap}>
              <Table className={cn('min-w-[720px]', commTableBase)}>
                <TableHeader>
                  <TableRow className={cn(commAutoTrHead, 'hover:bg-transparent')}>
                    <TableHead className={commAutoTh}>Communication</TableHead>
                    <TableHead className={commAutoTh}>Type</TableHead>
                    <TableHead className={commAutoTh}>
                      <span className="inline-flex items-center gap-1">
                        Schedule Date (CT)
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                      </span>
                    </TableHead>
                    <TableHead className={commAutoTh}>
                      <span className="inline-flex items-center gap-1">
                        Status
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                      </span>
                    </TableHead>
                    <TableHead className={cn(commAutoTh, 'w-[56px] text-right')}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScheduled.map((row) => (
                    <TableRow key={row.id} className={commAutoTr}>
                      <TableCell className={cn('max-w-[240px]', commAutoTd)}>
                        <span className="line-clamp-2">{row.communication}</span>
                      </TableCell>
                      <TableCell className={commAutoTd}>{row.type}</TableCell>
                      <TableCell className={cn('whitespace-nowrap', commAutoTd)}>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4 shrink-0 text-[#8b94b8]" aria-hidden />
                          {row.scheduleDate}
                        </span>
                      </TableCell>
                      <TableCell className={commAutoTd}>{scheduledBadge()}</TableCell>
                      <TableCell className={cn(commAutoTd, 'text-right')}>{RowActionsMenu(row.communication)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className={commAutomationInnerCard}>
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold leading-8 tracking-tight text-[#1d2c38]">Sent Communications</h2>
            <CommunicationsSearchFilter
              value={sentQuery}
              onChange={(v) => {
                setSentQuery(v)
                setSentPage(1)
              }}
              placeholder="Search Sent Communications"
              filterAriaLabel="Filter sent communications"
              searchAriaLabel="Search sent communications"
            />
          </div>
          <CardContent className="w-full min-w-0 p-0">
            <div className={commTableWrap}>
              <Table className={cn('min-w-[900px]', commTableBase)}>
                <TableHeader>
                  <TableRow className={cn(commAutoTrHead, 'hover:bg-transparent')}>
                    <TableHead className={commAutoTh}>Communication</TableHead>
                    <TableHead className={commAutoTh}>Type</TableHead>
                    <TableHead className={commAutoTh}>Employee Count</TableHead>
                    <TableHead className={commAutoTh}>Send Date (CT)</TableHead>
                    <TableHead className={commAutoTh}>
                      <span className="inline-flex items-center gap-1">
                        Status
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                      </span>
                    </TableHead>
                    <TableHead className={cn(commAutoTh, 'w-[56px] text-right')}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentPageRows.map((row) => (
                    <TableRow key={row.id} className={commAutoTr}>
                      <TableCell className={cn('max-w-[280px]', commAutoTd)}>
                        <span className="line-clamp-2 font-normal text-[#12181d]" title={row.communication}>
                          {row.communication}
                        </span>
                      </TableCell>
                      <TableCell className={commAutoTd}>{row.type}</TableCell>
                      <TableCell className={commAutoTd}>
                        <EmployeeCountCell row={row} />
                      </TableCell>
                      <TableCell className={cn('whitespace-nowrap', commAutoTd)}>
                        {row.sendDate ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4 shrink-0 text-[#8b94b8]" aria-hidden />
                            {row.sendDate}
                          </span>
                        ) : (
                          <span className="text-[#8b94b8]">—</span>
                        )}
                      </TableCell>
                      <TableCell className={commAutoTd}>{sentStatusBadge(row.status)}</TableCell>
                      <TableCell className={cn(commAutoTd, 'text-right')}>{RowActionsMenu(row.communication)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePaginationBar
              currentPage={sentPage}
              pageCount={pageCount}
              onPageChange={setSentPage}
              pageSize={pageSize}
              onPageSizeChange={(v) => {
                setPageSize(v)
                setSentPage(1)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ModeToggle({ mode, onChange }: { mode: TopMode; onChange: (m: TopMode) => void }) {
  const tabBase =
    'inline-flex h-10 min-h-10 items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/35 focus-visible:ring-offset-2'
  return (
    <div className="flex items-center gap-0" role="tablist" aria-label="Communications mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'self-service'}
        className={cn(
          tabBase,
          mode === 'self-service'
            ? 'gap-1 border-[#0058a3] text-[#0058a3]'
            : 'border-transparent text-[#5f6a94] hover:text-[#14182c]',
        )}
        onClick={() => onChange('self-service')}
      >
        <Pencil className="h-4 w-4" aria-hidden />
        On-Demand
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'automations'}
        className={cn(
          tabBase,
          mode === 'automations'
            ? 'gap-1 border-[#0058a3] text-[#0058a3]'
            : 'border-transparent text-[#5f6a94] hover:text-[#14182c]',
        )}
        onClick={() => onChange('automations')}
      >
        <Zap className="h-4 w-4" aria-hidden />
        Automations
      </button>
    </div>
  )
}
