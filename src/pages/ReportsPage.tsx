import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Sparkles } from 'lucide-react'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { REPORT_LIBRARY } from '@/data/adminMockData'

const kpis = [
  { service: 'Overview', label: 'Roster completion', value: '94%', detail: 'OE 2026 cohort' },
  { service: 'BenAdmin', label: 'Pending life events', value: '12', detail: 'Avg age 3.2 days' },
  { service: 'COBRA & Direct Bill', label: 'COBRA pay rate', value: '98.1%', detail: 'Last 90 days' },
  { service: 'Accounts Payments', label: 'HSA / FSA funding', value: '$182k', detail: 'This pay cycle' },
] as const

export default function ReportsPage() {
  const [nl, setNl] = useState('')

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reporting & analytics</h1>
          <p className="text-sm text-muted-foreground">
            Natural language report ideas, your service dashboard, and a searchable report library.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask for a report
            </CardTitle>
            <CardDescription>
              Describe what you need in plain language. This prototype echoes a suggested template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={nl}
              onChange={(e) => setNl(e.target.value)}
              placeholder='e.g. "Show me part-time enrollment by location for Q1"'
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setNl('Deduction variance by department')}>
                Try sample prompt
              </Button>
              <Button type="button" size="sm" disabled={!nl.trim()}>
                Generate draft report
              </Button>
            </div>
            {nl.trim() && (
              <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Suggested layout: table of departments with scheduled deductions vs actual withholdings, filterable by
                pay date. Save as &quot;{nl.slice(0, 40)}
                {nl.length > 40 ? '…' : ''}&quot;.
              </p>
            )}
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Services dashboard</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.service + k.label}>
                <CardHeader className="pb-2">
                  <Badge intent="info" className="w-fit">
                    {k.service}
                  </Badge>
                  <CardTitle className="text-base">{k.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Report library</CardTitle>
            <CardDescription>Search, filter by service, download CSV or PDF (mock).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REPORT_LIBRARY.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.author}</TableCell>
                    <TableCell>{r.service}</TableCell>
                    <TableCell>{r.updated}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm">
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <AdminFooter />
    </div>
  )
}
