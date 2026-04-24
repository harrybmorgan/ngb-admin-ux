import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { ChevronDown } from 'lucide-react'
import {
  DELIVERY_METHOD_OPTIONS,
  formatDeliveryMethodSummary,
  toggleDeliveryMethodSelection,
} from '@/components/communications/deliveryMethodChannel'
import { cn } from '@/lib/utils'

type DeliveryMethodMultiselectProps = {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  className?: string
  /** Same visual language as the single-line Select in these forms. */
  triggerClassName?: string
}

export function DeliveryMethodMultiselect({
  id,
  value,
  onChange,
  className,
  triggerClassName,
}: DeliveryMethodMultiselectProps) {
  const summary = formatDeliveryMethodSummary(value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'h-12 w-full justify-between gap-2 rounded-lg border font-normal text-left',
            className,
            triggerClassName,
          )}
          aria-label="Delivery method"
          aria-haspopup="menu"
        >
          <span className="min-w-0 truncate">{summary}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[min(100vw-2rem,var(--radix-dropdown-menu-trigger-width))] max-w-[32rem]"
        align="start"
      >
        {DELIVERY_METHOD_OPTIONS.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt}
            checked={value.includes(opt)}
            onCheckedChange={() => onChange(toggleDeliveryMethodSelection(value, opt))}
            onSelect={(e) => e.preventDefault()}
          >
            {opt}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
