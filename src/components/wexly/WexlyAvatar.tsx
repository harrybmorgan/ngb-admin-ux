import { cn } from '@/lib/utils'
import { WEXLY_GRADIENT } from '@/lib/wexlyBrand'
import { WexlySparkleIcon } from './WexlySparkleIcon'

/** Gradient orb + sparkle — matches spark `AssistIQAvatar`. */
export function WexlyAvatar({ size = 28, className }: { size?: number; className?: string }) {
  const iconSize = Math.round(size * 0.5)
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full text-white', className)}
      style={{ width: size, height: size, background: WEXLY_GRADIENT }}
      aria-hidden
    >
      <WexlySparkleIcon size={iconSize} />
    </div>
  )
}
