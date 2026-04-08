import {
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'

export default function BillingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/15">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & invoicing</h1>
          <p className="text-sm text-muted-foreground">
            Marketplace financials, remittance tools, payment methods, COBRA counts, and accounting actions — prototype
            layout.
          </p>
        </div>

        <Tabs defaultValue="marketplace">
          <TabsList className="flex w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="marketplace">Marketplace financials</TabsTrigger>
            <TabsTrigger value="recon">Remittance & reconciliation</TabsTrigger>
            <TabsTrigger value="pay">Payment methods</TabsTrigger>
            <TabsTrigger value="cobra">COBRA covered count</TabsTrigger>
            <TabsTrigger value="acct">Accounting tools</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Consolidated invoice</CardTitle>
                <CardDescription>
                  One bundled payment for all connected carriers and vendors for April 2026.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>UnitedHealthcare (medical)</TableCell>
                      <TableCell>$42,180.22</TableCell>
                      <TableCell>Apr 18, 2026</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Guardian (dental)</TableCell>
                      <TableCell>$3,942.10</TableCell>
                      <TableCell>Apr 18, 2026</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>WEX HSA admin</TableCell>
                      <TableCell>$612.00</TableCell>
                      <TableCell>Apr 18, 2026</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Button type="button">Schedule bundled payment</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recon" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Remittance & subsidies</CardTitle>
                <CardDescription>Collected vs owed, with subsidy breakdown by plan tier.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Automated feeds show $46,734 collected from members vs $46,891 carrier invoice — variance explained by 3
                pending payroll cycles. Export detailed remittance workbook.
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="outline">
                    Download reconciliation
                  </Button>
                  <Button type="button" variant="outline">
                    Subsidy detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pay" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment methods & schedules</CardTitle>
                <CardDescription>ACH, cards, and check — stored securely (prototype fields).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">ACH — operating account</label>
                  <Input readOnly value="Summit Ridge Bakery · ****4521" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Backup card</label>
                  <Input readOnly value="Visa · ****8892 · exp 08/28" />
                </div>
                <Button type="button" variant="outline" className="sm:col-span-2 w-fit">
                  Edit billing frequency & recurring rules
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cobra" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Active covered count (COBRA)</CardTitle>
                <CardDescription>Update counts so COBRA invoices stay accurate between payroll cycles.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Covered lives — COBRA medical</label>
                  <Input type="number" defaultValue={4} className="w-40" />
                </div>
                <Button type="button">Save count</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acct" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Backend accounting</CardTitle>
                <CardDescription>Admin fee booking, rapid entry, bulk uploads, refunds, ACH file generation.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" variant="outline">
                  Book admin fee
                </Button>
                <Button type="button" variant="outline">
                  Payment rapid entry
                </Button>
                <Button type="button" variant="outline">
                  Bulk payment upload
                </Button>
                <Button type="button" variant="outline">
                  Process refund
                </Button>
                <Button type="button" variant="outline">
                  Generate ACH file
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <AdminFooter />
    </div>
  )
}
