import { useId, useMemo, useState } from 'react'
import { Button, FloatLabel, Label, Sheet, SheetContent, SheetHeader, SheetTitle, Textarea } from '@wexinc-healthbenefits/ben-ui-kit'
import { Heading, Image as ImageIcon, MousePointerClick, Type } from 'lucide-react'
import { sanitizeEmailBodyHtml } from '@/lib/sanitizeHtml'
import { cn } from '@/lib/utils'

const SNIPPETS: { id: string; label: string; icon: typeof Type; html: string }[] = [
  {
    id: 'heading',
    label: 'Heading',
    icon: Heading,
    html: '\n<p style="font-size:18px;font-weight:600;margin:0 0 8px;color:#1d2c38">Section heading</p>\n',
  },
  {
    id: 'text',
    label: 'Text',
    icon: Type,
    html: '\n<p style="margin:0 0 12px;line-height:1.5;color:#12181d">Add your paragraph. Replace placeholder tokens as needed.</p>\n',
  },
  {
    id: 'image',
    label: 'Image',
    icon: ImageIcon,
    html: '\n<p style="margin:12px 0"><img src="https://placehold.co/560x200/e8ecf4/1d2c38?text=Image" width="100%" style="max-width:560px;height:auto;border-radius:4px" alt="" /></p>\n',
  },
  {
    id: 'button',
    label: 'CTA',
    icon: MousePointerClick,
    html: '\n<p style="margin:16px 0 0;text-align:center"><a href="{{portalUrl}}" style="display:inline-block;padding:8px 16px;background:#0058a3;color:#fff;border-radius:8px;text-decoration:none;font-weight:500">Go to benefits</a></p>\n',
  },
]

export type EditEmailTemplateSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** HTML loaded when the sheet opens (from template and/or last saved custom body). */
  initialHtml: string
  onSave: (payload: { templateName: string; html: string }) => void
}

/**
 * BCC “Edit email” — workspace-style template editor (no Figma app chrome).
 * Figma: [Editor section](https://www.figma.com/design/rH3S6MJJNltWf8lrrnU0jg/Communications-Builder?node-id=13832-79286).
 */
export function EditEmailTemplateSheet({ open, onOpenChange, initialHtml, onSave }: EditEmailTemplateSheetProps) {
  const id = useId()
  const [templateName, setTemplateName] = useState('')
  const [html, setHtml] = useState(initialHtml)
  // initialHtml is applied on mount; parent remounts this tree via `key` when reopening the editor

  const safePreview = useMemo(() => (html ? sanitizeEmailBodyHtml(html) : ''), [html])

  const handleSave = () => {
    onSave({ templateName: templateName.trim(), html })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex h-full w-full max-w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl lg:max-w-4xl',
        )}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-[#E4E6E9] px-4 py-4 sm:px-6">
          <SheetTitle className="text-left text-lg font-semibold text-[#14182c]">Edit email template</SheetTitle>
          <p className="text-left text-sm font-normal text-[#5c5c5c]">
            Adjust HTML for the content zone. Preview is sanitized. Create a new version or save over your working copy
            (prototype).
          </p>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside
            className="shrink-0 border-b border-[#E4E6E9] bg-[#fbfbfb] p-4 lg:w-48 lg:border-r lg:border-b-0"
            aria-label="Elements"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">Elements</p>
            <p className="mb-3 text-xs text-[#5c5c5c]">Insert blocks at the cursor (appends to end in this prototype).</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {SNIPPETS.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto flex-col gap-1.5 border-[#d1d6d8] py-2 text-xs font-medium text-[#1d2c38]"
                  onClick={() => setHtml((h) => `${h ?? ''}${s.html}`)}
                >
                  <s.icon className="h-4 w-4" aria-hidden />
                  {s.label}
                </Button>
              ))}
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
            <div className="shrink-0 max-w-2xl space-y-3">
              <FloatLabel
                id={`${id}-template-name`}
                label="Template name (optional, for a new or renamed template)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor={`${id}-html`} className="text-sm font-medium text-[#12181d]">
                HTML content
              </Label>
              <Textarea
                id={`${id}-html`}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="min-h-[200px] flex-1 font-mono text-sm leading-relaxed"
                placeholder="<div>...</div>"
                spellCheck={false}
              />
            </div>

            <div className="shrink-0 space-y-2">
              <p className="text-sm font-medium text-[#12181d]">Content zone preview</p>
              <p className="text-xs text-[#5c5c5c]">Interpreted HTML, sanitized in-app (same as main form).</p>
              {safePreview ? (
                <div
                  className="max-h-56 overflow-y-auto rounded-lg border border-[#d1d6d8] bg-white p-4"
                  dangerouslySetInnerHTML={{ __html: safePreview }}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-[#a5aeb4] bg-[#f9fafb] px-4 py-6 text-center text-sm text-[#5c5c5c]">
                  Add HTML to see a preview
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#E4E6E9] bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="border-[#d1d6d8] text-[#1d2c38]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" intent="primary" className="rounded-lg px-4" onClick={handleSave}>
            Save to communication
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
