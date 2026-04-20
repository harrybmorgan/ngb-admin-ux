import { Link } from 'react-router-dom'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wexinc-healthbenefits/ben-ui-kit'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, ChevronRight, CreditCard, FileSpreadsheet, Lock, Palette, Sparkles, Users } from 'lucide-react'
import { DashboardWelcomeHero } from '@/components/dashboard/DashboardWelcomeHero'
import { DashboardManageSetupSection } from '@/components/dashboard/DashboardManageSetupSection'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminDockablePageShell } from '@/components/layout/AdminDockablePageShell'
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

/** Shared list row for WEX Insights and Your top reports (same min-height and chrome). */
const dataReportsListRowClass =
  'flex w-full min-h-[5rem] items-center justify-between gap-3 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] px-4 py-3 text-left transition-colors hover:border-[#3958c3]/35 hover:bg-[#f0f3ff]'

const focusRingRow = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 focus-visible:ring-offset-2'

/** Shown in WEX Insights when the employer portal is live (prototype: rows look actionable but do not navigate). */
const postLaunchWexInsights = [
  {
    headline: 'Your OE announcement email is scheduled for tomorrow.',
    detail: 'Would you like to preview or edit?',
  },
  {
    headline: "45 employees haven't started their elections.",
    detail: "Click to send a 'Last Call' SMS.",
  },
  {
    headline: '12 EOI forms are pending approval.',
    detail: 'Click here to bulk approve or notify employees.',
  },
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

function PrelaunchUnlockSpotlight({ icon: Icon, headline, body }: { icon: LucideIcon; headline: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center sm:py-12" role="status" aria-live="polite">
      <div className="relative" aria-hidden>
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-2 border-dashed border-[#c8d0ef] bg-gradient-to-b from-[#f8f9fc] to-[#eef2ff]/50 text-[#9aa3bd]">
          <Icon className="h-9 w-9" strokeWidth={1.25} />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#e8ecf4] text-[#5f6a94] shadow-sm">
          <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
      </div>
      <div className="mx-auto max-w-[min(100%,288px)] space-y-1.5 px-2">
        <p className="text-sm font-semibold text-[#374056]">{headline}</p>
        <p className="text-xs leading-relaxed text-[#5f6a94]">{body}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { onboardingComplete, planReady, launchComplete } = useEmployerSetup()
  const portalLive = launchComplete

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />

      <AdminDockablePageShell>
        <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section>
          <DashboardWelcomeHero
            onboardingComplete={onboardingComplete}
            planReady={planReady}
            launchComplete={launchComplete}
          />
        </section>

        <DashboardManageSetupSection />

        <section className="space-y-4">
          <h2 className={sectionEyebrow}>Data & reports</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              className={cn(
                cardSurface,
                !portalLive ? 'pointer-events-none opacity-60' : 'group/card hover:shadow-md',
              )}
            >
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 px-6 pb-2 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-transform group-hover/card:scale-110">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-base font-bold leading-6 text-[#14182c]">WEX Insights</CardTitle>
                  {portalLive ? (
                    <CardDescription className="text-sm leading-5 text-[#5f6a94]">
                      Tailored for your benefits program
                    </CardDescription>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6 pt-2">
                {portalLive ? (
                  <>
                    <ul className="flex flex-col gap-2">
                      {postLaunchWexInsights.map(({ headline, detail }) => (
                        <li key={headline}>
                          <button
                            type="button"
                            className={cn(dataReportsListRowClass, focusRingRow, 'group/insight cursor-pointer')}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
                              <Sparkles
                                className="h-4 w-4 shrink-0 text-[#3958c3] group-hover/insight:text-[#3958c3]"
                                aria-hidden
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-bold text-[#14182c] group-hover/insight:text-[#3958c3]">
                                  {headline}
                                </span>
                                <span className="mt-0.5 block text-xs font-normal leading-snug text-[#5f6a94]">
                                  {detail}
                                </span>
                              </span>
                            </span>
                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-[#9aa3bd] transition-transform group-hover/insight:translate-x-0.5 group-hover/insight:text-[#3958c3]"
                              aria-hidden
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="border-t border-[#e8ecf4] pt-5 text-xs leading-relaxed text-[#5f6a94]">
                      Insights are illustrative for this prototype. Live signals will replace them when analytics feeds are
                      connected.
                    </p>
                  </>
                ) : (
                  <PrelaunchUnlockSpotlight
                    icon={Sparkles}
                    headline="Insights will appear here after launch"
                    body="Program trends and tailored signals for your benefits program show up once the employer portal is live."
                  />
                )}
              </CardContent>
            </Card>

            <Card
              className={cn(
                cardSurface,
                !portalLive ? 'pointer-events-none opacity-60' : 'group/card hover:shadow-md',
              )}
            >
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 px-6 pb-2 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-transform group-hover/card:scale-110">
                  <BarChart3 className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-base font-bold leading-6 text-[#14182c]">Your top reports</CardTitle>
                  {portalLive ? (
                    <CardDescription className="text-sm leading-5 text-[#5f6a94]">
                      Most used by your team — open in Reports.
                    </CardDescription>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6 pt-2">
                {portalLive ? (
                  <>
                    <ul className="flex flex-col gap-2">
                      {topReports.map((r) => (
                        <li key={r.id}>
                          <Link
                            to="/reports"
                            className={cn(dataReportsListRowClass, focusRingRow, 'group/row')}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-[#14182c] group-hover/row:text-[#3958c3]">
                                {r.name}
                              </span>
                              <span className="mt-0.5 block text-xs font-normal leading-snug text-[#5f6a94]">
                                {r.service} · Updated {relativeUpdatedFromIsoDate(r.updated)}
                              </span>
                            </span>
                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-[#9aa3bd] transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-[#3958c3]"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" size="sm" className={cn('w-full rounded-xl sm:w-auto', outlineSpark)}>
                      <Link to="/reports">View all reports</Link>
                    </Button>
                  </>
                ) : (
                  <PrelaunchUnlockSpotlight
                    icon={BarChart3}
                    headline="Report shortcuts will appear after launch"
                    body="Your team’s most-used reports and quick links to the library unlock when the employer portal is live."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={sectionEyebrow}>Frequent tasks</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {secondaryTasks.map(({ title, description, icon: Icon, to }) => {
              const locked = !portalLive
              return (
                <Card
                  key={title}
                  className={cn(
                    cardSurface,
                    locked ? 'pointer-events-none opacity-60' : 'group/card hover:shadow-md',
                  )}
                >
                  <CardHeader
                    className={cn(
                      'flex flex-row items-start gap-3 space-y-0 px-6 pt-6',
                      locked ? 'pb-6' : 'pb-2',
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-transform group-hover/card:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-base font-bold leading-6 text-[#14182c]">{title}</CardTitle>
                      <CardDescription className="text-sm leading-5 text-[#5f6a94]">
                        {locked ? 'Launch employer portal to unlock' : description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  {!locked ? (
                    <CardContent className="px-6 pb-6">
                      <Button asChild variant="outline" size="sm" className={cn('w-full sm:w-auto', outlineSpark)}>
                        <Link to={to}>Open</Link>
                      </Button>
                    </CardContent>
                  ) : null}
                </Card>
              )
            })}
          </div>
        </section>
          </main>

        <AdminFooter />
      </AdminDockablePageShell>
    </div>
  )
}
