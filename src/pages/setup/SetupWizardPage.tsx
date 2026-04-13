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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  Link2,
  Lock,
  Minus,
  Pencil,
  Plus,
  Rocket,
  SkipForward,
  Trash2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import {
  CONNECTORS,
  EMPLOYER,
  EMPLOYER_BUSINESS_STRUCTURE_OPTIONS,
  EMPLOYEE_GROUPS_CENSUS_DEFAULT,
  EMPLOYER_ROLES_DEFAULT_USERS,
  EMPLOYER_ROLES_USER_RIGHTS_OPTIONS,
  LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  LIFE_EVENT_DEFAULT_RETRO_DAYS,
  LIFE_EVENTS_DEFAULT_ROWS,
  DEFAULT_SELECTED_BENEFIT_PRODUCT_IDS,
  PRODUCT_OPTIONS,
  type EmployeeGroupClassRow,
  type EmployerRolesUserRow,
  type LifeEventRuleRow,
} from '@/data/adminMockData'
import {
  emitSetupChanged,
  GUIDED_SETUP_WIZARD_DRAFT_KEY,
  writeEmployerSetup,
} from '@/hooks/useEmployerSetup'

/** Linear task order (14 tasks). */
const TASK_LABELS = [
  'Company basics',
  'Roles and Permissions',
  'Add employees',
  'Define employee groups / divisions / classes',
  'Waiting periods & life events',
  'Choose benefits to offer',
  'Set default benefit dates',
  'Configure plans',
  'Marketplace',
  'Connect systems',
  'Verify rules and calculations in a safe environment',
  'Preview employee experience',
  'Spot-check migrated/imported data',
  'Review launch status',
] as const

/** Product ids that use consumer-directed / pre-tax admin (Configure plans carrier hint). */
const CDH_PRODUCT_IDS = new Set(['hsa', 'fsa', 'lpfsa', 'dcfsa'])

/** Bump when default “Choose benefits” selection changes so stored drafts can migrate. */
const BENEFITS_DEFAULTS_VERSION = 2

/** Older guided-setup default before expanded catalog + six default checks. */
const LEGACY_DEFAULT_BENEFIT_PRODUCT_IDS = new Set(['medical', 'dental', 'hsa'])

/** Full-bleed embedded theming / preview surface. */
const PREVIEW_EMPLOYEE_TASK_INDEX = 11

/** Single Connect systems task — waiting-on-others for vendor / feed work. */
const CONNECT_SYSTEMS_TASK_INDEX = 9

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
    description: 'Legal entity details and employer admin roles—who can change plans, billing, and integrations.',
    navHint: 'Company profile, then roles & permissions for admins.',
    taskIndices: [0, 1],
  },
  {
    title: 'Employee setup',
    description:
      'Add employees with payroll, CSV, or manual entry—any path is valid. Connecting payroll here carries forward to Connect Systems so you are not asked to start over.',
    navHint: 'Add people, then groups/classes, then waiting periods & life events.',
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
      'EDI, carrier eligibility, and payroll / HRIS in one place. Each line shows status here—expand to troubleshoot. Skip anything you already linked during Employee setup or Configure plans.',
    navHint: 'EDI, carrier feeds, then payroll—optional integrations.',
    taskIndices: [9],
  },
  {
    title: 'Test & Launch',
    description:
      'Verify rules in a safe environment first, then optional employee preview and data spot-check, then confirm launch readiness.',
    navHint: 'Verify in a safe environment, then preview, spot-check, launch.',
    taskIndices: [10, 11, 12, 13],
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

/** First task in the step that is not `complete` (skipped / waiting / review still count as “open”). If all are complete, first task in the step. */
function firstNonCompleteTaskIndexInStep(
  step: WizardStepDef,
  outcomes: readonly StoredTaskOutcome[],
): number {
  const first = step.taskIndices[0]
  if (first === undefined) return 0
  for (const i of step.taskIndices) {
    if (outcomes[i] !== 'complete') return i
  }
  return first
}

/** Persisted per-task outcome. Blocked / in progress / not started are derived for UI. */
type StoredTaskOutcome = 'pending' | 'complete' | 'skipped' | 'waiting_on_others' | 'needs_review'

const TASK_COUNT = TASK_LABELS.length

/**
 * Optional: Marketplace (8); Connect systems (9); employee preview (11); spot-check (12). Skipped never counts as complete.
 */
const OPTIONAL_TASK_IDS = new Set<number>([8, 9, 11, 12])

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
  /** Test & Launch: verify (10) first; optional preview / spot-check after; launch (13) after verify. */
  11: 10,
  12: 10,
  13: 10,
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

function mergeConfigurePlanNames(
  selectedProductIds: readonly string[],
  existing: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const id of selectedProductIds) {
    const prev = existing?.[id]
    out[id] = typeof prev === 'string' ? prev : ''
  }
  return out
}

