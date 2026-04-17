import { Link } from 'react-router-dom'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wexinc-healthbenefits/ben-ui-kit'
import { BarChart3, ChevronRight, CreditCard, FileSpreadsheet, Palette, Sparkles, Users } from 'lucide-react'
import { DashboardWelcomeHero } from '@/components/dashboard/DashboardWelcomeHero'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { useEmployerSetup } from '@/hooks/useEmployerSetup'
import { REPORT_LIBRARY } from '@/data/adminMockData'
import { relativeUpdatedFromIsoDate } from '@/lib/relativeUpdatedDate'
import { cn } from '@/lib/utils'

/** Spark / cxr-ux homepage–style elevated surface */
const cardSurface =
  'overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-[0_3px_9px_rgba(43,49,78,0.04),0_6px_18px_rgba(43,49,78,0.06)] transition-shadow'

const sectionEyebrow = 'text-[12px] font-black uppercase tracking-[3px] text-[#5f6a94] leading-4'

const outlineSpark =
  'rounded-xl border-[#3958c3] font-medium text-[#3958c3] hover:bg-[#3958c3]/5'

const keyInsights = [
  'Life-event volume is up 18% vs last month — most are dependent adds tied to your new medical tier.',
  'Claims filed via web portal are up this month; compare filing channels in Claims by Source.',
  'COBRA notices and premium subsidy reports are the most opened items by your team this week.',
] as const

const topReports = REPORT_LIBRARY.slice(0, 3)

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
  const { onboardingComplete, planReady } = useEmployerSetup()

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />

      <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section>
          <DashboardWelcomeHero onboardingComplete={onboardingComplete} planReady={planReady} />
        </section>

        <section className="space-y-4">
          <h2 className={sectionEyebrow}>Data & reports</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              className={cn(
                cardSurface,
                !planReady ? 'opacity-60' : 'group/card hover:shadow-md',
              )}
            >
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 px-6 pb-2 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-transform group-hover/card:scale-110">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-base font-bold leading-6 text-[#14182c]">WEX Insights</CardTitle>
                  <CardDescription className="text-sm leading-5 text-[#5f6a94]">
                    Tailored for your benefits program
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6 pt-2">
                <ul className="space-y-5 text-[15px] leading-[1.65] text-[#374056]">
                  {keyInsights.map((line) => (
                    <li key={line} className="flex gap-3.5">
                      <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#3958c3]" aria-hidden />
                      <span className="min-w-0">{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-[#e8ecf4] pt-5 text-xs leading-relaxed text-[#5f6a94]">
                  Insights are illustrative for this prototype. Live signals will replace them when analytics feeds are
                  connected.
                </p>
              </CardContent>
            </Card>

            <Card
              className={cn(
                cardSurface,
                !planReady ? 'opacity-60' : 'group/card hover:shadow-md',
              )}
            >
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 px-6 pb-2 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-transform group-hover/card:scale-110">
                  <BarChart3 className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-base font-bold leading-6 text-[#14182c]">Your top reports</CardTitle>
                  <CardDescription className="text-sm leading-5 text-[#5f6a94]">
                    Most used by your team — open in Reporting & Analytics.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <ul className="flex flex-col gap-2">
                  {topReports.map((r) => {
                    const rowClass =
                      'flex items-center justify-between gap-3 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] px-4 py-3 text-left'
                    const inner = (
                      <>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#14182c]">{r.name}</span>
                          <span className="mt-0.5 block text-xs text-[#5f6a94]">
                            {r.service} · Updated {relativeUpdatedFromIsoDate(r.updated)}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#9aa3bd]" aria-hidden />
                      </>
                    )
                    return (
                      <li key={r.id}>
                        {planReady ? (
                          <Link
                            to="/reports"
                            className={cn(
                              rowClass,
                              'group/row transition-colors hover:border-[#3958c3]/35 hover:bg-[#f0f3ff]',
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#14182c] group-hover/row:text-[#3958c3]">
                                {r.name}
                              </span>
                              <span className="mt-0.5 block text-xs text-[#5f6a94]">
                                {r.service} · Updated {relativeUpdatedFromIsoDate(r.updated)}
                              </span>
                            </span>
                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-[#9aa3bd] transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-[#3958c3]"
                              aria-hidden
                            />
                          </Link>
                        ) : (
                          <div className={cn(rowClass, 'opacity-70')}>{inner}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {planReady ? (
                  <Button asChild variant="outline" size="sm" className={cn('w-full rounded-xl sm:w-auto', outlineSpark)}>
                    <Link to="/reports">View all reports</Link>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled className="w-full rounded-xl sm:w-auto">
                    Complete plan setup first
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
          {!planReady && (
            <p className="text-xs leading-4 text-[#5f6a94]">
              Data and report shortcuts unlock when your plan framework is ready in the setup wizard, same as frequent
              tasks below.
            </p>
          )}
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
      </main>

      <AdminFooter />
    </div>
  )
}
