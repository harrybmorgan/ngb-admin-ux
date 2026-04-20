import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { CheckCircle2 } from 'lucide-react'

const CONFETTI_COLORS = ['#25146f', '#c8102e', '#3958c3', '#059669', '#d97706', '#94a3b8']

function buildConfettiPieces(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const ring = i % 8
    const spread = (i / count) * Math.PI * 2 + ring * 0.09
    const distance = 88 + (i % 11) * 14 + ring * 6
    const delay = (i % 5) * 0.02
    const duration = 1.25 + (i % 6) * 0.06
    const w = 4 + (i % 4)
    const h = 3 + (i % 3)
    const rotate = ((i * 47) % 360) - 180 + (i % 2) * 540
    return {
      id: i,
      angle: spread,
      distance,
      delay,
      duration,
      w,
      h,
      rotate,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }
  })
}

export type EmployerPortalLaunchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoHome: () => void
}

export function EmployerPortalLaunchDialog({ open, onOpenChange, onGoHome }: EmployerPortalLaunchDialogProps) {
  const pieces = useMemo(() => buildConfettiPieces(72), [])
  const prefersReducedMotion = useReducedMotion()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="overflow-hidden sm:max-w-md">
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-44 justify-center overflow-hidden"
            aria-hidden
          >
            {open && !prefersReducedMotion
              ? pieces.map((p) => (
                  <motion.span
                    key={p.id}
                    className="absolute top-[55%] left-1/2 origin-center rounded-[1px] shadow-sm"
                    style={{
                      width: p.w,
                      height: p.h,
                      marginLeft: -p.w / 2,
                      marginTop: -p.h / 2,
                      backgroundColor: p.color,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    animate={{
                      x: Math.cos(p.angle) * p.distance,
                      y: Math.sin(p.angle) * p.distance,
                      opacity: [1, 1, 0],
                      rotate: p.rotate,
                      scale: [1, 0.85, 0.25],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                ))
              : null}
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3 pt-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <CheckCircle2 className="h-8 w-8" strokeWidth={2} aria-hidden />
            </div>
            <DialogHeader className="space-y-2 sm:text-center">
              <DialogTitle className="text-xl">Employer portal is live</DialogTitle>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your launch completed successfully. Team members can sign in to the employer experience with the access you
                have configured.
              </p>
            </DialogHeader>
          </div>

          <DialogFooter className="relative z-10 mt-2 flex flex-col gap-2 sm:flex-col">
            <Button type="button" className="w-full" onClick={onGoHome}>
              Go home
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Keep editing
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
