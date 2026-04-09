import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmbeddedThemingStudio } from '@/pages/theming-engine/EmbeddedThemingStudio'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FloatLabel,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@wexinc-healthbenefits/ben-ui-kit'
import {
  AlertCircle,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  Link2,
  Lock,
  Minus,
  Rocket,
  SkipForward,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { CONNECTORS, EMPLOYER, PRODUCT_OPTIONS } from '@/data/adminMockData'
import { emitSetupChanged, writeEmployerSetup } from '@/hooks/useEmployerSetup'

/** v7: Shared default benefit dates + optional per-plan overrides in Configure plans. */
const WIZARD_DRAFT_KEY = 'ngb_admin_wizard_draft_v7'

/** Linear task order (18 tasks). */
const TASK_LABELS = [
  'Company basics',
  'Employer users & roles / permissions',
  'Add employees',
  'Define employee groups / divisions / classes',
  'Define waiting periods',
  'Choose benefits to offer',
  'Set default benefit dates',
  'Configure plans',
  'Marketplace',
  'Connect employee system',
  'Connect benefit/provider system',
  'Enable EDI',
  'Configure carrier feeds',
  'Review connected systems status',
  'Verify rules and calculations in a safe environment',
  'Preview employee experience',
  'Spot-check migrated/imported data',
  'Review launch status',
] as const

/** Full-bleed embedded theming / preview surface. */
const PREVIEW_EMPLOYEE_TASK_INDEX = 15

/** Waiting-on-others for vendor / feed work while reviewing connections. */
const CONNECT_STATUS_REVIEW_TASK_INDEX = 13

type WizardStepDef = {
  title: string
  /** Fuller step context in the main task card (not the step list). */
  description: string
  /** Single scannable line when this step is expanded in the sidebar. */
  navHint: string
  /** Global task indices (0-based) in this top-level step */
  taskIndices: readonly number[]
}

const WIZARD_STEPS: readonly WizardStepDef[] = [
  {
    title: 'Company basics',
    description: 'Legal profile and who can administer benefits in your organization.',
    navHint: 'Entity details, employer users, roles, and optional SSO.',
    taskIndices: [0, 1],
  },
  {
    title: 'Employee setup',
    description:
      'Add employees with payroll, CSV, or manual entry, then define classes, divisions, and waiting periods so eligibility lines up with payroll and carriers.',
    navHint: 'Add people, then groups/classes, then waiting periods.',
    taskIndices: [2, 3, 4],
  },
  {
    title: 'Benefits',
    description:
      'Pick products, set shared benefit timing defaults, then configure each plan in one place—dates can follow defaults or override per plan (e.g. FSA calendar year). Marketplace stays optional.',
    navHint: 'Products, shared dates, per-plan setup—Marketplace optional.',
    taskIndices: [5, 6, 7, 8],
  },
  {
    title: 'Connect Systems',
    description:
      'Optional deeper integrations and health checks—skip or confirm if you already connected during Employee setup or while configuring plans.',
    navHint: 'Optional integrations—skip if you already linked payroll or carriers.',
    taskIndices: [9, 10, 11, 12, 13],
  },
  {
    title: 'Test & Launch',
    description:
      'Verify rules in a safe environment first, then optional employee preview and data spot-check, then confirm launch readiness.',
    navHint: 'Verify in a safe environment, then preview, spot-check, launch.',
    taskIndices: [14, 15, 16, 17],
  },
] as const

/** Line icons for top-level steps (API-docs–style nav). */
const WIZARD_STEP_NAV_ICONS: readonly ComponentType<{ className?: string; strokeWidth?: number }>[] = [
  Building2,
  Users,
  HeartPulse,
  Link2,
  Rocket,
]

function stepGroupIndexForTask(taskIndex: number): number {
  const i = WIZARD_STEPS.findIndex((p) => p.taskIndices.includes(taskIndex))
  return i >= 0 ? i : 0
}

function taskOrdinalInStepGroup(taskIndex: number): { step: WizardStepDef; indexInStep: number; stepSize: number } {
  const step = WIZARD_STEPS[stepGroupIndexForTask(taskIndex)]
  const indexInStep = step.taskIndices.indexOf(taskIndex)
  return { step, indexInStep: indexInStep >= 0 ? indexInStep : 0, stepSize: step.taskIndices.length }
}

/** Persisted per-task outcome. Blocked / in progress / not started are derived for UI. */
type StoredTaskOutcome = 'pending' | 'complete' | 'skipped' | 'waiting_on_others' | 'needs_review'

const TASK_COUNT = TASK_LABELS.length

/**
 * Optional: Marketplace (8); Connect Systems (9–13); employee preview (15); spot-check (16). Skipped never counts as complete.
 */
const OPTIONAL_TASK_IDS = new Set<number>([8, 9, 10, 11, 12, 13, 15, 16])

/** Connect Systems tasks stay optional for progress; the nav shows one “optional step” label instead of per-task badges. */
const CONNECT_SYSTEMS_TASK_IDS = new Set(
  WIZARD_STEPS.find((s) => s.title === 'Connect Systems')?.taskIndices ?? [],
)

/**
 * Light in-step ordering only. Connect Systems tasks have no mutual blockers.
 */
const TASK_BLOCKER: Partial<Record<number, number>> = {
  1: 0,
  3: 2,
  4: 3,
  6: 5,
  7: 6,
  8: 7,
  /** Test & Launch: verify (14) first; optional preview / spot-check after; launch (17) after verify. */
  15: 14,
  16: 14,
  17: 14,
}

function isTaskRequired(taskIndex: number): boolean {
  return !OPTIONAL_TASK_IDS.has(taskIndex)
}

function isTaskBlocked(taskIndex: number, outcomes: readonly StoredTaskOutcome[]): boolean {
  const prereq = TASK_BLOCKER[taskIndex]
  if (prereq === undefined) return false
  return outcomes[prereq] !== 'complete'
}

function blockerPrereqIndex(taskIndex: number): number | undefined {
  return TASK_BLOCKER[taskIndex]
}

type TaskNavStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'skipped'
  | 'blocked'
  | 'waiting_on_others'
  | 'needs_review'

function resolveTaskNavStatus(
  taskIndex: number,
  stepIndex: number,
  outcomes: readonly StoredTaskOutcome[],
): TaskNavStatus {
  if (isTaskBlocked(taskIndex, outcomes)) return 'blocked'
  const o = outcomes[taskIndex]
  if (o === 'complete') return 'complete'
  if (o === 'skipped') return 'skipped'
  if (o === 'waiting_on_others') return 'waiting_on_others'
  if (o === 'needs_review') return 'needs_review'
  if (taskIndex === stepIndex) return 'in_progress'
  return 'not_started'
}

function stepRequiredIndices(step: WizardStepDef): number[] {
  return step.taskIndices.filter(isTaskRequired)
}

/** Required tasks only: complete counts toward step/setup progress; skipped does not. */
function stepRequiredProgress(
  step: WizardStepDef,
  outcomes: readonly StoredTaskOutcome[],
): { complete: number; total: number } {
  const req = stepRequiredIndices(step)
  const complete = req.filter((i) => outcomes[i] === 'complete').length
  return { complete, total: req.length }
}

/** All required tasks in the wizard (optional indices excluded). */
function globalRequiredProgress(outcomes: readonly StoredTaskOutcome[]): { complete: number; total: number } {
  let complete = 0
  let total = 0
  for (let i = 0; i < TASK_COUNT; i++) {
    if (!isTaskRequired(i)) continue
    total++
    if (outcomes[i] === 'complete') complete++
  }
  return { complete, total }
}

/** Optional tasks only — separate from required bar. */
function globalOptionalProgress(outcomes: readonly StoredTaskOutcome[]): { complete: number; total: number } {
  let complete = 0
  let total = 0
  for (let i = 0; i < TASK_COUNT; i++) {
    if (!OPTIONAL_TASK_IDS.has(i)) continue
    total++
    if (outcomes[i] === 'complete') complete++
  }
  return { complete, total }
}

function defaultTaskOutcomes(): StoredTaskOutcome[] {
  return Array.from({ length: TASK_COUNT }, () => 'pending')
}

/** Employer-wide timing defaults; most plans inherit unless overridden per plan. */
type DefaultBenefitDatesState = {
  planYearStart: string
  planYearEnd: string
  openEnrollment: string
  firstDeduction: string
}

/** Per selected product: inherit defaults or supply plan-specific dates / notes. */
type PlanBenefitDateSettings = {
  useDefaultDates: boolean
  overrideStart: string
  overrideEnd: string
  overrideTimingNote: string
}

const DEFAULT_BENEFIT_DATES: DefaultBenefitDatesState = {
  planYearStart: 'January 1, 2026',
  planYearEnd: 'December 31, 2026',
  openEnrollment: 'November 1 – November 30, 2025',
  firstDeduction: 'January 15, 2026',
}

function defaultPlanDateEntry(): PlanBenefitDateSettings {
  return {
    useDefaultDates: true,
    overrideStart: 'January 1, 2026',
    overrideEnd: 'December 31, 2026',
    overrideTimingNote: '',
  }
}

function mergePlanDateSettings(
  selectedProductIds: readonly string[],
  existing: Record<string, PlanBenefitDateSettings> | undefined,
): Record<string, PlanBenefitDateSettings> {
  const out: Record<string, PlanBenefitDateSettings> = {}
  for (const id of selectedProductIds) {
    const prev = existing?.[id]
    out[id] = prev
      ? {
          useDefaultDates: typeof prev.useDefaultDates === 'boolean' ? prev.useDefaultDates : true,
          overrideStart: typeof prev.overrideStart === 'string' ? prev.overrideStart : defaultPlanDateEntry().overrideStart,
          overrideEnd: typeof prev.overrideEnd === 'string' ? prev.overrideEnd : defaultPlanDateEntry().overrideEnd,
          overrideTimingNote: typeof prev.overrideTimingNote === 'string' ? prev.overrideTimingNote : '',
        }
      : defaultPlanDateEntry()
  }
  return out
}

function normalizeDefaultBenefitDates(raw: unknown): DefaultBenefitDatesState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BENEFIT_DATES }
  const o = raw as Record<string, unknown>
  return {
    planYearStart: typeof o.planYearStart === 'string' ? o.planYearStart : DEFAULT_BENEFIT_DATES.planYearStart,
    planYearEnd: typeof o.planYearEnd === 'string' ? o.planYearEnd : DEFAULT_BENEFIT_DATES.planYearEnd,
    openEnrollment: typeof o.openEnrollment === 'string' ? o.openEnrollment : DEFAULT_BENEFIT_DATES.openEnrollment,
    firstDeduction: typeof o.firstDeduction === 'string' ? o.firstDeduction : DEFAULT_BENEFIT_DATES.firstDeduction,
  }
}

