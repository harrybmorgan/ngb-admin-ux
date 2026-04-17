import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Bot, Building2, Inbox, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { EmployerRequestWizard } from '@/components/dashboard/EmployerRequestWizard'
import { SECURE_MESSAGE_REASONS, SUPPORT_CONTACT, type SecureMessageReason } from '@/data/getHelpConstants'

export type GetHelpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Prefills the hero “ask” field and closes this dialog (prototype). */
  onPrefillAssistantQuestion?: (text: string) => void
}

type HubView = 'hub' | 'assistant' | 'secure' | 'contact' | 'request'

const SAMPLE_QUESTION = 'When does open enrollment start for our medical plan?'

export function GetHelpDialog({ open, onOpenChange, onPrefillAssistantQuestion }: GetHelpDialogProps) {
  const [view, setView] = useState<HubView>('hub')
  const [requestKey, setRequestKey] = useState(0)
  const [secureReason, setSecureReason] = useState<SecureMessageReason | ''>('')
  const [secureBody, setSecureBody] = useState('')

  useEffect(() => {
    if (!open) {
      setView('hub')
      setSecureReason('')
      setSecureBody('')
    }
  }, [open])

  const goRequest = () => {
    setRequestKey((k) => k + 1)
    setView('request')
  }

  const hubCardClass =
    'flex w-full flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  const titleForView = (): string => {
    switch (view) {
      case 'assistant':
        return 'Ask the virtual assistant'
      case 'secure':
        return 'Send a secure message'
      case 'contact':
        return 'Contact us'
      case 'request':
        return 'Submit a request'
      default:
        return 'Get help'
    }
  }

  const submitSecure = (e: React.FormEvent) => {
    e.preventDefault()
    if (!secureReason) {
      toast.message('Select a reason for your inquiry.')
      return
    }
    if (!secureBody.trim()) {
      toast.message('Enter a message before sending.')
      return
    }
    toast.success('Secure message sent (prototype only — creates no User Contact record).')
    setSecureReason('')
    setSecureBody('')
    setView('hub')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titleForView()}</DialogTitle>
        </DialogHeader>

        {view === 'hub' ? (
          <div className="flex flex-col gap-4 py-2">
            <p id="get-help-hub-desc" className="text-sm text-muted-foreground">
              Choose how you want to reach support. For administrative or data changes, use <strong className="font-medium text-foreground">Submit a request</strong>. For general questions, use{' '}
              <strong className="font-medium text-foreground">Send a secure message</strong> or the assistant.
            </p>
            <div className="grid gap-3">
              <button type="button" className={hubCardClass} onClick={() => setView('assistant')}>
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Bot className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Ask the virtual assistant
                </span>
                <span className="text-xs text-muted-foreground">Search common answers or chat; escalate to a live agent when offered.</span>
              </button>
              <button type="button" className={hubCardClass} onClick={goRequest}>
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Inbox className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Submit a request
                </span>
                <span className="text-xs text-muted-foreground">Data changes, file processing, new enrollments, and similar actions.</span>
              </button>
              <button type="button" className={hubCardClass} onClick={() => setView('secure')}>
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Send a secure message
                </span>
                <span className="text-xs text-muted-foreground">General questions; opens a short form (mirrors Secure Inbox).</span>
              </button>
              <button type="button" className={hubCardClass} onClick={() => setView('contact')}>
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Contact information
                </span>
                <span className="text-xs text-muted-foreground">Phone numbers, email, and hours of operation.</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Track requests from the profile menu under{' '}
              <Link to="/tickets" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => onOpenChange(false)}>
                Tickets
              </Link>
              .
            </p>
          </div>
        ) : null}

        {view === 'assistant' ? (
          <div className="flex flex-col gap-4 py-2" aria-describedby="get-help-assistant-desc">
            <p id="get-help-assistant-desc" className="text-sm text-muted-foreground">
              In production, <strong className="font-medium text-foreground">Benefit Assistant</strong> appears in the lower-right corner for quick answers. You can also use the search field in the welcome
              area above to ask a question in this prototype.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setView('hub')}>
                Back to help options
              </Button>
              <Button
                type="button"
                variant="solid"
                onClick={() => {
                  onPrefillAssistantQuestion?.(SAMPLE_QUESTION)
                  onOpenChange(false)
                  toast.message('Sample question added to the search field (prototype).')
                }}
              >
                Try a sample question
              </Button>
            </div>
          </div>
        ) : null}

        {view === 'secure' ? (
          <form onSubmit={submitSecure} className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">Creates a User Contact record in production and notifies the support team.</p>
            <div className="space-y-2">
              <Label htmlFor="secure-reason" className="text-sm font-medium">
                Reason for inquiry
              </Label>
              <Select
                value={secureReason ? secureReason : undefined}
                onValueChange={(v) => setSecureReason(v as SecureMessageReason)}
              >
                <SelectTrigger id="secure-reason" aria-label="Reason for inquiry">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {SECURE_MESSAGE_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secure-body" className="text-sm font-medium">
                Message
              </Label>
              <Textarea
                id="secure-body"
                value={secureBody}
                onChange={(e) => setSecureBody(e.target.value)}
                placeholder="Type your question for the support team."
                rows={4}
                className="resize-y"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setView('hub')}>
                Back to help options
              </Button>
              <Button type="submit" variant="solid">
                Send secure message
              </Button>
            </div>
          </form>
        ) : null}

        {view === 'contact' ? (
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">Reach us during business hours for account and benefits support.</p>
            <dl className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</dt>
                <dd className="font-medium text-foreground">{SUPPORT_CONTACT.contactName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</dt>
                <dd>
                  <a href={`tel:${SUPPORT_CONTACT.phone.replace(/\D/g, '')}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {SUPPORT_CONTACT.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Toll-free</dt>
                <dd>
                  <a href={`tel:${SUPPORT_CONTACT.tollFree.replace(/\D/g, '')}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {SUPPORT_CONTACT.tollFree}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd>
                  <a href={`mailto:${SUPPORT_CONTACT.email}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {SUPPORT_CONTACT.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hours</dt>
                <dd className="text-foreground">{SUPPORT_CONTACT.hours}</dd>
              </div>
            </dl>
            <Button type="button" variant="outline" onClick={() => setView('hub')} className="w-fit">
              Back to help options
            </Button>
          </div>
        ) : null}

        {view === 'request' ? (
          <div className="py-2">
            <EmployerRequestWizard
              key={requestKey}
              onBack={() => setView('hub')}
              onSuccess={() => setView('hub')}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
