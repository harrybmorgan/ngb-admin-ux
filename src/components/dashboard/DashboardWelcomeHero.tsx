import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Badge } from '@wexinc-healthbenefits/ben-ui-kit'
import { Bell, Check, FileText, RefreshCw, Ticket, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { EMPLOYER } from '@/data/adminMockData'
import { cn } from '@/lib/utils'
import { AdminAiChatInput } from '@/components/dashboard/AdminAiChatInput'
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

type DashboardWelcomeHeroProps = {
  onboardingComplete: boolean
  planReady: boolean
}

const HERO_VISITED_KEY = 'ngb-admin-dashboard-hero-visited'

export function DashboardWelcomeHero({ onboardingComplete, planReady }: DashboardWelcomeHeroProps) {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [askValue, setAskValue] = useState('')
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

  const setupTitle = onboardingComplete ? 'Guided employer setup' : 'Start guided setup'
  const setupDescription = onboardingComplete
    ? 'You can revisit any step or adjust branding from your profile menu. Dashboard widgets below will fill in after setup.'
    : 'First time here? Walk through low-touch steps for plans, eligibility, integrations, and branding. Save anytime and pick up later.'

  const taskCount = onboardingComplete ? 0 : 1

  return (
    <div
      className={cn(
        'rounded-[25px] shadow-[0_8px_32px_rgba(43,49,78,0.1)]',
        'transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(43,49,78,0.14)]',
      )}
    >
      <motion.div
        className={cn(
          'relative isolate z-40 overflow-visible rounded-[25px] border border-[#e3e7f4]',
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
          className="spark-hero-content relative z-[1] flex flex-col overflow-visible lg:flex-row lg:items-stretch"
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
                <motion.button
                  variants={pillVariants}
                  type="button"
                  onClick={() => toast.message('DBI upload is not wired in this prototype.')}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.2, ease: softEaseOut }}
                  className={pillClass}
                >
                  <Upload className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                  Upload DBI
                </motion.button>
                <motion.button
                  variants={pillVariants}
                  type="button"
                  onClick={() => toast.message('Support ticketing is not enabled in this prototype.')}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.2, ease: softEaseOut }}
                  className={pillClass}
                >
                  <Ticket className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                  Submit support ticket
                </motion.button>
              </motion.div>
            </motion.div>

            {!planReady && (
              <p className="text-sm leading-5 text-[#5f6a94]">
                Complete plan design in setup to unlock data, reports, and frequent tasks below.
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
            <motion.div variants={ctaHeaderVariants} className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#5f6a94]" aria-hidden />
                <span className={sectionEyebrow}>Your next steps</span>
              </div>
              {taskCount > 0 ? (
                <Badge intent="info" className="rounded-full border-0 bg-[#eef2ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#3958c3]">
                  {taskCount} task
                </Badge>
              ) : (
                <Badge intent="default" className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                  All set
                </Badge>
              )}
            </motion.div>

            <motion.div
              variants={ctaCardVariants}
              initial={shouldAnimate ? 'hidden' : 'instant'}
              animate={animateState}
              className={cn(
                'flex min-h-0 flex-1 flex-col rounded-2xl border border-[#e8ecf4] bg-white/95 p-4 shadow-[0_2px_12px_rgba(43,49,78,0.06)] backdrop-blur-sm sm:p-5',
                'transition-shadow duration-300 hover:shadow-md',
              )}
            >
              <span className="mb-3 inline-flex w-fit rounded-md bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                Recommended
              </span>
              <h2 className="text-base font-bold leading-6 text-[#14182c]">{setupTitle}</h2>
              <p className="mt-2 text-sm leading-5 text-[#5f6a94]">{setupDescription}</p>

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
                Get started
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

            <p className="mt-4 flex items-center justify-center gap-2 text-center text-[13px] text-[#5f6a94]">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
              You&apos;re all caught up on other tasks
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
