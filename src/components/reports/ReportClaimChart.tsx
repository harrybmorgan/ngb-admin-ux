import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReportDetailClaimRow } from '@/data/adminMockData'

type ReportClaimChartProps = {
  rows: readonly ReportDetailClaimRow[]
}

export function ReportClaimChart({ rows }: ReportClaimChartProps) {
  const data = useMemo(() => {
    let paid = 0
    let processing = 0
    let hold = 0
    for (const r of rows) {
      if (r.claimStatus === 'paid') paid += 1
      else if (r.claimStatus === 'processing') processing += 1
      else hold += 1
    }
    return [
      { name: 'Paid', count: paid, fill: '#059669' },
      { name: 'Processing', count: processing, fill: '#d97706' },
      { name: 'Hold', count: hold, fill: '#dc2626' },
    ]
  }, [rows])

  return (
    <div className="h-[320px] w-full rounded-xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-medium text-[#14182c]">Claims by status</p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf4" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5f6a94' }} axisLine={{ stroke: '#e8ecf4' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5f6a94' }} axisLine={{ stroke: '#e8ecf4' }} />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e8ecf4',
              fontSize: '13px',
            }}
            formatter={(value: number | string) => [value, 'Claims']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
