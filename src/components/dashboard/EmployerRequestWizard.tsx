import { useCallback, useRef, useState } from 'react'
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  EMPLOYER_REQUEST_TYPES,
  REQUEST_ATTACHMENT_MAX_BYTES,
  type EmployerRequestType,
} from '@/data/getHelpConstants'
import { cn } from '@/lib/utils'

export type EmployerRequestWizardProps = {
  /** Called from step 1 when user leaves the wizard (e.g. back to Get help hub). */
  onBack: () => void
  /** After a successful prototype submit. */
  onSuccess: () => void
  /** When true, step 1 hides “Back to help options” (e.g. opened straight to submit from the hero). */
  hideHubBack?: boolean
}

export function EmployerRequestWizard({ onBack, onSuccess, hideHubBack = false }: EmployerRequestWizardProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [requestType, setRequestType] = useState<EmployerRequestType | ''>('')
  const [details, setDetails] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetFields = useCallback(() => {
    setStep(1)
    setRequestType('')
    setDetails('')
    setEffectiveDate('')
    setAttachment(null)
    setIsDragging(false)
  }, [])

  const applyFile = useCallback((file: File | null) => {
    if (!file) {
      setAttachment(null)
      return
    }
    if (file.size > REQUEST_ATTACHMENT_MAX_BYTES) {
      toast.message(`Attachments must be ${REQUEST_ATTACHMENT_MAX_BYTES / (1024 * 1024)} MB or smaller (prototype).`)
      return
    }
    setAttachment(file)
    toast.message(`"${file.name}" staged for this request (prototype — not uploaded).`)
  }, [])

  const handleContinue = () => {
    if (!requestType) {
      toast.message('Select a request type to continue.')
      return
    }
    setStep(2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const d = details.trim()
    if (!d) {
      toast.message('Add request details before submitting.')
      return
    }
    toast.success('Request recorded (prototype only — not sent or stored).')
    resetFields()
    onSuccess()
  }

  const handleWizardBack = () => {
    if (step === 2) {
      setStep(1)
      return
    }
    resetFields()
    onBack()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {step === 1 ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="employer-request-type" className="text-sm font-medium">
              Request type
            </Label>
            <Select
              value={requestType ? requestType : undefined}
              onValueChange={(v) => setRequestType(v as EmployerRequestType)}
            >
              <SelectTrigger id="employer-request-type" aria-label="Request type">
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYER_REQUEST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {!hideHubBack ? (
              <Button type="button" variant="outline" onClick={handleWizardBack}>
                Back to help options
              </Button>
            ) : null}
            <Button type="button" variant="solid" onClick={handleContinue} className={hideHubBack ? 'w-full sm:w-auto' : undefined}>
              Continue
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Request type: <span className="font-medium text-foreground">{requestType}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="employer-request-details" className="text-sm font-medium">
              Request details
            </Label>
            <Textarea
              id="employer-request-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what you need, including any employee or plan identifiers that apply."
              className="min-h-[120px] resize-y"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer-request-effective" className="text-sm font-medium">
              Effective date (optional)
            </Label>
            <input
              id="employer-request-effective"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Attachments (optional)</span>
            <p className="text-xs text-muted-foreground">CSV, PDF, or images up to 8 MB — prototype only.</p>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              aria-label="Choose file to attach"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) applyFile(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragging(false)
                const file = e.dataTransfer.files?.[0]
                if (file) applyFile(file)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/30',
                isDragging && 'border-primary/50 bg-primary/5',
              )}
            >
              <Upload className="h-8 w-8 opacity-60" aria-hidden />
              <span>Drag and drop a file, or click to browse</span>
              {attachment ? (
                <span className="text-xs font-medium text-foreground">Selected: {attachment.name}</span>
              ) : null}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleWizardBack}>
              Back
            </Button>
            <Button type="submit" variant="solid">
              Submit request
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
