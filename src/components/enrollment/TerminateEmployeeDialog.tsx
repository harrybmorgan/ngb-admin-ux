import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { toast } from 'sonner'
import { useCobraTerminationPrototype } from '@/hooks/useCobraTerminationPrototype'
import type { EnrollmentRow } from '@/data/adminMockData'

const TERM_REASONS = [
  { value: 'Layoff / budget reduction', label: 'Layoff / budget reduction' },
  { value: 'Voluntary resignation', label: 'Voluntary resignation' },
  { value: 'Performance', label: 'Performance' },
  { value: 'Other', label: 'Other' },
] as const

function todayIsoDate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type TerminateEmployeeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Pick<EnrollmentRow, 'id' | 'name' | 'status' | 'role'> | null
  /** Called after a successful submit (e.g. close profile sheet). */
  onAfterSubmit?: () => void
}

export function TerminateEmployeeDialog({ open, onOpenChange, employee, onAfterSubmit }: TerminateEmployeeDialogProps) {
  const { setCase } = useCobraTerminationPrototype()
  const [terminationDate, setTerminationDate] = useState(todayIsoDate)
  const [reason, setReason] = useState<string>(TERM_REASONS[0].value)

  useEffect(() => {
    if (open) {
      setTerminationDate(todayIsoDate())
      setReason(TERM_REASONS[0].value)
    }
  }, [open, employee?.id])

  const notEmployeeRole = Boolean(employee && employee.role !== 'Employee')
  const statusBlocked = Boolean(employee && (employee.status === 'Terminated' || employee.status === 'COBRA'))
  const blocked = notEmployeeRole || statusBlocked

  const handleSubmit = () => {
    if (!employee || blocked) return
    setCase({
      enrollmentRowId: employee.id,
      employeeName: employee.name,
      terminationDate,
      reason,
      phase: 'notice_sent',
    })
    toast.success('Termination saved. COBRA offer packet and carrier update triggered (prototype).')
    onAfterSubmit?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Terminate employee</DialogTitle>
        </DialogHeader>
        {employee ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{employee.name}</span>
              {blocked ? (
                <span className="mt-2 block text-destructive">
                  {statusBlocked
                    ? `This person is already marked ${employee.status.toLowerCase()} in the roster. Clear the demo from Home or choose an active employee.`
                    : 'Termination is only available for people with the Employee role in this prototype.'}
                </span>
              ) : (
                <span className="block pt-1">
                  Submitting this termination automatically sends the{' '}
                  <span className="font-medium text-foreground">COBRA offer packet</span> and updates the carrier—no separate
                  COBRA portal (prototype).
                </span>
              )}
            </p>
            {!blocked ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="term-date">Termination date</Label>
                  <Input
                    id="term-date"
                    type="date"
                    value={terminationDate}
                    onChange={(e) => setTerminationDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term-reason">Reason</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger id="term-reason">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {TERM_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={employee == null || blocked} onClick={handleSubmit}>
            Submit termination
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