type Draft = {
  stepIndex: number
  taskOutcomes: StoredTaskOutcome[]
  selectedProducts: string[]
  eligibilityNotes: string
  mappingStep: number
  /** Payroll/HRIS link initiated from Employee setup → data source (optional path). */
  linkedPayrollFromEmployeeSetup: boolean
  /** Benefit/provider link initiated from Configure plans (optional path). */
  linkedBenefitFeedsFromBenefits: boolean
  /** Shared effective / plan-year style defaults for most benefits. */
  defaultBenefitDates: DefaultBenefitDatesState
  /** Per-product date behavior inside Configure plans. */
  planBenefitDateSettings: Record<string, PlanBenefitDateSettings>
}

const defaultDraft: Draft = {
  stepIndex: 0,
  taskOutcomes: defaultTaskOutcomes(),
  selectedProducts: ['medical', 'dental', 'hsa'],
  eligibilityNotes:
    'IF employment type is full-time AND hire date is more than 60 days ago THEN eligible for medical on the first of next month.\nIF average hours are under 30 THEN offer limited medical only.',
  mappingStep: 0,
  linkedPayrollFromEmployeeSetup: false,
  linkedBenefitFeedsFromBenefits: false,
  defaultBenefitDates: { ...DEFAULT_BENEFIT_DATES },
  planBenefitDateSettings: mergePlanDateSettings(['medical', 'dental', 'hsa'], undefined),
}

function normalizeDraft(parsed: Partial<Draft> & { stepIndex?: number }): Draft {
  const merged: Draft = { ...defaultDraft, ...parsed }
  if (!merged.taskOutcomes || merged.taskOutcomes.length !== TASK_COUNT) {
    merged.taskOutcomes = defaultTaskOutcomes()
  }
  merged.stepIndex = Math.min(Math.max(0, merged.stepIndex), TASK_COUNT - 1)
  if (typeof merged.linkedPayrollFromEmployeeSetup !== 'boolean') merged.linkedPayrollFromEmployeeSetup = false
  if (typeof merged.linkedBenefitFeedsFromBenefits !== 'boolean') merged.linkedBenefitFeedsFromBenefits = false
  merged.defaultBenefitDates = normalizeDefaultBenefitDates(merged.defaultBenefitDates)
  merged.planBenefitDateSettings = mergePlanDateSettings(
    merged.selectedProducts,
    merged.planBenefitDateSettings as Record<string, PlanBenefitDateSettings> | undefined,
  )
  return merged
}

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY)
    if (!raw) return { ...defaultDraft }
    return normalizeDraft(JSON.parse(raw) as Partial<Draft>)
  } catch {
    return { ...defaultDraft }
  }
}

function saveDraft(d: Draft) {
  localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(d))
  emitSetupChanged()
}

const TASK_STATUS_LABEL: Record<TaskNavStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
  skipped: 'Skipped',
  blocked: 'Needs earlier step',
  waiting_on_others: 'Waiting on others',
  needs_review: 'Needs review',
}

