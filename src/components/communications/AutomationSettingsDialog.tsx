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
import { type ScheduleSendResult } from '@/components/communications/ScheduleSendDialog'

const REQUIRED_DOT_CLASS =
  'pointer-events-none absolute left-[5px] top-[5px] z-10 size-[6px] rounded-full bg-[#e12d33]'

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

export type AutomationSettingsResult =
  | { mode: 'scheduled'; schedule: ScheduleSendResult }
  | { mode: 'immediate' }
  | { mode: 'draft' }

type SettingsMode = 'schedule' | 'immediate' | 'draft'

export type AutomationSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (result: AutomationSettingsResult) => void
}

/**
 * Automation settings modal with overlay (Figma: [Schedule Modal / Automation Settings](https://www.figma.com/design/rH3S6MJJNltWf8lrrnU0jg/Communications-Builder?node-id=16324-89266)).
 */
export function AutomationSettingsDialog({
  open,
  onOpenChange,
  onConfirm,
}: AutomationSettingsDialogProps) {
  const titleId = useId()
  const [settingsMode, setSettingsMode] = useState<SettingsMode>('schedule')
  const [dateStr, setDateStr] = useState('')
  const [timeMinutes, setTimeMinutes] = useState('')

  useEffect(() => {
    if (open) {
      setSettingsMode('schedule')
      setDateStr('')
      setTimeMinutes('')
    }
  }, [open])

  const handlePrimary = () => {
    if (settingsMode === 'immediate') {
      onConfirm({ mode: 'immediate' })
      return
    }
    if (settingsMode === 'draft') {
      onConfirm({ mode: 'draft' })
      return
    }
    const ymd = dateStr || new Date().toISOString().slice(0, 10)
    const rawM = timeMinutes !== '' ? Number.parseInt(timeMinutes, 10) : 0
    const m = Number.isNaN(rawM) ? 0 : rawM
    onConfirm({
      mode: 'scheduled',
      schedule: {
        date: parseYmdToLocalDate(ymd),
        minutesFromMidnightCt: m,
        timeLabel: formatMinutesToCtLabel(m),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 p-0 sm:max-w-[512px] sm:overflow-hidden',
          'border-0 bg-white',
          'shadow-[0px_8px_16px_0px_rgba(2,13,36,0.15),0px_0px_1px_0px_rgba(2,13,36,0.3)]',
        )}
        size="md"
        aria-labelledby={titleId}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b-0 bg-white px-6 pt-1">
          <h2
            id={titleId}
            className="text-lg font-semibold leading-6 tracking-[-0.252px] text-[#1d2c38]"
          >
            Automation Settings
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

        <div
          className="flex max-h-[min(70vh,100%)] flex-col gap-4 overflow-y-auto px-6 py-4"
          role="radiogroup"
          aria-label="Automation start options"
        >
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="automation-settings"
              className="sr-only"
              checked={settingsMode === 'schedule'}
              onChange={() => setSettingsMode('schedule')}
            />
            <span
              className={cn(
                'relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                settingsMode === 'schedule' ? 'border-[#0058a3] bg-[#0058a3]' : 'border-[#a5aeb4] bg-white',
              )}
              aria-hidden
            >
              {settingsMode === 'schedule' ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <span className="text-sm leading-6 text-[#243746]">Schedule automation start date and time</span>
          </label>

          {settingsMode === 'schedule' ? (
            <div className="ml-0 flex w-full min-w-0 flex-col gap-4 pl-0 sm:flex-row sm:items-stretch">
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
                      aria-label="Automation start date"
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
                <Select value={timeMinutes || undefined} onValueChange={setTimeMinutes}>
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
          ) : null}

          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="automation-settings"
              className="sr-only"
              checked={settingsMode === 'immediate'}
              onChange={() => setSettingsMode('immediate')}
            />
            <span
              className={cn(
                'relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                settingsMode === 'immediate' ? 'border-[#0058a3] bg-[#0058a3]' : 'border-[#a5aeb4] bg-white',
              )}
              aria-hidden
            >
              {settingsMode === 'immediate' ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <span className="text-sm leading-6 text-[#243746]">Enable automation immediately</span>
          </label>

          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="automation-settings"
              className="sr-only"
              checked={settingsMode === 'draft'}
              onChange={() => setSettingsMode('draft')}
            />
            <span
              className={cn(
                'relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                settingsMode === 'draft' ? 'border-[#0058a3] bg-[#0058a3]' : 'border-[#a5aeb4] bg-white',
              )}
              aria-hidden
            >
              {settingsMode === 'draft' ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <span className="text-sm leading-6 text-[#243746]">Save as Draft (inactive)</span>
          </label>
        </div>

        <div className="flex h-[88px] w-full shrink-0 items-center justify-end gap-2 border-0 bg-white px-6">
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
            intent="primary"
            className="h-10 min-w-0 rounded-lg bg-[#0058a3] px-4 text-sm font-medium text-white hover:bg-[#0058a3]/90"
            onClick={handlePrimary}
          >
            Schedule Automation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