/** Configure plans: plan name entered (non-whitespace) counts as ready for status UI. */
function isConfigurePlanNameFilled(names: Record<string, string>, productId: string): boolean {
  return (names[productId] ?? '').trim().length > 0
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

type ConnectSystemsLineKey = 'edi' | 'carrier' | 'payroll'
type ConnectLineUiState = 'not_configured' | 'connected' | 'needs_attention'

type ConnectSystemsLineStateMap = Record<ConnectSystemsLineKey, ConnectLineUiState>

function defaultConnectSystemsLineState(): ConnectSystemsLineStateMap {
  return { edi: 'not_configured', carrier: 'not_configured', payroll: 'not_configured' }
}

function normalizeConnectSystemsLineState(raw: unknown): ConnectSystemsLineStateMap {
  const d = defaultConnectSystemsLineState()
  if (!raw || typeof raw !== 'object') return d
  const o = raw as Record<string, unknown>
  const norm = (v: unknown): ConnectLineUiState =>
    v === 'connected' || v === 'needs_attention' || v === 'not_configured' ? v : 'not_configured'
  return {
    edi: norm(o.edi),
    carrier: norm(o.carrier),
    payroll: norm(o.payroll),
  }
}

/** Migrate localStorage drafts from 18-task wizard (5 connect tasks) to 14 tasks (1 connect task). */
function migrateOldWizardDraft(parsed: Partial<Draft>): Partial<Draft> {
  if (parsed.taskOutcomes?.length !== 18) return parsed
  const old = parsed.taskOutcomes
  const taskOutcomes: StoredTaskOutcome[] = []
  for (let i = 0; i < 9; i++) taskOutcomes.push(old[i]!)
  const slice = old.slice(9, 14)
  let agg: StoredTaskOutcome = 'pending'
  if (slice.every((o) => o === 'complete' || o === 'skipped')) agg = 'complete'
  else if (slice.some((o) => o === 'waiting_on_others')) agg = 'waiting_on_others'
  else if (slice.some((o) => o === 'needs_review')) agg = 'needs_review'
  taskOutcomes.push(agg)
  for (let n = 10; n < 14; n++) taskOutcomes.push(old[n + 4]!)

  let stepIndex = parsed.stepIndex
  if (typeof stepIndex === 'number') {
    if (stepIndex >= 9 && stepIndex <= 13) stepIndex = 9
    else if (stepIndex >= 14) stepIndex = stepIndex - 4
    stepIndex = Math.min(Math.max(0, stepIndex), TASK_COUNT - 1)
  }
  return { ...parsed, taskOutcomes, stepIndex }
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
  /** Per integration line on Connect systems (EDI → carrier → payroll). */
  connectSystemsLineState: ConnectSystemsLineStateMap
  /** Shared effective / plan-year style defaults for most benefits. */
  defaultBenefitDates: DefaultBenefitDatesState
  /** Per-product date behavior inside Configure plans. */
  planBenefitDateSettings: Record<string, PlanBenefitDateSettings>
  /** User-entered plan display names in Configure plans (empty until typed). */
  configurePlanNames: Record<string, string>
  /** Stored draft version for benefit checkbox defaults (migration). */
  benefitsDefaultsVersion: number
}

const defaultDraft: Draft = {
  stepIndex: 0,
  taskOutcomes: defaultTaskOutcomes(),
  selectedProducts: [...DEFAULT_SELECTED_BENEFIT_PRODUCT_IDS],
  eligibilityNotes:
    'IF employment type is full-time AND hire date is more than 60 days ago THEN eligible for medical on the first of next month.\nIF average hours are under 30 THEN offer limited medical only.',
  mappingStep: 0,
  linkedPayrollFromEmployeeSetup: false,
  linkedBenefitFeedsFromBenefits: false,
  connectSystemsLineState: defaultConnectSystemsLineState(),
  defaultBenefitDates: { ...DEFAULT_BENEFIT_DATES },
  planBenefitDateSettings: mergePlanDateSettings([...DEFAULT_SELECTED_BENEFIT_PRODUCT_IDS], undefined),
  configurePlanNames: mergeConfigurePlanNames([...DEFAULT_SELECTED_BENEFIT_PRODUCT_IDS], undefined),
  benefitsDefaultsVersion: BENEFITS_DEFAULTS_VERSION,
}

function normalizeDraft(parsed: Partial<Draft> & { stepIndex?: number }): Draft {
  const parsedMigrated = migrateOldWizardDraft(parsed)
  const savedBenefitsDefaultsVersion = parsedMigrated.benefitsDefaultsVersion
  const merged: Draft = { ...defaultDraft, ...parsedMigrated }
  if (!merged.taskOutcomes || merged.taskOutcomes.length !== TASK_COUNT) {
    merged.taskOutcomes = defaultTaskOutcomes()
  }
  merged.stepIndex = Math.min(Math.max(0, merged.stepIndex), TASK_COUNT - 1)
  if (typeof merged.linkedPayrollFromEmployeeSetup !== 'boolean') merged.linkedPayrollFromEmployeeSetup = false
  if (typeof merged.linkedBenefitFeedsFromBenefits !== 'boolean') merged.linkedBenefitFeedsFromBenefits = false
  merged.connectSystemsLineState = normalizeConnectSystemsLineState(merged.connectSystemsLineState)
  merged.defaultBenefitDates = normalizeDefaultBenefitDates(merged.defaultBenefitDates)
  const validProductIds = new Set<string>(PRODUCT_OPTIONS.map((p) => p.id))
  let selectedProducts = (merged.selectedProducts ?? []).filter((id) => validProductIds.has(id))

  const matchesLegacyDefaultTrio = (() => {
    if (selectedProducts.length !== LEGACY_DEFAULT_BENEFIT_PRODUCT_IDS.size) return false
    const s = new Set(selectedProducts)
    if (s.size !== LEGACY_DEFAULT_BENEFIT_PRODUCT_IDS.size) return false
    for (const id of LEGACY_DEFAULT_BENEFIT_PRODUCT_IDS) {
      if (!s.has(id)) return false
    }
    return true
  })()

  if (savedBenefitsDefaultsVersion !== BENEFITS_DEFAULTS_VERSION) {
    if (selectedProducts.length === 0 || matchesLegacyDefaultTrio) {
      selectedProducts = [...DEFAULT_SELECTED_BENEFIT_PRODUCT_IDS]
    }
    merged.benefitsDefaultsVersion = BENEFITS_DEFAULTS_VERSION
  } else if (selectedProducts.length === 0) {
    selectedProducts = [...DEFAULT_SELECTED_BENEFIT_PRODUCT_IDS]
  }

  merged.selectedProducts = selectedProducts
  merged.planBenefitDateSettings = mergePlanDateSettings(
    merged.selectedProducts,
    merged.planBenefitDateSettings as Record<string, PlanBenefitDateSettings> | undefined,
  )
  merged.configurePlanNames = mergeConfigurePlanNames(
    merged.selectedProducts,
    merged.configurePlanNames as Record<string, string> | undefined,
  )
  return merged
}

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(GUIDED_SETUP_WIZARD_DRAFT_KEY)
    if (!raw) return { ...defaultDraft }
    return normalizeDraft(JSON.parse(raw) as Partial<Draft>)
  } catch {
    return { ...defaultDraft }
  }
}

