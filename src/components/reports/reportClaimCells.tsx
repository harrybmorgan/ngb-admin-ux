import { Check, Clock, X } from 'lucide-react'
import type { ReportDetailClaimStatus } from '@/data/adminMockData'
import { cn } from '@/lib/utils'

export function ClaimStatusText({ status }: { status: ReportDetailClaimStatus }) {
  const config: Record<
    ReportDetailClaimStatus,
    { label: string; icon: typeof Check; textClass: string }
  > = {
    paid: {
      label: 'Paid',
      icon: Check,
      textClass: 'text-emerald-700 dark:text-emerald-300',
    },
    processing: {
      label: 'Processing',
      icon: Clock,
      textClass: 'text-amber-800 dark:text-amber-200',
    },
    hold: {
      label: 'Hold',
      icon: X,
      textClass: 'text-red-700 dark:text-red-300',
    },
  }
  const { label, icon: Icon, textClass } = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-medium', textClass)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  )
}
