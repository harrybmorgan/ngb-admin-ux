/**
 * Saved per-report layout for the report detail / customize flow (prototype: localStorage).
 */

export const ALL_REPORT_COLUMN_IDS = [
  'methodFiled',
  'employerName',
  'submitDate',
  'claimNumber',
  'planType',
  'planDisplayName',
  'claimStatus',
  'claimProcessingStatus',
] as const

export type ReportColumnId = (typeof ALL_REPORT_COLUMN_IDS)[number]

const COLUMN_ID_SET = new Set<string>(ALL_REPORT_COLUMN_IDS)

/** User-added columns (prototype); persisted ids are `custom:<uuid>`. */
export const CUSTOM_COLUMN_PREFIX = 'custom:' as const

export const ADDABLE_CUSTOM_COLUMN_TYPES = [
  { id: 'text', label: 'Text', placeholder: '—' },
  { id: 'number', label: 'Number', placeholder: '0' },
  { id: 'date', label: 'Date', placeholder: '—' },
  { id: 'currency', label: 'Currency', placeholder: '$0.00' },
] as const

export type ReportCustomColumnTypeId = (typeof ADDABLE_CUSTOM_COLUMN_TYPES)[number]['id']

const CUSTOM_COLUMN_TYPE_SET = new Set<string>(
  ADDABLE_CUSTOM_COLUMN_TYPES.map((t) => t.id),
)

export function isCustomColumnId(id: string): boolean {
  return id.startsWith(CUSTOM_COLUMN_PREFIX)
}

export function isBuiltInColumnId(id: string): id is ReportColumnId {
  return COLUMN_ID_SET.has(id)
}

export type ReportFilterId = 'dateRange' | 'claimStatus' | 'plan'

export type ReportViewMode = 'table' | 'chart'

export type ReportColumnConfig = {
  /** Built-in field id or `custom:<uuid>` for user-added column types. */
  id: string
  /** When false, column is off in the report and listed at the bottom of the customize list. */
  enabled: boolean
  /** Built-in: overrides default label. Custom: display name for the column. */
  customLabel?: string
  /** Set for `custom:*` columns only. */
  customColumnType?: ReportCustomColumnTypeId
}

export type ReportCustomization = {
  /** Ordered list of columns to show; order is preserved in the table. */
  columns: ReportColumnConfig[]
  enabledFilters: ReportFilterId[]
  defaultView: ReportViewMode
  /** Saved display title; falls back to library name when unset. */
  displayName?: string
  /** Saved display description; falls back to library description when unset. */
  displayDescription?: string
}

const STORAGE_PREFIX = 'ngb-admin-ux-report-customization-v2-'

/** Legacy storage key (v1 used `visibleColumns` only). */
const STORAGE_PREFIX_LEGACY = 'ngb-admin-ux-report-customization-v1-'

export const DEFAULT_REPORT_CUSTOMIZATION: ReportCustomization = {
  columns: ALL_REPORT_COLUMN_IDS.map((id) => ({ id, enabled: true })),
  enabledFilters: ['dateRange', 'claimStatus', 'plan'],
  defaultView: 'table',
}

function normalizeCustomColumnConfig(c: ReportColumnConfig): ReportColumnConfig {
  const enabled = typeof c.enabled === 'boolean' ? c.enabled : true
  const type: ReportCustomColumnTypeId =
    c.customColumnType && CUSTOM_COLUMN_TYPE_SET.has(c.customColumnType) ? c.customColumnType : 'text'
  return {
    id: c.id,
    enabled,
    customColumnType: type,
    customLabel: typeof c.customLabel === 'string' && c.customLabel.trim() !== '' ? c.customLabel.trim() : undefined,
  }
}

/** Every built-in field appears once; enabled rows first, then disabled; custom columns follow in order. */
function expandToFullColumnList(cols: ReportColumnConfig[]): ReportColumnConfig[] {
  const builtInFromInput: ReportColumnConfig[] = []
  const customFromInput: ReportColumnConfig[] = []
  const seenBuiltIn = new Set<string>()

  for (const c of cols) {
    if (isCustomColumnId(c.id)) {
      customFromInput.push(c)
      continue
    }
    if (!COLUMN_ID_SET.has(c.id)) continue
    if (seenBuiltIn.has(c.id)) continue
    seenBuiltIn.add(c.id)
    builtInFromInput.push({
      id: c.id,
      enabled: typeof c.enabled === 'boolean' ? c.enabled : true,
    })
  }

  for (const id of ALL_REPORT_COLUMN_IDS) {
    if (!seenBuiltIn.has(id)) {
      builtInFromInput.push({ id, enabled: false })
    }
  }

  const enabled = builtInFromInput.filter((c) => c.enabled)
  const disabled = builtInFromInput.filter((c) => !c.enabled)

  const seenCustom = new Set<string>()
  const customUnique: ReportColumnConfig[] = []
  for (const c of customFromInput) {
    if (seenCustom.has(c.id)) continue
    seenCustom.add(c.id)
    customUnique.push(normalizeCustomColumnConfig(c))
  }

  return [...enabled, ...disabled, ...customUnique]
}

