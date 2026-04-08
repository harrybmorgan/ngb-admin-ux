import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@wexinc-healthbenefits/ben-ui-kit'
import {
  ArrowRight,
  ClipboardCheck,
  CreditCard,
  FileSpreadsheet,
  Palette,
  Rocket,
  Users,
} from 'lucide-react'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { EMPLOYER } from '@/data/adminMockData'
import { useEmployerSetup } from '@/hooks/useEmployerSetup'

const secondaryTasks = [
  {
    title: 'Review enrollment changes',
    description: '12 life events awaiting confirmation.',
    icon: Users,
    to: '/enrollment',
  },
  {
    title: 'Reconcile April invoice',
    description: 'Marketplace financials — bundled payment due 4/18.',
    icon: CreditCard,
    to: '/billing',
  },
  {
    title: 'Schedule OE announcement',
    description: 'Draft comms for fall open enrollment.',
    icon: FileSpreadsheet,
    to: '/communications',
  },
  {
    title: 'Adjust employee portal branding',
    description: 'Colors, logo, and navigation labels.',
    icon: Palette,
    to: '/theming',
  },
] as const

export default function DashboardPage() {
  const { onboardingComplete, planReady, launchComplete } = useEmployerSetup()
  const shelly = EMPLOYER.hrAdminName.split(' ')[0]

  return (
    <div
      className="flex min-h-screen flex-col font-sans"
      style={{
        backgroundImage:
          'linear-gradient(18.88deg, rgb(255, 255, 255) 17.85%, var(--primary\\/50,rgb(238, 242, 255)) 86.81%, var(--primary\\/200,rgb(199, 210, 254)) 103.68%)',
      }}
    >
      <AdminNavigation />

      <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="space-y-2">
          <Badge intent="info" className="w-fit">
            Employer admin · {EMPLOYER.name}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome, {shelly}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            You’re set up on the same WEX experience your employees see — tuned for the tasks you run every week:
            enrollment, billing, reporting, content, and communications.
          </p>
        </section>

        <section>
          <Card className="border-primary/20 bg-card/80 shadow-md backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Finish guided setup</CardTitle>
                  <CardDescription>
                    Low-touch steps to go live with plans, eligibility, integrations, and branding. Save anytime and
                    return later.
                  </CardDescription>
                </div>
                {onboardingComplete ? (
                  <Badge intent="success">Setup complete</Badge>
                ) : (
                  <Badge intent="warning">In progress</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/setup">
                  {onboardingComplete ? 'Review setup wizard' : 'Continue setup wizard'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!planReady && (
                <p className="text-sm text-muted-foreground">
                  Complete plan design to unlock billing reconciliation shortcuts.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Frequent tasks</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {secondaryTasks.map(({ title, description, icon: Icon, to }) => {
              const locked = !planReady && to !== '/theming'
              return (
                <Card
                  key={title}
                  className={`transition-shadow ${locked ? 'opacity-60' : 'hover:shadow-md'}`}
                >
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base">{title}</CardTitle>
                      <CardDescription className="text-sm">{description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {locked ? (
                      <Button type="button" variant="outline" size="sm" disabled className="w-full sm:w-auto">
                        Complete plan setup first
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                        <Link to={to}>Open</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {!planReady && (
            <p className="mt-3 text-xs text-muted-foreground">
              Tasks stay disabled until your plan framework is marked ready in the setup wizard. Branding stays available
              so you can preview the employee portal anytime.
            </p>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Launch status
              </CardTitle>
              <CardDescription>Prototype flags stored in your browser (localStorage).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border py-2">
                <span>Guided setup</span>
                <span className="font-medium">{onboardingComplete ? 'Complete' : 'Not complete'}</span>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <span>Plan framework ready</span>
                <span className="font-medium">{planReady ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Portal launch</span>
                <span className="font-medium">{launchComplete ? 'Live' : 'Not launched'}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="h-5 w-5 text-primary" />
                Quick links
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/reports">Reports & analytics</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/content">Content library</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/setup">Jump to review & launch</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}
