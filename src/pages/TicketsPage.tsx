import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Plus } from 'lucide-react'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminDockablePageShell } from '@/components/layout/AdminDockablePageShell'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { EmployerRequestWizard } from '@/components/dashboard/EmployerRequestWizard'

export default function TicketsPage() {
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestKey, setRequestKey] = useState(0)

  const openNewRequest = () => {
    setRequestKey((k) => k + 1)
    setRequestOpen(true)
  }

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <AdminDockablePageShell>
      <main className="mx-auto w-full max-w-[1000px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
            <p className="text-sm text-muted-foreground">Open and track support requests for your organization.</p>
          </div>
          <Button type="button" variant="solid" className="gap-2" onClick={openNewRequest}>
            <Plus className="h-4 w-4" aria-hidden />
            New request
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Request queue</CardTitle>
            <CardDescription>Demo only — no tickets are stored.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your queue, SLAs, and case history would appear here in a production build. Use <strong className="font-medium text-foreground">New request</strong> to open the same flow as <strong className="font-medium text-foreground">Get help</strong> on the dashboard.
          </CardContent>
        </Card>
      </main>
      <AdminFooter />

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent size="md" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New request</DialogTitle>
          </DialogHeader>
          <EmployerRequestWizard
            key={requestKey}
            onBack={() => setRequestOpen(false)}
            onSuccess={() => setRequestOpen(false)}
          />
        </DialogContent>
      </Dialog>
      </AdminDockablePageShell>
    </div>
  )
}
