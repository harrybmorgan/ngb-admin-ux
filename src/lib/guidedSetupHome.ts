import { GUIDED_SETUP_WIZARD_DRAFT_KEY } from '@/hooks/useEmployerSetup'

/** Keep in sync with `SetupWizardPage` TASK_LABELS length. */
export const GUIDED_SETUP_TASK_COUNT = 14

/** Optional wizard tasks — mirror `SetupWizardPage` OPTIONAL_TASK_IDS. */
const OPTIONAL_TASK_IDS = new Set<number>([8, 9, 11, 12])

export type GuidedTaskOutcome = 'pending' | 'complete' | 'skipped' | 'waiting_on_others' | 'needs_review'

export type GuidedRangeRollup =
  | 'all_complete'
  | 'attention'
  | 'in_progress'
  | 'not_started'

const ALLOWED = new Set<string>(['pending', 'complete', 'skipped', 'waiting_on_others', 'needs_review'])

export function isGuidedTaskRequired(taskIndex: number): boolean {
  return !OPTIONAL_TASK_IDS.has(taskIndex)
}

export function normalizeGuidedOutcomes(raw: unknown): GuidedTaskOutcome[] {
  if (!Array.isArray(raw) || raw.length !== GUIDED_SETUP_TASK_COUNT) {
    return Array.from({ length: GUIDED_SETUP_TASK_COUNT }, () => 'pending')
  }
  return raw.map((x) => (ALLOWED.has(String(x)) ? (x as GuidedTaskOutcome) : 'pending'))
}

export type GuidedDraftSnapshot = {
  stepIndex: number
  outcomes: GuidedTaskOutcome[]
}

export function readGuidedDraftSnapshot(): GuidedDraftSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GUIDED_SETUP_WIZARD_DRAFT_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as { stepIndex?: unknown; taskOutcomes?: unknown }
    const stepIndex =
      typeof o.stepIndex === 'number'
        ? Math.min(Math.max(0, o.stepIndex), GUIDED_SETUP_TASK_COUNT - 1)
        : 0
    return { stepIndex, outcomes: normalizeGuidedOutcomes(o.taskOutcomes) }
  } catch {
    return null
  }
}

export function guidedRequiredProgress(outcomes: readonly GuidedTaskOutcome[]): { complete: number; total: number } {
  let complete = 0
  let total = 0
  for (let i = 0; i < GUIDED_SETUP_TASK_COUNT; i++) {
    if (!isGuidedTaskRequired(i)) continue
    total++
    if (outcomes[i] === 'complete') complete++
  }
  return { complete, total }
}

function rollupForIndices(indices: readonly number[], outcomes: readonly GuidedTaskOutcome[]): GuidedRangeRollup {
  const slice = indices.map((i) => outcomes[i]!)
  if (slice.every((o) => o === 'complete')) return 'all_complete'
  if (slice.some((o) => o === 'needs_review' || o === 'waiting_on_others')) return 'attention'
  if (slice.every((o) => o === 'pending')) return 'not_started'
  return 'in_progress'
}

/** Employee setup block: add employees, groups/classes, waiting periods & life events. */
const EMPLOYEE_TASK_INDICES = [2, 3, 4] as const

export function employeeSetupRollup(outcomes: readonly GuidedTaskOutcome[]): GuidedRangeRollup {
  return rollupForIndices(EMPLOYEE_TASK_INDICES, outcomes)
}

export function integrationsRollup(outcomes: readonly GuidedTaskOutcome[]): GuidedRangeRollup {
  return rollupForIndices([9], outcomes)
}

export function marketplaceRollup(outcomes: readonly GuidedTaskOutcome[]): GuidedRangeRollup {
  return rollupForIndices([8], outcomes)
}

/** Core benefits configuration before marketplace: products, shared dates, configure plans. */
export function benefitsPlansRollup(outcomes: readonly GuidedTaskOutcome[]): GuidedRangeRollup {
  return rollupForIndices([5, 6, 7], outcomes)
}

export function rolesRollup(outcomes: readonly GuidedTaskOutcome[]): GuidedRangeRollup {
  return rollupForIndices([1], outcomes)
}

/**
 * Top-level wizard steps — keep `taskIndices` in sync with `SetupWizardPage` `WIZARD_STEPS`.
 */
export const WIZARD_STEP_GROUPS_FOR_HOME = [
  { title: 'Company basics', taskIndices: [0, 1] as const },
  { title: 'Employee setup', taskIndices: [2, 3, 4] as const },
  { title: 'Benefits', taskIndices: [5, 6, 7, 8] as const },
  { title: 'Connect Systems', taskIndices: [9] as const },
  { title: 'Test & Launch', taskIndices: [10, 11, 12, 13] as const },
] as const

function requiredTasksLeftInStep(
  step: (typeof WIZARD_STEP_GROUPS_FOR_HOME)[number],
  outcomes: readonly GuidedTaskOutcome[],
): number {
  return step.taskIndices.filter((i) => isGuidedTaskRequired(i) && outcomes[i] !== 'complete').length
}

/**
 * Hero meta line: current focus step and how many required tasks remain in that step,
 * else the first step that still has required work.
 */
export function getWizardHeroMeta(snapshot: GuidedDraftSnapshot): { stepTitle: string; stepsLeft: number } {
  const { outcomes, stepIndex } = snapshot

  const stepWithCursor = WIZARD_STEP_GROUPS_FOR_HOME.find((s) => (s.taskIndices as readonly number[]).includes(stepIndex))
  if (stepWithCursor) {
    const left = requiredTasksLeftInStep(stepWithCursor, outcomes)
    if (left > 0) return { stepTitle: stepWithCursor.title, stepsLeft: left }
  }

  for (const s of WIZARD_STEP_GROUPS_FOR_HOME) {
    const left = requiredTasksLeftInStep(s, outcomes)
    if (left > 0) return { stepTitle: s.title, stepsLeft: left }
  }

  return { stepTitle: 'Setup', stepsLeft: 0 }
}

export function formatStepsLeftPhrase(stepsLeft: number): string {
  if (stepsLeft <= 0) return 'No required steps left'
  return stepsLeft === 1 ? '1 step left' : `${stepsLeft} steps left`
}
