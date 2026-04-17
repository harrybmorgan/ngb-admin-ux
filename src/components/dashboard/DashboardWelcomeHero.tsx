import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Badge } from '@wexinc-healthbenefits/ben-ui-kit'
import { Bell, Check, ChevronRight, CircleHelp, FileText, Landmark, Receipt, RefreshCw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { EMPLOYER } from '@/data/adminMockData'
import { useGuidedSetupHomeState } from '@/hooks/useGuidedSetupHomeState'
import { formatStepsLeftPhrase, getWizardHeroMeta } from '@/lib/guidedSetupHome'
import { cn } from '@/lib/utils'
import { AdminAiChatInput } from '@/components/dashboard/AdminAiChatInput'
import { GetHelpDialog } from '@/components/dashboard/GetHelpDialog'
import { ShineBorder } from '@/components/ui/ShineBorder'
import { WexAiSparkleMark } from '@/components/ui/WexAiSparkleMark'

const MotionLink = motion(Link)

const sectionEyebrow = 'text-[11px] font-black uppercase tracking-[0.2em] text-[#5f6a94]'

const pillClass =
  'inline-flex items-center gap-2 rounded-full border border-[#c8d0ef] bg-white/95 px-4 py-2 text-[13px] font-medium text-[#14182c] shadow-sm transition-colors duration-200 hover:border-[#3958c3]/50 hover:bg-[#f8f9ff] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/35 focus-visible:ring-offset-2'

const softEaseOut: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const layoutSpring = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 24,
  mass: 0.9,
}

const restrainedSpring = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 20,
}

const containerVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: softEaseOut },
  },
  instant: { opacity: 1, y: 0 },
}

const greetingVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.1, ease: softEaseOut },
  },
  instant: { opacity: 1, y: 0 },
}

const inputVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.25, ease: softEaseOut },
  },
  instant: { opacity: 1, y: 0 },
}

const pillsContainerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.25, ease: softEaseOut },
  },
  instant: { opacity: 1, y: 0 },
}

const pillsWrapperVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.25,
      staggerChildren: 0.03,
    },
  },
  instant: { opacity: 1 },
}

const pillVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: softEaseOut },
  },
  instant: { opacity: 1, x: 0 },
}

const dividerDesktopVariants = {
  hidden: { opacity: 0, scaleY: 0 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.3, delay: 0.4, ease: softEaseOut },
  },
  instant: { opacity: 1, scaleY: 1 },
}

const dividerMobileVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.3, delay: 0.4, ease: softEaseOut },
  },
  instant: { opacity: 1, scaleX: 1 },
}

const ctaHeaderVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.5, ease: softEaseOut },
  },
  instant: { opacity: 1, y: 0 },
}

const ctaCardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    boxShadow: '0 2px 4px rgba(18,24,29,0.1)',
  },
  visible: {
    opacity: 1,
    y: 0,
    boxShadow:
      '0 0 1px rgba(18,24,29,0.2), 0 12px 16px rgba(18,24,29,0.08), 0 4px 6px rgba(18,24,29,0.03)',
    transition: { delay: 0.5, ...restrainedSpring },
  },
  instant: {
    opacity: 1,
    y: 0,
    boxShadow:
      '0 0 1px rgba(18,24,29,0.2), 0 12px 16px rgba(18,24,29,0.08), 0 4px 6px rgba(18,24,29,0.03)',
  },
}

function greetingLabel() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const postLaunchPriorities = [
  {
    title: 'Review 12 life events',
    subtitle: 'Confirm dependent adds, address updates, and COBRA qualifiers.',
    category: 'Enrollment',
    to: '/enrollment',
  },
  {
    title: 'Reconcile April invoice',
    subtitle: 'Bundled marketplace payment due Apr 18.',
    category: 'Billing',
    to: '/billing',
  },
  {
    title: 'Schedule OE announcement',
    subtitle: 'Draft comms for fall open enrollment.',
    category: 'Communications',
    to: '/communications',
  },
] as const

