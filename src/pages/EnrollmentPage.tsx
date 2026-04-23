import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { ChevronDown, MoreVertical, Plus, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminDockablePageShell } from '@/components/layout/AdminDockablePageShell'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { TerminateEmployeeDialog } from '@/components/enrollment/TerminateEmployeeDialog'
import { ENROLLMENT_ROWS, type EnrollmentRow } from '@/data/adminMockData'
import type { CobraTerminationActiveCase } from '@/hooks/useCobraTerminationPrototype'
import { useCobraTerminationPrototype } from '@/hooks/useCobraTerminationPrototype'

const PAGE_SIZE = 8

const ROSTER_SORT_OPTIONS = [
  { value: 'name_asc' as const, label: 'Name A–Z' },
  { value: 'name_desc' as const, label: 'Name Z–A' },
  { value: 'updated_desc' as const, label: 'Updated (newest first)' },
  { value: 'updated_asc' as const, label: 'Updated (oldest first)' },
]
type RosterSort = (typeof ROSTER_SORT_OPTIONS)[number]['value']

const ROLE_FILTER_OPTIONS: { value: 'all' | EnrollmentRow['role']; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'Employee', label: 'Employee' },
  { value: 'Dependent', label: 'Dependent' },
  { value: 'Authorized user', label: 'Authorized user' },
  { value: 'Beneficiary', label: 'Beneficiary' },
]

function compareIsoDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

type DisplayEnrollmentRow = EnrollmentRow & { cobraNoticeLabel?: string }

type PeopleHistoryEvent = {
  dateLabel: string
  title: string
  body: string
}

function mergeTerminationIntoRow(
  row: EnrollmentRow,
  activeCase: CobraTerminationActiveCase | null,
): DisplayEnrollmentRow {
  if (!activeCase || row.id !== activeCase.enrollmentRowId) return row
  return {
    ...row,
    status: 'Terminated',
    plan: 'COBRA election pending',
    lastUpdated: activeCase.terminationDate,
    cobraNoticeLabel:
      activeCase.phase === 'election_review' ? 'Review COBRA election status' : 'COBRA offer packet sent',
  }
}

