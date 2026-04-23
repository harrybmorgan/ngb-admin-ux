import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  FloatLabel,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { ArrowRight, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { USER_ID_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML } from '@/components/communications/AddCommunicationForm'
import {
  DEFAULT_DELIVERY_PREFERENCE,
  DELIVERY_METHOD_OPTIONS,
  getSecondaryChannelTabLabel,
  isDashboardDelivery,
  isEmailChannelTabDisabled,
  isSecondaryChannelTabDisabled,
} from '@/components/communications/deliveryMethodChannel'
import {
  AutomationSettingsDialog,
  type AutomationSettingsResult,
} from '@/components/communications/AutomationSettingsDialog'
import { EditEmailTemplateSheet } from '@/components/communications/EditEmailTemplateSheet'
import { sanitizeEmailBodyHtml } from '@/lib/sanitizeHtml'
import { cn } from '@/lib/utils'

const formCardClass =
  'flex w-full max-w-[1164px] flex-col items-center gap-10 rounded-lg border border-border bg-card p-4 sm:p-6'

const REQUIRED_DOT_CLASS =
  'pointer-events-none absolute left-[5px] top-[5px] z-10 size-[6px] rounded-full bg-[#e12d33]'

/** Figma: [Add Automation / SMS](https://www.figma.com/design/rH3S6MJJNltWf8lrrnU0jg/Communications-Builder?node-id=16323-77451) */
const SMS_COMPOSE_PLACEHOLDER = 'Add SMS to get started!'
const SMS_PREVIEW_PLACEHOLDER_TEXT = 'Your message preview will be shown here.'
const SMS_DEFAULT_AUTOMATION =
  'Open Enrollment has begun! Choose your [plan year] benefits by [deadline]. Review, compare, and enroll today: [bit.ly/my-site]'

const AUTOMATION_TYPE_OPTIONS = [
  'Benefit Class Change',
  'Confirmation',
  'Enrollment Window',
  'Life event',
  'COBRA notice',
] as const

const BCC_FROM_CLASS_OPTIONS = [
  'Benefit Class A',
  'Hourly / Non-exempt',
  'Salaried / Exempt',
  'Part-time',
  'Seasonal',
] as const
const BCC_TO_CLASS_OPTIONS = [
  'Benefit Class B',
  'Salaried — Class A (Medical + dental)',
  'Salaried — Class B (Core medical)',
  'Full-time — Retail',
  'Part-time — Limited benefits',
] as const

const TEMPLATE_CHOICES: { value: string; label: string }[] = [
  { value: 'benefit-class-change-1', label: 'Benefit Class Change 1' },
  { value: 'generic-oe', label: 'Open enrollment reminder' },
]

const GENERIC_OE_PREVIEW_HTML = `
  <div style="font-family: 'Open Sans', system-ui, sans-serif; color: #12181d; line-height: 1.5">
    <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px">Open enrollment ends soon</p>
    <p style="margin: 0; color: #5c5c5c; font-size: 14px">This preview uses the open enrollment reminder template (prototype).</p>
  </div>
`

function templatePreviewFor(value: string): string {
  if (value === 'generic-oe') return GENERIC_OE_PREVIEW_HTML
  if (value === 'benefit-class-change-1') return USER_ID_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML
  return USER_ID_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML
}

function defaultSubjectForTemplate(id: string): string {
  if (id === 'generic-oe') return 'Open enrollment reminder'
  return 'Your benefits eligibility has changed'
}

export function AddAutomationForm() {
  const navigate = useNavigate()
  const id = useId()

  const [automationName, setAutomationName] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<string>(DEFAULT_DELIVERY_PREFERENCE)
  const [automationType, setAutomationType] = useState('')

  const [bccFromClass, setBccFromClass] = useState<string>(BCC_FROM_CLASS_OPTIONS[0]!)
  const [bccToClass, setBccToClass] = useState<string>(BCC_TO_CLASS_OPTIONS[0]!)

  const [templateId, setTemplateId] = useState('benefit-class-change-1')
  const [emailSubject, setEmailSubject] = useState(() => defaultSubjectForTemplate('benefit-class-change-1'))
  const [customContentHtml, setCustomContentHtml] = useState<string | null>(null)
  const [editEmailOpen, setEditEmailOpen] = useState(false)
  const [editSession, setEditSession] = useState(0)
  const [messageChannelTab, setMessageChannelTab] = useState<'email' | 'sms'>('email')
  const [smsMessage, setSmsMessage] = useState(SMS_DEFAULT_AUTOMATION)

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)

  const showRestOfForm = automationType !== ''
  const emailTabDisabled = isEmailChannelTabDisabled(deliveryMethod)
  const secondaryTabDisabled = isSecondaryChannelTabDisabled(deliveryMethod)
  const secondaryChannelLabel = getSecondaryChannelTabLabel(deliveryMethod)

  const onDeliveryMethodChange = (v: string) => {
    setDeliveryMethod(v)
    if (v === 'Email only') setMessageChannelTab('email')
    if (v === 'SMS' || v === 'Dashboard') setMessageChannelTab('sms')
  }

  const previewSource = useMemo(() => {
    if (customContentHtml !== null) return customContentHtml
    return templatePreviewFor(templateId)
  }, [customContentHtml, templateId])

  const safePreviewHtml = useMemo(
    () => (previewSource ? sanitizeEmailBodyHtml(previewSource) : ''),
    [previewSource],
  )

  const editInitialHtml = useMemo(() => {
    if (customContentHtml !== null) return customContentHtml
    return templatePreviewFor(templateId)
  }, [customContentHtml, templateId])

  const onTemplateChange = (v: string) => {
    setTemplateId(v)
    setCustomContentHtml(null)
    setEmailSubject(defaultSubjectForTemplate(v))
  }

  const handleCancel = () => {
    navigate('/communications', { state: { defaultCommTab: 'automations' } })
  }

  const handleOpenSchedule = () => {
    setScheduleDialogOpen(true)
  }

  const handleAutomationSettingsConfirm = (result: AutomationSettingsResult) => {
    setScheduleDialogOpen(false)
    if (result.mode === 'scheduled') {
      const { date, timeLabel } = result.schedule
      const datePart = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
      toast.success(`Scheduled for ${datePart} at ${timeLabel} (prototype).`)
    } else if (result.mode === 'immediate') {
      toast.success('Automation will start immediately. (Prototype.)')
    } else {
      toast.success('Saved as draft. (Prototype.)')
    }
    navigate('/communications', {
      state: {
        newAutomationScheduled: true,
        automationName: automationName.trim() || undefined,
      },
    })
  }

  const openEditEmail = () => {
    setEditSession((n) => n + 1)
    setEditEmailOpen(true)
  }

  return (
    <>
      <Card className={cn(formCardClass, 'shadow-sm')}>
        <div className="w-full max-w-[740px]">
          <h1 className="text-2xl font-semibold leading-8 tracking-tight text-[#1d2c38]">Add New Automation</h1>
          <p className="mt-1 text-sm text-[#5c5c5c]">
            {showRestOfForm
              ? 'Prototype (no field validation in UI)'
              : 'Choose an automation type to configure the trigger, content, and schedule.'}
          </p>
        </div>

        <CardContent className="flex w-full max-w-[740px] flex-col gap-0 space-y-10 p-0">
          <section className="max-w-[740px] space-y-4" aria-label="Details">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Details</h2>
            <div className="flex max-w-[740px] flex-col gap-4">
              <div className="relative">
                <span className={REQUIRED_DOT_CLASS} aria-hidden />
                <Label htmlFor={`${id}-name`} className="sr-only">
                  Automation name
                </Label>
                <FloatLabel
                  id={`${id}-name`}
                  label="Automation Name"
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-normal leading-4 tracking-[0.1px] text-[#243746]">
                  Delivery Method
                </p>
                <div className="relative">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                  <Select value={deliveryMethod} onValueChange={onDeliveryMethodChange}>
                    <SelectTrigger
                      id={`${id}-delivery`}
                      className="h-12 w-full rounded-lg border-[#a5aeb4]"
                      aria-label="Delivery method"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_METHOD_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-normal leading-4 tracking-[0.1px] text-[#243746]">
                  Automation Type
                </p>
                <div className="relative">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                  <Select value={automationType || undefined} onValueChange={setAutomationType}>
                    <SelectTrigger
                      id={`${id}-automation-type`}
                      className="h-12 w-full rounded-lg border-[#a5aeb4]"
                      aria-label="Automation type"
                    >
                      <SelectValue placeholder="Select automation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTOMATION_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {showRestOfForm ? (
            <>
              <section className="max-w-[740px] space-y-4" aria-label="Define trigger">
                <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Define trigger</h2>
                <div className="flex w-full min-w-0 items-end gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-normal leading-4 tracking-[0.1px] text-[#243746]">
                      Moving From Benefit Class...
                    </p>
                    <div className="relative">
                      <span className={REQUIRED_DOT_CLASS} aria-hidden />
                      <Select value={bccFromClass} onValueChange={setBccFromClass}>
                        <SelectTrigger className="h-12 w-full rounded-lg border-[#a5aeb4]">
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
                  </div>
                  <div
                    className="flex h-12 shrink-0 items-center justify-center self-end pb-0.5"
                    aria-hidden
                  >
                    <ArrowRight className="h-5 w-5 text-[#243746]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-normal leading-4 tracking-[0.1px] text-[#243746]">
                      To Benefit Class...
                    </p>
                    <div className="relative">
                      <span className={REQUIRED_DOT_CLASS} aria-hidden />
                      <Select value={bccToClass} onValueChange={setBccToClass}>
                        <SelectTrigger className="h-12 w-full rounded-lg border-[#a5aeb4]">
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
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto gap-1.5 p-0 text-sm font-medium text-[#0058a3] hover:bg-transparent hover:text-[#0058a3] hover:underline"
                  onClick={() => toast.message('Additional from/to class rows (prototype).')}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add another
                </Button>
              </section>

              <Tabs
                value={messageChannelTab}
                onValueChange={(v) => setMessageChannelTab(v as 'email' | 'sms')}
                className="w-full max-w-[740px] space-y-4"
              >
                <div className="w-full border-b border-[#e4e6e9]">
                  <TabsList className="flex h-auto w-full min-h-0 flex-wrap items-stretch justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                    <TabsTrigger
                      value="email"
                      disabled={emailTabDisabled}
                      className="relative rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-[#12181d] shadow-none data-[state=active]:border-[#0058a3] data-[state=active]:text-[#0058a3] data-[state=inactive]:border-b data-[state=inactive]:border-[#e4e6e9] data-[state=inactive]:text-[#12181d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Email
                    </TabsTrigger>
                    <TabsTrigger
                      value="sms"
                      disabled={secondaryTabDisabled}
                      className="relative rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-[#12181d] shadow-none data-[state=active]:border-[#0058a3] data-[state=active]:text-[#0058a3] data-[state=inactive]:border-b data-[state=inactive]:border-[#e4e6e9] data-[state=inactive]:text-[#12181d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {secondaryChannelLabel}
                    </TabsTrigger>
                  </TabsList>
                </div>

                  <section className="space-y-4" aria-label="Content">
                    <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Content</h2>
                    <div className="flex max-w-[740px] flex-col gap-4">
                      <div className="relative">
                        <span className={REQUIRED_DOT_CLASS} aria-hidden />
                        <Label htmlFor={`${id}-subj-tab`} className="sr-only">
                          Email subject
                        </Label>
                        <FloatLabel
                          id={`${id}-subj-tab`}
                          label="Email Subject"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-normal leading-4 tracking-[0.1px] text-[#243746]">
                          Content template
                        </p>
                        <div className="relative">
                          <span className={REQUIRED_DOT_CLASS} aria-hidden />
                          <Select value={templateId} onValueChange={onTemplateChange}>
                            <SelectTrigger
                              id={`${id}-template-tabbed`}
                              className="h-12 w-full rounded-lg border-[#a5aeb4]"
                            >
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              {TEMPLATE_CHOICES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="mt-1.5 text-[10px] font-normal leading-4 tracking-[0.1px] text-[#243746]">
                          Changes made here will not affect the original template.
                        </p>
                      </div>
                    </div>
                  </section>

                  <TabsContent value="email" className="mt-0 space-y-4 focus-visible:outline-none" tabIndex={-1}>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">Email</h2>
                      <Button
                        type="button"
                        variant="outline"
                        intent="primary"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5 rounded-md border-[#0058a3] px-3 text-[#0058a3]"
                        onClick={openEditEmail}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Edit email
                      </Button>
                    </div>
                    <div className="w-full overflow-hidden rounded-lg border border-[#a5aeb4] bg-white">
                      <div className="px-4 py-3">
                        <p className="text-[11px] font-normal leading-4 tracking-[0.055px] text-[#515f6b]">Preview</p>
                        {safePreviewHtml ? (
                          <div
                            className="mt-2 max-h-[min(464px,70vh)] overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
                          />
                        ) : (
                          <div
                            className="mt-2 flex min-h-[120px] items-center justify-center text-center text-sm text-[#5c5c5c]"
                            role="status"
                          >
                            Select a content template to load the content zone preview.
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                <TabsContent value="sms" className="mt-0 space-y-3 focus-visible:outline-none" tabIndex={-1}>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-lg font-semibold leading-6 tracking-tight text-[#1d2c38]">
                        {isDashboardDelivery(deliveryMethod) ? 'Dashboard' : 'SMS'}
                      </h2>
                      <Button
                        type="button"
                        variant="outline"
                        intent="primary"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5 rounded-md border-[#0058a3] px-3 text-[#0058a3]"
                        onClick={() =>
                          toast.message('Edit SMS: update the message in the compose area (prototype).')
                        }
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Edit SMS
                      </Button>
                    </div>
                    <div className="grid min-h-[220px] w-full overflow-hidden rounded-lg border border-[#a5aeb4] bg-white sm:grid-cols-2">
                      <div className="flex flex-col border-[#a5aeb4] sm:border-r">
                        <div className="min-h-0 flex-1 p-3">
                          <Textarea
                            id={`${id}-sms-compose`}
                            value={smsMessage}
                            onChange={(e) => setSmsMessage(e.target.value)}
                            placeholder={SMS_COMPOSE_PLACEHOLDER}
                            className="min-h-[180px] w-full resize-y rounded-md border-0 bg-transparent p-0 text-sm text-[#12181d] shadow-none focus-visible:ring-0"
                            aria-label="SMS message body"
                            spellCheck
                          />
                        </div>
                      </div>
                      <div className="flex flex-col bg-[#f2f2f2] p-3">
                        <p className="text-[11px] font-normal leading-4 tracking-[0.055px] text-[#515f6b]">Preview</p>
                        <div className="mt-2 flex min-h-[160px] items-start justify-start">
                          <div className="max-w-[min(100%,18rem)] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm leading-snug text-[#12181d] shadow-sm">
                            {smsMessage.trim() ? smsMessage : SMS_PREVIEW_PLACEHOLDER_TEXT}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#5c5c5c]">
                      {smsMessage.length} characters | Text messages are limited to 160 characters.
                    </p>
                  </TabsContent>
                </Tabs>

            </>
          ) : null}

          <div className="flex w-full max-w-[740px] flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              intent="primary"
              className="h-9 rounded-md border border-[#0058a3] text-[#0058a3]"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            {showRestOfForm ? (
              <Button type="button" intent="primary" className="h-9 rounded-md px-4" onClick={handleOpenSchedule}>
                Schedule automation
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <EditEmailTemplateSheet
        key={editSession}
        open={editEmailOpen}
        onOpenChange={setEditEmailOpen}
        initialHtml={editInitialHtml}
        onSave={({ html }) => {
          setCustomContentHtml(html)
        }}
      />

      <AutomationSettingsDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onConfirm={handleAutomationSettingsConfirm}
      />
    </>
  )
}