const POST_LAUNCH_QUEUE_VISIBLE = 3 as const

function postLaunchPriorityCount() {
  return 1 + postLaunchPriorities.length
}

type DashboardWelcomeHeroProps = {
  onboardingComplete: boolean
  planReady: boolean
  launchComplete: boolean
}

const HERO_VISITED_KEY = 'ngb-admin-dashboard-hero-visited'

export function DashboardWelcomeHero({ onboardingComplete, planReady, launchComplete }: DashboardWelcomeHeroProps) {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const guidedSnapshot = useGuidedSetupHomeState()
  const [askValue, setAskValue] = useState('')
  const [getHelpOpen, setGetHelpOpen] = useState(false)
  const firstName = EMPLOYER.hrAdminName.split(' ')[0]

  const [isFirstVisit] = useState(() => {
    if (typeof window !== 'undefined') {
      if (import.meta.env.DEV) return true
      return !sessionStorage.getItem(HERO_VISITED_KEY)
    }
    return false
  })

  useEffect(() => {
    if (isFirstVisit) {
      sessionStorage.setItem(HERO_VISITED_KEY, 'true')
    }
  }, [isFirstVisit])

  const shouldAnimate = isFirstVisit && !prefersReducedMotion
  const animateState = shouldAnimate ? 'visible' : 'instant'

  const setupCard = useMemo(() => {
    const hasDraft = guidedSnapshot !== null
    if (onboardingComplete) {
      return {
        state: 'complete' as const,
        title: 'Setup ready',
        helperLine: launchComplete
          ? 'Review or adjust configuration anytime'
          : 'Core setup is complete',
        ctaLabel: 'Review setup',
        headerBadge: { label: 'All set', intent: 'default' as const },
        pill: { label: 'Complete', className: 'bg-emerald-100 text-emerald-950' },
        metaLine: null as string | null,
      }
    }
    if (hasDraft && guidedSnapshot) {
      const { stepTitle, stepsLeft } = getWizardHeroMeta(guidedSnapshot)
      const metaLine =
        stepsLeft > 0
          ? `${stepTitle} · ${formatStepsLeftPhrase(stepsLeft)}`
          : "Required steps complete — wrap up launch when you're ready."
      return {
        state: 'in_progress' as const,
        title: 'Continue guided setup',
        description: 'Pick up where you left off and finish the remaining setup steps.',
        ctaLabel: 'Continue',
        headerBadge: { label: '1 task', intent: 'info' as const },
        pill: { label: 'In progress', className: 'bg-[#eef2ff] text-[#3958c3]' },
        metaLine,
      }
    }
    return {
      state: 'not_started' as const,
      title: 'Start guided setup',
      description:
        'First time here? Walk through low-touch steps for plans, eligibility, integrations, and branding. Save anytime and pick up later.',
      ctaLabel: 'Get started',
      headerBadge: { label: '1 task', intent: 'info' as const },
      pill: { label: 'Recommended', className: 'bg-amber-100 text-amber-950' },
      metaLine: null as string | null,
    }
  }, [guidedSnapshot, onboardingComplete, launchComplete])

  return (
    <div
      className={cn(
        'rounded-[25px] shadow-[0_8px_32px_rgba(43,49,78,0.1)]',
        'transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(43,49,78,0.14)]',
      )}
    >
      <motion.div
        className={cn(
          'relative isolate z-0 overflow-visible rounded-[25px] border border-[#e3e7f4]',
          'shadow-[0_1.5px_4.5px_rgba(43,49,78,0.04)] [filter:drop-shadow(0_0_0_transparent)]',
        )}
        layout
        transition={{ layout: layoutSpring }}
        initial={shouldAnimate ? 'hidden' : 'instant'}
        animate={animateState}
        variants={containerVariants}
      >
        <ShineBorder
          borderWidth={1.5}
          duration={18}
          color={['#25146f', '#c8102e', '#25146f']}
          className="pointer-events-none absolute inset-0 z-[45] rounded-[inherit] border-none bg-transparent p-0 shadow-none dark:bg-transparent"
        >
          {null}
        </ShineBorder>
        {/* Clip animated layers only so popovers (AI search suggestions) can extend past this frame */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[25px]"
          aria-hidden
        >
          <div className="relative min-h-full w-full">
            <div className="spark-hero-bg-base" />
            <div className="spark-hero-bg-layer-a" />
            <div className="spark-hero-bg-layer-b" />
          </div>
        </div>

        <motion.div
          className="spark-hero-content relative z-[50] flex flex-col overflow-visible lg:flex-row lg:items-stretch"
          layout
          transition={{ layout: layoutSpring }}
        >
          <motion.div
            layout
            transition={{ layout: layoutSpring }}
            className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:max-w-none lg:basis-[58%]"
          >
            <motion.div variants={greetingVariants} className="flex flex-col gap-4">
              <motion.div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_1.057px_3.17px_rgba(2,13,36,0.2),0_0_0.528px_rgba(2,13,36,0.3)]"
                style={{
                  backgroundImage:
                    'linear-gradient(133.514deg, rgb(37, 20, 111) 2.4625%, rgb(200, 16, 46) 100%)',
                }}
                aria-hidden
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                transition={restrainedSpring}
              >
                <WexAiSparkleMark size="16.9px" />
              </motion.div>
              <div className="flex min-w-0 flex-col gap-2">
                <h2 className="text-[40px] font-semibold leading-[56px] tracking-[-0.88px] text-[#14182c]">
                  {greetingLabel()}, {firstName}
                </h2>
                <p className="text-[19px] leading-[32px] tracking-[-0.304px] text-[#5f6a94]">
                  Welcome to your Unified Benefits Operating System.
                </p>
              </div>
            </motion.div>

            <motion.div variants={inputVariants}>
              <AdminAiChatInput
                value={askValue}
                onChange={setAskValue}
                onMicClick={() => toast.message('Voice input is not enabled in this prototype.')}
                onSendClick={() => {
                  toast.message(
                    askValue.trim()
                      ? 'Search and assistant features are not enabled in this prototype.'
                      : 'Type a question to get started (prototype).',
                  )
                }}
              />
            </motion.div>

            <motion.div variants={pillsContainerVariants} className="flex flex-col gap-4">
              <p className={sectionEyebrow}>Quick actions</p>
              <motion.div variants={pillsWrapperVariants} className="flex flex-wrap gap-2">
                {launchComplete ? (
                  <>
                    <motion.button
                      variants={pillVariants}
                      type="button"
                      onClick={() => navigate('/billing')}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                      transition={{ duration: 0.2, ease: softEaseOut }}
                      className={pillClass}
                    >
                      <Landmark className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                      Fund accounts
                    </motion.button>
                    <motion.button
                      variants={pillVariants}
                      type="button"
                      onClick={() => navigate('/billing')}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                      transition={{ duration: 0.2, ease: softEaseOut }}
                      className={pillClass}
                    >
                      <Receipt className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                      Submit COBRA remittance
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    variants={pillVariants}
                    type="button"
                    onClick={() => navigate('/enrollment')}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.2, ease: softEaseOut }}
                    className={pillClass}
                  >
                    <RefreshCw className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                    Sync payroll data
                  </motion.button>
                )}
                <motion.button
                  variants={pillVariants}
                  type="button"
                  onClick={() => toast.message('File upload is not wired in this prototype.')}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.2, ease: softEaseOut }}
                  className={pillClass}
                >
                  <Upload className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                  Upload file
                </motion.button>
                <motion.button
                  variants={pillVariants}
                  type="button"
                  onClick={() => setGetHelpOpen(true)}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.2, ease: softEaseOut }}
                  className={pillClass}
                >
                  <CircleHelp className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                  Get help
                </motion.button>
              </motion.div>
            </motion.div>

            {launchComplete && !planReady && (
              <p className="text-sm leading-5 text-[#5f6a94]">
                Your portal is live. Finish any remaining plan configuration in setup if your team still has open tasks.
              </p>
            )}
          </motion.div>

          <motion.div
            variants={dividerMobileVariants}
            style={{ originX: 0 }}
            className="block h-[1.5px] w-full shrink-0 bg-[#e3e7f4]/80 lg:hidden"
            aria-hidden
          />
          <motion.div
            variants={dividerDesktopVariants}
            style={{ originY: 0 }}
            className="hidden w-[1.5px] shrink-0 self-stretch bg-[#e3e7f4]/80 lg:block"
            aria-hidden
          />

          <motion.div
            layout
            transition={{ layout: layoutSpring }}
            className="flex min-w-0 flex-col px-6 py-6 sm:px-8 sm:py-8 lg:basis-[42%]"
          >
            <motion.div
              variants={ctaHeaderVariants}
              className={cn(
                'mb-4 flex flex-wrap items-center justify-between gap-2',
                onboardingComplete && 'mb-3',
              )}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                <span className={sectionEyebrow}>{onboardingComplete ? 'What needs attention' : 'Your next steps'}</span>
              </div>
              {onboardingComplete ? (
                <Badge intent="info" className="rounded-full border-0 bg-[#eef2ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#3958c3]">
                  {postLaunchPriorityCount()} priorit{postLaunchPriorityCount() === 1 ? 'y' : 'ies'}
                </Badge>
              ) : (
                <Badge
                  intent={setupCard.headerBadge.intent}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    setupCard.headerBadge.intent === 'info' && 'border-0 bg-[#eef2ff] text-[#3958c3]',
                  )}
                >
                  {setupCard.headerBadge.label}
                </Badge>
              )}
            </motion.div>

            {!onboardingComplete ? (
              <motion.div
                variants={ctaCardVariants}
                initial={shouldAnimate ? 'hidden' : 'instant'}
                animate={animateState}
                className={cn(
                  'flex min-h-0 flex-1 flex-col rounded-2xl border border-[#e8ecf4] bg-white/95 p-4 shadow-[0_2px_12px_rgba(43,49,78,0.06)] backdrop-blur-sm sm:p-5',
                  'transition-shadow duration-300 hover:shadow-md',
                )}
              >
                <span
                  className={cn(
                    'mb-3 inline-flex w-fit rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                    setupCard.pill.className,
                  )}
                >
                  {setupCard.pill.label}
                </span>
                <h2 className="text-base font-bold leading-6 text-[#14182c]">{setupCard.title}</h2>
                <p className="mt-2 text-sm leading-5 text-[#5f6a94]">{setupCard.description}</p>
                {setupCard.metaLine ? (
                  <p className="mt-2 text-xs font-medium leading-snug text-[#374056]">{setupCard.metaLine}</p>
                ) : null}

                <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#e8ecf4] bg-[#f7f8fc] px-3 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#3958c3] shadow-sm">
                    <FileText className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 text-[13px] leading-snug">
                    <p className="font-semibold text-[#14182c]">{EMPLOYER.name}</p>
                    <p className="text-[#5f6a94]">Ben Admin · CDH · COBRA</p>
                  </div>
                </div>

                <MotionLink
                  to="/setup"
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  transition={{ duration: 0.2, ease: softEaseOut }}
                  className={cn(
                    'dashboard-welcome-cta mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-semibold text-white no-underline shadow-md',
                    'wex-ai-gradient-send',
                    'transition-[box-shadow,transform,filter] duration-200 hover:brightness-[1.05]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b21b6]/50 focus-visible:ring-offset-2',
                  )}
                >
                  {setupCard.ctaLabel}
                </MotionLink>

                <motion.button
                  type="button"
                  onClick={() => toast.message('Reminder set (prototype only — not saved).')}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.2, ease: softEaseOut }}
                  className="mt-3 w-full text-center text-[13px] font-semibold text-[#5f6a94] underline-offset-2 transition-colors hover:text-[#3958c3] hover:underline"
                >
                  Remind me tomorrow
                </motion.button>
              </motion.div>
            ) : (
              <div
                className="flex min-h-0 w-full flex-1 flex-col gap-2"
                aria-label={`What needs attention: featured — ${setupCard.title}; also ${postLaunchPriorities
                  .slice(0, POST_LAUNCH_QUEUE_VISIBLE)
                  .map((t) => t.title)
                  .join(', ')}.`}
              >
                <motion.div
                  variants={ctaCardVariants}
                  initial={shouldAnimate ? 'hidden' : 'instant'}
                  animate={animateState}
                  className={cn(
                    'flex flex-col gap-2 rounded-xl border border-[#e8ecf4] bg-white px-2.5 py-1.5 shadow-[0_1px_2px_rgba(43,49,78,0.05)] sm:px-3 sm:py-2',
                    'transition-[box-shadow,transform] duration-200 hover:border-[#dfe4ef] hover:shadow-[0_2px_6px_rgba(43,49,78,0.06)]',
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_1px_3px_rgba(5,122,85,0.22)]"
                      aria-hidden
                    >
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <h2 className="text-sm font-semibold leading-snug tracking-tight text-[#14182c]">{setupCard.title}</h2>
                        <span
                          className="inline-flex shrink-0 rounded border border-emerald-200/90 bg-emerald-50/90 px-1 py-px text-[8px] font-semibold uppercase tracking-[0.08em] text-emerald-800/80"
                          title="Setup status"
                        >
                          {setupCard.pill.label}
                        </span>
                      </div>
                      {'helperLine' in setupCard && setupCard.helperLine ? (
                        <p className="text-[11px] leading-snug text-[#5f6a94]">{setupCard.helperLine}</p>
                      ) : null}
                    </div>
                  </div>

                  <MotionLink
                    to="/setup"
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                    transition={{ duration: 0.2, ease: softEaseOut }}
                    className={cn(
                      'dashboard-welcome-cta mt-0.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-transparent py-1.5 text-xs font-semibold text-white no-underline shadow-sm',
                      'wex-ai-gradient-send',
                      'transition-[box-shadow,transform,filter] duration-200 hover:brightness-[1.04]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b21b6]/50 focus-visible:ring-offset-2',
                    )}
                  >
                    {setupCard.ctaLabel}
                  </MotionLink>
                </motion.div>

                <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label="More priorities">
                  {postLaunchPriorities.slice(0, POST_LAUNCH_QUEUE_VISIBLE).map((item) => (
                    <li key={item.to}>
                      <MotionLink
                        to={item.to}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
                        transition={{ duration: 0.15, ease: softEaseOut }}
                        className={cn(
                          'group flex items-start gap-3 rounded-xl border border-[#e8ecf4]/80 bg-[#fafbff]/90 px-3 py-2 text-left no-underline',
                          'transition-colors duration-200 hover:border-[#d8deeb] hover:bg-white',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/35 focus-visible:ring-offset-2',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa3bd]">{item.category}</p>
                          <p className="mt-0.5 text-[13px] font-semibold leading-snug text-[#14182c]">{item.title}</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-[#5f6a94]">{item.subtitle}</p>
                        </div>
                        <ChevronRight
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#c8cfdf] transition-colors group-hover:text-[#3958c3]"
                          aria-hidden
                        />
                      </MotionLink>
                    </li>
                  ))}
                </ul>

                <MotionLink
                  to="/setup"
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  transition={{ duration: 0.2, ease: softEaseOut }}
                  className="mt-0.5 inline-flex items-center justify-center gap-1 self-center text-[13px] font-semibold text-[#3958c3] no-underline underline-offset-4 hover:underline"
                >
                  View all priorities
                  <ChevronRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
                </MotionLink>
              </div>
            )}

            {!onboardingComplete && !launchComplete && (
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-[13px] text-[#5f6a94]">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                You&apos;re all caught up on other tasks
              </p>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
      <GetHelpDialog
        open={getHelpOpen}
        onOpenChange={setGetHelpOpen}
        openToRequest
        onPrefillAssistantQuestion={(text) => setAskValue(text)}
      />
    </div>
  )
}