function parseColumnConfig(x: unknown): ReportColumnConfig | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  if (typeof r.id !== 'string') return null

  if (isCustomColumnId(r.id)) {
    const enabled = typeof r.enabled === 'boolean' ? r.enabled : true
    const rawType = r.customColumnType
    if (typeof rawType !== 'string' || !CUSTOM_COLUMN_TYPE_SET.has(rawType)) return null
    const customColumnType = rawType as ReportCustomColumnTypeId
    if (typeof r.customLabel === 'string' && r.customLabel.trim() !== '') {
      return { id: r.id, enabled, customColumnType, customLabel: r.customLabel.trim() }
    }
    return { id: r.id, enabled, customColumnType }
  }

  if (!COLUMN_ID_SET.has(r.id)) return null
  const id = r.id as ReportColumnId
  const enabled = typeof r.enabled === 'boolean' ? r.enabled : true
  if (typeof r.customLabel === 'string' && r.customLabel.trim() !== '') {
    return { id, enabled, customLabel: r.customLabel }
  }
  return { id, enabled }
}

function migrateVisibleColumns(visibleColumns: unknown): ReportColumnConfig[] | null {
  if (!Array.isArray(visibleColumns)) return null
  const cols = visibleColumns.filter(
    (x): x is ReportColumnId => typeof x === 'string' && COLUMN_ID_SET.has(x),
  )
  if (cols.length === 0) return null
  return cols.map((id) => ({ id, enabled: true as boolean }))
}

function normalizeCustomization(raw: unknown): ReportCustomization {
  const base: ReportCustomization = {
    columns: DEFAULT_REPORT_CUSTOMIZATION.columns.map((c) => ({ ...c })),
    enabledFilters: [...DEFAULT_REPORT_CUSTOMIZATION.enabledFilters],
    defaultView: DEFAULT_REPORT_CUSTOMIZATION.defaultView,
  }
  if (!raw || typeof raw !== 'object') return base
  const o = raw as Record<string, unknown>

  if (Array.isArray(o.columns)) {
    const parsed = o.columns.map(parseColumnConfig).filter((x): x is ReportColumnConfig => x != null)
    const seen = new Set<string>()
    const unique: ReportColumnConfig[] = []
    for (const c of parsed) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      unique.push(c)
    }
    if (unique.length > 0) base.columns = expandToFullColumnList(unique)
  } else {
    const migrated = migrateVisibleColumns(o.visibleColumns)
    if (migrated && migrated.length > 0) base.columns = expandToFullColumnList(migrated)
  }

  if (Array.isArray(o.enabledFilters)) {
    const allowed: ReportFilterId[] = ['dateRange', 'claimStatus', 'plan']
    const filters = o.enabledFilters.filter(
      (x): x is ReportFilterId => typeof x === 'string' && allowed.includes(x as ReportFilterId),
    )
    base.enabledFilters = filters
  }

  if (o.defaultView === 'table' || o.defaultView === 'chart') {
    base.defaultView = o.defaultView
  }

  if (typeof o.displayName === 'string') {
    base.displayName = o.displayName
  }
  if (typeof o.displayDescription === 'string') {
    base.displayDescription = o.displayDescription
  }

  return base
}

/**
 * Saved displayName / displayDescription in localStorage override the catalog. When a report is
 * renamed in REPORT_LIBRARY, clear persisted values that match the old strings so the new defaults show.
 */
const LEGACY_REPORT_PRESENTATION: Record<
  string,
  { displayNames?: readonly string[]; displayDescriptions?: readonly string[] }
> = {
  r1: {
    displayNames: ['Payroll deduction reconciliation'],
    displayDescriptions: ['Compare payroll deductions to funding and variances.'],
  },
}

function migrateLegacyReportPresentation(reportId: string, c: ReportCustomization): ReportCustomization {
  const leg = LEGACY_REPORT_PRESENTATION[reportId]
  if (!leg) return c

  let displayName = c.displayName
  let displayDescription = c.displayDescription
  const dn = displayName?.trim() ?? ''
  if (leg.displayNames?.includes(dn)) {
    displayName = undefined
  }
  const dd = displayDescription?.trim() ?? ''
  if (leg.displayDescriptions?.includes(dd)) {
    displayDescription = undefined
  }

  if (displayName === c.displayName && displayDescription === c.displayDescription) {
    return c
  }
  return { ...c, displayName, displayDescription }
}

/** Built-in title overrides are not edited in the UI; custom columns keep their label and type. */
export function stripColumnCustomLabels(customization: ReportCustomization): ReportCustomization {
  return {
    ...customization,
    columns: customization.columns.map((c) => {
      if (isCustomColumnId(c.id)) {
        return normalizeCustomColumnConfig(c)
      }
      return {
        id: c.id,
        enabled: typeof c.enabled === 'boolean' ? c.enabled : true,
      }
    }),
  }
}

