import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FloatLabel,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Calendar, ChevronDown, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { sanitizeEmailBodyHtml } from '@/lib/sanitizeHtml'
import { cn } from '@/lib/utils'

const formCardClass =
  'flex w-full max-w-[1124px] flex-col gap-6 rounded-lg border border-[#d1d6d8] bg-white p-4 sm:p-6'

const DELIVERY_OPTIONS = ['Default Delivery Preference'] as const
/** `Enrollment Window` = OE; `Benefit Class Change` = BCC (lightweight template + preview in this prototype). */
const CONFIGURATION_TYPE_OPTIONS = ['User ID', 'Enrollment Window', 'Benefit Class Change'] as const

const ENROLLMENT_TYPE_OPTIONS = ['Annual Open Enrollment', 'New hire', 'Special enrollment (life event)'] as const
const ENROLLMENT_STATUS_OPTIONS = [
  'Not Started, Incomplete',
  'In progress',
  'Complete',
] as const
const BENEFIT_CLASS_OPTIONS = ['Part Time, Full Time', 'All benefit classes', 'Salaried only'] as const

const BCC_FROM_CLASS_OPTIONS = ['Hourly / Non-exempt', 'Salaried / Exempt', 'Part-time', 'Seasonal'] as const
const BCC_TO_CLASS_OPTIONS = [
  'Salaried — Class A (Medical + dental)',
  'Salaried — Class B (Core medical)',
  'Full-time — Retail',
  'Part-time — Limited benefits',
] as const

const TEMPLATE_CHOICES: { value: string; label: string }[] = [
  { value: 'benefit-class-change-1', label: 'Benefit Class Change 1' },
  { value: 'generic-oe', label: 'Open enrollment reminder' },
  { value: 'oe-content-zone-22', label: '22: Content Zone Name' },
]

/** Rich HTML for preview; sanitized before `dangerouslySetInnerHTML`. */
const TEMPLATE_PREVIEW_HTML: Record<string, string> = {
  'benefit-class-change-1': `
    <div style="font-family: 'Open Sans', system-ui, sans-serif; color: #12181d; line-height: 1.5">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px">Your benefit eligibility is ready to review</p>
      <p style="margin: 0 0 12px">We’ve updated your benefit class. Sign in to the member portal to confirm your elections.</p>
      <p style="margin: 0; color: #5c5c5c; font-size: 14px">This message was sent to the address on file for your account.</p>
    </div>
  `,
  'generic-oe': `
    <div style="font-family: 'Open Sans', system-ui, sans-serif; color: #12181d; line-height: 1.5">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px">Open enrollment ends soon</p>
      <p style="margin: 0">Complete your 2026 elections before the window closes. Questions? Use Contact Us in the portal.</p>
    </div>
  `,
  'oe-content-zone-22': `
    <div style="font-family: 'Open Sans', system-ui, sans-serif; color: #12181d; line-height: 1.5">
      <p style="font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #0b5fa5">ACME Health</p>
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px">Open Enrollment 2025</p>
      <p style="margin: 0 0 12px">Review and confirm your medical, dental, and voluntary elections before the deadline.</p>
      <p style="margin: 0; color: #5c5c5c; font-size: 14px">This preview uses your selected content zone template (prototype).</p>
    </div>
  `,
}

function countUserIds(raw: string): number {
  return raw
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean).length
}

type SendTiming = 'schedule' | 'immediately'

