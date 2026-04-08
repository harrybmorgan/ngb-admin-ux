import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { themingEngineSchema, defaultThemingEngineValues } from '@/pages/theming-engine/schema'
import type { ThemingEngineFormValues } from '@/pages/theming-engine/schema'
import { ThemingEngineHighlightProvider } from '@/pages/theming-engine/ThemingEngineHighlightContext'
import { ThemingEngineTopBar } from '@/pages/theming-engine/ThemingEngineTopBar'
import { ThemingEngineConfigPane } from '@/pages/theming-engine/ThemingEngineConfigPane'
import { ThemingEnginePreviewPane } from '@/pages/theming-engine/ThemingEnginePreviewPane'
import { cn } from '@/lib/utils'

/**
 * Elizabeth’s customization studio — same layout as the consumer repo’s Theming Engine, embedded for Shelly (HR admin).
 */
export default function ThemingPage() {
  const form = useForm<ThemingEngineFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod resolver output type has optional fields from .default()
    resolver: zodResolver(themingEngineSchema) as any,
    defaultValues: defaultThemingEngineValues,
  })

  return (
    <FormProvider {...form}>
      <ThemingEngineHighlightProvider>
        <div className={cn('flex min-h-screen flex-col bg-background')}>
          <AdminNavigation hideNav />
          <ThemingEngineTopBar />
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-96 shrink-0 flex-col overflow-hidden border-r border-border bg-card">
              <ThemingEngineConfigPane />
            </aside>
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/30">
              <ThemingEnginePreviewPane />
            </main>
          </div>
        </div>
      </ThemingEngineHighlightProvider>
    </FormProvider>
  )
}
