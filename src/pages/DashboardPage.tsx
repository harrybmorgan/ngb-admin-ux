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
import { cn } from '@/lib/utils'

/** Spark / cxr-ux homepage–style elevated surface */
const cardSurface =
  'overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-[0_3px_9px_rgba(43,49,78,0.04),0_6px_18px_rgba(43,49,78,0.06)] transition-shadow'

const sectionEyebrow = 'text-[12px] font-black uppercase tracking-[3px] text-[#5f6a94] leading-4'

const outlineSpark =
  'rounded-xl border-[#3958c3] font-medium text-[#3958c3] hover:bg-[#3958c3]/5'

const secondaryTasks = [
  {
    title: 'Review people changes',
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
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />

      <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge intent="info" className="w-fit rounded-full border-0 bg-[#eef2ff] px-3 py-1 text-[12px] font-semibold text-[#3958c3]">
              {EMPLOYER.name}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-[#14182c] sm:text-4xl">
              Welcome, {shelly}
            </h1>
          </div>
        </section>

        <section>
          <Card className={cn(cardSurface, 'hover:shadow-md')}>
            <CardHeader className="space-y-4 px-6 pb-2 pt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3]">
                  <Rocket className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold leading-6 text-[#14182c]">Finish guided setup</CardTitle>
                    <CardDescription className="text-sm leading-5 text-[#5f6a94]">
                      Low-touch steps to go live with plans, eligibility, integrations, and branding. Save anytime and
                      return later.
                    </CardDescription>
                  </div>
                  {onboardingComplete ? (
                    <Badge intent="success" className="shrink-0 rounded-full">
                      Setup complete
                    </Badge>
                  ) : (
                    <Badge intent="warning" className="shrink-0 rounded-full">
                      In progress
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-6 pb-6 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-xl border-0 bg-[#3958c3] px-6 text-[15px] font-medium text-white hover:bg-[#2d4699]"
              >
                <Link to="/setup" className="inline-flex items-center gap-2">
                  {onboardingComplete ? 'Review setup wizard' : 'Continue setup wizard'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!planReady && (
                <p className="text-sm leading-5 text-[#5f6a94]">
                  Complete plan design to unlock billing reconciliation shortcuts.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className={sectionEyebrow}>Frequent tasks</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {secondaryTasks.map(({ title, description, icon: Icon, to }) => {
              const locked = !planReady && to !== '/theming'
              return (
                <Card
                  key={title}
                  className={cn(
                    cardSurface,
                    locked ? 'opacity-60' : 'group/card hover:shadow-md',
                  )}
                >
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0 px-6 pb-2 pt-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-transform group-hover/card:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-base font-bold leading-6 text-[#14182c]">{title}</CardTitle>
                      <CardDescription className="text-sm leading-5 text-[#5f6a94]">{description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    {locked ? (
                      <Button type="button" variant="outline" size="sm" disabled className="w-full rounded-xl sm:w-auto">
                        Complete plan setup first
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className={cn('w-full sm:w-auto', outlineSpark)}>
                        <Link to={to}>Open</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {!planReady && (
            <p className="text-xs leading-4 text-[#5f6a94]">
              Tasks stay disabled until your plan framework is marked ready in the setup wizard. Branding stays available
              so you can preview the employee portal anytime.
            </p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className={cn(cardSurface, 'hover:shadow-md lg:col-span-2')}>
            <CardHeader className="px-6 pb-2 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3]">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold leading-6 text-[#14182c]">Launch status</CardTitle>
                  <CardDescription className="text-sm text-[#5f6a94]">
                    Prototype flags stored in your browser (localStorage).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 px-6 pb-6 pt-2">
              <div className="flex justify-between border-b border-[#e3e7f4] py-3 text-sm">
                <span className="text-[#5f6a94]">Guided setup</span>
                <span className="font-semibold text-[#14182c]">{onboardingComplete ? 'Complete' : 'Not complete'}</span>
              </div>
              <div className="flex justify-between border-b border-[#e3e7f4] py-3 text-sm">
                <span className="text-[#5f6a94]">Plan framework ready</span>
                <span className="font-semibold text-[#14182c]">{planReady ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-[#5f6a94]">Portal launch</span>
                <span className="font-semibold text-[#14182c]">{launchComplete ? 'Live' : 'Not launched'}</span>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(cardSurface, 'hover:shadow-md')}>
            <CardHeader className="px-6 pb-2 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3]">
                  <Rocket className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold leading-6 text-[#14182c]">Quick links</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-6 pb-6">
              <Button asChild variant="outline" size="sm" className={cn('justify-center sm:justify-start', outlineSpark)}>
                <Link to="/reports">Reports & analytics</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className={cn('justify-center sm:justify-start', outlineSpark)}>
                <Link to="/content">Content library</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className={cn('justify-center sm:justify-start', outlineSpark)}>
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
