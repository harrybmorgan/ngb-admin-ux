/**
 * Prototype: saved preview filter sets on the report customize page (localStorage, per report).
 */

import {
  CLAIM_STATUS_FILTER_OPTIONS,
  DATE_RANGE_OPTIONS,
  PLAN_FILTER_OPTIONS,
  type ClaimStatusFilterValue,
} from '@/lib/reportClaimModel'

export type SavedFilterPreset = {
  id: string
  title: string
  dateRange: (typeof DATE_RANGE_OPTIONS)[number]
  claimStatusFilter: ClaimStatusFilterValue
  planFilter: string
}

const STORAGE_PREFIX = 'ngb-admin-ux-report-customize-saved-filters-'

const DATE_RANGE_SET = new Set<string>(DATE_RANGE_OPTIONS)
const PLAN_SET = new Set<string>(PLAN_FILTER_OPTIONS)
const STATUS_VALUES = new Set<ClaimStatusFilterValue>(
  CLAIM_STATUS_FILTER_OPTIONS.map((o) => o.value),
)

function storageKey(reportId: string): string {
  return `${STORAGE_PREFIX}${reportId}`
}

function parsePreset(x: unknown): SavedFilterPreset | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  if (typeof r.id !== 'string' || r.id.length === 0) return null
  if (typeof r.title !== 'string' || r.title.trim() === '') return null
  if (typeof r.dateRange !== 'string' || !DATE_RANGE_SET.has(r.dateRange)) return null
  if (typeof r.planFilter !== 'string' || !PLAN_SET.has(r.planFilter)) return null
  if (typeof r.claimStatusFilter !== 'string' || !STATUS_VALUES.has(r.claimStatusFilter as ClaimStatusFilterValue)) {
    return null
  }
  return {
    id: r.id,
    title: r.title.trim(),
    dateRange: r.dateRange as SavedFilterPreset['dateRange'],
    claimStatusFilter: r.claimStatusFilter as ClaimStatusFilterValue,
    planFilter: r.planFilter,
  }
}

export function loadSavedFilterPresets(reportId: string): SavedFilterPreset[] {
  try {
    const raw = localStorage.getItem(storageKey(reportId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(parsePreset).filter((x): x is SavedFilterPreset => x != null)
  } catch {
    return []
  }
}

export function saveSavedFilterPresets(reportId: string, presets: SavedFilterPreset[]): void {
  localStorage.setItem(storageKey(reportId), JSON.stringify(presets))
}

export function addSavedFilterPreset(
  reportId: string,
  data: Omit<SavedFilterPreset, 'id'>,
): SavedFilterPreset {
  const preset: SavedFilterPreset = {
    ...data,
    id: crypto.randomUUID(),
  }
  const list = loadSavedFilterPresets(reportId)
  list.push(preset)
  saveSavedFilterPresets(reportId, list)
  return preset
}