function TaskStatusGlyph({ status, taskNumber }: { status: TaskNavStatus; taskNumber: number }) {
  const shell = 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold tabular-nums'
  switch (status) {
    case 'complete':
      return (
        <span className={cn(shell, 'border-emerald-600/30 bg-emerald-600/90 text-white')} aria-hidden>
          <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      )
    case 'skipped':
      return (
        <span className={cn(shell, 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200')} aria-hidden>
          <Minus className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      )
    case 'needs_review':
      return (
        <span className={cn(shell, 'border-amber-600/45 bg-amber-500/10 text-amber-700 dark:text-amber-300')} aria-hidden>
          <AlertCircle className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      )
    case 'waiting_on_others':
      return (
        <span className={cn(shell, 'border-sky-600/35 bg-sky-500/10 text-sky-800 dark:text-sky-200')} aria-hidden>
          <Clock className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      )
    case 'blocked':
      return (
        <span className={cn(shell, 'border-muted-foreground/25 bg-muted/60 text-muted-foreground')} aria-hidden>
          <Lock className="h-2 w-2" strokeWidth={2.5} />
        </span>
      )
    case 'in_progress':
      return (
        <span className={cn(shell, 'border-primary bg-primary text-primary-foreground')} aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
        </span>
      )
    case 'not_started':
    default:
      return (
        <span className={cn(shell, 'border-muted-foreground/30 bg-background text-muted-foreground')} aria-hidden>
          {taskNumber}
        </span>
      )
  }
}

/** Progressive disclosure for progress rules—default is one line only. */
function SetupProgressHelpDisclosure({ id, className }: { id: string; className?: string }) {
  const legendRow = (glyph: ReactNode, text: string) => (
    <li className="flex gap-2">
      <span className="mt-0.5 shrink-0">{glyph}</span>
      <span className="min-w-0 text-[10px] leading-snug text-muted-foreground">{text}</span>
    </li>
  )

  return (
    <div className={cn('mb-2 space-y-2 pb-2', className)}>
      <p className="text-[11px] leading-snug text-muted-foreground">Only required tasks count toward progress.</p>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="setup-progress-help" className="border-0">
          <AccordionTrigger
            id={`${id}-trigger`}
            aria-controls={id}
            className="py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:no-underline [&>svg]:text-muted-foreground"
          >
            How progress works
          </AccordionTrigger>
          <AccordionContent className="pb-1 pt-0">
            <div
              id={id}
              role="region"
              aria-labelledby={`${id}-trigger`}
              aria-label="Progress rules: task states"
              className="border-l border-border pl-2.5 pt-0.5"
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Task states</p>
              <ul className="space-y-1.5">
                {legendRow(
                  <TaskStatusGlyph status="complete" taskNumber={1} />,
                  'Complete — counts toward required progress.',
                )}
                {legendRow(
                  <TaskStatusGlyph status="skipped" taskNumber={1} />,
                  'Skipped — visible, not counted as done.',
                )}
                {legendRow(
                  <TaskStatusGlyph status="needs_review" taskNumber={1} />,
                  'Needs review — resolve before it can complete.',
                )}
                {legendRow(
                  <TaskStatusGlyph status="waiting_on_others" taskNumber={1} />,
                  'Waiting on others — paused until external work clears.',
                )}
                {legendRow(
                  <TaskStatusGlyph status="blocked" taskNumber={1} />,
                  'Blocked — preview allowed; finish earlier tasks in the step to complete.',
                )}
                {legendRow(
                  <TaskStatusGlyph status="in_progress" taskNumber={1} />,
                  'In progress — current task.',
                )}
                {legendRow(
                  <TaskStatusGlyph status="not_started" taskNumber={3} />,
                  'Not started — number is order in this step.',
                )}
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Separator className="bg-border/60" />
    </div>
  )
}

/**
 * Step header ornaments: derived only from required-task stored outcomes + blockers.
 * Optional tasks never satisfy “required complete”; optional-only steps never show required-success.
 */
function wizardStepRequiredIndicators(
  step: WizardStepDef,
  outcomes: readonly StoredTaskOutcome[],
  currentTaskIndex: number,
): {
  /** Emerald check: every required task is `complete`, none skipped / waiting / needs review. */
  showRequiredSuccess: boolean
  /** Amber: any required task skipped, waiting on others, or needs review. */
  showRequiredAttention: boolean
  /** Dot: some but not all required tasks complete; no attention flags above. */
  showRequiredInProgress: boolean
  /** Subtle focus: this step contains the task currently open in the main column. */
  showActiveStepRing: boolean
  /** Cursor is past this step’s last task (orientation only; does not imply completion). */
  isPastStep: boolean
} {
  const requiredIdx = step.taskIndices.filter(isTaskRequired)
  const hasRequired = requiredIdx.length > 0
  const reqTotal = requiredIdx.length
  const reqComplete = requiredIdx.filter((i) => outcomes[i] === 'complete').length
  const reqSkipped = requiredIdx.some((i) => outcomes[i] === 'skipped')
  const reqWaiting = requiredIdx.some((i) => outcomes[i] === 'waiting_on_others')
  const reqReview = requiredIdx.some((i) => outcomes[i] === 'needs_review')

  const requiredSuccess =
    hasRequired &&
    reqComplete === reqTotal &&
    !reqSkipped &&
    !reqWaiting &&
    !reqReview

  const requiredAttention = hasRequired && (reqSkipped || reqWaiting || reqReview)

  const requiredInProgress =
    hasRequired &&
    !requiredSuccess &&
    !requiredAttention &&
    reqComplete > 0 &&
    reqComplete < reqTotal

  const last = step.taskIndices[step.taskIndices.length - 1]!
  const containsCurrent = step.taskIndices.includes(currentTaskIndex)
  const isPastStep = currentTaskIndex > last
  const showActiveStepRing = containsCurrent && !isPastStep

  return {
    showRequiredSuccess: requiredSuccess,
    showRequiredAttention: requiredAttention,
    showRequiredInProgress: requiredInProgress,
    showActiveStepRing,
    isPastStep,
  }
}

function stepHasWaitingOnOthers(step: WizardStepDef, outcomes: readonly StoredTaskOutcome[]): boolean {
  return step.taskIndices.some((i) => outcomes[i] === 'waiting_on_others')
}

/** Tasks you can open and finish right now (not blocked, not already marked done). */
function availableOpenTasks(outcomes: readonly StoredTaskOutcome[]): { index: number; label: string }[] {
  return TASK_LABELS.map((label, i) => ({ label, i }))
    .filter(({ i }) => !isTaskBlocked(i, outcomes) && outcomes[i] !== 'complete')
    .map(({ label, i }) => ({ index: i, label }))
}

function unlockGuidanceForPrereq(prereqIndex: number, outcomes: readonly StoredTaskOutcome[]): string {
  const name = TASK_LABELS[prereqIndex]
  const o = outcomes[prereqIndex]
  if (o === 'skipped') {
    return `This task opens after ${name} is finished. You skipped it earlier—open ${name} and work through it, or mark it done when you’re ready.`
  }
  if (o === 'waiting_on_others') {
    return `We’re holding this step until ${name} is no longer waiting on someone outside your team—or you clear that waiting note.`
  }
  if (o === 'needs_review') {
    return `Finish the review on ${name}, then come back here.`
  }
  return `Work through ${name} and tap Next when you’re done. Skipped steps don’t unlock what comes after.`
}

export default function SetupWizardPage() {
  const [draft, setDraft] = useState<Draft>(() => loadDraft())
  const [mappingOpen, setMappingOpen] = useState(false)
  const [selectedStepIndex, setSelectedStepIndex] = useState(() => stepGroupIndexForTask(loadDraft().stepIndex))

  useEffect(() => {
    saveDraft(draft)
  }, [draft])

  const stepIndex = draft.stepIndex
  const totalTasks = TASK_LABELS.length
  const stepMeta = taskOrdinalInStepGroup(stepIndex)
  const taskOutcomes = draft.taskOutcomes
  const overallRequired = useMemo(() => globalRequiredProgress(taskOutcomes), [taskOutcomes])
  const overallOptional = useMemo(() => globalOptionalProgress(taskOutcomes), [taskOutcomes])
  useEffect(() => {
    setSelectedStepIndex(stepGroupIndexForTask(stepIndex))
  }, [stepIndex])

  const goBack = useCallback(() => {
    setDraft((d) => ({ ...d, stepIndex: Math.max(0, d.stepIndex - 1) }))
  }, [])

  const completeCurrentAndAdvance = useCallback(() => {
    setDraft((d) => {
      const i = d.stepIndex
      if (isTaskBlocked(i, d.taskOutcomes)) return d
      const nextOutcomes = [...d.taskOutcomes]
      if (nextOutcomes[i] !== 'complete') {
        nextOutcomes[i] = 'complete'
      }
      const next = Math.min(i + 1, totalTasks - 1)
      return { ...d, taskOutcomes: nextOutcomes, stepIndex: next }
    })
  }, [totalTasks])

  const skipCurrentAndAdvance = useCallback(() => {
    setDraft((d) => {
      const i = d.stepIndex
      const nextOutcomes = [...d.taskOutcomes]
      if (nextOutcomes[i] !== 'complete') {
        nextOutcomes[i] = 'skipped'
      }
      const next = Math.min(i + 1, totalTasks - 1)
      return { ...d, taskOutcomes: nextOutcomes, stepIndex: next }
    })
  }, [totalTasks])

  const goToTask = useCallback((taskIdx: number) => {
    setDraft((d) => ({ ...d, stepIndex: taskIdx }))
  }, [])

  const availableNowTasks = useMemo(() => availableOpenTasks(taskOutcomes), [taskOutcomes])

  const toggleProduct = (id: string) => {
    setDraft((d) => {
      const set = new Set(d.selectedProducts)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      const selected = [...set]
      return {
        ...d,
        selectedProducts: selected,
        planBenefitDateSettings: mergePlanDateSettings(selected, d.planBenefitDateSettings),
      }
    })
  }

  const launch = () => {
    writeEmployerSetup({
      onboardingComplete: true,
      planReady: true,
      launchComplete: true,
    })
    setDraft((d) => ({
      ...d,
      stepIndex: totalTasks - 1,
      taskOutcomes: d.taskOutcomes.map(() => 'complete'),
    }))
  }

  const currentBlocked = isTaskBlocked(stepIndex, taskOutcomes)
  const prereqForCurrent = blockerPrereqIndex(stepIndex)

  const mappingSteps = useMemo(
    () => ['Connect to ADP', 'Authorize WEX secure handshake', 'Preview field mapping', 'Activate sync'],
    [],
  )

  const payrollHrisConnectors = useMemo(
    () => CONNECTORS.filter((c) => /payroll|hris/i.test(c.category)),
    [],
  )
  const carrierFeedConnectors = useMemo(
    () => CONNECTORS.filter((c) => /carrier|eligibility/i.test(c.category) || /eligibility/i.test(c.name)),
    [],
  )

  const benefitPlansForConfig = useMemo(() => {
    const nameById: Record<string, string> = {
      medical: 'Summit PPO Gold',
      dental: 'Bright Smile PPO',
      vision: 'Clear View Select',
      hsa: 'HSA election (CDH)',
      lpfsa: 'Limited purpose FSA',
      commuter: 'Commuter pre-tax',
      voluntary: 'Voluntary supplemental bundle',
    }
    return draft.selectedProducts
      .map((pid) => {
        const opt = PRODUCT_OPTIONS.find((p) => p.id === pid)
        if (!opt) return null
        return {
          productId: pid,
          benefitType: opt.label,
          planName: nameById[pid] ?? `${opt.label} plan`,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [draft.selectedProducts])

  const [benefitsActivePlanIndex, setBenefitsActivePlanIndex] = useState(0)

  useEffect(() => {
    setBenefitsActivePlanIndex((i) => Math.min(i, Math.max(0, benefitPlansForConfig.length - 1)))
  }, [benefitPlansForConfig.length])

  const stepBody = (() => {
    const mappingSheet = (
      <Sheet open={mappingOpen} onOpenChange={setMappingOpen}>
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Mapping wizard (ADP)</SheetTitle>
          </SheetHeader>
          <ol className="space-y-2 text-sm">
            {mappingSteps.map((label, i) => (
              <li
                key={label}
                className={`rounded-md border px-3 py-2 ${
                  i === draft.mappingStep ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                {i + 1}. {label}
              </li>
            ))}
          </ol>
          <div className="mt-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  mappingStep: Math.max(0, d.mappingStep - 1),
                }))
              }
            >
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                setDraft((d) => {
                  const next = Math.min(mappingSteps.length - 1, d.mappingStep + 1)
                  return { ...d, mappingStep: next }
                })
              }}
            >
              Next
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )

    const waitingOnMappingsToggle = (
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground">Waiting on a vendor or file feed?</span>
        {draft.taskOutcomes[CONNECT_STATUS_REVIEW_TASK_INDEX] === 'waiting_on_others' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              setDraft((d) => {
                const next = [...d.taskOutcomes]
                next[CONNECT_STATUS_REVIEW_TASK_INDEX] = 'pending'
                return { ...d, taskOutcomes: next }
              })
            }
          >
            Clear waiting — I can continue
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              setDraft((d) => {
                const next = [...d.taskOutcomes]
                next[CONNECT_STATUS_REVIEW_TASK_INDEX] = 'waiting_on_others'
                return { ...d, taskOutcomes: next }
              })
            }
          >
            Mark as waiting on others
          </Button>
        )}
      </div>
    )

    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pulled automatically from your broker file and IRS records. You can correct details with one support ticket
              if anything looks off.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatLabel
                label="Company name"
                readOnly
                className="bg-muted/50"
                value={EMPLOYER.name}
              />
              <FloatLabel label="Federal Tax ID (EIN)" readOnly className="bg-muted/50" value={EMPLOYER.ein} />
              <FloatLabel
                label="Payroll frequency"
                readOnly
                className="bg-muted/50"
                value={EMPLOYER.payrollFrequency}
              />
              <FloatLabel
                label="Total employees"
                readOnly
                className="bg-muted/50"
                value={String(EMPLOYER.employeeCount)}
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Employer users administer benefits in WEX—separate from employees who only enroll. Pair each person with a
              role so permissions stay auditable.
            </p>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Users & invites</CardTitle>
                <CardDescription>HR, finance, and broker partners who need secure access.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" variant="outline">
                  Download user template
                </Button>
                <Button type="button">Send invites</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Roles & permissions</CardTitle>
                <CardDescription>Who can change plans, approve enrollments, view billing, and manage integrations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Typical owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Benefits administrator</TableCell>
                      <TableCell>Full product setup</TableCell>
                      <TableCell>HR lead</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Payroll liaison</TableCell>
                      <TableCell>Deductions & census</TableCell>
                      <TableCell>Payroll manager</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Read-only auditor</TableCell>
                      <TableCell>Reports</TableCell>
                      <TableCell>Finance</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm">
                  Add new person
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SSO / directory</CardTitle>
                <CardDescription>Optional—connect an IdP later without blocking your first pass.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" size="sm">
                  View connection options
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Add employees with payroll, CSV, or manual entry—any path is valid. Connecting ADP / Workday here carries
              forward to Connect Systems so you are not asked to start over.
            </p>
            <div className="grid gap-3 sm:grid-cols-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Connect ADP / Workday</CardTitle>
                  <CardDescription>Bi-directional payroll / HRIS—recommended when you have a supported vendor.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMappingOpen(true)
                      setDraft((d) => ({ ...d, linkedPayrollFromEmployeeSetup: true }))
                    }}
                  >
                    Start connection
                  </Button>
                  {draft.linkedPayrollFromEmployeeSetup ? (
                    <Badge intent="default" className="text-[11px] font-normal">
                      Linked from this task
                    </Badge>
                  ) : null}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Upload CSV</CardTitle>
                  <CardDescription>Bulk import with name, hire date, job title, and work email.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline">
                    Download template
                  </Button>
                  <Button type="button">Upload CSV</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Enter manually</CardTitle>
                  <CardDescription>For one-off hires or corrections before your HRIS sync is live.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline">
                    Open quick add employee
                  </Button>
                </CardContent>
              </Card>
            </div>
            {mappingSheet}
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Classes and divisions drive eligibility, contributions, and reporting—keep them aligned with payroll and
              carrier contracts.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Full-time</TableCell>
                  <TableCell>Eligibility class</TableCell>
                  <TableCell>30+ hrs / week</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Northeast region</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Reporting only</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm">
              Add group or division
            </Button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Waiting periods control when coverage starts after hire or life events—keep them consistent with SPD and
              carrier contracts.
            </p>
            <div className="flex flex-wrap gap-2">
              {['First of month after DOH', '60-day benefits wait', '90-day probation', 'Rehire rules'].map((label) => (
                <Badge key={label} intent="default" className="cursor-default">
                  {label}
                </Badge>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm">
              Open waiting-period editor
            </Button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select every benefit category you offer. Each selection becomes a plan you configure in{' '}
              <strong className="font-medium text-foreground">Configure plans</strong>—you can add more categories later.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRODUCT_OPTIONS.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={draft.selectedProducts.includes(p.id)}
                    onCheckedChange={() => toggleProduct(p.id)}
                  />
                  <span className="text-sm font-medium">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set timing defaults most plans will share—medical, dental, vision, and similar lines typically follow the same
              plan year and enrollment window. In <strong className="font-medium text-foreground">Configure plans</strong>,
              you can opt out per plan (for example, an FSA on a calendar year while medical follows your fiscal plan year)
              without retyping dates everywhere.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatLabel
                label="Default coverage / plan year start"
                className="bg-background"
                value={draft.defaultBenefitDates.planYearStart}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    defaultBenefitDates: { ...d.defaultBenefitDates, planYearStart: e.target.value },
                  }))
                }
              />
              <FloatLabel
                label="Default coverage / plan year end"
                className="bg-background"
                value={draft.defaultBenefitDates.planYearEnd}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    defaultBenefitDates: { ...d.defaultBenefitDates, planYearEnd: e.target.value },
                  }))
                }
              />
              <FloatLabel
                label="Default open enrollment window"
                className="bg-background sm:col-span-2"
                value={draft.defaultBenefitDates.openEnrollment}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    defaultBenefitDates: { ...d.defaultBenefitDates, openEnrollment: e.target.value },
                  }))
                }
              />
              <FloatLabel
                label="Default first deduction date"
                className="bg-background sm:col-span-2"
                value={draft.defaultBenefitDates.firstDeduction}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    defaultBenefitDates: { ...d.defaultBenefitDates, firstDeduction: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        )
      case 7: {
        if (benefitPlansForConfig.length === 0) {
          return (
            <div className="space-y-4 rounded-lg border border-dashed border-border bg-muted/15 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No benefit categories selected yet. Choose at least one in{' '}
                <strong className="font-medium text-foreground">Choose benefits to offer</strong>, then return here.
              </p>
              <Button type="button" variant="outline" onClick={() => goToTask(5)}>
                Go to choose benefits
              </Button>
            </div>
          )
        }
        const plan = benefitPlansForConfig[benefitsActivePlanIndex]!
        const carrierLabel =
          plan.productId === 'medical'
            ? 'UHC'
            : plan.productId === 'dental'
              ? 'Guardian'
              : plan.productId === 'vision'
                ? 'VSP'
                : plan.productId === 'hsa' || plan.productId === 'lpfsa'
                  ? 'WEX (CDH)'
                  : plan.productId === 'commuter'
                    ? 'Commuter vendor'
                    : 'Carrier TBD'
        const cobraName = `cobra-${plan.productId}`
        const planDates =
          draft.planBenefitDateSettings[plan.productId] ?? defaultPlanDateEntry()
        const def = draft.defaultBenefitDates
        return (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Configure one plan at a time. Dates follow your employer defaults unless you turn off “Use default benefit
              dates” for an exception (for example, calendar-year FSA vs plan-year medical).
            </p>
            <div
              className="flex flex-wrap gap-2 border-b border-border pb-3"
              role="tablist"
              aria-label="Plans to configure"
            >
              {benefitPlansForConfig.map((p, i) => (
                <button
                  key={p.productId}
                  type="button"
                  role="tab"
                  aria-selected={i === benefitsActivePlanIndex}
                  onClick={() => setBenefitsActivePlanIndex(i)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-left text-xs transition-colors',
                    i === benefitsActivePlanIndex
                      ? 'border-primary bg-primary/10 font-medium text-foreground'
                      : 'border-transparent bg-muted/35 text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {p.benefitType}
                  </span>
                  <span className="block">{p.planName}</span>
                </button>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">1 · Basic plan information</CardTitle>
                <CardDescription>
                  Benefit type, plan name, carrier, and whether this plan follows shared default dates or uses its own.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FloatLabel label="Benefit type" readOnly className="bg-muted/50" value={plan.benefitType} />
                  <FloatLabel label="Plan name" readOnly className="bg-muted/50" value={plan.planName} />
                  <FloatLabel label="Carrier / provider" readOnly className="bg-muted/50 sm:col-span-2" value={carrierLabel} />
                </div>

                <div className="rounded-lg border border-border bg-muted/15 px-3 py-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={planDates.useDefaultDates}
                      onCheckedChange={(checked) =>
                        setDraft((d) => ({
                          ...d,
                          planBenefitDateSettings: {
                            ...d.planBenefitDateSettings,
                            [plan.productId]: {
                              ...planDates,
                              useDefaultDates: checked === true,
                            },
                          },
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <span className="text-sm font-medium text-foreground">Use default benefit dates</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Inherit the employer defaults from <strong className="font-medium text-foreground">Set default benefit dates</strong>.
                        Turn off only when this plan needs different effective or plan-year timing.
                      </span>
                    </span>
                  </label>
                </div>

                {planDates.useDefaultDates ? (
                  <div
                    className="rounded-md border border-border/80 bg-muted/25 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground"
                    role="status"
                  >
                    <p className="font-medium text-foreground">Using employer defaults for this plan</p>
                    <p className="mt-1">
                      <span className="text-muted-foreground">Coverage period:</span>{' '}
                      <span className="text-foreground">{def.planYearStart}</span> –{' '}
                      <span className="text-foreground">{def.planYearEnd}</span>
                    </p>
                    <p className="mt-1">
                      <span className="text-muted-foreground">Open enrollment:</span>{' '}
                      <span className="text-foreground">{def.openEnrollment}</span>
                    </p>
                    <p className="mt-1">
                      <span className="text-muted-foreground">First deduction:</span>{' '}
                      <span className="text-foreground">{def.firstDeduction}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-md border border-amber-500/25 bg-amber-500/[0.06] px-3 py-3">
                    <p className="text-xs font-medium text-foreground">Plan-specific dates (override)</p>
                    <p className="text-[11px] text-muted-foreground">
                      Only this plan uses the values below; other plans can still follow defaults.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FloatLabel
                        label="Start date"
                        className="bg-background"
                        value={planDates.overrideStart}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            planBenefitDateSettings: {
                              ...d.planBenefitDateSettings,
                              [plan.productId]: { ...planDates, overrideStart: e.target.value },
                            },
                          }))
                        }
                      />
                      <FloatLabel
                        label="End date"
                        className="bg-background"
                        value={planDates.overrideEnd}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            planBenefitDateSettings: {
                              ...d.planBenefitDateSettings,
                              [plan.productId]: { ...planDates, overrideEnd: e.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor={`plan-timing-${plan.productId}`} className="mb-1 block text-[11px] font-medium text-muted-foreground">
                        Plan timing / exception notes (optional)
                      </label>
                      <textarea
                        id={`plan-timing-${plan.productId}`}
                        rows={2}
                        placeholder="e.g. Calendar-year FSA; OE Dec 1–15 only for this product"
                        value={planDates.overrideTimingNote}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            planBenefitDateSettings: {
                              ...d.planBenefitDateSettings,
                              [plan.productId]: { ...planDates, overrideTimingNote: e.target.value },
                            },
                          }))
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Feeds & handshakes (optional—ties to Connect Systems)</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(carrierFeedConnectors.length ? carrierFeedConnectors : CONNECTORS.slice(2, 4)).map((c) => (
                      <Button
                        key={c.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto justify-start py-2 text-left"
                        onClick={() => {
                          setMappingOpen(true)
                          setDraft((d) => ({ ...d, linkedBenefitFeedsFromBenefits: true }))
                        }}
                      >
                        <span className="block text-xs font-medium">{c.name}</span>
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {c.category} · {c.direction}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
                {draft.linkedBenefitFeedsFromBenefits ? (
                  <p className="text-xs text-muted-foreground">
                    Provider connection recorded for this demo—you can extend it under Connect Systems when ready.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">2 · Plan requirements</CardTitle>
                <CardDescription>Plan-specific rules, MEC / ACA posture, and funding where applicable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Network and tier rules documented for this plan
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked={plan.productId === 'medical'} />
                  MEC / ACA minimum value considered (medical-style products)
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox />
                  Affordability / safe harbor checks documented
                </label>
                <p className="text-xs font-medium text-foreground">Funding type</p>
                <div className="flex flex-wrap gap-2">
                  {(['Fully insured', 'Level-funded', 'Self-funded', 'Pre-tax only (CDH)'] as const).map((ft) => (
                    <Badge key={ft} intent="default" className="cursor-default font-normal">
                      {ft}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">3 · Coverage eligibility</CardTitle>
                <CardDescription>Who can enroll under this plan and dependent rules.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <fieldset>
                  <legend className="mb-2 text-xs font-medium text-muted-foreground">Coverage tiers offered</legend>
                  <div className="space-y-2 text-muted-foreground">
                    <label className="flex items-center gap-2">
                      <input type="radio" name={`tier-${plan.productId}`} defaultChecked className="accent-primary" />
                      Employee only
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name={`tier-${plan.productId}`} className="accent-primary" />
                      Employee + family (tiers: EE / EE+children / family)
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name={`tier-${plan.productId}`} className="accent-primary" />
                      Employee + one dependent level only
                    </label>
                  </div>
                </fieldset>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Dependent options</p>
                  <div className="flex flex-wrap gap-2">
                    {['Children to age 26', 'Disabled dependents', 'Domestic partners'].map((label) => (
                      <Badge key={label} intent="default" className="cursor-default font-normal">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Eligibility notes (SPD-aligned)</p>
                  <textarea
                    rows={4}
                    value={draft.eligibilityNotes}
                    onChange={(e) => setDraft((d) => ({ ...d, eligibilityNotes: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">4 · COBRA eligibility</CardTitle>
                <CardDescription>How this plan treats continuation coverage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input type="radio" name={cobraName} className="accent-primary" />
                  Not COBRA eligible
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={cobraName}
                    defaultChecked={['medical', 'dental', 'vision'].includes(plan.productId)}
                    className="accent-primary"
                  />
                  COBRA eligible — standard 102% rate
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name={cobraName} className="accent-primary" />
                  COBRA eligible — custom rates (administrative + tier overrides)
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">5 · Plan costs & contributions</CardTitle>
                <CardDescription>Model, employer / employee share, and group-specific logic.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['% of premium', 'Flat per tier', 'Defined contribution', 'EE-only (CDH)'].map((m) => (
                    <Badge key={m} intent="default" className="cursor-default font-normal">
                      {m}
                    </Badge>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee group</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>Employee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Full-time</TableCell>
                      <TableCell>75% core tier</TableCell>
                      <TableCell>25% + dependents</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Part-time (25+ hrs)</TableCell>
                      <TableCell>Buy-up schedule B</TableCell>
                      <TableCell>Remainder</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    writeEmployerSetup({ planReady: true })
                    setDraft((d) => {
                      const next = [...d.taskOutcomes]
                      next[7] = 'needs_review'
                      return { ...d, taskOutcomes: next }
                    })
                  }}
                >
                  Mark contribution setup ready for review (demo)
                </Button>
              </CardContent>
            </Card>
            {mappingSheet}
          </div>
        )
      }
      case 8:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">Optional.</strong> Marketplace is for third-party add-ons
              (pet, legal, identity, and similar)—not core medical or dental. Skip if you do not offer these products.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { t: 'Pet insurance', d: 'Voluntary, per-vendor feeds' },
                { t: 'Legal / ID shield', d: 'Partner enrollment only' },
                { t: 'Supplemental life', d: 'Carrier file or API' },
              ].map((x) => (
                <Card key={x.t}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{x.t}</CardTitle>
                    <CardDescription>{x.d}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button type="button" variant="outline" size="sm">
                      Configure (optional)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      case 9:
        return (
          <div className="space-y-4">
            {draft.linkedPayrollFromEmployeeSetup ? (
              <div className="rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-3 py-2 text-sm text-foreground">
                <strong className="font-medium">Already in progress:</strong> you started payroll / HRIS from Employee
                setup. Use this task to extend mappings or confirm production cutover—no need to repeat the same setup.
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Optional deep-dive for payroll / HRIS. Connect here if you did not use ADP or Workday during Employee setup.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {(payrollHrisConnectors.length ? payrollHrisConnectors : CONNECTORS.slice(0, 2)).map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.name}</CardTitle>
                    <CardDescription>
                      {c.category} · {c.direction}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button type="button" variant="outline" size="sm" onClick={() => setMappingOpen(true)}>
                      {draft.linkedPayrollFromEmployeeSetup ? 'Review / extend' : 'Configure'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {mappingSheet}
          </div>
        )
      case 10:
        return (
          <div className="space-y-4">
            {draft.linkedBenefitFeedsFromBenefits ? (
              <div className="rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-3 py-2 text-sm text-foreground">
                <strong className="font-medium">Already in progress:</strong> you configured a benefit or carrier feed
                while configuring plans. Confirm or extend those connections here instead of starting from scratch.
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Optional—link healthcare and ancillary carriers or broker feeds if you did not connect them while configuring plans.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {(carrierFeedConnectors.length ? carrierFeedConnectors : CONNECTORS.slice(2, 4)).map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.name}</CardTitle>
                    <CardDescription>
                      {c.category} · {c.direction}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button type="button" variant="outline" size="sm" onClick={() => setMappingOpen(true)}>
                      {draft.linkedBenefitFeedsFromBenefits ? 'Review / extend' : 'Configure'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {mappingSheet}
          </div>
        )
      case 11:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Turn on file-based eligibility and census delivery where your vendors support EDI or WEX unified files.
            </p>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">WEX unified EDI</CardTitle>
                <CardDescription>Census & eligibility · Inbound / Outbound</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" size="sm" onClick={() => setMappingOpen(true)}>
                  Enable EDI lane
                </Button>
              </CardContent>
            </Card>
            {mappingSheet}
          </div>
        )
      case 12:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Schedule and test carrier eligibility files—timing should match payroll deductions and your plan effective
              dates.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(carrierFeedConnectors.length ? carrierFeedConnectors : CONNECTORS.slice(2, 4)).map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.name}</CardTitle>
                    <CardDescription>
                      {c.category} · {c.direction}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button type="button" variant="outline" size="sm" onClick={() => setMappingOpen(true)}>
                      Open feed settings
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {mappingSheet}
          </div>
        )
      case 13:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              One place to see what is live, what is still testing, and what you started earlier in the wizard.
            </p>
            <ul className="space-y-1.5 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
              <li>
                Employee system:{' '}
                <span className="font-medium">
                  {draft.linkedPayrollFromEmployeeSetup ? 'Linked from Employee setup' : 'Not linked from Employee setup'}
                </span>
              </li>
              <li>
                Benefit / provider feeds:{' '}
                <span className="font-medium">
                  {draft.linkedBenefitFeedsFromBenefits ? 'Touched while configuring plans' : 'Not configured in plan setup'}
                </span>
              </li>
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              {CONNECTORS.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.name}</CardTitle>
                    <CardDescription>
                      {c.category} · {c.direction}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button type="button" variant="outline" size="sm" onClick={() => setMappingOpen(true)}>
                      View status
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {waitingOnMappingsToggle}
            {mappingSheet}
          </div>
        )
      case 14:
        return (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Run eligibility rules and contribution math against test or sandbox data—catch gaps before production
              enrollment opens.
            </p>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Eligibility (test census)</CardTitle>
                <CardDescription>Re-run rules on sample lives; align language with your SPD.</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  rows={6}
                  value={draft.eligibilityNotes}
                  onChange={(e) => setDraft((d) => ({ ...d, eligibilityNotes: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contributions & deductions</CardTitle>
                <CardDescription>Compare expected EE / ER amounts by group against payroll test runs.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Expected EE</TableHead>
                      <TableHead>Expected ER</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Jordan Lee</TableCell>
                      <TableCell>Summit PPO — EE+children</TableCell>
                      <TableCell>$186.40</TableCell>
                      <TableCell>$412.10</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Priya Shah</TableCell>
                      <TableCell>Summit PPO — EE only</TableCell>
                      <TableCell>$102.00</TableCell>
                      <TableCell>$355.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sandbox checklist</CardTitle>
                <CardDescription>Light pass—production would tie to your tenant’s test environment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Test tenant reflects latest plan year and classes
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Deduction codes match payroll mapping
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox />
                  Carrier test file accepted (if applicable)
                </label>
              </CardContent>
            </Card>
          </div>
        )
      case 15:
        return (
          <>
            <div className="shrink-0 space-y-2 px-6 pb-3 pt-0">
              <p className="text-sm text-muted-foreground">
                <strong className="font-medium text-foreground">Optional.</strong> Preview what employees see—site-wide
                look, navigation, and key enrollment screens. Run this after you are comfortable with rules in sandbox. Use{' '}
                <strong className="font-medium text-foreground">Skip for now</strong> if design can wait; the studio stays
                available from your account menu.
              </p>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-border">
              <EmbeddedThemingStudio variant="embedded" />
            </div>
          </>
        )
      case 16:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">Optional.</strong> Spot-check a few migrated or imported
              rows before you invite the full population.
            </p>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employee data</CardTitle>
                <CardDescription>Census row, class, and dependents.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" variant="outline">
                  Open sample roster
                </Button>
                <Button type="button" variant="outline">
                  Upload test CSV
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Benefits data</CardTitle>
                <CardDescription>Plans, tiers, and effective dates for the same lives.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Medical tier matches HRIS class
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Dependents sync to carrier test file
                </label>
              </CardContent>
            </Card>
          </div>
        )
      case 17:
        return (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              One compact preflight—blockers, approvals, and readiness before you launch. This is not a full operations
              dashboard.
            </p>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Launch readiness</CardTitle>
                <CardDescription>Demo summary; production would pull live checklist and sign-off state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border bg-muted/25 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Blockers</p>
                    <p className="mt-1 font-medium text-foreground">1 open · 4 clear</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Approvals</p>
                    <p className="mt-1 font-medium text-foreground">HR ✓ · Finance ✓ · Broker pending</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Readiness</p>
                    <p className="mt-1 font-medium text-foreground">High — minor follow-ups</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Launch confidence</span>
                    <span className="font-medium text-foreground">88%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[88%] rounded-full bg-primary" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                  <Button type="button" size="lg" className="gap-2" onClick={launch}>
                    Launch employer portal
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/">Go to admin home</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  After launch, send a pilot invite and confirm login. Ongoing work lives in admin home, dashboard, and
                  settings.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return null
    }
  })()

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main
        className={cn(
          'mx-auto flex w-full max-w-none flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
          stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX && 'min-h-0',
        )}
      >
        <header className="mb-5 shrink-0 space-y-4 pb-0 lg:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Guided employer setup</h1>
              <p className="mt-1 truncate text-sm text-muted-foreground" title={`${stepMeta.step.title} · ${TASK_LABELS[stepIndex]}`}>
                <span className="text-foreground/90">{stepMeta.step.title}</span>
                <span className="text-muted-foreground"> · </span>
                {TASK_LABELS[stepIndex]}
              </p>
              <p className="mt-1.5 text-xs tabular-nums leading-snug text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  {overallRequired.complete}/{overallRequired.total}
                </span>{' '}
                required tasks complete
                {overallOptional.total > 0 ? (
                  <>
                    <span className="text-border"> · </span>
                    <span title="Optional tasks do not fill the required bar">
                      {overallOptional.complete}/{overallOptional.total} optional done
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <Badge
              intent="default"
              className="shrink-0 rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground"
            >
              {TASK_STATUS_LABEL[resolveTaskNavStatus(stepIndex, stepIndex, taskOutcomes)]}
            </Badge>
          </div>
          <Separator className="bg-border/60" />
        </header>

        <div
          className={cn(
            'flex flex-col gap-8 lg:flex-row lg:gap-10',
            stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX ? 'min-h-0 flex-1 lg:items-stretch' : 'lg:items-start',
          )}
        >
          <aside className="order-2 min-w-0 shrink-0 lg:order-1 lg:w-[18.5rem] xl:w-[20rem]">
            <nav aria-labelledby="setup-steps-heading" className="lg:sticky lg:top-24">
              <p
                id="setup-steps-heading"
                className="mb-1 text-sm font-semibold leading-snug tracking-tight text-foreground"
              >
                Setup steps
              </p>
              <SetupProgressHelpDisclosure id="setup-progress-help" />
              <ScrollArea className="mt-2 h-[min(52vh,30rem)] w-full lg:h-auto lg:max-h-none">
                <ol className="flex flex-col gap-1 pb-1 pr-3 lg:pb-0 lg:pr-0">
                {WIZARD_STEPS.map((wizardStep, stepIdx) => {
                  const stepInd = wizardStepRequiredIndicators(wizardStep, draft.taskOutcomes, stepIndex)
                  const stepRowSelected = selectedStepIndex === stepIdx
                  const reqProgress = stepRequiredProgress(wizardStep, draft.taskOutcomes)
                  const optionalIndices = wizardStep.taskIndices.filter((i) => !isTaskRequired(i))
                  const optionalComplete = optionalIndices.filter((i) => draft.taskOutcomes[i] === 'complete').length
                  const optionalTotal = optionalIndices.length
                  const waitingStep = stepHasWaitingOnOthers(wizardStep, draft.taskOutcomes)
                  const isConnectSystemsStep = wizardStep.title === 'Connect Systems'
                  const reqSummaryShort =
                    reqProgress.total > 0
                      ? `${reqProgress.complete}/${reqProgress.total} required`
                      : optionalTotal > 0
                        ? isConnectSystemsStep
                          ? `Optional step · ${optionalComplete}/${optionalTotal} done`
                          : `${optionalComplete}/${optionalTotal} optional done`
                        : 'All optional'
                  const StepNavIcon = WIZARD_STEP_NAV_ICONS[stepIdx] ?? Building2

                  return (
                    <li key={wizardStep.title} className="rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSelectedStepIndex(stepIdx)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-lg px-1 py-2.5 text-left transition-colors',
                          'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                        )}
                        aria-pressed={stepRowSelected}
                        aria-controls={stepRowSelected ? `setup-step-panel-${stepIdx}` : undefined}
                        aria-label={`${wizardStep.title}, ${reqProgress.total > 0 ? `${reqProgress.complete} of ${reqProgress.total} required complete` : isConnectSystemsStep ? 'optional step, no required tasks' : 'all tasks optional in this step'}`}
                        id={`setup-step-trigger-${stepIdx}`}
                      >
                        <span
                          className={cn(
                            'relative mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center text-muted-foreground',
                            stepInd.showActiveStepRing &&
                              'rounded-md ring-2 ring-primary/35 ring-offset-2 ring-offset-background',
                            stepInd.isPastStep && !stepRowSelected && 'opacity-80',
                          )}
                          aria-hidden
                        >
                          <StepNavIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          {stepInd.showRequiredSuccess ? (
                            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                              <Check className="h-2 w-2" strokeWidth={3} aria-hidden />
                            </span>
                          ) : stepInd.showRequiredAttention ? (
                            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                              <AlertCircle className="h-2 w-2" strokeWidth={3} aria-hidden />
                            </span>
                          ) : stepInd.showRequiredInProgress ? (
                            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary shadow-sm ring-2 ring-background" aria-hidden />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1 pt-0.5">
                          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                            <span className="min-w-0 max-w-full break-words text-sm font-semibold leading-snug text-foreground">
                              {wizardStep.title}
                            </span>
                            {isConnectSystemsStep ? (
                              <Badge
                                intent="outline"
                                className="h-5 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide"
                                title="Nothing in this step is required for setup progress"
                              >
                                Optional
                              </Badge>
                            ) : null}
                            {waitingStep ? (
                              <Badge
                                intent="default"
                                className="h-5 gap-0.5 bg-sky-500/15 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100"
                                title="A task in this step is waiting on an external party"
                              >
                                <Clock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                                Waiting
                              </Badge>
                            ) : null}
                          </span>
                          {!stepRowSelected ? (
                            <span className="mt-0.5 block break-words text-xs tabular-nums leading-snug text-muted-foreground">
                              {reqSummaryShort}
                            </span>
                          ) : (
                            <span className="mt-0.5 block break-words text-xs leading-snug text-muted-foreground">
                              {wizardStep.navHint}
                            </span>
                          )}
                        </span>
                      </button>

                      {stepRowSelected ? (
                        <div
                          className="pb-2 pl-1 pt-0.5"
                          id={`setup-step-panel-${stepIdx}`}
                          role="region"
                          aria-labelledby={`setup-step-trigger-${stepIdx}`}
                        >
                          <ol className="space-y-0.5 pl-7">
                            {wizardStep.taskIndices.map((taskIdx, taskOrd) => {
                              const navStatus = resolveTaskNavStatus(taskIdx, stepIndex, draft.taskOutcomes)
                              const current = taskIdx === stepIndex
                              const label = TASK_LABELS[taskIdx]
                              const blocked = navStatus === 'blocked'
                              const showOptionalTaskBadge =
                                OPTIONAL_TASK_IDS.has(taskIdx) && !CONNECT_SYSTEMS_TASK_IDS.has(taskIdx)
                              return (
                                <li key={label}>
                                  <button
                                    type="button"
                                    onClick={() => goToTask(taskIdx)}
                                    className={cn(
                                      'flex w-full min-w-0 items-start gap-2 rounded-r-md py-2 pl-2.5 pr-2 text-left text-sm leading-snug transition-colors',
                                      current &&
                                        !blocked &&
                                        'border-l-[3px] border-primary bg-primary/10 font-medium text-primary',
                                      current &&
                                        blocked &&
                                        'border-l-[3px] border-amber-500 bg-amber-500/10 font-medium text-foreground',
                                      !current && 'border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                    )}
                                    aria-current={current ? 'step' : undefined}
                                    aria-label={`${label}, ${showOptionalTaskBadge ? 'Optional. ' : CONNECT_SYSTEMS_TASK_IDS.has(taskIdx) ? 'Part of optional Connect Systems step. ' : ''}${TASK_STATUS_LABEL[navStatus]}${blocked ? '. You can open this to preview; finish earlier steps to complete it.' : ''}`}
                                  >
                                    <span className="shrink-0 self-start pt-px">
                                      <TaskStatusGlyph status={navStatus} taskNumber={taskOrd + 1} />
                                    </span>
                                    <span
                                      className={cn(
                                        'min-w-0 flex-1 break-words',
                                        current && !blocked && 'text-primary',
                                        navStatus === 'skipped' && 'text-amber-900 line-through decoration-amber-700/50 dark:text-amber-200',
                                        navStatus === 'waiting_on_others' && 'text-sky-900 dark:text-sky-100',
                                        navStatus === 'needs_review' && 'text-amber-800 dark:text-amber-200',
                                      )}
                                    >
                                      {label}
                                    </span>
                                    {showOptionalTaskBadge ? (
                                      <Badge
                                        intent="outline"
                                        className="h-5 shrink-0 px-1.5 py-0 text-[8px] font-semibold uppercase tracking-wide"
                                        title={
                                          taskIdx === 8
                                            ? 'Marketplace — optional third-party add-ons'
                                            : taskIdx === 15
                                              ? 'Employee experience preview — optional; run after verify when you want'
                                              : 'Optional — does not count toward required setup progress'
                                        }
                                      >
                                        Optional
                                      </Badge>
                                    ) : null}
                                    {navStatus === 'waiting_on_others' ? (
                                      <Clock className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
                                    ) : null}
                                  </button>
                                </li>
                              )
                            })}
                          </ol>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
                </ol>
              </ScrollArea>
            </nav>
          </aside>

          <div
            className={cn(
              'order-1 min-w-0 flex-1 space-y-5',
              stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX && 'flex min-h-0 flex-col',
            )}
          >
            <Card className={cn('shadow-sm', stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX && 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
              <CardHeader className={cn('px-6 pb-3', stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX && 'shrink-0')}>
                <CardTitle className="text-xl">{TASK_LABELS[stepIndex]}</CardTitle>
                <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{stepMeta.step.description}</p>
                <CardDescription className="mt-2 text-xs text-muted-foreground">
                  {OPTIONAL_TASK_IDS.has(stepIndex) && !CONNECT_SYSTEMS_TASK_IDS.has(stepIndex)
                    ? 'Optional — not counted toward required progress.'
                    : 'Progress saves automatically in this browser.'}
                </CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX ? 'flex min-h-0 flex-1 flex-col space-y-0 p-0' : 'space-y-6',
                )}
              >
                {currentBlocked && prereqForCurrent !== undefined ? (
                  <Alert intent="info" role="status" className="mb-4 flex flex-col gap-3 text-sm">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Available for you now
                      </p>
                      {availableNowTasks.length > 0 ? (
                        <ul className="mt-1.5 list-inside list-disc text-[13px] leading-relaxed text-foreground">
                          {availableNowTasks.slice(0, 5).map(({ index, label }) => (
                            <li key={index}>
                              <button
                                type="button"
                                className="text-left underline decoration-muted-foreground/50 underline-offset-2 hover:text-primary"
                                onClick={() => goToTask(index)}
                              >
                                {label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1.5 text-[13px] text-muted-foreground">
                          Use the steps on the left to revisit a completed task, or use the button below to open what’s
                          blocking you.
                        </p>
                      )}
                      {availableNowTasks.length > 5 ? (
                        <p className="mt-1 text-xs text-muted-foreground">+ more in the task list</p>
                      ) : null}
                    </div>
                    <Separator className="bg-border/60" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        This screen
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-foreground">
                        You can look around, but you won’t be able to move forward here until an earlier piece is wrapped
                        up.
                      </p>
                    </div>
                    <Separator className="bg-border/60" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        What unlocks this task
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {unlockGuidanceForPrereq(prereqForCurrent, taskOutcomes)}
                      </p>
                      <Button type="button" size="sm" className="mt-2" onClick={() => goToTask(prereqForCurrent)}>
                        Go to {TASK_LABELS[prereqForCurrent]}
                      </Button>
                    </div>
                  </Alert>
                ) : null}
                <div
                  className={cn(
                    currentBlocked && stepIndex !== PREVIEW_EMPLOYEE_TASK_INDEX && 'pointer-events-none select-none opacity-[0.55]',
                  )}
                >
                  {stepBody}
                </div>
              </CardContent>
            </Card>

            <div
              className={cn(
                'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX && 'shrink-0',
              )}
            >
              <div className="flex flex-wrap gap-2">
                {stepIndex > 0 ? (
                  <Button type="button" variant="outline" onClick={goBack} className="gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : null}
              </div>
              {stepIndex < totalTasks - 1 ? (
                <div className="flex flex-wrap gap-2">
                  {!currentBlocked ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-1 text-muted-foreground"
                        onClick={skipCurrentAndAdvance}
                      >
                        <SkipForward className="h-4 w-4" />
                        Skip for now
                      </Button>
                      <Button type="button" variant="outline" className="gap-1" onClick={completeCurrentAndAdvance}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  ) : prereqForCurrent !== undefined ? (
                    <Button type="button" className="gap-1" onClick={() => goToTask(prereqForCurrent)}>
                      Go to {TASK_LABELS[prereqForCurrent]}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <AdminFooter />
    </div>
  )
}
