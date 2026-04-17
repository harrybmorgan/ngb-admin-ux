import { Button, ButtonGroup } from '@wexinc-healthbenefits/ben-ui-kit'
import { BarChart3, Table2 } from 'lucide-react'
import type { ReportViewMode } from '@/lib/reportCustomization'

type ReportViewToggleProps = {
  value: ReportViewMode
  onChange: (v: ReportViewMode) => void
}

export function ReportViewToggle({ value, onChange }: ReportViewToggleProps) {
  return (
    <ButtonGroup className="rounded-xl border border-[#d0d7e6] p-0.5">
      <Button
        type="button"
        variant={value === 'table' ? 'solid' : 'ghost'}
        intent={value === 'table' ? 'primary' : undefined}
        size="sm"
        className="gap-1.5 rounded-lg px-3"
        onClick={() => onChange('table')}
      >
        <Table2 className="h-3.5 w-3.5" aria-hidden />
        Table
      </Button>
      <Button
        type="button"
        variant={value === 'chart' ? 'solid' : 'ghost'}
        intent={value === 'chart' ? 'primary' : undefined}
        size="sm"
        className="gap-1.5 rounded-lg px-3"
        onClick={() => onChange('chart')}
      >
        <BarChart3 className="h-3.5 w-3.5" aria-hidden />
        Chart
      </Button>
    </ButtonGroup>
  )
}
