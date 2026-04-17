import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FloatLabel,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { toast } from 'sonner'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { EMPLOYER } from '@/data/adminMockData'

export default function SettingsPage() {
  const [digestEmail, setDigestEmail] = useState(true)
  const [billingAlerts, setBillingAlerts] = useState(true)
  const [enrollmentReminders, setEnrollmentReminders] = useState(false)
  const [productUpdates, setProductUpdates] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState('60')
  const [timezone, setTimezone] = useState('america-denver')

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1100px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Account and workspace preferences for {EMPLOYER.hrAdminName} at {EMPLOYER.name}.
          </p>
        </div>

        <Alert>
          <AlertDescription>
            This prototype does not persist changes. Buttons and toggles demonstrate layout and copy only.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="profile">
          <TabsList className="flex w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>Your profile</CardTitle>
                    <CardDescription>How you appear to other admins and in audit logs.</CardDescription>
                  </div>
                  <Badge intent="outline" className="shrink-0 font-normal">
                    Benefits administrator
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatLabel
                    label="Full name"
                    id="settings-display-name"
                    value={EMPLOYER.hrAdminName}
                    onChange={() => {}}
                    readOnly
                    aria-readonly="true"
                  />
                  <FloatLabel
                    label="Work email"
                    id="settings-email"
                    type="email"
                    autoComplete="email"
                    value={EMPLOYER.hrAdminEmail}
                    onChange={() => {}}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Name and email are sourced from your identity provider in production. Contact IT to update directory
                  fields.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => toast.message('Profile edit is not wired in this prototype.')}>
                    Request directory update
                  </Button>
                  <Button type="button" onClick={() => toast.message('Saved (prototype only — not persisted).')}>
                    Save display preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email & in-app</CardTitle>
                <CardDescription>Choose what we send to {EMPLOYER.hrAdminEmail} and surface in the admin shell.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor="notif-digest" className="text-sm font-medium">
                      Weekly benefits digest
                    </Label>
                    <p className="text-xs text-muted-foreground">Enrollment status, tasks due, and carrier notices.</p>
                  </div>
                  <Switch id="notif-digest" checked={digestEmail} onCheckedChange={setDigestEmail} />
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor="notif-billing" className="text-sm font-medium">
                      Payroll & remittance alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">Due dates, failed pulls, and reconciliation exceptions.</p>
                  </div>
                  <Switch id="notif-billing" checked={billingAlerts} onCheckedChange={setBillingAlerts} />
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor="notif-oe" className="text-sm font-medium">
                      Open enrollment reminders
                    </Label>
                    <p className="text-xs text-muted-foreground">Nudges when cohorts are behind schedule.</p>
                  </div>
                  <Switch id="notif-oe" checked={enrollmentReminders} onCheckedChange={setEnrollmentReminders} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor="notif-product" className="text-sm font-medium">
                      Product updates & webinars
                    </Label>
                    <p className="text-xs text-muted-foreground">Release notes and optional training invites.</p>
                  </div>
                  <Switch id="notif-product" checked={productUpdates} onCheckedChange={setProductUpdates} />
                </div>
                <Button type="button" variant="solid" onClick={() => toast.message('Notification preferences saved (prototype only).')}>
                  Save notification preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sign-in & sessions</CardTitle>
                <CardDescription>Multi-factor authentication and how long an idle session stays active.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Multi-factor authentication</p>
                    <p className="text-xs text-muted-foreground">Email OTP on this prototype login flow.</p>
                  </div>
                  <Badge intent="default">On</Badge>
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="session-timeout" className="text-sm font-medium">
                    Idle session timeout
                  </Label>
                  <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                    <SelectTrigger id="session-timeout" aria-label="Idle session timeout">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => toast.message('Password change opens your IdP in production.')}>
                    Change password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => toast.message('Sign out everywhere is not wired in this prototype.')}
                  >
                    Sign out all other sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employer workspace</CardTitle>
                <CardDescription>Defaults for dates, exports, and scheduled jobs tied to {EMPLOYER.name}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatLabel
                    label="Legal entity"
                    id="settings-legal"
                    value={EMPLOYER.legalName}
                    onChange={() => {}}
                    readOnly
                    aria-readonly="true"
                  />
                  <FloatLabel
                    label="EIN (masked in production)"
                    id="settings-ein"
                    value={EMPLOYER.ein}
                    onChange={() => {}}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="workspace-tz" className="text-sm font-medium">
                    Default timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="workspace-tz" aria-label="Default timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-new-york">Eastern (US & Canada)</SelectItem>
                      <SelectItem value="america-chicago">Central (US & Canada)</SelectItem>
                      <SelectItem value="america-denver">Mountain (US & Canada)</SelectItem>
                      <SelectItem value="america-los-angeles">Pacific (US & Canada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Company address, NAICS, and payroll frequency are managed in guided setup and company profile — not
                  duplicated here in production.
                </p>
                <Button type="button" onClick={() => toast.message('Workspace defaults saved (prototype only).')}>
                  Save workspace defaults
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
