import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Calendar } from 'lucide-react'
import type { ReportFilterId } from '@/lib/reportCustomization'
import {
  CLAIM_STATUS_FILTER_OPTIONS,
  DATE_RANGE_OPTIONS,
  PLAN_FILTER_OPTIONS,
  type ClaimStatusFilterValue,
} from '@/lib/reportClaimModel'

type ReportClaimFilterBarProps = {
  enabledFilters: readonly ReportFilterId[]
  dateRange: (typeof DATE_RANGE_OPTIONS)[number]
  onDateRangeChange: (v: (typeof DATE_RANGE_OPTIONS)[number]) => void
  claimStatusFilter: ClaimStatusFilterValue
  onClaimStatusFilterChange: (v: ClaimStatusFilterValue) => void
  planFilter: string
  onPlanFilterChange: (v: string) => void
  onReset: () => void
}

export function ReportClaimFilterBar({
  enabledFilters,
  dateRange,
  onDateRangeChange,
  claimStatusFilter,
  onClaimStatusFilterChange,
  planFilter,
  onPlanFilterChange,
  onReset,
}: ReportClaimFilterBarProps) {
  const showDate = enabledFilters.includes('dateRange')
  const showStatus = enabledFilters.includes('claimStatus')
  const showPlan = enabledFilters.includes('plan')
  if (!showDate && !showStatus && !showPlan) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#e8ecf4] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {showDate && (
          <div className="flex w-full min-w-[200px] items-center gap-2 sm:w-auto">
            <Calendar className="h-4 w-4 shrink-0 text-[#5f6a94]" aria-hidden />
            <Select
              value={dateRange}
              onValueChange={(v) => onDateRangeChange(v as (typeof DATE_RANGE_OPTIONS)[number])}
            >
              <SelectTrigger className="w-full min-w-[200px] rounded-xl border-[#d0d7e6]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {showStatus && (
          <Select
            value={claimStatusFilter}
            onValueChange={(v) => onClaimStatusFilterChange(v as ClaimStatusFilterValue)}
          >
            <SelectTrigger className="w-full min-w-[180px] rounded-xl border-[#d0d7e6] sm:w-[200px]">
              <SelectValue placeholder="Claim status" />
            </SelectTrigger>
            <SelectContent>
              {CLAIM_STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showPlan && (
          <Select value={planFilter} onValueChange={onPlanFilterChange}>
            <SelectTrigger className="w-full min-w-[180px] rounded-xl border-[#d0d7e6] sm:w-[200px]">
              <SelectValue placeholder="Plans" />
            </SelectTrigger>
            <SelectContent>
              {PLAN_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Button type="button" variant="outline" className="rounded-xl border-[#d0d7e6]" onClick={onReset}>
        Reset Filters
      </Button>
    </div>
  )
}