export function loadReportCustomization(reportId: string): ReportCustomization {
  const fallback = (): ReportCustomization =>
    stripColumnCustomLabels({
      columns: DEFAULT_REPORT_CUSTOMIZATION.columns.map((c) => ({ ...c })),
      enabledFilters: [...DEFAULT_REPORT_CUSTOMIZATION.enabledFilters],
      defaultView: DEFAULT_REPORT_CUSTOMIZATION.defaultView,
    })

  try {
    const v2 = localStorage.getItem(`${STORAGE_PREFIX}${reportId}`)
    if (v2) {
      const n = normalizeCustomization(JSON.parse(v2) as unknown)
      let result = stripColumnCustomLabels({ ...n, columns: expandToFullColumnList(n.columns) })
      const migrated = migrateLegacyReportPresentation(reportId, result)
      if (migrated !== result) {
        result = migrated
        saveReportCustomization(reportId, result)
      }
      return result
    }
    const legacy = localStorage.getItem(`${STORAGE_PREFIX_LEGACY}${reportId}`)
    if (legacy) {
      const n = normalizeCustomization(JSON.parse(legacy) as unknown)
      let result = stripColumnCustomLabels({ ...n, columns: expandToFullColumnList(n.columns) })
      const migrated = migrateLegacyReportPresentation(reportId, result)
      if (migrated !== result) {
        result = migrated
        saveReportCustomization(reportId, result)
      }
      return result
    }
    return fallback()
  } catch {
    return fallback()
  }
}

export function saveReportCustomization(reportId: string, customization: ReportCustomization): void {
  const columns =
    customization.columns.length > 0
      ? customization.columns
      : DEFAULT_REPORT_CUSTOMIZATION.columns.map((c) => ({ ...c }))

  const payload = stripColumnCustomLabels({
    ...customization,
    columns,
    enabledFilters: customization.enabledFilters,
    defaultView: customization.defaultView,
  })
  localStorage.setItem(`${STORAGE_PREFIX}${reportId}`, JSON.stringify(payload))
}

/** Title and description for UI (saved overrides or library defaults). */
export function resolveReportPresentation(
  library: { name: string; description: string },
  customization: ReportCustomization,
): { title: string; description: string } {
  const title = customization.displayName?.trim() || library.name
  const description =
    customization.displayDescription !== undefined
      ? customization.displayDescription.trim()
      : library.description
  return { title, description }
}

export function getReportColumnLabel(c: ReportColumnConfig): string {
  if (isCustomColumnId(c.id)) {
    const explicit = c.customLabel?.trim()
    if (explicit) return explicit
    const t = c.customColumnType
    if (t) {
      const found = ADDABLE_CUSTOM_COLUMN_TYPES.find((x) => x.id === t)
      if (found) return found.label
    }
    return 'Custom column'
  }
  if (isBuiltInColumnId(c.id)) {
    return c.customLabel?.trim() ? c.customLabel.trim() : REPORT_COLUMN_LABELS[c.id]
  }
  return c.customLabel?.trim() || c.id
}

export type ResolvedReportTableColumn = {
  id: string
  label: string
  customColumnType?: ReportCustomColumnTypeId
}

/** Resolved header labels for the data table (enabled columns only, in order). */
export function resolveColumnHeaders(columns: readonly ReportColumnConfig[]): ResolvedReportTableColumn[] {
  return columns
    .filter((c) => c.enabled)
    .map((c) => {
      const base: ResolvedReportTableColumn = {
        id: c.id,
        label: getReportColumnLabel(c),
      }
      if (isCustomColumnId(c.id) && c.customColumnType) {
        base.customColumnType = c.customColumnType
      }
      return base
    })
}

/** Creates a new user-defined column (saved with the report customization). */
export function getCustomColumnCellPlaceholder(type: ReportCustomColumnTypeId | undefined): string {
  if (!type) return '—'
  return ADDABLE_CUSTOM_COLUMN_TYPES.find((t) => t.id === type)?.placeholder ?? '—'
}

export function createCustomColumnConfig(
  columnType: ReportCustomColumnTypeId,
  displayName?: string,
): ReportColumnConfig {
  const id = `${CUSTOM_COLUMN_PREFIX}${crypto.randomUUID()}`
  const typeMeta = ADDABLE_CUSTOM_COLUMN_TYPES.find((t) => t.id === columnType)
  const label = displayName?.trim() || typeMeta?.label || 'Custom column'
  return {
    id,
    enabled: true,
    customColumnType: columnType,
    customLabel: label,
  }
}

export const REPORT_COLUMN_LABELS: Record<ReportColumnId, string> = {
  methodFiled: 'Method Filed',
  employerName: 'Employer Name',
  submitDate: 'Submit Date',
  claimNumber: 'Claim Number',
  planType: 'Plan Type',
  planDisplayName: 'Plan Display Name',
  claimStatus: 'Claim Status',
  claimProcessingStatus: 'Claim Processing Status',
}

export const REPORT_FILTER_LABELS: Record<ReportFilterId, string> = {
  dateRange: 'Date range',
  claimStatus: 'Claim status',
  plan: 'Plan',
}
