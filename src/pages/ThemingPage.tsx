import { cn } from '@/lib/utils'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminDockablePageShell } from '@/components/layout/AdminDockablePageShell'
import { EmbeddedThemingStudio } from '@/pages/theming-engine/EmbeddedThemingStudio'

/**
 * Elizabeth’s customization studio — same layout as the consumer repo’s Theming Engine (employer branding).
 */
export default function ThemingPage() {
  return (
    <div className={cn('admin-app-bg flex min-h-screen flex-col font-sans')}>
      <AdminNavigation hideNav />
      <AdminDockablePageShell>
        <EmbeddedThemingStudio variant="standalone" />
      </AdminDockablePageShell>
    </div>
  )
}
