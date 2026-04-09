import { Link } from 'react-router-dom'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wexinc-healthbenefits/ben-ui-kit'
import { BarChart3, CreditCard, FileSpreadsheet, LineChart, Palette, Users } from 'lucide-react'
import { DashboardWelcomeHero } from '@/components/dashboard/DashboardWelcomeHero'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
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

const dashboardWidgets = [
  {
    title: 'Enrollment snapshot',
    description: 'Participation rates, life-event queue, and census freshness pulled from payroll sync.',
    icon: BarChart3,
  },
  {
    title: 'Financial pulse',
    description: 'Invoice status, spend pacing, and claims volume for finance and benefits reviews.',
    icon: LineChart,
  },
] as const

export default function DashboardPage() {
  const { onboardingComplete, planReady } = useEmployerSetup()

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />

      <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section>
          <DashboardWelcomeHero onboardingComplete={onboardingComplete} planReady={planReady} />
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

        <section className="space-y-4">
          <h2 className={sectionEyebrow}>Data & reports</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {dashboardWidgets.map(({ title, description, icon: Icon }) => {
              const locked = !planReady
              return (
                <Card
                  key={title}
                  className={cn(
                    cardSurface,
                    locked ? 'opacity-60' : 'hover:shadow-md',
                  )}
                >
                  <CardHeader className="space-y-3 px-6 pb-2 pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3]',
                            locked && 'grayscale',
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="text-base font-bold leading-6 text-[#14182c]">{title}</CardTitle>
                          <CardDescription className="text-sm leading-5 text-[#5f6a94]">{description}</CardDescription>
                        </div>
                      </div>
                      {locked ? (
                        <span className="shrink-0 rounded-full bg-[#f1f3f9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5f6a94]">
                          Awaits setup
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                          Ready for data
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 px-6 pb-6">
                    <div
                      className={cn(
                        'rounded-xl border border-dashed border-[#d5dbe8] bg-[#f8f9fe] p-4',
                        locked && 'pointer-events-none select-none',
                      )}
                      aria-hidden={locked ? true : undefined}
                    >
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#9aa3bd]">
                        Placeholder preview
                      </p>
                      <div className="space-y-2.5">
                        {[72, 48, 88, 56].map((w, i) => (
                          <div
                            key={i}
                            className="h-2.5 rounded-full bg-[#e3e7f4]"
                            style={{ width: `${w}%` }}
                          />
                        ))}
                      </div>
                      <div className="mt-4 h-16 rounded-lg bg-[#eef2ff]/60" />
                    </div>
                    <p className="text-xs leading-4 text-[#5f6a94]">
                      {locked
                        ? 'This widget stays disabled until your plan framework is ready, same as shortcuts above. Then it will update with reports and synced data from your environment.'
                        : 'Layout preview only. Metrics and exports will replace this placeholder once reporting feeds are connected (prototype).'}
                    </p>
                    <Button type="button" variant="outline" size="sm" disabled className="w-full rounded-xl sm:w-auto">
                      {locked ? 'Complete plan setup first' : 'View report (coming soon)'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {!planReady && (
            <p className="text-xs leading-4 text-[#5f6a94]">
              Widgets unlock together with frequent tasks when plan setup is finished in the wizard. After that, this area
              is where live dashboards and report shortcuts will land.
            </p>
          )}
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}
