import { Link } from 'react-router-dom'
import { Button } from '@wexinc-healthbenefits/ben-ui-kit'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  MessageSquare,
  Mic,
  Palette,
  Send,
  Sparkles,
  Users,
} from 'lucide-react'
import { EMPLOYER } from '@/data/adminMockData'
import { cn } from '@/lib/utils'

/** SPARK hero shell — Figma node 1125:34822 outer frame */
const heroFrame =
  'overflow-hidden rounded-[32px] border border-[#e3e7f4] bg-white shadow-[0_1.5px_4.5px_rgba(43,49,78,0.04)]'

const chipBase =
  'inline-flex items-center gap-1.5 rounded-full border border-[#e8eaef] bg-[#fafbfc] px-3 py-1.5 text-[12px] font-normal text-[#5f6a94] transition-colors hover:border-[#dce0ea] hover:bg-[#f4f5f8]'

/** Figma elevation/3 on nested task card */
const nextCardShadow =
  'shadow-[0_0_1px_rgba(18,24,29,0.2),0_12px_16px_rgba(18,24,29,0.08),0_4px_6px_rgba(18,24,29,0.03)]'

/** WEX AI primary CTA — Figma button-large gradient + #25146f border */
const wexAiCta =
  'border border-[#25146f] bg-gradient-to-br from-[#25146f] to-[#c8102e] text-white shadow-none hover:opacity-[0.96]'

/** Figma node 1125:34826 — [Agent] Floating Action Button */
const agentFabClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-2 shadow-[0_1px_3px_rgba(2,13,36,0.2),0_0_1px_rgba(2,13,36,0.3)]'


