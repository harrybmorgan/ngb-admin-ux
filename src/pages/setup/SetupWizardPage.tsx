import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmbeddedThemingStudio } from '@/pages/theming-engine/EmbeddedThemingStudio'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FloatLabel,
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
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Lock,
  Minus,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { CONNECTORS, EMPLOYER, PRODUCT_OPTIONS } from '@/data/adminMockData'
import { emitSetupChanged, writeEmployerSetup } from '@/hooks/useEmployerSetup'

/** v2: 5 phases × granular tasks (JTBD-aligned); bump key so legacy 9-step drafts are not mixed. */
const WIZARD_DRAFT_KEY = 'ngb_admin_wizard_draft_v2'

/** Linear task order across all phases (28 tasks). */
const TASK_LABELS = [
  'Company basics',
  'Plan year / dates',
  'Employer users',
  'Roles & permissions',
  'Core structure reused across products',
  'Benefits offered',
  'Marketplace',
  'Contribution model',
  'Employer / employee contributions',
  'Eligibility rules',
  'Waiting periods',
  'Tax scenarios',
  'Advanced lifecycle rules',
  'Payroll / HRIS',
  'Banking / funding',
  'Carrier feeds',
  'Technical contacts',
  'Data mappings',
  'Preview employee experience',
  'Spot-check imported employees',
  'Validate rate logic',
  'Validate eligibility logic',
  'Verify setup in sandbox',
  'Final blockers',
  'Final approvals',
  'First employee access confirmed',
  'Go to admin home',
  'Ongoing updates / next steps',
] as const

/** Full-bleed embedded theming / preview surface. */
const PREVIEW_EMPLOYEE_TASK_INDEX = 18

/** Waiting-on-others toggle lives on data mappings (external feeds / mappings). */
const DATA_MAPPINGS_TASK_INDEX = 17

type PhaseDef = {
  title: string
  description: string
  /** Global task indices (0-based) belonging to this phase */
  taskIndices: readonly number[]
}

const PHASES: readonly PhaseDef[] = [
  {
    title: 'Company & Access',
    description: 'Company, plan timing, people, roles, and shared structure you reuse across products.',
    taskIndices: [0, 1, 2, 3, 4],
  },
  {
    title: 'Benefits & Rules',
    description: 'Offerings, optional Marketplace add-ons, money, eligibility, timing, tax, and lifecycle rules.',
    taskIndices: [5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    title: 'Connect Systems',
    description: 'Payroll, banking, carriers, technical contacts, and field mappings.',
    taskIndices: [13, 14, 15, 16, 17],
  },
  {
    title: 'Test & Verify',
    description: 'Preview, spot-check data, validate logic, and confirm sandbox behavior.',
    taskIndices: [18, 19, 20, 21, 22],
  },
  {
    title: 'Launch & Handoff',
    description: 'Blockers, approvals, first live access, and transition to day-to-day admin.',
    taskIndices: [23, 24, 25, 26, 27],
  },
] as const

const CONNECT_START = 13
const CONNECT_END = 17
const VERIFY_START = 18
const VERIFY_END = 22

function phaseIndexForTask(taskIndex: number): number {
  const i = PHASES.findIndex((p) => p.taskIndices.includes(taskIndex))
  return i >= 0 ? i : 0
}

function taskOrdinalInPhase(taskIndex: number): { phase: PhaseDef; indexInPhase: number; phaseSize: number } {
  const phase = PHASES[phaseIndexForTask(taskIndex)]
  const indexInPhase = phase.taskIndices.indexOf(taskIndex)
  return { phase, indexInPhase: indexInPhase >= 0 ? indexInPhase : 0, phaseSize: phase.taskIndices.length }
}

/** Persisted per-task outcome. Blocked / in progress / not started are derived for UI. */
type StoredTaskOutcome = 'pending' | 'complete' | 'skipped' | 'waiting_on_others' | 'needs_review'

const TASK_COUNT = TASK_LABELS.length

/**
 * Optional tasks: skipped does not block the required chain.
 * Marketplace — third-party add-ons (e.g. pet, legal); not required before launch by default.
 */
const OPTIONAL_TASK_IDS = new Set<number>([6])

/** Linear prerequisites within a section; skipped never satisfies `complete`. */
const TASK_BLOCKER: Partial<Record<number, number>> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  7: 5,
  8: 7,
  9: 8,
  10: 9,
  11: 10,
  12: 11,
  14: 13,
  15: 14,
  16: 15,
  17: 16,
  19: 18,
  20: 19,
  21: 20,
  22: 21,
  24: 23,
  25: 24,
  26: 25,
  27: 26,
}