function saveDraft(d: Draft) {
  localStorage.setItem(GUIDED_SETUP_WIZARD_DRAFT_KEY, JSON.stringify(d))
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

  const selectStepAndGoToFirstOpenTask = useCallback((stepIdx: number) => {
    setSelectedStepIndex(stepIdx)
    setDraft((d) => {
      const step = WIZARD_STEPS[stepIdx]
      if (!step) return d
      const target = firstNonCompleteTaskIndexInStep(step, d.taskOutcomes)
      return { ...d, stepIndex: target }
    })
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
        configurePlanNames: mergeConfigurePlanNames(selected, d.configurePlanNames),
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
    return draft.selectedProducts
      .map((pid) => {
        const opt = PRODUCT_OPTIONS.find((p) => p.id === pid)
        if (!opt) return null
        return {
          productId: pid,
          benefitType: opt.label,
          planName: draft.configurePlanNames[pid] ?? '',
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [draft.selectedProducts, draft.configurePlanNames])

  const [benefitsActivePlanIndex, setBenefitsActivePlanIndex] = useState(0)

  useEffect(() => {
    setBenefitsActivePlanIndex((i) => Math.min(i, Math.max(0, benefitPlansForConfig.length - 1)))
  }, [benefitPlansForConfig.length])

  const [rolesPermissionRows, setRolesPermissionRows] = useState<EmployerRolesUserRow[]>(() => [
    ...EMPLOYER_ROLES_DEFAULT_USERS,
  ])
  const [rolesSheetOpen, setRolesSheetOpen] = useState(false)
  const [rolesEditingId, setRolesEditingId] = useState<string | null>(null)
  const [rolesEditForm, setRolesEditForm] = useState({
    name: '',
    email: '',
    userRights: 'Read-only auditor',
  })

  const [employeeGroupRows, setEmployeeGroupRows] = useState<EmployeeGroupClassRow[]>(() => [
    ...EMPLOYEE_GROUPS_CENSUS_DEFAULT,
  ])
  const [employeeGroupSheetOpen, setEmployeeGroupSheetOpen] = useState(false)
  const [employeeGroupEditingId, setEmployeeGroupEditingId] = useState<string | null>(null)
  const [employeeGroupEditForm, setEmployeeGroupEditForm] = useState({
    groupLabel: '',
    breakdown: '',
  })
  const [employeeGroupSheetIsAdd, setEmployeeGroupSheetIsAdd] = useState(false)

  const [lifeEventRows, setLifeEventRows] = useState<LifeEventRuleRow[]>(() => [...LIFE_EVENTS_DEFAULT_ROWS])
  const [lifeEventSheetOpen, setLifeEventSheetOpen] = useState(false)
  const [lifeEventEditingId, setLifeEventEditingId] = useState<string | null>(null)
  const [lifeEventSheetIsAdd, setLifeEventSheetIsAdd] = useState(false)
  const [lifeEventEditForm, setLifeEventEditForm] = useState({
    eventName: '',
    code: '',
    retroDays: String(LIFE_EVENT_DEFAULT_RETRO_DAYS),
    futureDays: String(LIFE_EVENT_DEFAULT_FUTURE_DAYS),
  })

  const [connectMappingLine, setConnectMappingLine] = useState<ConnectSystemsLineKey | null>(null)
  const [connectExpandLine, setConnectExpandLine] = useState<ConnectSystemsLineKey | null>(null)

  const stepBody = (() => {
    const mappingSheet = (
      <Sheet
        open={mappingOpen}
        onOpenChange={(open) => {
          setMappingOpen(open)
          if (!open) setConnectMappingLine(null)
        }}
      >
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {connectMappingLine === 'edi'
                ? 'EDI mapping'
                : connectMappingLine === 'carrier'
                  ? 'Carrier feed mapping'
                  : connectMappingLine === 'payroll'
                    ? 'Payroll / HRIS mapping'
                    : 'Mapping wizard (ADP)'}
            </SheetTitle>
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
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex gap-2">
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
            {connectMappingLine ? (
              <div className="flex gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setMappingOpen(false)
                    setConnectMappingLine(null)
                  }}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    const line = connectMappingLine
                    setDraft((d) => ({
                      ...d,
                      connectSystemsLineState: { ...d.connectSystemsLineState, [line]: 'connected' },
                      ...(line === 'payroll' ? { linkedPayrollFromEmployeeSetup: true } : {}),
                      ...(line === 'carrier' ? { linkedBenefitFeedsFromBenefits: true } : {}),
                    }))
                    setMappingOpen(false)
                    setConnectMappingLine(null)
                  }}
                >
                  Save connection
                </Button>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    )

    const rolesPermissionsSheet = (
      <Sheet
        open={rolesSheetOpen}
        onOpenChange={(open) => {
          setRolesSheetOpen(open)
          if (!open) setRolesEditingId(null)
        }}
      >
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <FloatLabel
              label="Name"
              id="roles-edit-name"
              value={rolesEditForm.name}
              onChange={(e) => setRolesEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FloatLabel
              label="Email"
              id="roles-edit-email"
              type="email"
              autoComplete="email"
              value={rolesEditForm.email}
              onChange={(e) => setRolesEditForm((f) => ({ ...f, email: e.target.value }))}
            />
            <div className="space-y-2">
              <label htmlFor="roles-edit-rights" className="text-sm font-medium text-foreground">
                User rights
              </label>
              <Select
                value={rolesEditForm.userRights}
                onValueChange={(v) => setRolesEditForm((f) => ({ ...f, userRights: v }))}
              >
                <SelectTrigger id="roles-edit-rights" className="w-full">
                  <SelectValue placeholder="Select user rights" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYER_ROLES_USER_RIGHTS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-auto flex gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setRolesSheetOpen(false)
                setRolesEditingId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                if (!rolesEditingId) return
                setRolesPermissionRows((rows) =>
                  rows.map((r) => (r.id === rolesEditingId ? { ...r, ...rolesEditForm } : r)),
                )
                setRolesSheetOpen(false)
                setRolesEditingId(null)
              }}
            >
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )

    const employeeGroupsSheet = (
      <Sheet
        open={employeeGroupSheetOpen}
        onOpenChange={(open) => {
          setEmployeeGroupSheetOpen(open)
          if (!open) {
            setEmployeeGroupEditingId(null)
            setEmployeeGroupSheetIsAdd(false)
          }
        }}
      >
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{employeeGroupSheetIsAdd ? 'Add group' : 'Edit group'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <FloatLabel
              label="Group"
              id="eg-edit-label"
              value={employeeGroupEditForm.groupLabel}
              onChange={(e) => setEmployeeGroupEditForm((f) => ({ ...f, groupLabel: e.target.value }))}
            />
            <FloatLabel
              label="Divisions / classes"
              id="eg-edit-breakdown"
              value={employeeGroupEditForm.breakdown}
              onChange={(e) => setEmployeeGroupEditForm((f) => ({ ...f, breakdown: e.target.value }))}
            />
            <p className="text-xs leading-snug text-muted-foreground">
              For Full-time and Part-time, list subdivisions separated by slashes or commas (e.g. Office / Sales /
              Janitor). Use an em dash or leave blank when there are no subdivisions.
            </p>
          </div>
          <div className="mt-auto flex gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (employeeGroupSheetIsAdd && employeeGroupEditingId) {
                  setEmployeeGroupRows((rows) => rows.filter((r) => r.id !== employeeGroupEditingId))
                }
                setEmployeeGroupSheetOpen(false)
                setEmployeeGroupEditingId(null)
                setEmployeeGroupSheetIsAdd(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                if (!employeeGroupEditingId) return
                setEmployeeGroupRows((rows) =>
                  rows.map((r) =>
                    r.id === employeeGroupEditingId
                      ? {
                          ...r,
                          groupLabel: employeeGroupEditForm.groupLabel,
                          breakdown: employeeGroupEditForm.breakdown,
                        }
                      : r,
                  ),
                )
                setEmployeeGroupSheetIsAdd(false)
                setEmployeeGroupEditingId(null)
                setEmployeeGroupSheetOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )

    const lifeEventsSheet = (
      <Sheet
        open={lifeEventSheetOpen}
        onOpenChange={(open) => {
          setLifeEventSheetOpen(open)
          if (!open) {
            setLifeEventEditingId(null)
            setLifeEventSheetIsAdd(false)
          }
        }}
      >
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{lifeEventSheetIsAdd ? 'Add life event' : 'Edit life event'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <FloatLabel
              label="Event name"
              id="le-edit-name"
              value={lifeEventEditForm.eventName}
              onChange={(e) => setLifeEventEditForm((f) => ({ ...f, eventName: e.target.value }))}
            />
            <FloatLabel
              label="Code"
              id="le-edit-code"
              value={lifeEventEditForm.code}
              onChange={(e) => setLifeEventEditForm((f) => ({ ...f, code: e.target.value }))}
            />
            <FloatLabel
              label="Retro (days)"
              id="le-edit-retro"
              inputMode="numeric"
              value={lifeEventEditForm.retroDays}
              onChange={(e) => setLifeEventEditForm((f) => ({ ...f, retroDays: e.target.value }))}
            />
            <FloatLabel
              label="Future (days)"
              id="le-edit-future"
              inputMode="numeric"
              value={lifeEventEditForm.futureDays}
              onChange={(e) => setLifeEventEditForm((f) => ({ ...f, futureDays: e.target.value }))}
            />
            <p className="text-xs leading-snug text-muted-foreground">
              Retro and future set how far back or forward enrollment may apply from the event date.
            </p>
          </div>
          <div className="mt-auto flex gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (lifeEventSheetIsAdd && lifeEventEditingId) {
                  setLifeEventRows((rows) => rows.filter((r) => r.id !== lifeEventEditingId))
                }
                setLifeEventSheetOpen(false)
                setLifeEventEditingId(null)
                setLifeEventSheetIsAdd(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                if (!lifeEventEditingId) return
                const retro = Number.parseInt(lifeEventEditForm.retroDays.trim(), 10)
                const future = Number.parseInt(lifeEventEditForm.futureDays.trim(), 10)
                const retroDays =
                  Number.isFinite(retro) && retro >= 0 ? retro : LIFE_EVENT_DEFAULT_RETRO_DAYS
                const futureDays =
                  Number.isFinite(future) && future >= 0 ? future : LIFE_EVENT_DEFAULT_FUTURE_DAYS
                setLifeEventRows((rows) =>
                  rows.map((r) =>
                    r.id === lifeEventEditingId
                      ? {
                          ...r,
                          eventName: lifeEventEditForm.eventName.trim() || r.eventName,
                          code: lifeEventEditForm.code.trim() || r.code,
                          retroDays,
                          futureDays,
                        }
                      : r,
                  ),
                )
                setLifeEventSheetIsAdd(false)
                setLifeEventEditingId(null)
                setLifeEventSheetOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )

    const waitingOnMappingsToggle = (
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground">Waiting on a vendor or file feed?</span>
        {draft.taskOutcomes[CONNECT_SYSTEMS_TASK_INDEX] === 'waiting_on_others' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              setDraft((d) => {
                const next = [...d.taskOutcomes]
                next[CONNECT_SYSTEMS_TASK_INDEX] = 'pending'
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
                next[CONNECT_SYSTEMS_TASK_INDEX] = 'waiting_on_others'
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
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Confirm your legal entity profile. Values shown are sample data for this preview—production would sync from
              your implementation files and verified sources.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatLabel label="Legal Name" readOnly className="bg-muted/50" value={EMPLOYER.legalName} />
              <FloatLabel label="DBA Name" readOnly className="bg-muted/50" value={EMPLOYER.dbaName} />
              <FloatLabel label="EIN" readOnly className="bg-muted/50" value={EMPLOYER.ein} />
              <FloatLabel
                label="Industry / NAICS Code"
                readOnly
                className="bg-muted/50 sm:col-span-2"
                value={EMPLOYER.industryNaics}
              />
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Addresses</CardTitle>
                <CardDescription>Headquarters and mailing locations on file.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{EMPLOYER.addresses}</p>
              </CardContent>
            </Card>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Business structure</p>
              <ul className="grid gap-2 sm:grid-cols-2" role="list">
                {EMPLOYER_BUSINESS_STRUCTURE_OPTIONS.map((opt) => {
                  const selected = opt === EMPLOYER.businessStructure
                  return (
                    <li
                      key={opt}
                      aria-current={selected ? 'true' : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm',
                        selected
                          ? 'border-primary bg-primary/5 font-medium text-foreground'
                          : 'border-border bg-muted/20 text-muted-foreground',
                      )}
                    >
                      {selected ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/35" aria-hidden />
                      )}
                      <span>{opt}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )
      case 1:
        return (
          <>
            {rolesPermissionsSheet}
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Employer admins are separate from employees who only enroll. Assign user rights so plan changes, billing,
                and integrations stay auditable.
              </p>
              <Card>
                <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-base">Roles &amp; Permissions</CardTitle>
                    <CardDescription>Name, email, and rights for each person who can sign in to this employer workspace.</CardDescription>
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 gap-2 sm:mt-0"
                    onClick={() => {
                      const id = `user-${Date.now()}`
                      const defaultRights: string = EMPLOYER_ROLES_USER_RIGHTS_OPTIONS[2] ?? 'Read-only auditor'
                      const newRow: EmployerRolesUserRow = {
                        id,
                        name: 'New user',
                        email: '',
                        userRights: defaultRights,
                        locked: false,
                      }
                      setRolesPermissionRows((rows) => [...rows, newRow])
                      setRolesEditingId(id)
                      setRolesEditForm({
                        name: newRow.name,
                        email: newRow.email,
                        userRights: newRow.userRights,
                      })
                      setRolesSheetOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Add user
                  </Button>
                </CardHeader>
                <CardContent className="space-y-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>User rights</TableHead>
                        <TableHead className="w-[100px] text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rolesPermissionRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="max-w-[200px] break-all text-muted-foreground">{row.email || '—'}</TableCell>
                          <TableCell className="max-w-[min(280px,40vw)] break-words">{row.userRights}</TableCell>
                          <TableCell className="text-right">
                            {row.locked ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Primary administrator on file">
                                <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                                <span className="hidden sm:inline">Locked</span>
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                                aria-label={`Edit ${row.name}`}
                                onClick={() => {
                                  setRolesEditingId(row.id)
                                  setRolesEditForm({
                                    name: row.name,
                                    email: row.email,
                                    userRights: row.userRights,
                                  })
                                  setRolesSheetOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )
      case 2:
        return (
          <div className="space-y-6">
           
            <div className="grid gap-3 sm:grid-cols-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Connect payroll</CardTitle>
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
                  <CardDescription>Bulk import with employee census data.</CardDescription>
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
          <>
            {employeeGroupsSheet}
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Groups and classes from your employee census (previous step) are shown below. Adjust labels or
                subdivisions so eligibility, contributions, and carrier reporting stay aligned with payroll.
              </p>
              <Card>
                <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-base">Groups, divisions &amp; classes</CardTitle>
                    <CardDescription>
                      Executives, full- and part-time cohorts, COBRA, and any custom groups you add.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 gap-2 sm:mt-0"
                    onClick={() => {
                      const id = `group-${Date.now()}`
                      const newRow: EmployeeGroupClassRow = {
                        id,
                        groupLabel: 'New group',
                        breakdown: '',
                        fromCensus: false,
                      }
                      setEmployeeGroupRows((rows) => [...rows, newRow])
                      setEmployeeGroupEditingId(id)
                      setEmployeeGroupEditForm({
                        groupLabel: newRow.groupLabel,
                        breakdown: newRow.breakdown,
                      })
                      setEmployeeGroupSheetIsAdd(true)
                      setEmployeeGroupSheetOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Add group
                  </Button>
                </CardHeader>
                <CardContent className="space-y-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group</TableHead>
                        <TableHead>Divisions / classes</TableHead>
                        <TableHead className="w-[130px]">Source</TableHead>
                        <TableHead className="w-[100px] text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeGroupRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.groupLabel}</TableCell>
                          <TableCell className="max-w-[min(320px,50vw)] break-words text-muted-foreground">
                            {row.breakdown || '—'}
                          </TableCell>
                          <TableCell>
                            {row.fromCensus ? (
                              <Badge intent="outline" className="whitespace-nowrap text-[10px] font-semibold uppercase">
                                Census
                              </Badge>
                            ) : (
                              <Badge intent="default" className="whitespace-nowrap text-[10px] font-normal">
                                Manual
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-muted-foreground hover:text-foreground"
                              aria-label={`Edit ${row.groupLabel}`}
                              onClick={() => {
                                setEmployeeGroupEditingId(row.id)
                                setEmployeeGroupEditForm({
                                  groupLabel: row.groupLabel,
                                  breakdown: row.breakdown === '—' ? '' : row.breakdown,
                                })
                                setEmployeeGroupSheetIsAdd(false)
                                setEmployeeGroupSheetOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )
      case 4:
        return (
          <>
            {lifeEventsSheet}
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Waiting periods control when coverage starts after hire. Life event rules set how far back or forward
                enrollment may apply—keep both aligned with your SPD and carrier contracts.
              </p>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waiting periods</p>
                <div className="flex flex-wrap gap-2">
                  {['First of month after DOH', '60-day benefits wait', '90-day probation', 'Rehire rules'].map(
                    (label) => (
                      <Badge key={label} intent="default" className="cursor-default">
                        {label}
                      </Badge>
                    ),
                  )}
                </div>
                <Button type="button" variant="outline" size="sm">
                  Open waiting-period editor
                </Button>
              </div>
              <Card>
                <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-base">Life events</CardTitle>
                    <CardDescription>
                      Enrollment windows by event type. New rows default to {LIFE_EVENT_DEFAULT_RETRO_DAYS} days retro
                      and {LIFE_EVENT_DEFAULT_FUTURE_DAYS} days future unless you change them.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 gap-2 sm:mt-0"
                    onClick={() => {
                      const id = `life-event-${Date.now()}`
                      const newRow: LifeEventRuleRow = {
                        id,
                        eventName: 'New life event',
                        code: 'NEW_EVENT',
                        retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
                        futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
                      }
                      setLifeEventRows((rows) => [...rows, newRow])
                      setLifeEventEditingId(id)
                      setLifeEventEditForm({
                        eventName: newRow.eventName,
                        code: newRow.code,
                        retroDays: String(newRow.retroDays),
                        futureDays: String(newRow.futureDays),
                      })
                      setLifeEventSheetIsAdd(true)
                      setLifeEventSheetOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Add event
                  </Button>
                </CardHeader>
                <CardContent className="space-y-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="w-[100px]">Retro</TableHead>
                        <TableHead className="w-[100px]">Future</TableHead>
                        <TableHead className="w-[120px] text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lifeEventRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="max-w-[min(320px,55vw)] font-medium break-words">
                            {row.eventName}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">{row.code}</TableCell>
                          <TableCell>{row.retroDays} days</TableCell>
                          <TableCell>{row.futureDays} days</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                                aria-label={`Edit ${row.eventName}`}
                                onClick={() => {
                                  setLifeEventEditingId(row.id)
                                  setLifeEventEditForm({
                                    eventName: row.eventName,
                                    code: row.code,
                                    retroDays: String(row.retroDays),
                                    futureDays: String(row.futureDays),
                                  })
                                  setLifeEventSheetIsAdd(false)
                                  setLifeEventSheetOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-destructive hover:text-destructive"
                                aria-label={`Delete ${row.eventName}`}
                                onClick={() => setLifeEventRows((rows) => rows.filter((r) => r.id !== row.id))}
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select every benefit category you offer. Each selection becomes a plan you configure in{' '}
              <strong className="font-medium text-foreground">Configure plans</strong>—you can add more categories later.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                : CDH_PRODUCT_IDS.has(plan.productId)
                  ? 'WEX (CDH)'
                  : plan.productId === 'transit-parking'
                    ? 'Commuter vendor'
                    : 'Carrier TBD'
        const cobraName = `cobra-${plan.productId}`
        const planDates =
          draft.planBenefitDateSettings[plan.productId] ?? defaultPlanDateEntry()
        const def = draft.defaultBenefitDates
        const configurePlansTotal = benefitPlansForConfig.length
        const configurePlansWithName = benefitPlansForConfig.filter((p) =>
          isConfigurePlanNameFilled(draft.configurePlanNames, p.productId),
        ).length
        const configurePlansNeedName = configurePlansTotal - configurePlansWithName
        return (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Configure one plan at a time. Dates follow your employer defaults unless you turn off “Use default benefit
              dates” for an exception (for example, calendar-year FSA vs plan-year medical).
            </p>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">1 · Basic plan information</CardTitle>
                <CardDescription>
                  Benefit type, plan name, carrier, and whether this plan follows shared default dates or uses its own.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="configure-benefit-type" className="text-sm font-medium text-foreground">
                      Benefit type
                    </label>
                    <Select
                      value={plan.productId}
                      onValueChange={(pid) => {
                        const idx = benefitPlansForConfig.findIndex((p) => p.productId === pid)
                        if (idx >= 0) setBenefitsActivePlanIndex(idx)
                      }}
                    >
                      <SelectTrigger id="configure-benefit-type" className="w-full max-w-md">
                        <SelectValue placeholder="Select benefit type" />
                      </SelectTrigger>
                      <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[min(100vw-2rem,28rem)]">
                        {benefitPlansForConfig.map((p) => {
                          const filled = isConfigurePlanNameFilled(draft.configurePlanNames, p.productId)
                          return (
                            <SelectItem key={p.productId} value={p.productId} className="pr-2">
                              <span className="flex w-full min-w-0 items-center justify-between gap-3">
                                <span className="truncate">{p.benefitType}</span>
                                <span
                                  className={cn(
                                    'flex shrink-0 items-center gap-1 text-xs',
                                    filled ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-600',
                                  )}
                                >
                                  {filled ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                      <span>Ready</span>
                                    </>
                                  ) : (
                                    <span>Needs name</span>
                                  )}
                                </span>
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-snug text-muted-foreground" aria-live="polite">
                      {configurePlansNeedName === 0 ? (
                        <>
                          All {configurePlansTotal} selected benefit{' '}
                          {configurePlansTotal === 1 ? 'type has' : 'types have'} a plan name.
                        </>
                      ) : (
                        <>
                          {configurePlansWithName} of {configurePlansTotal} have a plan name
                          <span className="text-muted-foreground/80"> · </span>
                          <span className="font-medium text-foreground">
                            {configurePlansNeedName} still need{configurePlansNeedName === 1 ? 's' : ''} a name
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <FloatLabel
                    label="Plan name"
                    id={`configure-plan-name-${plan.productId}`}
                    className="bg-background sm:col-span-2"
                    value={plan.planName}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        configurePlanNames: {
                          ...d.configurePlanNames,
                          [plan.productId]: e.target.value,
                        },
                      }))
                    }
                  />
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
      case 9: {
        const ediStatus = draft.connectSystemsLineState.edi
        const carrierStatus: ConnectLineUiState =
          draft.connectSystemsLineState.carrier === 'needs_attention'
            ? 'needs_attention'
            : draft.connectSystemsLineState.carrier === 'connected' || draft.linkedBenefitFeedsFromBenefits
              ? 'connected'
              : 'not_configured'
        const payrollStatus: ConnectLineUiState =
          draft.connectSystemsLineState.payroll === 'needs_attention'
            ? 'needs_attention'
            : draft.connectSystemsLineState.payroll === 'connected' || draft.linkedPayrollFromEmployeeSetup
              ? 'connected'
              : 'not_configured'

        const connectLineBadge = (state: ConnectLineUiState) => (
          <Badge
            intent="outline"
            className={cn(
              'shrink-0 font-medium',
              state === 'connected' &&
                'border-emerald-600/35 bg-emerald-600/10 text-emerald-950 dark:text-emerald-50',
              state === 'needs_attention' &&
                'border-amber-600/40 bg-amber-500/12 text-amber-950 dark:text-amber-100',
            )}
          >
            {state === 'connected' ? 'Connected' : state === 'needs_attention' ? 'Needs attention' : 'Not connected'}
          </Badge>
        )

        const openConnectMap = (line: ConnectSystemsLineKey) => {
          setConnectMappingLine(line)
          setMappingOpen(true)
        }

        const markLineAttention = (line: ConnectSystemsLineKey) =>
          setDraft((d) => ({
            ...d,
            connectSystemsLineState: { ...d.connectSystemsLineState, [line]: 'needs_attention' },
          }))

        const ediRows = CONNECTORS.filter((c) => c.id === 'edi')
        const carrierRows = carrierFeedConnectors.length ? carrierFeedConnectors : CONNECTORS.slice(2, 4)
        const payrollRows = payrollHrisConnectors.length ? payrollHrisConnectors : CONNECTORS.slice(0, 2)

        const lineCard = (
          lineKey: ConnectSystemsLineKey,
          title: string,
          description: string,
          status: ConnectLineUiState,
          hint: string | null,
          children: ReactNode,
        ) => {
          const expanded = connectExpandLine === lineKey
          return (
            <Card key={lineKey} className="overflow-hidden border-border/80">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription className="text-sm">{description}</CardDescription>
                  </div>
                  {connectLineBadge(status)}
                </div>
                {status === 'connected' ? (
                  <p className="text-xs text-muted-foreground">
                    Last check OK · sample sync ·{' '}
                    {lineKey === 'payroll' && draft.linkedPayrollFromEmployeeSetup && draft.connectSystemsLineState.payroll !== 'connected'
                      ? 'Linked from Employee setup'
                      : lineKey === 'carrier' && draft.linkedBenefitFeedsFromBenefits && draft.connectSystemsLineState.carrier !== 'connected'
                        ? 'Started from Configure plans'
                        : 'Ready for production cutover'}
                  </p>
                ) : null}
                {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {children}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openConnectMap(lineKey)}>
                    {status === 'connected' ? 'Review / extend' : 'Configure'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setConnectExpandLine((x) => (x === lineKey ? null : lineKey))}
                    aria-expanded={expanded}
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    Diagnose
                  </Button>
                </div>
                {expanded ? (
                  <div
                    className="rounded-lg border border-border/80 bg-muted/20 px-3 py-3 text-sm"
                    role="region"
                    aria-label={`${title} diagnostics`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connection checks</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                      <li>Handshake and credentials validated against your tenant (demo).</li>
                      <li>File or API schema version matches the latest WEX template.</li>
                      <li>Test payload accepted; errors surface in carrier or payroll logs.</li>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => markLineAttention(lineKey)}
                    >
                      Mark needs attention (demo)
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        }

        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">Optional.</strong> Set up EDI, carrier eligibility, and payroll
              in the order below. Status updates on this screen—expand <strong className="font-medium">Diagnose</strong> for
              quick checks or open the mapping flow to record a connection.
            </p>
            <div className="space-y-4">
              {lineCard(
                'edi',
                'EDI',
                'File-based census and eligibility—WEX unified EDI or vendor-specific lanes.',
                ediStatus,
                null,
                <div className="grid gap-2 sm:grid-cols-2">
                  {ediRows.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md border border-border/80 bg-background/50 px-3 py-2 text-xs text-muted-foreground"
                    >
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p>
                        {c.category} · {c.direction}
                      </p>
                    </div>
                  ))}
                </div>,
              )}
              {lineCard(
                'carrier',
                'Carrier',
                'Healthcare and ancillary carrier feeds—eligibility, enrollment, and reconciliation.',
                carrierStatus,
                draft.linkedBenefitFeedsFromBenefits
                  ? 'You already started a feed while configuring plans—you can extend it here.'
                  : null,
                <div className="grid gap-2 sm:grid-cols-2">
                  {carrierRows.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md border border-border/80 bg-background/50 px-3 py-2 text-xs text-muted-foreground"
                    >
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p>
                        {c.category} · {c.direction}
                      </p>
                    </div>
                  ))}
                </div>,
              )}
              {lineCard(
                'payroll',
                'Payroll (employee system)',
                'Payroll / HRIS for deductions, classes, and census—bi-directional where supported.',
                payrollStatus,
                draft.linkedPayrollFromEmployeeSetup
                  ? 'Payroll link started from Employee setup—confirm mappings or production cutover here.'
                  : null,
                <div className="grid gap-2 sm:grid-cols-2">
                  {payrollRows.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md border border-border/80 bg-background/50 px-3 py-2 text-xs text-muted-foreground"
                    >
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p>
                        {c.category} · {c.direction}
                      </p>
                    </div>
                  ))}
                </div>,
              )}
            </div>
            {waitingOnMappingsToggle}
            {mappingSheet}
          </div>
        )
      }
      case 10:
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
      case 11:
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
      case 12:
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
      case 13:
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
                        onClick={() => selectStepAndGoToFirstOpenTask(stepIdx)}
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
                                            : taskIdx === 11
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
