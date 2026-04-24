import { cn } from '@/lib/utils'

type LetterDocumentPreviewProps = {
  body: string
  /** Shown in the body area when `body` is empty. */
  emptyHint: string
  /** Merges on the root article for context-specific theming. */
  className?: string
  /** Muted/secondary text color: forms using hex grays in Communications builder. */
  variant?: 'tokens' | 'figma'
}

const mutedClass = {
  tokens: 'text-muted-foreground',
  figma: 'text-[#5c5c5c]',
} as const

const subMutedClass = {
  tokens: 'text-muted-foreground/90',
  figma: 'text-[#515f6b]',
} as const

/**
 * Read-only “printed letter / business email” style preview (not chat/SMS).
 */
export function LetterDocumentPreview({
  body,
  emptyHint,
  className,
  variant = 'tokens',
}: LetterDocumentPreviewProps) {
  const m = mutedClass[variant]
  const sm = subMutedClass[variant]
  const hasContent = body.trim().length > 0

  return (
    <div
      className={cn(
        'mt-2 max-h-[min(420px,65vh)] w-full min-h-[200px] overflow-y-auto pr-0.5',
        variant === 'figma' && 'text-[#12181d]',
      )}
    >
      <article
        className={cn(
          'w-full max-w-full rounded-sm border border-solid bg-card text-left text-sm leading-relaxed shadow-md',
          variant === 'tokens' && 'border-border',
          variant === 'figma' && 'border-[#d9d9d9] shadow-sm',
          className,
        )}
        role="status"
        aria-label="Letter document preview"
      >
        <header
          className={cn('border-b px-5 py-4', variant === 'tokens' && 'border-border', variant === 'figma' && 'border-[#e4e6e9]')}
        >
          <p className="text-sm font-semibold text-foreground">[Employer / plan name]</p>
          <p className={cn('mt-1.5 text-[11px] leading-5', sm)}>
            123 Benefits Way, Suite 100
            <br />
            Portland, OR 97201
          </p>
        </header>
        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className={cn('min-w-0 text-[11px] leading-5', sm)}>
              <p className="font-medium text-foreground">[Member name]</p>
              <p>Member address line 1</p>
              <p>City, ST 00000</p>
            </div>
            <p className={cn('shrink-0 text-[11px] tabular-nums', sm)}>[Date]</p>
          </div>
          <p className="text-foreground">Dear [Member name],</p>
          <div
            className={cn(
              'min-h-[5.5rem] text-[13px] leading-6',
              hasContent ? 'whitespace-pre-wrap text-foreground' : cn('italic', m),
            )}
          >
            {hasContent ? body : emptyHint}
          </div>
          <div className="space-y-1 pt-1">
            <p className="text-foreground">Sincerely,</p>
            <p className={sm}>[Client Name] Benefits Team</p>
          </div>
        </div>
      </article>
    </div>
  )
}