function isTaskRequired(taskIndex: number): boolean {
  return !OPTIONAL_TASK_IDS.has(taskIndex)
}

function firstIncompleteRequiredInRange(
  outcomes: readonly StoredTaskOutcome[],
  start: number,
  end: number,
): number | undefined {
  for (let i = start; i <= end; i++) {
    if (!isTaskRequired(i)) continue
    if (outcomes[i] !== 'complete') return i
  }
  return undefined
}

/** Phase gates: Test & Verify opens after Connect required work; Launch after Verify required work. */
function phaseGatePrereqIndex(taskIndex: number, outcomes: readonly StoredTaskOutcome[]): number | undefined {
  if (taskIndex >= VERIFY_START && taskIndex <= VERIFY_END) {
    return firstIncompleteRequiredInRange(outcomes, CONNECT_START, CONNECT_END)
  }
  if (taskIndex >= 23) {
    return firstIncompleteRequiredInRange(outcomes, VERIFY_START, VERIFY_END)
  }
  return undefined
}

function isTaskBlocked(taskIndex: number, outcomes: readonly StoredTaskOutcome[]): boolean {
  const gatePrereq = phaseGatePrereqIndex(taskIndex, outcomes)
  if (gatePrereq !== undefined) return true
  const prereq = TASK_BLOCKER[taskIndex]
  if (prereq === undefined) return false
  return outcomes[prereq] !== 'complete'
}

