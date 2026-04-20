import { cn } from '@/lib/utils'

/** White sparkle mark used inside the WEXly gradient orb (spark `AssistIqButton` SVG). */
export function WexlySparkleIcon({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M13.913 13.9149L11.9997 24.0033L10.087 13.9149L0 12.0013L10.087 10.0884L12.0003 0L13.913 10.0884L24 12.0013L13.913 13.9149Z"
        fill="currentColor"
      />
      <path
        d="M20.2758 19.7969L19.5994 23.3628L18.923 19.7969L15.3569 19.1204L18.923 18.4439L19.5994 14.8781L20.2752 18.4439L23.8412 19.1204L20.2758 19.7969Z"
        fill="currentColor"
      />
    </svg>
  )
}
