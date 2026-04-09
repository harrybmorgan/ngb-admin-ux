import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wexinc-healthbenefits/ben-ui-kit'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'

export default function TicketsPage() {
  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1000px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">Open and track support requests for your organization.</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Support</CardTitle>
            <CardDescription>Demo only — no tickets are stored.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your queue, SLAs, and case history would appear here in a production build.
          </CardContent>
        </Card>
      </main>
      <AdminFooter />
    </div>
  )
}
