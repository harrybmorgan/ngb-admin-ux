import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wexinc-healthbenefits/ben-ui-kit'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { EMPLOYER } from '@/data/adminMockData'

export default function SettingsPage() {
  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1000px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Account and workspace preferences for {EMPLOYER.hrAdminName}.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Demo only — no changes are saved.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Notification preferences, security, and session options would live here in a production build.
          </CardContent>
        </Card>
      </main>
      <AdminFooter />
    </div>
  )
}
