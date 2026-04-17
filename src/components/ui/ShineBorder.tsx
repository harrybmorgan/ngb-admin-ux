import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ColorProp = string | string[]

export interface ShineBorderProps {
  borderRadius?: number
  borderWidth?: number
  duration?: number
  color?: ColorProp
  className?: string
  children: ReactNode
}

/**
 * Animated gradient border (conic-style sweep via masked radial + background-position).
 * Ported from spark-2026 homepage hero (SparkAiForwardHero).
 */
export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = '#000000',
  className,
  children,
}: ShineBorderProps) {
  const gradientColors = Array.isArray(color) ? color.join(', ') : color

  return (
    <div
      style={{ '--border-radius': `${borderRadius}px` } as CSSProperties}
      className={cn(
        'relative grid h-full w-full place-items-center rounded-[inherit] bg-white p-3 text-black dark:bg-black dark:text-white',
        className,
      )}
    >
      {children}
      <div
        style={
          {
            '--border-width': `${borderWidth}px`,
            '--shine-pulse-duration': `${duration}s`,
            '--mask-linear-gradient': `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            '--background-radial-gradient': `radial-gradient(circle, transparent 20%, ${gradientColors}, transparent 80%)`,
          } as CSSProperties
        }
        className={
          'pointer-events-none absolute inset-0 -z-10 rounded-[inherit] before:absolute before:inset-0 before:rounded-[inherit] before:p-[length:var(--border-width)] before:content-[""] before:![-webkit-mask-composite:xor] before:[-webkit-mask:var(--mask-linear-gradient)] before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%] before:![mask-composite:exclude] before:[mask:var(--mask-linear-gradient)] motion-safe:before:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear] before:pointer-events-none before:opacity-70 before:blur-[0.5px] after:pointer-events-none after:absolute after:-inset-[1px] after:rounded-[inherit] after:p-[length:var(--border-width)] after:content-[""] after:![-webkit-mask-composite:xor] after:[-webkit-mask:var(--mask-linear-gradient)] after:[background-image:var(--background-radial-gradient)] after:[background-size:300%_300%] after:![mask-composite:exclude] after:[mask:var(--mask-linear-gradient)] motion-safe:after:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear] after:blur-[2px] after:opacity-30'
        }
        aria-hidden
      />
    </div>
  )
}
