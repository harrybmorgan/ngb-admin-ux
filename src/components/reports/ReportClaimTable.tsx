import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@wexinc-healthbenefits/ben-ui-kit'
import type { ReportDetailClaimRow } from '@/data/adminMockData'
import {
  getCustomColumnCellPlaceholder,
  isBuiltInColumnId,
  type ResolvedReportTableColumn,
} from '@/lib/reportCustomization'
import { planTypeLabel } from '@/lib/reportClaimModel'
import { ClaimStatusText } from '@/components/reports/reportClaimCells'

export type ReportTableColumn = ResolvedReportTableColumn

type ReportClaimTableProps = {
  rows: ReportDetailClaimRow[]
  columns: readonly ReportTableColumn[]
  onRowClick: (row: ReportDetailClaimRow) => void
}

export function ReportClaimTable({
  rows,
  columns,
  onRowClick,
}: ReportClaimTableProps) {
  if (columns.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#d0d7e6] bg-[#f8f9fc] px-4 py-8 text-center text-sm text-[#5f6a94]">
        Add at least one column to show the table.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#e8ecf4] bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col, idx) => (
              <TableHead
                key={`${col.id}-${idx}`}
                className={
                  col.id === 'planDisplayName'
                    ? 'min-w-[220px]'
                    : col.id === 'claimProcessingStatus'
                      ? 'min-w-[180px]'
                      : 'whitespace-nowrap'
                }
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer border-b border-[#eef1f7] last:border-0 hover:bg-[#f8f9fc]"
              onClick={() => onRowClick(row)}
            >
              {columns.map((col, idx) => (
                <TableCell key={`${row.id}-${col.id}-${idx}`} className="align-middle text-[#374056]">
                  {!isBuiltInColumnId(col.id) && (
                    <span className="text-[#9aa3bd] tabular-nums">
                      {getCustomColumnCellPlaceholder(col.customColumnType)}
                    </span>
                  )}
                  {col.id === 'methodFiled' && row.methodFiled}
                  {col.id === 'employerName' && row.employerName}
                  {col.id === 'submitDate' && <span className="tabular-nums">{row.submitDate}</span>}
                  {col.id === 'claimNumber' && (
                    <span className="font-medium tabular-nums">{row.claimNumber}</span>
                  )}
                  {col.id === 'planType' && planTypeLabel(row.planType)}
                  {col.id === 'planDisplayName' && row.planDisplayName}
                  {col.id === 'claimStatus' && <ClaimStatusText status={row.claimStatus} />}
                  {col.id === 'claimProcessingStatus' && row.claimProcessingStatus}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
