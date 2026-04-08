import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { themingEngineSchema, defaultThemingEngineValues } from '@/pages/theming-engine/schema'
import type { ThemingEngineFormValues } from '@/pages/theming-engine/schema'
import { ThemingEngineHighlightProvider } from '@/pages/theming-engine/ThemingEngineHighlightContext'
import { ThemingEngineTopBar } from '@/pages/theming-engine/ThemingEngineTopBar'
import { ThemingEngineConfigPane } from '@/pages/theming-engine/ThemingEngineConfigPane'
import { ThemingEnginePreviewPane } from '@/pages/theming-engine/ThemingEnginePreviewPane'
import { cn } from '@/lib/utils'

type EmbeddedThemingStudioProps = {
  /** In setup wizard: constrained height, hide browser back on Cancel. */
  variant?: 'standalone' | 'embedded'
}

/**
 * Branding / theming engine UI (config + preview). Used on /theming and inside the setup wizard.
 */
export function EmbeddedThemingStudio({ variant = 'standalone' }: EmbeddedThemingStudioProps) {
  const embedded = variant === 'embedded'
  const form = useForm<ThemingEngineFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod resolver output type has optional fields from .default()
    resolver: zodResolver(themingEngineSchema) as any,
    defaultValues: defaultThemingEngineValues,
  })

  return (
    <FormProvider {...form}>
      <ThemingEngineHighlightProvider>
        <div
          className={cn(
            'flex flex-col bg-background',
            embedded ? 'h-full min-h-0 min-w-0 flex-1 overflow-hidden' : 'min-h-0 w-full flex-1 overflow-hidden',
          )}
        >
          <ThemingEngineTopBar embedded={embedded} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <aside
              className={cn(
                'flex w-full shrink-0 flex-col overflow-hidden border-b border-border bg-card lg:border-b-0 lg:border-r',
                embedded
                  ? 'min-h-0 min-w-0 flex-[1_1_42%] lg:h-full lg:max-h-none lg:w-96 lg:flex-none xl:w-[26rem] 2xl:w-[32rem]'
                  : 'max-h-[38vh] lg:max-h-none lg:w-80 xl:w-96',
              )}
            >
              <ThemingEngineConfigPane embedded={embedded} />
            </aside>
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-muted/30 lg:min-h-0">
              <ThemingEnginePreviewPane embedded={embedded} />
            </main>
          </div>
        </div>
      </ThemingEngineHighlightProvider>
    </FormProvider>
  )
}