function appendCobraTerminationHistory(
  base: PeopleHistoryEvent[],
  row: EnrollmentRow,
  activeCase: CobraTerminationActiveCase | null,
): PeopleHistoryEvent[] {
  if (!activeCase || row.id !== activeCase.enrollmentRowId) return base
  const d = activeCase.terminationDate
  const lines: PeopleHistoryEvent[] = [
    { dateLabel: `${d} · 9:00 AM`, title: 'Termination recorded', body: activeCase.reason },
    {
      dateLabel: `${d} · 9:00 AM`,
      title: 'COBRA offer packet sent',
      body: 'Termination qualifying event (prototype).',
    },
    {
      dateLabel: `${d} · 9:01 AM`,
      title: 'Carrier update queued',
      body: 'Eligibility update from the same termination event (prototype).',
    },
  ]
  if (activeCase.phase === 'election_review') {
    const reviewLabel = new Date(activeCase.updatedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    lines.push({
      dateLabel: `${reviewLabel} · 8:00 AM`,
      title: 'Election window active',
      body: 'Review COBRA election status from the dashboard or Financials.',
    })
  }
  return [...base, ...lines]
}

/** Oldest → newest; copy kept short like an admin activity feed. */
function buildPeopleHistoryEvents(row: EnrollmentRow): PeopleHistoryEvent[] {
  const plan = row.plan || 'Medical + dental + vision'
  return [
    {
      dateLabel: 'Jan 8, 2025 · 9:12 AM',
      title: 'New hire from payroll',
      body: `${row.name} · Full-time · Class A`,
    },
    {
      dateLabel: 'Feb 1, 2025',
      title: 'Eligible to enroll',
      body: 'Waiting period met · enrollment window opened',
    },
    {
      dateLabel: 'Mar 18, 2025 · 4:06 PM',
      title: 'Election submitted',
      body: plan,
    },
    {
      dateLabel: 'Mar 19, 2025 · 6:40 AM',
      title: 'Sent to carrier',
      body: '834 acknowledged · medical, dental, vision',
    },
    {
      dateLabel: 'Apr 1, 2025',
      title: 'Coverage started',
      body: 'Effective date · member IDs issued',
    },
    {
      dateLabel: 'Apr 4, 2025',
      title: 'Premiums on payroll',
      body: 'First deduction · check date 4/4/2025',
    },
    {
      dateLabel: 'Sep 9, 2025',
      title: 'Life event approved',
      body: 'HR · special enrollment opened',
    },
    {
      dateLabel: 'Sep 24, 2025 · 2:51 PM',
      title: 'Election changed',
      body: 'Tier + dependent · effective Oct 1',
    },
    {
      dateLabel: 'Oct 1, 2025',
      title: 'Update live',
      body: 'Carrier file processed',
    },
    {
      dateLabel: 'Oct 17, 2025 · 3:18 PM',
      title: 'Retro billing calculated',
      body: 'Sep 2025 · $186.42',
    },
    {
      dateLabel: 'Oct 21, 2025 · 7:05 AM',
      title: 'Retro on payroll',
      body: 'Catch-up · check date 10/24/2025',
    },
    {
      dateLabel: `${row.lastUpdated} · 4:00 PM`,
      title: 'Census sync',
      body: 'HRIS import',
    },
  ]
}

export default function EnrollmentPage() {
  const { activeCase } = useCobraTerminationPrototype()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | EnrollmentRow['role']>('all')
  const [rosterSort, setRosterSort] = useState<RosterSort>('name_asc')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<DisplayEnrollmentRow | null>(null)
  const [termDialogOpen, setTermDialogOpen] = useState(false)
  const [termEmployee, setTermEmployee] = useState<Pick<EnrollmentRow, 'id' | 'name' | 'status' | 'role'> | null>(null)

  const mergedRows = useMemo(
    () => ENROLLMENT_ROWS.map((r) => mergeTerminationIntoRow(r, activeCase)),
    [activeCase],
  )

  const displayedRows = useMemo(() => {
    const rows = mergedRows.filter((r) => {
      const q = query.trim().toLowerCase()
      const matchQ = !q || r.name.toLowerCase().includes(q) || r.plan.toLowerCase().includes(q)
      const matchS = status === 'all' || r.status === status
      const matchRole = roleFilter === 'all' || r.role === roleFilter
      return matchQ && matchS && matchRole
    })
    return [...rows].sort((a, b) => {
      switch (rosterSort) {
        case 'name_asc':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        case 'name_desc':
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' })
        case 'updated_desc':
          return compareIsoDates(b.lastUpdated, a.lastUpdated)
        case 'updated_asc':
          return compareIsoDates(a.lastUpdated, b.lastUpdated)
        default:
          return 0
      }
    })
  }, [mergedRows, query, status, roleFilter, rosterSort])

  const pageCount = Math.max(1, Math.ceil(displayedRows.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => (p >= pageCount ? Math.max(0, pageCount - 1) : p))
  }, [pageCount])

  const slice = displayedRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <AdminDockablePageShell>
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          <p className="text-sm text-muted-foreground">
            Search people, open profiles, and use quick adds — all census fields in one prototype workspace.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Consumer records</CardTitle>
              <CardDescription>Paginated roster with filters (demo data).</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="gap-1">
                    Quick add
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Quick add employee</DropdownMenuItem>
                  <DropdownMenuItem>Quick add dependent</DropdownMenuItem>
                  <DropdownMenuItem>Quick add authorized user</DropdownMenuItem>
                  <DropdownMenuItem>Quick add authorized signer / cardholder</DropdownMenuItem>
                  <DropdownMenuItem>Quick add beneficiary</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <UserMinus className="mr-2 h-4 w-4" />
                    Quick term employee
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" className="gap-1">
                <Plus className="h-4 w-4" />
                New enrollment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <FloatLabel
                label="Search"
                containerClassName="min-w-[200px] flex-1"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
              />
              <div className="w-full min-w-[160px] sm:w-44">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Role</span>
                <Select
                  value={roleFilter}
                  onValueChange={(v) => {
                    setRoleFilter(v as 'all' | EnrollmentRow['role'])
                    setPage(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full min-w-[160px] sm:w-48">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Status</span>
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="COBRA">COBRA</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full min-w-[180px] sm:w-52">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Sort</span>
                <Select
                  value={rosterSort}
                  onValueChange={(v) => {
                    setRosterSort(v as RosterSort)
                    setPage(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROSTER_SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      <Badge
                        intent={
                          row.status === 'Active'
                            ? 'success'
                            : row.status === 'Pending'
                              ? 'warning'
                              : row.status === 'Terminated'
                                ? 'destructive'
                                : 'default'
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="truncate">{row.plan}</div>
                      {row.cobraNoticeLabel ? (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{row.cobraNoticeLabel}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            aria-label={`Actions for ${row.name}`}
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelected(row)}>View details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.message('Edit person (prototype).')}>Edit</DropdownMenuItem>
                          {row.role === 'Employee' ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setTermEmployee({
                                    id: row.id,
                                    name: row.name,
                                    status: row.status,
                                    role: row.role,
                                  })
                                  setTermDialogOpen(true)
                                }}
                              >
                                Terminate
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                Showing {slice.length} of {displayedRows.length} · Page {page + 1} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
              </SheetHeader>
              <Tabs key={selected.id} defaultValue="demo" className="mt-4">
                <TabsList className="flex h-auto w-full flex-wrap gap-1">
                  <TabsTrigger value="demo">Profile</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="dep">Dependents</TabsTrigger>
                  <TabsTrigger value="auth">Authorized signer</TabsTrigger>
                  <TabsTrigger value="ben">Beneficiary</TabsTrigger>
                  <TabsTrigger value="job">Employment</TabsTrigger>
                  <TabsTrigger value="pay">Payroll</TabsTrigger>
                </TabsList>
                <TabsContent value="demo" className="mt-4 space-y-2 text-sm">
                  <p className="text-muted-foreground">Employee / member demographics (SSN last-4 masked, DOB, address).</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>DOB: 04/16/1991</li>
                    <li>Work email: jordan.lee@summitridgebakery.com</li>
                    <li>Mobile: (503) 555-0142</li>
                  </ul>
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <ol className="list-none space-y-3">
                    {appendCobraTerminationHistory(buildPeopleHistoryEvents(selected), selected, activeCase).map((ev, i) => (
                      <li
                        key={`${ev.dateLabel}-${i}`}
                        className="rounded-lg border border-border bg-muted/40 px-4 py-3 shadow-sm"
                      >
                        <time className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {ev.dateLabel}
                        </time>
                        <p className="mt-1 text-sm font-semibold text-foreground">{ev.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ev.body}</p>
                      </li>
                    ))}
                  </ol>
                </TabsContent>
                <TabsContent value="dep" className="mt-4 text-sm text-muted-foreground">
                  Dependent profiles with relationship codes and eligibility mirrors.
                </TabsContent>
                <TabsContent value="auth" className="mt-4 text-sm text-muted-foreground">
                  Authorized signer / cardholder demographics and spending limits.
                </TabsContent>
                <TabsContent value="ben" className="mt-4 text-sm text-muted-foreground">
                  Beneficiary allocations and contingent beneficiaries.
                </TabsContent>
                <TabsContent value="job" className="mt-4 text-sm text-muted-foreground">
                  Employment info, rehire dates, FTE / hours bands, wage basis for offers.
                </TabsContent>
                <TabsContent value="pay" className="mt-4 text-sm text-muted-foreground">
                  Payroll schedule, deduction codes, and per-pay period elections.
                </TabsContent>
              </Tabs>
              {selected.role === 'Employee' ? (
                <div className="mt-6 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setTermEmployee({
                        id: selected.id,
                        name: selected.name,
                        status: selected.status,
                        role: selected.role,
                      })
                      setTermDialogOpen(true)
                    }}
                  >
                    Terminate employee
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </SheetContent>
      </Sheet>

      <TerminateEmployeeDialog
        open={termDialogOpen}
        onOpenChange={(o) => {
          setTermDialogOpen(o)
          if (!o) setTermEmployee(null)
        }}
        employee={termEmployee}
        onAfterSubmit={() => setSelected(null)}
      />

      <AdminFooter />
      </AdminDockablePageShell>
    </div>
  )
}