function blockerPrereqIndex(taskIndex: number, outcomes: readonly StoredTaskOutcome[]): number | undefined {
  const gate = phaseGatePrereqIndex(taskIndex, outcomes)
  if (gate !== undefined) return gate
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

function phaseRequiredIndices(phase: PhaseDef): number[] {
  return phase.taskIndices.filter(isTaskRequired)
}

function phaseOptionalIndices(phase: PhaseDef): number[] {
  return phase.taskIndices.filter((i) => OPTIONAL_TASK_IDS.has(i))
}

/** Required tasks only: complete counts toward phase/setup progress; skipped does not. */
function phaseRequiredProgress(
  phase: PhaseDef,
  outcomes: readonly StoredTaskOutcome[],
): { complete: number; total: number } {
  const req = phaseRequiredIndices(phase)
  const complete = req.filter((i) => outcomes[i] === 'complete').length
  return { complete, total: req.length }
}

function phaseOptionalSummary(
  phase: PhaseDef,
  outcomes: readonly StoredTaskOutcome[],
): { complete: number; skipped: number; open: number; total: number } {
  const opt = phaseOptionalIndices(phase)
  let complete = 0
  let skipped = 0
  let open = 0
  for (const i of opt) {
    const o = outcomes[i]
    if (o === 'complete') complete++
    else if (o === 'skipped') skipped++
    else open++
  }
  return { complete, skipped, open, total: opt.length }
}

function formatOptionalSummaryLine(summary: { complete: number; skipped: number; open: number; total: number }): string | null {
  if (summary.total === 0) return null
  const parts: string[] = []
  if (summary.complete > 0) parts.push(`${summary.complete} done`)
  if (summary.skipped > 0) parts.push(`${summary.skipped} skipped`)
  if (summary.open > 0) parts.push(`${summary.open} not started`)
  if (parts.length === 0) return null
  return `Optional: ${parts.join(' · ')}`
}

/** Employer-wide required task completion (optional tasks excluded from numerator and denominator). */
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

function defaultTaskOutcomes(): StoredTaskOutcome[] {
  return Array.from({ length: TASK_COUNT }, () => 'pending')
}

type Draft = {
  stepIndex: number
  taskOutcomes: StoredTaskOutcome[]
  selectedProducts: string[]
  eligibilityNotes: string
  mappingStep: number
}

const defaultDraft: Draft = {
  stepIndex: 0,
  taskOutcomes: defaultTaskOutcomes(),
  selectedProducts: ['medical', 'dental', 'hsa'],
  eligibilityNotes:
    'IF employment type is full-time AND hire date is more than 60 days ago THEN eligible for medical on the first of next month.\nIF average hours are under 30 THEN offer limited medical only.',
  mappingStep: 0,
}

function normalizeDraft(parsed: Partial<Draft> & { stepIndex?: number }): Draft {
  const merged: Draft = { ...defaultDraft, ...parsed }
  if (!merged.taskOutcomes || merged.taskOutcomes.length !== TASK_COUNT) {
    merged.taskOutcomes = defaultTaskOutcomes()
  }
  merged.stepIndex = Math.min(Math.max(0, merged.stepIndex), TASK_COUNT - 1)
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

function SetupPhasesHelpPanel({ id, className }: { id: string; className?: string }) {
  const legendRow = (glyph: ReactNode, text: string) => (
    <li className="flex gap-2.5">
      <span className="mt-0.5 shrink-0">{glyph}</span>
      <span className="min-w-0 text-[11px] leading-snug text-muted-foreground">{text}</span>
    </li>
  )

  return (
    <div
      id={id}
      role="region"
      aria-label="How setup phases and task status work"
      className={cn(
        'mb-3 rounded-lg border border-border bg-muted/25 px-3 py-2.5 shadow-sm dark:bg-muted/15',
        className,
      )}
    >
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Progress is based on <strong className="font-medium text-foreground">required</strong> tasks you finish (not
        visits or skips). Optional tasks are tracked on their own and never fill the required bar. The phase you’re
        working in expands when you change steps. Tap any phase to see only that phase’s tasks. A lock means you can
        preview that task, but you’ll need earlier required work done before it can count as complete.
      </p>
      <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Task icons</p>
      <ul className="space-y-2">
        {legendRow(
          <TaskStatusGlyph status="complete" taskNumber={1} />,
          'Complete — required tasks count toward phase and overall required progress.',
        )}
        {legendRow(
          <TaskStatusGlyph status="skipped" taskNumber={1} />,
          'Skipped — stays visible; does not count as done for required progress.',
        )}
        {legendRow(
          <TaskStatusGlyph status="needs_review" taskNumber={1} />,
          'Needs review — finish review before it can count as complete.',
        )}
        {legendRow(
          <TaskStatusGlyph status="waiting_on_others" taskNumber={1} />,
          'Waiting on others — paused until someone outside your team moves, or you clear the flag.',
        )}
        {legendRow(
          <TaskStatusGlyph status="blocked" taskNumber={1} />,
          'Needs earlier step — open for preview; complete prerequisite tasks first.',
        )}
        {legendRow(
          <TaskStatusGlyph status="in_progress" taskNumber={1} />,
          'In progress — the task you’re on right now.',
        )}
        {legendRow(
          <TaskStatusGlyph status="not_started" taskNumber={3} />,
          'To do — step number until you start or finish.',
        )}
      </ul>
      <p className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2 text-[11px] leading-snug text-muted-foreground">
        <span className="shrink-0 rounded bg-muted/80 px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
          Optional
        </span>
        <span>
          Optional tasks never count toward required progress. Marketplace covers optional third-party add-ons (pet,
          legal, and similar)—skip if you do not offer them; they are not required before launch by default.
        </span>
      </p>
    </div>
  )
}

type PhaseBadgeMode = 'all_complete' | 'partial_skipped' | 'active' | 'upcoming' | 'behind'

function phaseBadgeMode(phase: PhaseDef, outcomes: readonly StoredTaskOutcome[], stepIndex: number): PhaseBadgeMode {
  const indices = phase.taskIndices
  const { complete: reqComplete, total: reqTotal } = phaseRequiredProgress(phase, outcomes)
  const requiredSatisfied = reqTotal === 0 || reqComplete === reqTotal
  const anyOptionalOrOpen = indices.some((i) => {
    const o = outcomes[i]
    return o !== 'complete' && o !== 'skipped'
  })
  const hasSkipped = indices.some((i) => outcomes[i] === 'skipped')

  if (requiredSatisfied && !anyOptionalOrOpen) {
    return hasSkipped ? 'partial_skipped' : 'all_complete'
  }

  if (indices.includes(stepIndex)) return 'active'

  const lastInPhase = indices[indices.length - 1]!
  if (stepIndex > lastInPhase) {
    return 'behind'
  }

  if (stepIndex < indices[0]!) return 'upcoming'

  return 'upcoming'
}

function phaseHasWaitingOnOthers(phase: PhaseDef, outcomes: readonly StoredTaskOutcome[]): boolean {
  return phase.taskIndices.some((i) => outcomes[i] === 'waiting_on_others')
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
  if (prereqIndex >= CONNECT_START && prereqIndex <= CONNECT_END) {
    const gateNote =
      'Test & Verify stays gated until every required Connect Systems task is marked complete (skips don’t count). '
    if (o === 'skipped') {
      return `${gateNote}Finish ${name} for real, or mark it complete when ready—skipped work doesn’t unlock the next section.`
    }
    if (o === 'waiting_on_others') {
      return `${gateNote}We’re waiting on ${name}—clear the waiting flag or finish that work so you can move into testing.`
    }
    if (o === 'needs_review') {
      return `${gateNote}Resolve the review on ${name}, then continue.`
    }
    return `${gateNote}Complete ${name} and use Next when you’re done.`
  }
  if (prereqIndex >= VERIFY_START && prereqIndex <= VERIFY_END) {
    const gateNote =
      'Launch & Handoff opens after every required task in Test & Verify is complete (skips don’t count). '
    if (o === 'skipped') {
      return `${gateNote}Wrap up ${name}—skipped tasks don’t satisfy this gate.`
    }
    if (o === 'waiting_on_others') {
      return `${gateNote}Clear waiting or finish ${name} before go-live tasks.`
    }
    if (o === 'needs_review') {
      return `${gateNote}Finish review on ${name} first.`
    }
    return `${gateNote}Complete ${name} when you’re ready.`
  }
  if (o === 'skipped') {
    return `This step turns on after ${name} is finished. You skipped it earlier—open ${name} and work through it, or mark it done when you’re ready.`
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
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(() => phaseIndexForTask(loadDraft().stepIndex))
  const [phasesHelpOpen, setPhasesHelpOpen] = useState(false)

  useEffect(() => {
    saveDraft(draft)
  }, [draft])

  const stepIndex = draft.stepIndex
  const totalTasks = TASK_LABELS.length
  const phaseMeta = taskOrdinalInPhase(stepIndex)
  const taskOutcomes = draft.taskOutcomes
  useEffect(() => {
    setSelectedPhaseIndex(phaseIndexForTask(stepIndex))
  }, [stepIndex])

  const { complete: finishedRequiredCount, total: totalRequiredTasks } = useMemo(
    () => globalRequiredProgress(taskOutcomes),
    [taskOutcomes],
  )

  const currentPhaseRequired = useMemo(
    () => phaseRequiredProgress(phaseMeta.phase, taskOutcomes),
    [phaseMeta.phase, taskOutcomes],
  )

  const currentPhaseOptionalLine = useMemo(
    () => formatOptionalSummaryLine(phaseOptionalSummary(phaseMeta.phase, taskOutcomes)),
    [phaseMeta.phase, taskOutcomes],
  )

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
      return { ...d, selectedProducts: [...set] }
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
  const prereqForCurrent = blockerPrereqIndex(stepIndex, taskOutcomes)

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
        {draft.taskOutcomes[DATA_MAPPINGS_TASK_INDEX] === 'waiting_on_others' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              setDraft((d) => {
                const next = [...d.taskOutcomes]
                next[DATA_MAPPINGS_TASK_INDEX] = 'pending'
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
                next[DATA_MAPPINGS_TASK_INDEX] = 'waiting_on_others'
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Align plan years, renewals, and key effective dates so benefits, contributions, and payroll stay in sync.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatLabel label="Plan year start" readOnly className="bg-muted/50" value="January 1" />
              <FloatLabel label="Plan year end" readOnly className="bg-muted/50" value="December 31" />
              <FloatLabel label="Open enrollment window" readOnly className="bg-muted/50" value="Nov 1 – Nov 30" />
              <FloatLabel label="First deduction date" readOnly className="bg-muted/50" value="Jan 15, 2026" />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Employer users are the people who administer benefits in your organization—separate from employees who
              only enroll.
            </p>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invite admins</CardTitle>
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
                <CardTitle className="text-base">SSO / directory (optional)</CardTitle>
                <CardDescription>Connect IdP later without blocking your first pass.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" size="sm">
                  View connection options
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define who can change plans, approve enrollments, view billing, and manage integrations.
            </p>
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
              Adjust role matrix
            </Button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure the plan <em>framework</em> once—names, carriers, networks, effective dates—then reuse it across
              medical, dental, vision, and CDH without duplicating shells.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Effective</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Summit PPO Gold</TableCell>
                  <TableCell>Medical PPO</TableCell>
                  <TableCell>UHC</TableCell>
                  <TableCell>Jan 1, 2026</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bright Smile PPO</TableCell>
                  <TableCell>Dental</TableCell>
                  <TableCell>Guardian</TableCell>
                  <TableCell>Jan 1, 2026</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">HSA election</TableCell>
                  <TableCell>CDH</TableCell>
                  <TableCell>WEX</TableCell>
                  <TableCell>Jan 1, 2026</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm">
              Add plan row
            </Button>
          </div>
        )
      case 5:
        return (
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
        )
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">Optional.</strong> Marketplace is for third-party add-ons
              such as pet insurance, legal plans, identity protection, and similar partner offerings—not core medical or
              dental. Skip this task if you do not sell these products.
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
      case 7:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how employer dollars flow—percent of premium, flat amount, tiered by coverage level, or defined
              contribution. This drives what employees see before you enter rate tables.
            </p>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model</CardTitle>
                <CardDescription>Demo selection only; production supports blended models per product.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge intent="default" className="cursor-default">
                  % of premium (medical)
                </Badge>
                <Badge intent="default" className="cursor-default">
                  Flat HSA seed (annual)
                </Badge>
              </CardContent>
            </Card>
          </div>
        )
      case 8:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rates and eligibility classes attach to your plan framework so contribution tiers stay consistent.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan shell</TableHead>
                  <TableHead>Rate table</TableHead>
                  <TableHead>Eligibility class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Summit PPO Gold</TableCell>
                  <TableCell>2026 EE-only / EE+children / family</TableCell>
                  <TableCell>Full-time</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Summit PPO Gold</TableCell>
                  <TableCell>2026 part-time buy-up</TableCell>
                  <TableCell>Part-time (25+ hrs)</TableCell>
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
                  next[8] = 'needs_review'
                  return { ...d, taskOutcomes: next }
                })
              }}
            >
              Mark contribution tables ready (demo)
            </Button>
          </div>
        )
      case 9:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Plain-English rules with presets for employment types, dependents, and domestic partners.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Full-time (30+ hrs)', 'Part-time carve-out', 'Dependents to age 26', 'Domestic partners'].map(
                (label) => (
                  <Badge key={label} intent="default" className="cursor-default">
                    {label}
                  </Badge>
                ),
              )}
            </div>
            <textarea
              rows={8}
              value={draft.eligibilityNotes}
              onChange={(e) => setDraft((d) => ({ ...d, eligibilityNotes: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
        )
      case 10:
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
      case 11:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Capture Section 125, imputed income, HSA eligibility, and commuter or other pre-tax programs in one place.
            </p>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tax posture (demo)</CardTitle>
                <CardDescription>Full-time medical is pre-tax; voluntary life over $50k imputed.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" size="sm">
                  Review tax assumptions
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      case 12:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              COBRA, leave of absence, rehire, and age-out automations reduce manual clean-up after go-live.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>LOA → benefits suspension with reinstatement rules</li>
              <li>COBRA offer timing tied to qualifying events</li>
              <li>Domestic partner attestations and annual re-certification</li>
            </ul>
            <Button type="button" variant="outline" size="sm">
              Configure lifecycle triggers
            </Button>
          </div>
        )
      case 13:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Payroll / HRIS is the system of record for jobs, compensation, and deductions—connect it before you trust
              census or enrollment feeds.
            </p>
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
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {mappingSheet}
          </div>
        )
      case 14:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Link funding accounts and premium remittance preferences so carrier and vendor payments reconcile cleanly.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatLabel label="Primary operating account" readOnly className="bg-muted/50" value="•••• 4821 (demo)" />
              <FloatLabel label="Premium remittance" readOnly className="bg-muted/50" value="ACH — 3-day settlement" />
            </div>
            <Button type="button" variant="outline" size="sm">
              Add funding instructions
            </Button>
          </div>
        )
      case 15:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Carrier feeds carry enrollment, tier changes, and terminations—coordinate timing with payroll deductions.
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
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {mappingSheet}
          </div>
        )
      case 16:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Name the people carriers, payroll, and WEX should call for file issues, testing windows, and cutover.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatLabel label="Primary technical contact" readOnly className="bg-muted/50" value="Jordan Lee" />
              <FloatLabel label="Escalation" readOnly className="bg-muted/50" value="Priya Shah" />
              <FloatLabel label="Carrier TAM" readOnly className="bg-muted/50" value="Assigned at activation" />
              <FloatLabel label="Payroll partner" readOnly className="bg-muted/50" value="ADP specialist (demo)" />
            </div>
          </div>
        )
      case 17:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Align census, eligibility, deduction, and carrier fields. Census, eligibility, CDH, and COBRA share one WEX
              standard where file-based delivery is used.
            </p>
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
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {waitingOnMappingsToggle}
            {mappingSheet}
          </div>
        )
      case 18:
        return (
          <>
            <div className="shrink-0 space-y-2 px-6 pb-3 pt-0">
              <p className="text-sm text-muted-foreground">
                Preview what employees see—site-wide look, navigation, and key enrollment screens. Use{' '}
                <strong className="font-medium text-foreground">Skip for now</strong> if design can wait; the studio stays
                available from your account menu.
              </p>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-border">
              <EmbeddedThemingStudio variant="embedded" />
            </div>
          </>
        )
      case 19:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm a handful of imported rows—titles, classes, and dependents—before you trust rate and eligibility
              runs.
            </p>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Census spot-check</CardTitle>
                <CardDescription>Upload a CSV or pull the latest HRIS snapshot.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" variant="outline">
                  Download template
                </Button>
                <Button type="button">Upload CSV</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add manually</CardTitle>
                <CardDescription>For one-off corrections during testing.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline">
                  Open quick add employee
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      case 20:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Compare a few sample lives against expected payroll deductions and employer contributions.
            </p>
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
          </div>
        )
      case 21:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Re-run eligibility against test census; fix rule gaps before production enrollment opens.
            </p>
            <textarea
              rows={8}
              value={draft.eligibilityNotes}
              onChange={(e) => setDraft((d) => ({ ...d, eligibilityNotes: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
        )
      case 22:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sandbox verification</CardTitle>
                <CardDescription>Confirm end-to-end behavior before you remove test-only flags.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Test employees walk the full enrollment path
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Deduction codes post to payroll test company
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox />
                  Carrier test files accepted
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Rate and tier logic match billing preview
                </label>
              </CardContent>
            </Card>
          </div>
        )
      case 23:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Final blockers</CardTitle>
                <CardDescription>Resolve anything that would stop invites or first payroll deductions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Data mappings signed off
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox />
                  Carrier effective dates confirmed
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Billing / funding account verified
                </label>
              </CardContent>
            </Card>
          </div>
        )
      case 24:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Final approvals</CardTitle>
                <CardDescription>Document sign-off from HR leadership and finance (demo placeholders).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  HR executive approval
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Finance approval on contributions
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox />
                  Broker of record acknowledgment
                </label>
              </CardContent>
            </Card>
          </div>
        )
      case 25:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">First employee access</CardTitle>
                <CardDescription>Confirm at least one real employee can sign in and see the right offers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Invite sent to pilot employee
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Login and MFA completed
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox />
                  Enrollment path completed in production tenant
                </label>
              </CardContent>
            </Card>
            <div className="flex flex-wrap gap-3">
              <Button type="button" size="lg" className="gap-2" onClick={launch}>
                Launch employer portal
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/">Back to dashboard</Link>
              </Button>
            </div>
          </div>
        )
      case 26:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You’re done with guided setup—admin home is where day-to-day tasks, tickets, and announcements live.
            </p>
            <Button type="button" size="lg" asChild>
              <Link to="/">Go to admin home</Link>
            </Button>
          </div>
        )
      case 27:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Keep integrations, rates, and rules current as products and statutes change.
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Quarterly carrier and payroll reconciliation</li>
              <li>Annual renewal and open enrollment prep</li>
              <li>Document updates (SPD, SBC, notices)</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/">Open dashboard</Link>
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/settings">Account settings</Link>
              </Button>
            </div>
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
        <header className="mb-6 shrink-0 lg:mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Guided employer setup</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Phase {phaseIndexForTask(stepIndex) + 1} of {PHASES.length} · {phaseMeta.phase.title}
            </span>
            <span className="text-muted-foreground"> · </span>
            {TASK_LABELS[stepIndex]}
            <span className="text-muted-foreground">
              {' '}
              · Task {phaseMeta.indexInPhase + 1} of {phaseMeta.phaseSize} in this phase
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              This phase: {currentPhaseRequired.complete} of {currentPhaseRequired.total} required tasks complete
            </span>
            {currentPhaseOptionalLine ? (
              <>
                <span className="text-muted-foreground"> · </span>
                <span>{currentPhaseOptionalLine}</span>
              </>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Overall:{' '}
            <span className="font-medium text-foreground">
              {finishedRequiredCount} of {totalRequiredTasks} required tasks complete
            </span>
          </p>
        </header>

        <div
          className={cn(
            'flex flex-col gap-8 lg:flex-row lg:gap-10',
            stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX ? 'min-h-0 flex-1 lg:items-stretch' : 'lg:items-start',
          )}
        >
          <aside className="order-2 shrink-0 lg:order-1 lg:w-[17.5rem] xl:w-[18.5rem]">
            <nav aria-labelledby="setup-phases-heading" className="lg:sticky lg:top-24">
              <div className="mb-1 flex items-center gap-0.5">
                <p
                  id="setup-phases-heading"
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Phases
                </p>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  aria-expanded={phasesHelpOpen}
                  aria-controls="setup-phases-help"
                  onClick={() => setPhasesHelpOpen((o) => !o)}
                >
                  <Info className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  <span className="sr-only">How phases and task status work</span>
                </button>
              </div>
              {phasesHelpOpen ? <SetupPhasesHelpPanel id="setup-phases-help" /> : null}
              <ol className="scrollbar-hide mt-2 flex max-h-[min(52vh,30rem)] flex-col gap-1 overflow-y-auto pb-1 lg:max-h-none lg:overflow-visible lg:pb-0">
                {PHASES.map((phase, phaseIdx) => {
                  const badge = phaseBadgeMode(phase, draft.taskOutcomes, stepIndex)
                  const phaseContainsCurrent = phase.taskIndices.includes(stepIndex)
                  const phaseSelected = selectedPhaseIndex === phaseIdx
                  const reqProgress = phaseRequiredProgress(phase, draft.taskOutcomes)
                  const optLine = formatOptionalSummaryLine(phaseOptionalSummary(phase, draft.taskOutcomes))
                  const waitingPhase = phaseHasWaitingOnOthers(phase, draft.taskOutcomes)

                  return (
                    <li
                      key={phase.title}
                      className={cn(
                        'rounded-lg border border-transparent',
                        phaseContainsCurrent && 'border-primary/20 bg-primary/[0.04]',
                        phaseSelected && 'border-border/80 bg-muted/20',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPhaseIndex(phaseIdx)}
                        className={cn(
                          'flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                          'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                        )}
                        aria-expanded={phaseSelected}
                        aria-controls={`setup-phase-panel-${phaseIdx}`}
                        aria-label={`${phase.title}, ${reqProgress.complete} of ${reqProgress.total} required tasks complete${optLine ? `, ${optLine}` : ''}`}
                        id={`setup-phase-trigger-${phaseIdx}`}
                      >
                        <span className="mt-0.5 text-muted-foreground" aria-hidden>
                          {phaseSelected ? (
                            <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2} />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2} />
                          )}
                        </span>
                        <span
                          className={cn(
                            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums',
                            badge === 'all_complete' && 'bg-emerald-600/90 text-white',
                            badge === 'partial_skipped' &&
                              'border border-amber-500/50 bg-amber-500/15 text-amber-900 dark:text-amber-100',
                            badge === 'active' && 'bg-primary text-primary-foreground',
                            badge === 'behind' &&
                              'border border-amber-600/40 bg-amber-500/15 text-amber-900 dark:text-amber-100',
                            badge === 'upcoming' && 'bg-muted/80 text-muted-foreground',
                          )}
                          aria-hidden
                        >
                          {badge === 'all_complete' ? (
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                          ) : badge === 'partial_skipped' ? (
                            <Minus className="h-3 w-3" strokeWidth={2.5} />
                          ) : badge === 'behind' ? (
                            <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
                          ) : (
                            phaseIdx + 1
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[13px] font-semibold leading-snug text-foreground">{phase.title}</span>
                            {waitingPhase ? (
                              <span
                                className="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1 py-0 text-[9px] font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100"
                                title="A task in this phase is waiting on an external party"
                              >
                                <Clock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                                Waiting
                              </span>
                            ) : null}
                          </span>
                          {!phaseSelected ? (
                            <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                              {reqProgress.complete} of {reqProgress.total} required done
                              {optLine ? ` · ${optLine}` : ''}
                              {phaseContainsCurrent ? ' · You are here' : ''}
                            </span>
                          ) : (
                            <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                              {phase.description}
                            </span>
                          )}
                        </span>
                      </button>

                      {phaseSelected ? (
                        <div
                          className="border-t border-border/50 px-2 pb-2 pt-1"
                          id={`setup-phase-panel-${phaseIdx}`}
                          role="region"
                          aria-labelledby={`setup-phase-trigger-${phaseIdx}`}
                        >
                          <p className="mb-1.5 px-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                            Tasks in this phase
                          </p>
                          <p className="mb-2 px-1 text-[10px] font-medium text-foreground">
                            {reqProgress.complete} of {reqProgress.total} required complete
                            {optLine ? ` · ${optLine}` : ''}
                          </p>
                          <ol className="space-y-0.5 border-l border-border/60 pl-2">
                            {phase.taskIndices.map((taskIdx, ord) => {
                              const navStatus = resolveTaskNavStatus(taskIdx, stepIndex, draft.taskOutcomes)
                              const current = taskIdx === stepIndex
                              const label = TASK_LABELS[taskIdx]
                              const blocked = navStatus === 'blocked'
                              const optional = OPTIONAL_TASK_IDS.has(taskIdx)
                              const taskOrdinalInPhase = ord + 1
                              return (
                                <li key={label}>
                                  <button
                                    type="button"
                                    onClick={() => goToTask(taskIdx)}
                                    className={cn(
                                      'flex w-full items-center gap-2 rounded-md py-1 pl-1.5 pr-1 text-left text-[11px] leading-tight transition-colors',
                                      current &&
                                        !blocked &&
                                        'bg-primary/10 font-medium text-foreground ring-1 ring-primary/25',
                                      current &&
                                        blocked &&
                                        'bg-amber-500/10 font-medium text-foreground ring-1 ring-amber-400/35',
                                      !current && !blocked && 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                                      !current && blocked && 'text-muted-foreground hover:bg-muted/50',
                                    )}
                                    aria-current={current ? 'step' : undefined}
                                    aria-label={`${label}, ${optional ? 'Optional. ' : ''}${TASK_STATUS_LABEL[navStatus]}${blocked ? '. You can open this to preview; finish earlier steps to complete it.' : ''}`}
                                  >
                                    <TaskStatusGlyph status={navStatus} taskNumber={taskOrdinalInPhase} />
                                    <span className="min-w-0 flex-1 truncate">{label}</span>
                                    {optional ? (
                                      <span
                                        className="shrink-0 rounded bg-muted/80 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-muted-foreground"
                                        title="Optional Marketplace add-ons (pet, legal, and similar)—not required for launch"
                                      >
                                        Optional
                                      </span>
                                    ) : null}
                                    {navStatus === 'waiting_on_others' ? (
                                      <Clock className="h-3 w-3 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
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
            </nav>
          </aside>

          <div
            className={cn(
              'order-1 min-w-0 flex-1 space-y-5',
              stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX && 'flex min-h-0 flex-col',
            )}
          >
            <Card className={cn('shadow-sm', stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX && 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
              <CardHeader className={cn('px-6 pb-4', stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX && 'shrink-0')}>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl">{TASK_LABELS[stepIndex]}</CardTitle>
                  <Badge intent="default" className="rounded-full text-[11px] font-normal">
                    {TASK_STATUS_LABEL[resolveTaskNavStatus(stepIndex, stepIndex, taskOutcomes)]}
                  </Badge>
                </div>
                <CardDescription>
                  {OPTIONAL_TASK_IDS.has(stepIndex)
                    ? 'This is an optional task—it does not count toward required setup progress. Skipped optional work stays visible in the list but is not treated as done.'
                    : 'This is a required task—it counts toward your required progress when you finish the work and tap Next. Skips stay visible but do not count as done.'}{' '}
                  Progress saves automatically in this browser.
                </CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  stepIndex === PREVIEW_EMPLOYEE_TASK_INDEX ? 'flex min-h-0 flex-1 flex-col space-y-0 p-0' : 'space-y-6',
                )}
              >
                {currentBlocked && prereqForCurrent !== undefined ? (
                  <div
                    className="mb-4 space-y-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
                    role="status"
                  >
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
                          Use the phases on the left to revisit a completed step, or use the button below to open what’s
                          blocking you.
                        </p>
                      )}
                      {availableNowTasks.length > 5 ? (
                        <p className="mt-1 text-xs text-muted-foreground">+ more in the task list</p>
                      ) : null}
                    </div>
                    <div className="border-t border-border/60 pt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        This screen
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-foreground">
                        You can look around, but you won’t be able to move forward here until an earlier piece is wrapped
                        up.
                      </p>
                    </div>
                    <div className="border-t border-border/60 pt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        What unlocks this step
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {unlockGuidanceForPrereq(prereqForCurrent, taskOutcomes)}
                      </p>
                      <Button type="button" size="sm" className="mt-2" onClick={() => goToTask(prereqForCurrent)}>
                        Go to {TASK_LABELS[prereqForCurrent]}
                      </Button>
                    </div>
                  </div>
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
