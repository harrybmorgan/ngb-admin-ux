import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useEmployerSetup } from '@/hooks/useEmployerSetup'
import { useGuidedSetupHomeState } from '@/hooks/useGuidedSetupHomeState'
import { cn } from '@/lib/utils'

const sectionEyebrow = 'text-[12px] font-black uppercase tracking-[3px] text-[#5f6a94] leading-4'

const tileClass =
  'group flex items-center justify-between gap-3 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] px-4 py-3 text-left shadow-[0_1px_3px_rgba(43,49,78,0.04)] transition-[border-color,background-color,box-shadow] hover:border-[#3958c3]/35 hover:bg-[#f0f3ff] hover:shadow-[0_2px_8px_rgba(43,49,78,0.06)]'

const shortcuts = [
  {
    to: '/setup?wizardStep=2',
    title: 'Edit benefits and rates',
    hint: 'Plans, contributions, and effective dates',
  },
  {
    to: '/setup?wizardStep=3',
    title: 'Review integrations',
    hint: 'EDI, carriers, and payroll connections',
  },
  {
    to: '/setup?task=1',
    title: 'Manage employer users',
    hint: 'Roles and admin permissions',
  },
] as const

/**
 * Secondary setup entry points — shown only after guided setup has been started (draft saved)
 * or marked complete, so the hero stays the sole primary “resume setup” surface.
 */
export function DashboardManageSetupSection() {
  const { onboardingComplete } = useEmployerSetup()
  const snapshot = useGuidedSetupHomeState()

  const showSection = onboardingComplete || snapshot !== null
  if (!showSection) return null

  return (
    <section className="space-y-3" aria-labelledby="dashboard-manage-setup-heading">
      <h2 id="dashboard-manage-setup-heading" className={sectionEyebrow}>
        Manage setup
      </h2>

      <div className="grid gap-3 sm:grid-cols-3">
        {shortcuts.map(({ to, title, hint }) => (
          <Link key={to} to={to} className={cn(tileClass, 'no-underline')}>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-snug text-[#14182c] group-hover:text-[#3958c3]">
                {title}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-[#5f6a94]">{hint}</span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[#9aa3bd] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3958c3]"
              aria-hidden
            />
          </Link>
        ))}
      </div>

      <p className="pt-0.5">
        <Link
          to="/setup"
          className="text-sm font-semibold text-[#3958c3] underline-offset-4 transition-colors hover:text-[#2d46a3] hover:underline"
        >
          View all setup tasks
        </Link>
      </p>
    </section>
  )
}
