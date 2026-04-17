import type { ReportDetailClaimRow, ReportDetailClaimStatus, ReportDetailPlanType } from '@/data/adminMockData'
import type { ReportFilterId } from '@/lib/reportCustomization'

export const DATE_RANGE_OPTIONS = ['Last 30 Days', 'Last 90 Days', 'Year to date'] as const
export const PLAN_FILTER_OPTIONS = ['All Plans', 'Medical FSA', 'Dependent Care', 'HSA'] as const

export type ClaimStatusFilterValue = 'all' | ReportDetailClaimStatus

export const CLAIM_STATUS_FILTER_OPTIONS: { value: ClaimStatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'hold', label: 'Hold' },
]

export function parseSubmitDateMmDdYyyy(s: string): Date {
  const parts = s.split('/')
  if (parts.length !== 3) return new Date(NaN)
  const month = Number(parts[0])
  const day = Number(parts[1])
  const year = Number(parts[2])
  return new Date(year, month - 1, day)
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function maxSubmitDate(rows: readonly ReportDetailClaimRow[]): Date {
  if (rows.length === 0) return startOfDay(new Date())
  let max = parseSubmitDateMmDdYyyy(rows[0]!.submitDate)
  for (const row of rows) {
    const d = parseSubmitDateMmDdYyyy(row.submitDate)
    if (!Number.isNaN(d.getTime()) && d > max) max = d
  }
  return startOfDay(max)
}

export function submitDateInRange(
  submitDateStr: string,
  rangeLabel: (typeof DATE_RANGE_OPTIONS)[number],
  asOf: Date,
): boolean {
  const d = startOfDay(parseSubmitDateMmDdYyyy(submitDateStr))
  if (Number.isNaN(d.getTime())) return false
  const end = startOfDay(asOf)
  if (d > end) return false

  if (rangeLabel === 'Last 30 Days') {
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    return d >= start && d <= end
  }
  if (rangeLabel === 'Last 90 Days') {
    const start = new Date(end)
    start.setDate(start.getDate() - 89)
    return d >= start && d <= end
  }
  if (rangeLabel === 'Year to date') {
    const start = new Date(end.getFullYear(), 0, 1)
    return d >= start && d <= end
  }
  return true
}

export function planTypeLabel(planType: ReportDetailPlanType): string {
  const labels: Record<ReportDetailPlanType, string> = {
    medical_flex: 'Medical Flex',
    dependent_care: 'Dependent Care',
    hsa: 'Health Savings Account',
  }
  return labels[planType]
}

export function filterClaimRows(
  rows: readonly ReportDetailClaimRow[],
  options: {
    planFilter: string
    claimStatusFilter: ClaimStatusFilterValue
    dateRange: (typeof DATE_RANGE_OPTIONS)[number]
    reportAsOf: Date
    enabledFilters: readonly ReportFilterId[]
  },
): ReportDetailClaimRow[] {
  return rows.filter((row) => {
    if (options.enabledFilters.includes('plan')) {
      const planOk =
        options.planFilter === 'All Plans' ||
        (options.planFilter === 'Medical FSA' && row.planType === 'medical_flex') ||
        (options.planFilter === 'Dependent Care' && row.planType === 'dependent_care') ||
        (options.planFilter === 'HSA' && row.planType === 'hsa')
      if (!planOk) return false
    }

    if (options.enabledFilters.includes('claimStatus')) {
      if (options.claimStatusFilter !== 'all' && row.claimStatus !== options.claimStatusFilter) {
        return false
      }
    }

    if (options.enabledFilters.includes('dateRange')) {
      if (!submitDateInRange(row.submitDate, options.dateRange, options.reportAsOf)) return false
    }

    return true
  })
}
