import { useEffect, useId, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const REQUIRED_DOT_CLASS =
  'pointer-events-none absolute left-[5px] top-[5px] z-10 size-[6px] rounded-full bg-[#e12d33]'

/** 15-minute slots from 12:00am through 11:45pm CT (display labels; value = minutes from midnight). */
function formatMinutesToCtLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const isPm = h >= 12
  const h12 = h % 12 === 0 ? 12 : h % 12
  const mm = m.toString().padStart(2, '0')
  return `${h12}:${mm}${isPm ? 'pm' : 'am'} CT`
}

const CT_TIME_MINUTES: number[] = Array.from({ length: 24 * 4 }, (_, i) => i * 15)

function parseYmdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

export type ScheduleSendResult = {
  date: Date
  /** Minutes from midnight on the CT schedule grid (0, 15, …, 1425). */
  minutesFromMidnightCt: number
  /** Display string, e.g. `1:15pm CT`. */
  timeLabel: string
}

export type ScheduleSendDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchedule: (result: ScheduleSendResult) => void
}

export function ScheduleSendDialog({ open, onOpenChange, onSchedule }: ScheduleSendDialogProps) {
  const titleId = useId()
  const [dateStr, setDateStr] = useState('')
  const [timeMinutes, setTimeMinutes] = useState('')

  useEffect(() => {
    if (open) {
      setDateStr('')
      setTimeMinutes('')
    }
  }, [open])

  const canSubmit = Boolean(dateStr) && timeMinutes !== ''

  const handleScheduleClick = () => {
    if (!canSubmit || !dateStr) return
    const minutesFromMidnightCt = Number.parseInt(timeMinutes, 10)
    if (Number.isNaN(minutesFromMidnightCt)) return
    onSchedule({
      date: parseYmdToLocalDate(dateStr),
      minutesFromMidnightCt,
      timeLabel: formatMinutesToCtLabel(minutesFromMidnightCt),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col gap-8 p-0 sm:max-w-[512px] sm:overflow-hidden',
          'shadow-[0px_8px_16px_0px_rgba(2,13,36,0.15),0px_0px_1px_0px_rgba(2,13,36,0.3)]',
        )}
        size="md"
        aria-labelledby={titleId}
      >
        <p className="sr-only">
          Choose a send date and time in Central Time. Times are in 15-minute steps from 12:00 a.m. to 11:45 p.m. CT.
        </p>
        <div className="flex h-16 shrink-0 items-center justify-between rounded-t-lg bg-white px-6">
          <h2
            id={titleId}
            className="text-lg font-semibold leading-6 tracking-[-0.252px] text-[#1d2c38]"
          >
            Select Date &amp; Time
          </h2>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-9 shrink-0 rounded-md p-0 text-[#1d2c38] hover:bg-[#f5f5f5]"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-6">
          <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4">
            <div className="relative min-w-0 flex-1 sm:max-w-[224px]">
              <span className={REQUIRED_DOT_CLASS} aria-hidden />
              <div className="flex h-12 w-full min-w-0 flex-col justify-center overflow-hidden rounded-lg border border-[#a5aeb4] bg-white pl-3 pr-10">
                <p className="text-[10px] font-normal leading-4 tracking-[0.1px] text-[#243746]">Date</p>
                <div className="relative flex w-full min-w-0 items-center">
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="h-5 w-full min-w-0 border-0 bg-transparent p-0 pl-0.5 text-sm leading-5 text-[#12181d] [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                    aria-label="Send date"
                    aria-required
                    required
                  />
                  <Calendar
                    className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#243746]"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
            <div className="relative min-w-0 flex-1 sm:max-w-[224px]">
              <span className={REQUIRED_DOT_CLASS} aria-hidden />
              <Select
                value={timeMinutes || undefined}
                onValueChange={setTimeMinutes}
              >
                <SelectTrigger
                  className="h-12 w-full min-w-0 justify-between gap-2 rounded-lg border border-[#a5aeb4] bg-white py-0 pl-3 pr-2 text-left text-sm font-normal text-[#12181d] shadow-none data-[placeholder]:text-[#5c5c5c] focus:ring-0"
                  aria-label="Time in Central Time, 15-minute intervals"
                >
                  <SelectValue placeholder="Time (CT)" />
                </SelectTrigger>
                <SelectContent className="max-h-60" position="popper">
                  {CT_TIME_MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {formatMinutesToCtLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex h-[88px] w-full shrink-0 items-center justify-end gap-2 bg-white px-6">
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-lg px-4 text-sm font-medium text-[#1d2c38] hover:bg-transparent hover:underline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            intent="primary"
            className={cn(
              'h-10 min-w-0 rounded-lg px-4 text-sm font-medium',
              canSubmit
                ? 'bg-[#0058a3] text-white'
                : 'border-0 bg-[#f7f7f7] text-[#7c858e] shadow-none',
            )}
            onClick={handleScheduleClick}
          >
            Schedule Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