function greetingForHour(h: number): string {
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const quickChips = [
  { label: 'Review roster', icon: Users, to: '/enrollment' },
  { label: 'Draft announcement', icon: MessageSquare, to: '/communications' },
  { label: 'Billing summary', icon: CreditCard, to: '/billing' },
  { label: 'Member portal look', icon: Palette, to: '/theming' },
] as const

export function EmployerDashboardHero() {
  const firstName = EMPLOYER.hrAdminName.split(' ')[0]
  const greeting = greetingForHour(new Date().getHours())

  return (
    <section className={cn('spark-hero-root', heroFrame)} aria-labelledby="employer-hero-heading">
      <div className="spark-hero-bg-base opacity-[0.35]" aria-hidden />
      <div className="spark-hero-bg-layer-a opacity-[0.4]" aria-hidden />
      <div className="spark-hero-bg-layer-b opacity-[0.35]" aria-hidden />

      <div className="spark-hero-content relative z-[1] px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-8">
          {/* Left — greeting, AI input, quick chips (unchanged IA) */}
          <div className="min-w-0 flex-1">
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-2">
                <div
                  className={agentFabClass}
                  style={{
                    backgroundImage: 'linear-gradient(133.5deg, rgb(37, 20, 111) 2.46%, rgb(200, 16, 46) 100%)',
                  }}
                  aria-hidden
                >
                  <Sparkles className="h-[17px] w-[17px] text-white" strokeWidth={2} aria-hidden />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b95b2]">{EMPLOYER.name}</p>
                  <h1
                    id="employer-hero-heading"
                    className="text-[1.375rem] font-bold leading-snug tracking-tight text-[#14182c] sm:text-[1.5rem]"
                  >
                    {greeting}, {firstName}
                  </h1>
                  <p className="max-w-xl text-[14px] leading-[1.5] text-[#5f6a94]">
                    Benefits admin can feel overwhelming—we help you stay on track with clear next steps.
                  </p>
                </div>
              </div>

              <form className="relative max-w-xl pt-0.5" role="search" aria-label="Ask the assistant" onSubmit={(e) => e.preventDefault()}>
                  <label htmlFor="employer-hero-ai-input" className="sr-only">
                    Ask the assistant
                  </label>
                  <div className="flex h-10 items-center gap-1 rounded-full border border-[#dfe3ec] bg-white pl-3.5 pr-1 focus-within:border-[#c5cce0] focus-within:ring-1 focus-within:ring-[#3958c3]/20">
                    <input
                      id="employer-hero-ai-input"
                      type="search"
                      placeholder="Ask me… how to document a qualifying life event"
                      className="min-w-0 flex-1 border-0 bg-transparent py-0 text-[13px] leading-tight text-[#14182c] placeholder:text-[#9aa3bc] placeholder:italic focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#3958c3] transition-colors hover:bg-[#e4e9fc]"
                      aria-label="Voice input"
                    >
                      <Mic className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <button
                      type="submit"
                      className={cn(
                        'flex size-[35px] shrink-0 items-center justify-center rounded-[28px] border border-solid border-[#25146f]',
                        '[background-image:linear-gradient(133.5deg,rgba(37,20,111,0.1)_2.46%,rgba(200,16,46,0.1)_100%)]',
                        'hover:[background-image:linear-gradient(133.5deg,rgba(37,20,111,0.16)_2.46%,rgba(200,16,46,0.16)_100%)]',
                        'transition-[background-image,box-shadow] duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/35 focus-visible:ring-offset-1',
                      )}
                      aria-label="Send"
                    >
                      <Send className="size-[14px] text-[#25146f]" strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </form>

                <div className="space-y-2 pt-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a8b0c4]">Based on your workflow</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickChips.map(({ label, icon: Icon, to }) => (
                      <Link key={to} to={to} className={chipBase}>
                        <Icon className="h-3.5 w-3.5 shrink-0 text-[#a8b0c4]" aria-hidden />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* Figma vertical rule */}
          <div className="hidden h-auto w-px shrink-0 bg-[#e3e7f4] lg:block lg:w-[1.5px]" aria-hidden />

          {/* Right — Figma “Notification” column + nested card (JTBD onboarding copy) */}
          <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[min(100%,376px)] lg:max-w-[376px]">
            <div className="flex w-full items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Bell className="h-[18px] w-[18px] shrink-0 text-[#5f6a94]" strokeWidth={2} aria-hidden />
                <p className="text-[12px] font-black uppercase leading-4 tracking-[2.4px] text-[#5f6a94]">Your next steps</p>
                <span className="rounded-md bg-[#e1e8ff] px-2 py-0.5 text-[12px] font-bold leading-4 text-[#7a87b2]">
                  2 tasks
                </span>
              </div>
            </div>

            <div className="w-full">
              <div
                className={cn(
                  'flex w-full flex-col gap-6 rounded-[32px] border border-[#e2e8f0] bg-white p-[25px]',
                  nextCardShadow,
                )}
              >
                {/* Figma 1125:34860 layout — in-progress onboarding resume (always) */}
                <div className="flex w-full flex-col gap-3">
                  <div className="inline-flex w-fit rounded-md bg-[#e1e8ff] px-3 py-1">
                    <span className="text-[11px] font-extrabold uppercase leading-[16.5px] tracking-[0.275px] text-[#3958c3]">
                      Benefits & rules
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold leading-8 tracking-[-0.456px] text-[#14182c]">
                    Define waiting periods for new hires
                  </h2>
                  <p className="text-base leading-[24.75px] text-[#5f6a94]">
                    Prevents enrollment timing issues later.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 rounded-[24px] border border-[#f8f9fe] bg-[#f8f9fe] p-[17px]">
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <FileText className="h-[18px] w-[18px] text-[#5f6a94]" strokeWidth={2} aria-hidden />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold leading-6 text-[#14182c]">5–10 min · 2 tasks left</p>
                        <p className="text-xs font-medium leading-5 text-[#5f6a94]">Step 2 of 5</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-extrabold leading-7 tracking-[-0.5px] text-[#14182c]">40%</p>
                    </div>
                  </div>
                  <div
                    className="h-[3px] w-full overflow-hidden rounded-full bg-[#e8ebf2]"
                    role="progressbar"
                    aria-valuenow={40}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Setup 40% complete"
                  >
                    <div className="h-full w-[40%] rounded-full bg-[#3958c3]" />
                  </div>
                </div>

                <div className="flex w-full flex-col items-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      'h-auto min-h-11 w-full gap-2 rounded-xl px-3 py-2.5 text-[15.75px] font-medium',
                      wexAiCta,
                    )}
                  >
                    <Link to="/setup" className="inline-flex items-center justify-center gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
                      Continue setup
                    </Link>
                  </Button>
                  <p className="text-center text-xs font-medium leading-4 text-[#7a87b2]">Progress saves automatically</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-[#9ca7c7]" strokeWidth={2} aria-hidden />
              <p className="text-sm leading-6 tracking-[-0.084px] text-[#9ca7c7]">
                You can pause anytime—your place is saved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EmployerDashboardHero
