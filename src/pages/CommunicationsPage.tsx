import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'

export default function CommunicationsPage() {
  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1100px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communications</h1>
          <p className="text-sm text-muted-foreground">
            Unified builder for automated and on-demand messages — OE, life events, and provisioning notices.
          </p>
        </div>

        <Tabs defaultValue="builder">
          <TabsList className="flex w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="builder">Message builder</TabsTrigger>
            <TabsTrigger value="delivery">Delivery settings</TabsTrigger>
            <TabsTrigger value="prefs">Employee preferences</TabsTrigger>
            <TabsTrigger value="provision">Account provisioning</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign</CardTitle>
                <CardDescription>Automated (open enrollment) or on-demand send.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch defaultChecked />
                    Automated schedule
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch />
                    On-demand only
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Channels</span>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center gap-2">
                        <Switch defaultChecked />
                        Email
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch defaultChecked />
                        SMS (where opted in)
                      </label>
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Audience</span>
                    <p className="text-sm text-muted-foreground">Active employees · Retail + Production · Exclude COBRA</p>
                  </div>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Body</span>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="Hi team — open enrollment starts Monday. Log in to the Summit Ridge benefits portal to review your 2026 elections."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button">Send yourself a test</Button>
                  <Button type="button" variant="outline">
                    Schedule send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin delivery methods</CardTitle>
                <CardDescription>From-addresses, SMS short code, bounce handling.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Corporate domain DKIM: verified · Default reply-to: benefits@summitridgebakery.com</p>
                <Button type="button" variant="outline" size="sm">
                  Update SMTP profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prefs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee delivery preferences</CardTitle>
                <CardDescription>Contact verification before sensitive messages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <label className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2">
                  <span>Require mobile verification for SMS</span>
                  <Switch defaultChecked />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2">
                  <span>Annual email address confirmation</span>
                  <Switch defaultChecked />
                </label>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="provision" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Broker / employer user notifications</CardTitle>
                <CardDescription>When new admin seats are created or SSO is linked.</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  readOnly
                  value="Template: Your WEX employer admin access is ready. Username: {{login}} · First login requires password reset."
                />
                <Button type="button" variant="outline" className="mt-3">
                  Edit provisioning template
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
