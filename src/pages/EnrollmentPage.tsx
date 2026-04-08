import { useMemo, useState } from 'react'
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
import { ChevronDown, Plus, UserMinus } from 'lucide-react'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { ENROLLMENT_ROWS, type EnrollmentRow } from '@/data/adminMockData'

const PAGE_SIZE = 8

export default function EnrollmentPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<EnrollmentRow | null>(null)

  const filtered = useMemo(() => {
    return ENROLLMENT_ROWS.filter((r) => {
      const q = query.trim().toLowerCase()
      const matchQ = !q || r.name.toLowerCase().includes(q) || r.plan.toLowerCase().includes(q)
      const matchS = status === 'all' || r.status === status
      return matchQ && matchS
    })
  }, [query, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const slice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
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
                New life event
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      <Badge intent={row.status === 'Active' ? 'success' : row.status === 'Pending' ? 'warning' : 'default'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{row.plan}</TableCell>
                    <TableCell>{row.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                Showing {slice.length} of {filtered.length} · Page {page + 1} of {pageCount}
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
              <Tabs defaultValue="demo" className="mt-4">
                <TabsList className="flex w-full flex-wrap h-auto gap-1">
                  <TabsTrigger value="demo">Profile</TabsTrigger>
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
            </>
          )}
        </SheetContent>
      </Sheet>

      <AdminFooter />
    </div>
  )
}