export function AddCommunicationForm() {
  const navigate = useNavigate()
  const id = useId()

  const [configurationType, setConfigurationType] = useState<string>('')
  const [communicationName, setCommunicationName] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<string>(DELIVERY_OPTIONS[0]!)

  const isUserId = configurationType === 'User ID'
  const isEnrollmentWindow = configurationType === 'Enrollment Window'
  const isBenefitClassChange = configurationType === 'Benefit Class Change'
  const hasConfigurationSelection = isUserId || isEnrollmentWindow || isBenefitClassChange

  const [userIdsRaw, setUserIdsRaw] = useState('')
  const [enrollmentType, setEnrollmentType] = useState<string>(ENROLLMENT_TYPE_OPTIONS[0]!)
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>(ENROLLMENT_STATUS_OPTIONS[0]!)
  const [benefitClass, setBenefitClass] = useState<string>(BENEFIT_CLASS_OPTIONS[0]!)
  const [enrollmentStartDate, setEnrollmentStartDate] = useState('2025-01-01')

  const [emailSubject, setEmailSubject] = useState('')
  const [templateId, setTemplateId] = useState<string>('')
  const [bccFromClass, setBccFromClass] = useState<string>('')
  const [bccToClass, setBccToClass] = useState<string>('')
  const [fromAddress] = useState('DoNotReply@wexapps.com')
  const [showAsSender, setShowAsSender] = useState('WEX Benefits')
  const [sendTiming, setSendTiming] = useState<SendTiming>('schedule')

  const userIdCount = useMemo(() => countUserIds(userIdsRaw), [userIdsRaw])

  const onConfigurationTypeChange = (v: string) => {
    setConfigurationType(v)
    if (v === 'Enrollment Window') {
      setTemplateId('oe-content-zone-22')
      setCommunicationName((n) => n || '2025 Open Enrollment Email')
      setEmailSubject((s) => s || 'Open Enrollment 2025')
    } else if (v === 'User ID') {
      setTemplateId((t) =>
        t === 'oe-content-zone-22' || t === '' ? 'benefit-class-change-1' : t,
      )
    } else if (v === 'Benefit Class Change') {
      setCommunicationName('')
      setEmailSubject('')
      setTemplateId('')
      setBccFromClass('')
      setBccToClass('')
    }
  }

  const effectiveTemplateId = (
    isUserId && templateId === 'oe-content-zone-22' ? 'benefit-class-change-1' : templateId
  ) as string
  const previewSource =
    hasConfigurationSelection && effectiveTemplateId
      ? TEMPLATE_PREVIEW_HTML[effectiveTemplateId] ?? TEMPLATE_PREVIEW_HTML['benefit-class-change-1']!
      : ''
  const safePreviewHtml = useMemo(
    () => (previewSource ? sanitizeEmailBodyHtml(previewSource) : ''),
    [previewSource],
  )

  const handleCancel = () => {
    navigate('/communications')
  }

  const handleSchedule = () => {
    navigate('/communications', {
      state: {
        newCommunicationScheduled: true,
        name: communicationName.trim() || undefined,
      },
    })
  }

  const templateSelectValue =
    isUserId && templateId === 'oe-content-zone-22' ? 'benefit-class-change-1' : templateId || undefined

  const contentTemplateOptions = isUserId
    ? TEMPLATE_CHOICES.filter((t) => t.value !== 'oe-content-zone-22')
    : isBenefitClassChange
      ? TEMPLATE_CHOICES.filter((t) => t.value === 'benefit-class-change-1' || t.value === 'generic-oe')
      : TEMPLATE_CHOICES

  return (
    <Card className={cn(formCardClass, 'shadow-sm')}>
      <div className="border-b border-[#E4E6E9] pb-4">
        <h1 className="text-2xl font-semibold leading-8 tracking-tight text-[#14182c]">Add New Communication</h1>
        <p className="mt-1 text-sm text-[#5c5c5c]">
          Prototype · no field validation in UI. Choose Configuration Type to show the rest of the form.
        </p>
      </div>

      <CardContent className="flex flex-col gap-0 space-y-8 p-0">
        <section className="space-y-4" aria-label="Details">
          <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Details</h2>
          <div className="flex max-w-[740px] flex-col gap-4">
            <div>
              <Label htmlFor={`${id}-name`} className="sr-only">
                Communication name
              </Label>
              <FloatLabel
                id={`${id}-name`}
                label="Communication Name *"
                value={communicationName}
                onChange={(e) => setCommunicationName(e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#12181d]">Delivery Method *</p>
              <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <SelectTrigger id={`${id}-delivery`} className="h-12 w-full rounded-lg border-[#a5aeb4]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#12181d]">Configuration Type *</p>
              <Select
                value={configurationType || undefined}
                onValueChange={onConfigurationTypeChange}
              >
                <SelectTrigger id={`${id}-config`} className="h-12 w-full rounded-lg border-[#a5aeb4]">
                  <SelectValue placeholder="Select configuration type" />
                </SelectTrigger>
                <SelectContent>
                  {CONFIGURATION_TYPE_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!hasConfigurationSelection ? (
                <p className="mt-1.5 text-sm text-[#5c5c5c]">Select a type to see configuration, content, and email fields.</p>
              ) : null}
            </div>
          </div>
        </section>

        {isUserId ? (
          <section className="space-y-4" aria-label="Configuration">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Configuration</h2>
            <div className="max-w-[740px] space-y-2">
              <Label htmlFor={`${id}-user-ids`} className="text-sm font-medium text-[#12181d]">
                User IDs (comma separated, ex: 1234, 4567, 7890) *
              </Label>
              <Textarea
                id={`${id}-user-ids`}
                value={userIdsRaw}
                onChange={(e) => setUserIdsRaw(e.target.value)}
                className="min-h-[140px] w-full resize-y rounded-lg border-[#a5aeb4] text-sm"
                autoComplete="off"
              />
              <p className="text-sm text-[#5c5c5c]">
                {userIdCount === 1 ? '1 user' : `${userIdCount} users`}
              </p>
            </div>
          </section>
        ) : null}

        {isBenefitClassChange ? (
          <section className="space-y-4" aria-label="Configuration (benefit class change)">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Configuration</h2>
            <p className="max-w-[740px] text-sm text-[#5c5c5c]">
              Select the classes that drive this communication (prototype; no field validation in UI).
            </p>
            <div className="grid max-w-[740px] gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-sm font-medium text-[#12181d]">From benefit class *</p>
                <Select
                  value={bccFromClass || undefined}
                  onValueChange={setBccFromClass}
                >
                  <SelectTrigger id={`${id}-bcc-from`} className="h-12 w-full rounded-lg border-[#a5aeb4]">
                    <SelectValue placeholder="Select from class" />
                  </SelectTrigger>
                  <SelectContent>
                    {BCC_FROM_CLASS_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-[#12181d]">To benefit class *</p>
                <Select
                  value={bccToClass || undefined}
                  onValueChange={setBccToClass}
                >
                  <SelectTrigger id={`${id}-bcc-to`} className="h-12 w-full rounded-lg border-[#a5aeb4]">
                    <SelectValue placeholder="Select to class" />
                  </SelectTrigger>
                  <SelectContent>
                    {BCC_TO_CLASS_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        ) : null}

        {isEnrollmentWindow ? (
          <section className="space-y-4" aria-label="Configuration (enrollment window)">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Configuration</h2>
            <div className="flex max-w-[740px] flex-col gap-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-[#12181d]">Enrollment Type *</p>
                <Select value={enrollmentType} onValueChange={setEnrollmentType}>
                  <SelectTrigger id={`${id}-enrollment-type`} className="h-12 w-full rounded-lg border-[#a5aeb4]">
                    <SelectValue placeholder="Enrollment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENROLLMENT_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-[#12181d]">Status *</p>
                  <Select value={enrollmentStatus} onValueChange={setEnrollmentStatus}>
                    <SelectTrigger id={`${id}-status`} className="h-12 w-full rounded-lg border-[#a5aeb4]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENROLLMENT_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-[#12181d]">Benefit Class</p>
                  <Select value={benefitClass} onValueChange={setBenefitClass}>
                    <SelectTrigger id={`${id}-benefit-class`} className="h-12 w-full rounded-lg border-[#a5aeb4]">
                      <SelectValue placeholder="Benefit Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {BENEFIT_CLASS_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="max-w-[min(100%,360px)]">
                <p className="mb-1.5 text-sm font-medium text-[#12181d]">Enrollment Effective Start Date *</p>
                <div className="relative">
                  <input
                    id={`${id}-start-date`}
                    type="date"
                    value={enrollmentStartDate}
                    onChange={(e) => setEnrollmentStartDate(e.target.value)}
                    className="h-12 w-full rounded-lg border border-[#a5aeb4] pr-10 pl-3 text-sm text-[#12181d]"
                    aria-label="Enrollment effective start date"
                  />
                  <Calendar
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c5c5c]"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {hasConfigurationSelection ? (
        <section className="space-y-4" aria-label="Content">
          <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Content</h2>
          <div className="flex max-w-[740px] flex-col gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#12181d]">Content Template *</p>
              <Select
                value={templateSelectValue}
                onValueChange={setTemplateId}
              >
                <SelectTrigger id={`${id}-template`} className="h-12 w-full rounded-lg border-[#a5aeb4]">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {contentTemplateOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-[#5c5c5c]">Changes made here will not affect the original template.</p>
            </div>
          </div>
        </section>
        ) : null}

        {hasConfigurationSelection ? (
        <section className="space-y-4" aria-label="Email">
          <div className="flex max-w-[740px] items-start justify-between gap-4">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Email</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1.5 text-[#0058a3]"
              onClick={() => toast.message('Edit email (prototype).')}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit Email
            </Button>
          </div>
          <div className="flex max-w-[740px] flex-col gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#5c5c5c]">From</p>
              <input
                id={`${id}-from`}
                readOnly
                value={fromAddress}
                className="h-12 w-full cursor-not-allowed rounded-lg border border-[#d1d6d8] bg-[#f5f7fa] px-4 text-sm text-[#12181d]"
                aria-label="From address (read only)"
              />
            </div>
            <FloatLabel
              id={`${id}-sender`}
              label="Show as sender *"
              value={showAsSender}
              onChange={(e) => setShowAsSender(e.target.value)}
            />
            <FloatLabel
              id={`${id}-email-subj`}
              label="Email Subject *"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>
        </section>
        ) : null}

        {isEnrollmentWindow ? (
          <section className="max-w-[740px] space-y-2" aria-label="Send options">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Send options</h2>
            <p className="text-sm text-[#5c5c5c]">Figma &quot;Send Options&quot; states — choose when to send (no enforcement in this prototype).</p>
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#12181d]">When to send</p>
              <Select
                value={sendTiming}
                onValueChange={(v) => setSendTiming(v as SendTiming)}
              >
                <SelectTrigger id={`${id}-send-timing`} className="h-12 w-full max-w-sm rounded-lg border-[#a5aeb4]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">Schedule (default — use Schedule Send)</SelectItem>
                  <SelectItem value="immediately">Send immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        ) : null}

        {hasConfigurationSelection ? (
        <section className="space-y-2" aria-label="Preview">
          <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Preview</h2>
          <p className="text-sm text-[#5c5c5c]">Content zone preview shows interpreted HTML (sanitized in-app).</p>
          {safePreviewHtml ? (
            <div
              className="max-h-[420px] max-w-[740px] overflow-y-auto rounded-lg border border-[#d1d6d8] bg-white p-4"
              dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
            />
          ) : (
            <div
              className="flex min-h-[120px] max-w-[740px] items-center justify-center rounded-lg border border-dashed border-[#a5aeb4] bg-[#f9fafb] px-4 text-center text-sm text-[#5c5c5c]"
              role="status"
            >
              Select a content template to load the content zone preview.
            </div>
          )}
        </section>
        ) : null}
      </CardContent>

      <div className="mt-2 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[#E4E6E9] pt-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            intent="primary"
            className="rounded-lg border-[#0058a3] px-4 text-[#0058a3]"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          {hasConfigurationSelection ? (
            <div className="inline-flex w-full min-w-0 sm:w-auto">
              <Button
                type="button"
                intent="primary"
                className="shrink-0 rounded-l-lg rounded-r-none border-r-0 px-4"
                onClick={handleSchedule}
              >
                Schedule Send
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    intent="primary"
                    className="rounded-l-none rounded-r-lg px-2.5"
                    aria-label="More send options"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleSchedule()}>Send now (prototype)</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toast.message('Open schedule picker (prototype).')}>
                    Choose date and time
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
