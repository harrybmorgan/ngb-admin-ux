import { useEffect, useId, useMemo, useState } from 'react'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { ArrowRight, Calendar, ChevronDown, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EditEmailTemplateSheet } from '@/components/communications/EditEmailTemplateSheet'
import {
  ScheduleSendDialog,
  type ScheduleSendResult,
} from '@/components/communications/ScheduleSendDialog'
import { sanitizeEmailBodyHtml } from '@/lib/sanitizeHtml'
import { cn } from '@/lib/utils'
import { DeliveryMethodMultiselect } from '@/components/communications/DeliveryMethodMultiselect'
import { LetterDocumentPreview } from '@/components/communications/LetterDocumentPreview'
import {
  DEFAULT_DELIVERY_PREFERENCE,
  type ChannelTabId,
  getChannelTabLabel,
  getContinueToNextLabel,
  getNextChannelTab,
  getVisibleChannelTabs,
  shouldUseSingleScheduleButton,
} from '@/components/communications/deliveryMethodChannel'

const formCardClass =
  'flex w-full max-w-[1164px] flex-col items-center gap-10 rounded-lg border border-border bg-card p-4 sm:p-6'

const REQUIRED_DOT_CLASS =
  'pointer-events-none absolute left-[5px] top-[5px] z-10 size-[6px] rounded-full bg-destructive'

const COMM_FIELD_LABEL_CLASS =
  'mb-1 text-[10px] font-normal leading-4 tracking-[0.1px] text-muted-foreground'

const outlinePrimaryCtaClass =
  'h-8 shrink-0 gap-1.5 rounded-md border border-link text-link'

const tabsTriggerClassName =
  'relative rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-foreground shadow-none data-[state=active]:border-link data-[state=active]:text-link data-[state=inactive]:border-b data-[state=inactive]:border-border data-[state=inactive]:text-foreground disabled:cursor-not-allowed disabled:opacity-50'

const previewFrameLabelClass = 'text-[11px] font-normal leading-4 tracking-[0.055px] text-muted-foreground'

/** Placeholder copy aligned with [SMS view in Communications-Builder](https://www.figma.com/design/rH3S6MJJNltWf8lrrnU0jg/Communications-Builder?node-id=15670-55448). */
const SMS_COMPOSE_PLACEHOLDER = 'Add SMS to get started!'
const SMS_PREVIEW_PLACEHOLDER_TEXT = 'Your message preview will be shown here.'

const SMS_PLACEHOLDER_USER_ID =
  "ACME Health: Use your User ID to sign in to the benefits portal. Do not share your password or User ID. Questions? [support phone]"

const SMS_PLACEHOLDER_ENROLLMENT =
  'Open enrollment: complete your 2026 elections by [deadline]. Sign in: [portal] — ACME Health. Reply STOP to opt out.'

const SMS_PLACEHOLDER_BCC =
  "Congrats on your new benefit class! Sign in to review your elections. Questions? [support] Reply STOP to opt out."

/** `Enrollment Window` = OE; `Benefit Class Change` = BCC (lightweight template + preview in this prototype). */
const CONFIGURATION_TYPE_OPTIONS = ['User ID', 'Enrollment Window', 'Benefit Class Change'] as const

const ENROLLMENT_TYPE_OPTIONS = ['Annual Open Enrollment', 'New hire', 'Special enrollment (life event)'] as const
const ENROLLMENT_STATUS_OPTIONS = [
  'Not Started, Incomplete',
  'In progress',
  'Complete',
] as const
const BENEFIT_CLASS_OPTIONS = ['Part Time, Full Time', 'All benefit classes', 'Salaried only'] as const

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
  { value: 'oe-content-zone-22', label: '22: Content Zone Name' },
]

/** User ID configuration: default content template (dropdown + preview). */
const USER_ID_DEFAULT_TEMPLATE = 'user-id-reminder-1' as const

const USER_ID_CONTENT_TEMPLATE_CHOICES: { value: string; label: string }[] = [
  { value: USER_ID_DEFAULT_TEMPLATE, label: 'User ID & sign-in reminder' },
  { value: 'benefit-class-change-1', label: 'Benefit Class Change 1' },
  { value: 'generic-oe', label: 'Open enrollment reminder' },
]

/** Rich HTML for preview; sanitized before `dangerouslySetInnerHTML`. */
const TEMPLATE_PREVIEW_HTML: Record<string, string> = {
  [USER_ID_DEFAULT_TEMPLATE]: `
    <div style="font-family: 'Open Sans', system-ui, sans-serif; color: #12181d; line-height: 1.5; max-width: 600px; margin: 0 auto">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px; color: #1d2c38">Your benefits User ID</p>
      <p style="margin: 0 0 12px">We are sending this message to share or remind you of the <strong>User ID</strong> you use to sign in to your employer&rsquo;s benefits website. Use it with your password (or the sign-in method your plan uses) to access your account.</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #243746"><span style="font-weight: 600">User ID:</span> [User ID will appear here]</p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #243746">If you&rsquo;ve forgotten your password, use <strong>Forgot password</strong> on the sign-in page&mdash;do not reply to this email with your password.</p>
      <p style="margin: 0 0 12px">
        <a href="#" style="color: #0058a3; font-weight: 500">Go to sign in</a>
      </p>
      <p style="margin: 0; color: #5c5c5c; font-size: 14px">This message was sent to the address on file for your account. For help, contact your benefits administrator.</p>
    </div>
  `,
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

/** Open-enrollment style content zone (“Welcome to … Annual Open Enrollment”); used for Enrollment Window preview. Named historically — not the class-change eligibility template below. */
export const BCC_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML = `
  <div style="font-family: Inter, 'Open Sans', system-ui, sans-serif; color: #12181d; line-height: 1.5; max-width: 600px; margin: 0 auto; text-align: center">
    <p style="font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #0b5fa5">ACME Health</p>
    <div style="background: #f1fafe; padding: 16px; margin: 0 -8px 16px; border-radius: 0">
      <p style="margin: 0; font-size: 14px; color: #243746">Illustration</p>
    </div>
    <p style="font-size: 17px; font-weight: 600; margin: 0 0 8px; color: #1d2c38">Welcome to 2025 Annual Open Enrollment</p>
    <p style="font-size: 16px; font-weight: 600; margin: 0 0 12px; color: #1d2c38">Enrollment Deadline: 1 / 1 / 2025</p>
    <p style="font-size: 14px; margin: 0 0 12px; text-align: left">
      This is a short intro paragraph that include the start date 1/1/2025 and the <strong>deadline date of 1/1/2025</strong> for annual open enrollment this year.
    </p>
    <p style="font-size: 14px; font-weight: 600; margin: 0 0 8px; text-align: left">Enrollment Materials</p>
    <ul style="text-align: left; color: #0058a3; font-size: 14px; margin: 0 0 12px; padding-left: 1.25rem">
      <li>My Benefit Express Website</li>
      <li>2025 Enrollment Guide</li>
      <li>Another Helpful Resource</li>
    </ul>
    <p style="font-size: 14px; margin: 0 0 12px; text-align: left">Another short paragraph with more information for reviewing and electing benefits.</p>
    <p style="font-size: 14px; margin: 0 0 16px; text-align: left">
      <a href="#" style="display: inline-block; background: #0058a3; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-weight: 500; font-size: 14px">Enroll Now</a>
    </p>
    <p style="font-size: 13px; color: #515f6b; border-top: 1px solid #d9d9d9; padding-top: 12px; margin: 0">[Client Name] Benefits Team</p>
  </div>
`

/** “Benefit Class Change 1” content zone in preview for User ID; matches [Communications-Builder / User ID](https://www.figma.com/design/rH3S6MJJNltWf8lrrnU0jg/Communications-Builder?node-id=2098-54587). */
export const USER_ID_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML = `
  <div style="font-family: Inter, 'Open Sans', system-ui, sans-serif; color: #12181d; line-height: 1.5; max-width: 600px; margin: 0 auto; text-align: center">
    <p style="font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #0b5fa5">ACME Health</p>
    <div style="background: #f5f7fa; padding: 24px; margin: 0 0 16px; min-height: 120px; display: flex; align-items: center; justify-content: center; color: #5c5c5c; font-size: 12px">Illustration / hero</div>
    <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px; color: #1d2c38">Your Benefits Eligibility has Changed</p>
    <p style="font-size: 14px; margin: 0 0 12px; text-align: left">You’ve recently become eligible for health benefits due to a change in your status or a qualifying life event. If you’ve already completed your online benefits enrollment, no further action is required.</p>
    <p style="font-size: 14px; margin: 0 0 12px; text-align: left">If you have not enrolled in your benefits, you have up to 31 days from the date of your recent status change to complete enrollment.</p>
    <p style="font-size: 14px; margin: 0 0 12px; text-align: left">If you choose to enroll in benefits, your benefits will be effective retroactive to status change date. This date can be found on the confirmation statement at the completion of your enrollment. You will be responsible for any retroactive premium payments that may be due once you enroll in coverage.</p>
    <p style="font-size: 14px; margin: 0 0 12px; text-align: left">
      If you need help or have any questions please reach out by phone at <a href="#" style="color: #0058a3">[123-123-1234]</a> or email at <a href="#" style="color: #0058a3">[hr@clientname.com]</a>.
    </p>
    <p style="font-size: 14px; margin: 0 0 16px; text-align: left">
      <a href="#" style="display: inline-block; background: #0058a3; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-weight: 500; font-size: 14px">Enroll Now</a>
    </p>
    <p style="font-size: 13px; color: #515f6b; border-top: 1px solid #d9d9d9; padding-top: 12px; margin: 0; text-align: center">[Client Name] Benefits Team</p>
  </div>
`

const DEMO_USER_IDS_CSV =
  '1234, 4567, 7891, 9123, 9234, 9345, 9456, 9567, 9678, 9789'

type EmailSubjectConfig = 'userId' | 'enrollment' | 'bcc'

function resolveUserIdTemplateId(t: string): string {
  return t === 'oe-content-zone-22' || t === '' ? USER_ID_DEFAULT_TEMPLATE : t
}

/**
 * Default subject line aligned to the active content template + preview for each
 * configuration type. Updated when the user changes configuration or template.
 */
function getDefaultEmailSubjectForTemplate(config: EmailSubjectConfig, templateId: string): string {
  const raw = templateId || ''
  switch (config) {
    case 'userId': {
      const id = resolveUserIdTemplateId(raw)
      if (id === USER_ID_DEFAULT_TEMPLATE) {
        return 'Your User ID and benefits sign-in'
      }
      if (id === 'benefit-class-change-1') {
        return 'Your benefits eligibility has changed'
      }
      if (id === 'generic-oe') {
        return 'Open enrollment ends soon'
      }
      return 'Message from your benefits team'
    }
    case 'enrollment':
      if (raw === 'oe-content-zone-22') {
        return 'Welcome to 2025 Open Enrollment'
      }
      if (raw === 'generic-oe') {
        return 'Reminder: open enrollment is closing soon'
      }
      if (raw === 'benefit-class-change-1') {
        return 'Your benefit eligibility is ready to review'
      }
      return 'Open Enrollment 2025'
    case 'bcc':
      if (raw === 'benefit-class-change-1') {
        return 'Your benefits eligibility has changed'
      }
      if (raw === 'generic-oe') {
        return 'Open enrollment reminder'
      }
      return 'Update from your benefits team'
    default:
      return 'Message from your benefits team'
  }
}

/** OE “22: Content Zone Name” preview; same rich zone as [Enrollment Window](https://www.figma.com/design/rH3S6MJJNltWf8lrrnU0jg/Communications-Builder?node-id=2136-24968) — open-enrollment style body (not the class-change eligibility template). */
const ENROLLMENT_OE_22_FIGMA_PREVIEW_HTML = BCC_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML

function countUserIds(raw: string): number {
  return raw
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean).length
}

export function AddCommunicationForm() {
  const navigate = useNavigate()
  const id = useId()

  const [configurationType, setConfigurationType] = useState<string>('')
  const [communicationName, setCommunicationName] = useState('')
  const [deliveryMethodSelection, setDeliveryMethodSelection] = useState<string[]>([
    DEFAULT_DELIVERY_PREFERENCE,
  ])

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
  /** BCC: HTML saved from Edit email template sheet; `null` = use selected template only. */
  const [bccCustomContentHtml, setBccCustomContentHtml] = useState<string | null>(null)
  const [bccEditEmailOpen, setBccEditEmailOpen] = useState(false)
  /** Bumps so `EditEmailTemplateSheet` remounts with fresh `initialHtml` each time the editor opens. */
  const [bccEditSession, setBccEditSession] = useState(0)
  /** User ID path: HTML from Edit email template sheet; `null` = use selected template preview. */
  const [userIdCustomContentHtml, setUserIdCustomContentHtml] = useState<string | null>(null)
  const [userIdEditEmailOpen, setUserIdEditEmailOpen] = useState(false)
  const [userIdEditSession, setUserIdEditSession] = useState(0)
  const [enrollmentCustomContentHtml, setEnrollmentCustomContentHtml] = useState<string | null>(null)
  const [enrollmentEditEmailOpen, setEnrollmentEditEmailOpen] = useState(false)
  const [enrollmentEditSession, setEnrollmentEditSession] = useState(0)
  const [fromAddress] = useState('DoNotReply@wexapps.com')
  const [showAsSender, setShowAsSender] = useState('WEX Benefits')
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  /**
   * Default delivery: Email | SMS (Text) Message above Content per
   * [Figma 15521:22806](https://www.figma.com/design/rH3S6MJJNltWf8lrrnU0jg/Communications-Builder?node-id=15521-22806).
   */
  const [messageChannelTab, setMessageChannelTab] = useState<ChannelTabId>('email')
  const [smsMessage, setSmsMessage] = useState('')
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [letterBody, setLetterBody] = useState('')

  const visibleChannelTabs = useMemo(
    () => getVisibleChannelTabs(deliveryMethodSelection),
    [deliveryMethodSelection],
  )

  useEffect(() => {
    if (visibleChannelTabs.length > 0 && !visibleChannelTabs.includes(messageChannelTab)) {
      setMessageChannelTab(visibleChannelTabs[0]!)
    }
  }, [visibleChannelTabs, messageChannelTab])

  const userIdCount = useMemo(() => countUserIds(userIdsRaw), [userIdsRaw])

  const nextChannelTab = getNextChannelTab(visibleChannelTabs, messageChannelTab)
  const showChannelContinue = nextChannelTab !== null
  const useSingleSchedule = shouldUseSingleScheduleButton(
    deliveryMethodSelection,
    messageChannelTab,
    visibleChannelTabs,
  )

  const onConfigurationTypeChange = (v: string) => {
    setConfigurationType(v)
    if (v === 'Enrollment Window') {
      setTemplateId('oe-content-zone-22')
      setCommunicationName((n) => n || '2025 Open Enrollment Email')
      setEmailSubject(getDefaultEmailSubjectForTemplate('enrollment', 'oe-content-zone-22'))
      setEnrollmentCustomContentHtml(null)
      setMessageChannelTab('email')
      setSmsMessage(SMS_PLACEHOLDER_ENROLLMENT)
    } else if (v === 'User ID') {
      setTemplateId((t) => {
        const next = t === 'oe-content-zone-22' || t === '' ? USER_ID_DEFAULT_TEMPLATE : t
        setEmailSubject(getDefaultEmailSubjectForTemplate('userId', next))
        return next
      })
      setCommunicationName((n) => n || 'Communication to UserID')
      setUserIdsRaw((r) => r || DEMO_USER_IDS_CSV)
      setUserIdCustomContentHtml(null)
      setEnrollmentCustomContentHtml(null)
      setMessageChannelTab('email')
      setSmsMessage(SMS_PLACEHOLDER_USER_ID)
    } else if (v === 'Benefit Class Change') {
      setCommunicationName('')
      setEmailSubject(getDefaultEmailSubjectForTemplate('bcc', 'benefit-class-change-1'))
      setTemplateId('benefit-class-change-1')
      setBccFromClass('Benefit Class A')
      setBccToClass('Benefit Class B')
      setBccCustomContentHtml(null)
      setEnrollmentCustomContentHtml(null)
      setMessageChannelTab('email')
      setSmsMessage(SMS_PLACEHOLDER_BCC)
    }
  }

  const effectiveTemplateId = (
    isUserId && templateId === 'oe-content-zone-22' ? USER_ID_DEFAULT_TEMPLATE : templateId
  ) as string
  const previewSource = useMemo(() => {
    if (!hasConfigurationSelection) return ''
    if (isBenefitClassChange) {
      if (bccCustomContentHtml !== null) return bccCustomContentHtml
      if (effectiveTemplateId === 'benefit-class-change-1') {
        return USER_ID_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML
      }
      if (effectiveTemplateId) {
        return TEMPLATE_PREVIEW_HTML[effectiveTemplateId] ?? ''
      }
      return ''
    }
    if (isUserId) {
      if (userIdCustomContentHtml !== null) return userIdCustomContentHtml
      if (effectiveTemplateId === 'benefit-class-change-1') {
        return USER_ID_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML
      }
      if (effectiveTemplateId) {
        return (
          TEMPLATE_PREVIEW_HTML[effectiveTemplateId] ?? TEMPLATE_PREVIEW_HTML[USER_ID_DEFAULT_TEMPLATE]!
        )
      }
      return ''
    }
    if (isEnrollmentWindow) {
      if (enrollmentCustomContentHtml !== null) return enrollmentCustomContentHtml
      if (effectiveTemplateId === 'oe-content-zone-22') {
        return ENROLLMENT_OE_22_FIGMA_PREVIEW_HTML
      }
      if (effectiveTemplateId) {
        return TEMPLATE_PREVIEW_HTML[effectiveTemplateId] ?? ''
      }
      return ''
    }
    if (effectiveTemplateId) {
      return TEMPLATE_PREVIEW_HTML[effectiveTemplateId] ?? TEMPLATE_PREVIEW_HTML['benefit-class-change-1']!
    }
    return ''
  }, [
    hasConfigurationSelection,
    isBenefitClassChange,
    isUserId,
    isEnrollmentWindow,
    bccCustomContentHtml,
    userIdCustomContentHtml,
    enrollmentCustomContentHtml,
    effectiveTemplateId,
  ])
  const safePreviewHtml = useMemo(
    () => (previewSource ? sanitizeEmailBodyHtml(previewSource) : ''),
    [previewSource],
  )
  const bccEditInitialHtml = useMemo(() => {
    if (bccCustomContentHtml !== null) return bccCustomContentHtml
    if (effectiveTemplateId === 'benefit-class-change-1') {
      return USER_ID_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML
    }
    if (effectiveTemplateId) return TEMPLATE_PREVIEW_HTML[effectiveTemplateId] ?? ''
    return ''
  }, [bccCustomContentHtml, effectiveTemplateId])

  const userIdEditInitialHtml = useMemo(() => {
    if (userIdCustomContentHtml !== null) return userIdCustomContentHtml
    if (effectiveTemplateId === 'benefit-class-change-1') {
      return USER_ID_BENEFIT_CLASS_CHANGE_1_PREVIEW_HTML
    }
    if (effectiveTemplateId) return TEMPLATE_PREVIEW_HTML[effectiveTemplateId] ?? ''
    return ''
  }, [userIdCustomContentHtml, effectiveTemplateId])

  const enrollmentEditInitialHtml = useMemo(() => {
    if (enrollmentCustomContentHtml !== null) return enrollmentCustomContentHtml
    if (effectiveTemplateId === 'oe-content-zone-22') {
      return ENROLLMENT_OE_22_FIGMA_PREVIEW_HTML
    }
    if (effectiveTemplateId) return TEMPLATE_PREVIEW_HTML[effectiveTemplateId] ?? ''
    return ''
  }, [enrollmentCustomContentHtml, effectiveTemplateId])

  const onContentTemplateChange = (v: string) => {
    setTemplateId(v)
    if (isBenefitClassChange) {
      setBccCustomContentHtml(null)
      setEmailSubject(getDefaultEmailSubjectForTemplate('bcc', v))
    }
    if (isUserId) {
      setUserIdCustomContentHtml(null)
      setEmailSubject(
        getDefaultEmailSubjectForTemplate('userId', resolveUserIdTemplateId(v)),
      )
    }
    if (isEnrollmentWindow) {
      setEnrollmentCustomContentHtml(null)
      setEmailSubject(getDefaultEmailSubjectForTemplate('enrollment', v))
    }
  }

  const handleCancel = () => {
    navigate('/communications')
  }

  const handleSendNow = () => {
    navigate('/communications', {
      state: {
        newCommunicationScheduled: true,
        name: communicationName.trim() || undefined,
        sendMode: 'now' as const,
      },
    })
  }

  const handleOpenScheduleDialog = () => {
    setScheduleDialogOpen(true)
  }

  const handleScheduleFromModal = (result: ScheduleSendResult) => {
    setScheduleDialogOpen(false)
    navigate('/communications', {
      state: {
        newCommunicationScheduled: true,
        name: communicationName.trim() || undefined,
        sendMode: 'scheduled' as const,
        scheduleDate: result.date.toISOString().slice(0, 10),
        timeLabel: result.timeLabel,
        minutesFromMidnightCt: result.minutesFromMidnightCt,
      },
    })
    const datePart = result.date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    toast.success(
      `Scheduled for ${datePart} at ${result.timeLabel} (prototype).`,
    )
  }

  const templateSelectValue =
    isUserId && templateId === 'oe-content-zone-22' ? USER_ID_DEFAULT_TEMPLATE : templateId || undefined

  const contentTemplateOptions = isUserId
    ? USER_ID_CONTENT_TEMPLATE_CHOICES
    : isBenefitClassChange
      ? TEMPLATE_CHOICES.filter((t) => t.value === 'benefit-class-change-1' || t.value === 'generic-oe')
      : TEMPLATE_CHOICES

  return (
    <Card className={cn(formCardClass, 'shadow-sm')}>
      <div className="w-full max-w-[740px]">
        <h1 className="text-2xl font-semibold leading-8 tracking-tight text-foreground">Add New Communication</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasConfigurationSelection
            ? 'Prototype (no field validation in UI)'
            : 'Choose a configuration type to configure targeting, content, and schedule.'}
        </p>
      </div>

      <CardContent className="flex w-full max-w-[740px] flex-col gap-0 space-y-10 p-0">
        <section className="max-w-[740px] space-y-4" aria-label="Details">
          <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Details</h2>
          <div className="flex max-w-[740px] flex-col gap-4">
            <div className="relative">
              <span className={REQUIRED_DOT_CLASS} aria-hidden />
              <Label htmlFor={`${id}-name`} className="sr-only">
                Communication name
              </Label>
              <FloatLabel
                id={`${id}-name`}
                label="Communication Name"
                value={communicationName}
                onChange={(e) => setCommunicationName(e.target.value)}
              />
            </div>
            <div>
              <p className={COMM_FIELD_LABEL_CLASS}>Delivery Method</p>
              <div className="relative">
                <span className={REQUIRED_DOT_CLASS} aria-hidden />
                <DeliveryMethodMultiselect
                  id={`${id}-delivery`}
                  value={deliveryMethodSelection}
                  onChange={setDeliveryMethodSelection}
                  className="border-input"
                  triggerClassName="border-input"
                />
              </div>
            </div>
            <div>
              <p className={COMM_FIELD_LABEL_CLASS}>Configuration Type</p>
              <div className="relative">
                <span className={REQUIRED_DOT_CLASS} aria-hidden />
                <Select
                  value={configurationType || undefined}
                  onValueChange={onConfigurationTypeChange}
                >
                  <SelectTrigger
                    id={`${id}-config`}
                    className="h-12 w-full rounded-lg border border-input"
                    aria-required
                  >
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
              </div>
              {!hasConfigurationSelection ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Select a type to see configuration, content, and email fields.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {isUserId ? (
          <section className="max-w-[740px] space-y-4" aria-label="Configuration">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Configuration</h2>
            <div className="space-y-1.5">
              <div className="relative">
                <span className={REQUIRED_DOT_CLASS} aria-hidden />
                <Label
                  htmlFor={`${id}-user-ids`}
                  className="pointer-events-none absolute left-4 top-3 z-[1] text-[10px] font-normal leading-4 tracking-[0.1px] text-muted-foreground"
                >
                  User IDs (comma separated, ex: 1234, 4567, 7890)
                </Label>
                <Textarea
                  id={`${id}-user-ids`}
                  value={userIdsRaw}
                  onChange={(e) => setUserIdsRaw(e.target.value)}
                  className="min-h-[132px] w-full resize-y rounded-lg border border-input bg-background pt-8 text-sm text-foreground"
                  autoComplete="off"
                  aria-required
                />
              </div>
              <p className={COMM_FIELD_LABEL_CLASS}>
                {userIdCount === 0
                  ? '0 User IDs'
                  : userIdCount === 1
                    ? '1 user'
                    : `${userIdCount} users`}
              </p>
            </div>
          </section>
        ) : null}

        {isBenefitClassChange ? (
          <section className="max-w-[740px] space-y-4" aria-label="Configuration (benefit class change)">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Configuration</h2>
            <div className="flex w-full min-w-0 items-end gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className={COMM_FIELD_LABEL_CLASS}>Moving From Benefit Class…</p>
                <div className="relative">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                <Select
                  value={bccFromClass || undefined}
                  onValueChange={setBccFromClass}
                >
                  <SelectTrigger id={`${id}-bcc-from`} className="h-12 w-full rounded-lg border border-input">
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
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={COMM_FIELD_LABEL_CLASS}>To Benefit Class…</p>
                <div className="relative">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                <Select
                  value={bccToClass || undefined}
                  onValueChange={setBccToClass}
                >
                  <SelectTrigger id={`${id}-bcc-to`} className="h-12 w-full rounded-lg border border-input">
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
              className="h-auto gap-1.5 p-0 text-sm font-medium text-link hover:bg-transparent hover:text-link hover:underline"
              onClick={() => toast.message('Additional from/to class rows are not wired in this prototype.')}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add another
            </Button>
          </section>
        ) : null}

        {isEnrollmentWindow ? (
          <section className="max-w-[740px] space-y-4" aria-label="Configuration (enrollment window)">
            <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Configuration</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className={COMM_FIELD_LABEL_CLASS}>Enrollment Type</p>
                <div className="relative">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                  <Select value={enrollmentType} onValueChange={setEnrollmentType}>
                    <SelectTrigger
                      id={`${id}-enrollment-type`}
                      className="h-12 w-full rounded-lg border border-input"
                      aria-required
                    >
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
              </div>
              <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                <div>
                  <p className={COMM_FIELD_LABEL_CLASS}>Status</p>
                  <div className="relative">
                    <span className={REQUIRED_DOT_CLASS} aria-hidden />
                    <Select value={enrollmentStatus} onValueChange={setEnrollmentStatus}>
                      <SelectTrigger
                        id={`${id}-status`}
                        className="h-12 w-full rounded-lg border border-input"
                        aria-required
                      >
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
                </div>
                <div>
                  <p className={COMM_FIELD_LABEL_CLASS}>Benefit Class</p>
                  <div className="relative">
                    <span className={REQUIRED_DOT_CLASS} aria-hidden />
                    <Select value={benefitClass} onValueChange={setBenefitClass}>
                      <SelectTrigger id={`${id}-benefit-class`} className="h-12 w-full rounded-lg border border-input">
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
              </div>
              <div className="w-full sm:max-w-[min(100%,360px)]">
                <p className={COMM_FIELD_LABEL_CLASS}>Enrollment Effective Start Date</p>
                <div className="relative">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                  <input
                    id={`${id}-start-date`}
                    type="date"
                    value={enrollmentStartDate}
                    onChange={(e) => setEnrollmentStartDate(e.target.value)}
                    className="h-12 w-full rounded-lg border border-input bg-background pr-10 pl-3 text-sm text-foreground"
                    aria-label="Enrollment effective start date"
                    aria-required
                  />
                  <Calendar
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {hasConfigurationSelection ? (
          <Tabs
            value={messageChannelTab}
            onValueChange={(v) => setMessageChannelTab(v as ChannelTabId)}
            className="w-full max-w-[740px] space-y-4"
          >
            <div className="w-full border-b border-border">
              <TabsList className="flex h-auto w-full min-h-0 flex-wrap items-stretch justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                {visibleChannelTabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className={tabsTriggerClassName}>
                    {getChannelTabLabel(tab)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <section className="space-y-4" aria-label="Content">
              <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Content</h2>
              <div className="flex max-w-[740px] flex-col gap-4">
                {isBenefitClassChange ? (
                  <div className="relative">
                    <span className={REQUIRED_DOT_CLASS} aria-hidden />
                    <Label htmlFor={`${id}-bcc-email-subj-tab`} className="sr-only">
                      Email subject
                    </Label>
                    <FloatLabel
                      id={`${id}-bcc-email-subj-tab`}
                      label="Email Subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                ) : null}
                <div>
                  <p className={COMM_FIELD_LABEL_CLASS}>Content template</p>
                  <div className="relative">
                    <span className={REQUIRED_DOT_CLASS} aria-hidden />
                    <Select value={templateSelectValue} onValueChange={onContentTemplateChange}>
                      <SelectTrigger
                        id={`${id}-template-tabbed`}
                        className="h-12 w-full rounded-lg border border-input"
                        aria-required
                      >
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
                  </div>
                  <p className="mt-1.5 text-[10px] font-normal leading-4 tracking-[0.1px] text-muted-foreground">
                    Changes made here will not affect the original template.
                  </p>
                </div>
              </div>
            </section>

            <TabsContent value="email" className="mt-0 space-y-4 focus-visible:outline-none" tabIndex={-1}>
              {isBenefitClassChange ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Email</h2>
                    <Button
                      type="button"
                      variant="outline"
                      intent="primary"
                      size="sm"
                      className={outlinePrimaryCtaClass}
                      onClick={() => {
                        setBccEditSession((s) => s + 1)
                        setBccEditEmailOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit email
                    </Button>
                  </div>
                  <div className="w-full overflow-hidden rounded-lg border border-input bg-card">
                    <div className="px-4 py-3">
                      <p className={previewFrameLabelClass}>Preview</p>
                      {safePreviewHtml ? (
                        <div
                          className="mt-2 max-h-[min(464px,70vh)] overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
                        />
                      ) : (
                        <div
                          className="mt-2 flex min-h-[120px] items-center justify-center text-center text-sm text-muted-foreground"
                          role="status"
                        >
                          Select a content template to load the content zone preview.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
              {isUserId ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Email</h2>
                    <Button
                      type="button"
                      variant="outline"
                      intent="primary"
                      size="sm"
                      className={outlinePrimaryCtaClass}
                      onClick={() => {
                        setUserIdEditSession((s) => s + 1)
                        setUserIdEditEmailOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit email
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                    <div>
                      <div
                        className="flex h-12 cursor-not-allowed flex-col justify-center overflow-hidden rounded-lg border border-input bg-card px-4"
                        aria-label="From address (read only)"
                      >
                        <span className="text-[10px] font-normal leading-4 tracking-[0.1px] text-muted-foreground">From</span>
                        <span className="truncate text-sm leading-5 text-foreground">{fromAddress}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className={REQUIRED_DOT_CLASS} aria-hidden />
                      <Label htmlFor={`${id}-sender-uid-t`} className="sr-only">
                        Show as sender
                      </Label>
                      <FloatLabel
                        id={`${id}-sender-uid-t`}
                        label="Show as sender"
                        value={showAsSender}
                        onChange={(e) => setShowAsSender(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <span className={REQUIRED_DOT_CLASS} aria-hidden />
                    <Label htmlFor={`${id}-email-subj-uid-t`} className="sr-only">
                      Email subject
                    </Label>
                    <FloatLabel
                      id={`${id}-email-subj-uid-t`}
                      label="Email Subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  <div className="w-full overflow-hidden rounded-lg border border-input bg-card">
                    <div className="px-4 py-3">
                      <p className={previewFrameLabelClass}>Preview</p>
                      {safePreviewHtml ? (
                        <div
                          className="mt-2 max-h-[min(464px,70vh)] overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
                        />
                      ) : (
                        <div
                          className="mt-2 flex min-h-[120px] items-center justify-center text-center text-sm text-muted-foreground"
                          role="status"
                        >
                          Select a content template to load the content zone preview.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
              {isEnrollmentWindow ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Email</h2>
                    <Button
                      type="button"
                      variant="outline"
                      intent="primary"
                      size="sm"
                      className={outlinePrimaryCtaClass}
                      onClick={() => {
                        setEnrollmentEditSession((s) => s + 1)
                        setEnrollmentEditEmailOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit email
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                    <div>
                      <div
                        className="flex h-12 flex-col justify-center overflow-hidden rounded-lg border border-input bg-card px-4"
                        aria-label="From address (read only)"
                      >
                        <span className="text-[10px] font-normal leading-4 tracking-[0.1px] text-muted-foreground">From</span>
                        <span className="truncate text-sm leading-5 text-foreground">{fromAddress}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className={REQUIRED_DOT_CLASS} aria-hidden />
                      <Label htmlFor={`${id}-sender-oe-t`} className="sr-only">
                        Show as sender
                      </Label>
                      <FloatLabel
                        id={`${id}-sender-oe-t`}
                        label="Show as sender"
                        value={showAsSender}
                        onChange={(e) => setShowAsSender(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <span className={REQUIRED_DOT_CLASS} aria-hidden />
                    <Label htmlFor={`${id}-email-subj-oe-t`} className="sr-only">
                      Email subject
                    </Label>
                    <FloatLabel
                      id={`${id}-email-subj-oe-t`}
                      label="Email Subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  <div className="w-full overflow-hidden rounded-lg border border-input bg-card">
                    <div className="px-4 py-3">
                      <p className={previewFrameLabelClass}>Preview</p>
                      {safePreviewHtml ? (
                        <div
                          className="mt-2 max-h-[min(464px,70vh)] overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
                        />
                      ) : (
                        <div
                          className="mt-2 flex min-h-[120px] items-center justify-center text-center text-sm text-muted-foreground"
                          role="status"
                        >
                          Select a content template to load the content zone preview.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="sms" className="mt-0 space-y-3 focus-visible:outline-none" tabIndex={-1}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">SMS</h2>
                <Button
                  type="button"
                  variant="outline"
                  intent="primary"
                  size="sm"
                  className={outlinePrimaryCtaClass}
                  onClick={() =>
                    toast.message('Edit SMS: update the message in the compose area (prototype).')
                  }
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit SMS
                </Button>
              </div>
              <div className="grid min-h-[220px] w-full overflow-hidden rounded-lg border border-input bg-card sm:grid-cols-2">
                <div className="relative flex flex-col border-b border-input sm:border-b-0 sm:border-r sm:border-t-0 sm:border-l-0">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                  <div className="min-h-0 flex-1 p-3">
                    <Textarea
                      id={`${id}-sms-compose`}
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder={SMS_COMPOSE_PLACEHOLDER}
                      className="min-h-[180px] w-full resize-y rounded-md border-0 bg-transparent p-0 text-sm text-foreground shadow-none focus-visible:ring-0"
                      aria-label="SMS message body"
                      aria-required
                    />
                  </div>
                </div>
                <div className="flex flex-col bg-muted p-3">
                  <p className={previewFrameLabelClass}>Preview</p>
                  <div className="mt-2 flex min-h-[160px] items-start justify-start">
                    <div className="max-w-[min(100%,18rem)] rounded-2xl rounded-tl-sm bg-card px-3 py-2 text-sm leading-snug text-foreground shadow-sm">
                      {smsMessage.trim() ? smsMessage : SMS_PREVIEW_PLACEHOLDER_TEXT}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {smsMessage.length} characters | Text messages are limited to 160 characters.
              </p>
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0 space-y-3 focus-visible:outline-none" tabIndex={-1}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">
                  Dashboard Notification
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  intent="primary"
                  size="sm"
                  className={outlinePrimaryCtaClass}
                  onClick={() =>
                    toast.message(
                      'Edit notification: update the message in the compose area (prototype).',
                    )
                  }
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit notification
                </Button>
              </div>
              <div className="grid min-h-[220px] w-full overflow-hidden rounded-lg border border-input bg-card sm:grid-cols-2">
                <div className="relative flex flex-col border-b border-input sm:border-b-0 sm:border-r">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                  <div className="min-h-0 flex-1 p-3">
                    <Textarea
                      id={`${id}-dashboard-compose`}
                      value={dashboardMessage}
                      onChange={(e) => setDashboardMessage(e.target.value)}
                      placeholder="Add a dashboard notification to get started!"
                      className="min-h-[180px] w-full resize-y rounded-md border-0 bg-transparent p-0 text-sm text-foreground shadow-none focus-visible:ring-0"
                      aria-label="Dashboard notification message"
                    />
                  </div>
                </div>
                <div className="flex flex-col bg-muted p-3">
                  <p className={previewFrameLabelClass}>Preview</p>
                  <div className="mt-2 flex min-h-[160px] items-start">
                    <div
                      className="w-full max-w-md rounded-lg border border-border bg-card p-3 text-left shadow-sm"
                      role="status"
                    >
                      <p className="text-xs font-medium text-muted-foreground">Notification</p>
                      <p className="mt-2 text-sm text-foreground">
                        {dashboardMessage.trim() ? dashboardMessage : 'Preview will appear here.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="letter" className="mt-0 space-y-3 focus-visible:outline-none" tabIndex={-1}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Letter</h2>
                <Button
                  type="button"
                  variant="outline"
                  intent="primary"
                  size="sm"
                  className={outlinePrimaryCtaClass}
                  onClick={() => toast.message('Edit letter: update the body in the compose area (prototype).')}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit letter
                </Button>
              </div>
              <div className="grid min-h-[220px] w-full overflow-hidden rounded-lg border border-input bg-card sm:grid-cols-2">
                <div className="relative flex flex-col border-b border-input sm:border-b-0 sm:border-r">
                  <span className={REQUIRED_DOT_CLASS} aria-hidden />
                  <div className="min-h-0 flex-1 p-3">
                    <Textarea
                      id={`${id}-letter-compose`}
                      value={letterBody}
                      onChange={(e) => setLetterBody(e.target.value)}
                      placeholder="Add letter copy to get started."
                      className="min-h-[180px] w-full resize-y rounded-md border-0 bg-transparent p-0 text-sm text-foreground shadow-none focus-visible:ring-0"
                      aria-label="Letter body"
                    />
                  </div>
                </div>
                <div className="flex min-h-0 flex-col bg-muted p-3">
                  <p className={previewFrameLabelClass}>Preview</p>
                  <LetterDocumentPreview
                    body={letterBody}
                    emptyHint="Letter copy will appear in the body of this message."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}

      </CardContent>

      <div className="w-full max-w-[740px]">
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            intent="primary"
            className="h-9 rounded-md border border-link text-link"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          {hasConfigurationSelection ? (
            isBenefitClassChange ? (
              showChannelContinue && nextChannelTab ? (
                <Button
                  type="button"
                  variant="link"
                  intent="primary"
                  className="h-auto min-h-0 gap-1.5 p-0 text-sm font-medium text-link no-underline hover:text-link hover:underline"
                  onClick={() => setMessageChannelTab(nextChannelTab)}
                >
                  {getContinueToNextLabel(nextChannelTab)}
                  <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                </Button>
              ) : (
                <Button
                  type="button"
                  intent="primary"
                  className="h-9 rounded-md px-4"
                  onClick={handleOpenScheduleDialog}
                >
                  Continue to schedule
                </Button>
              )
            ) : showChannelContinue && nextChannelTab ? (
              <Button
                type="button"
                variant="link"
                intent="primary"
                className="h-auto min-h-0 gap-1.5 p-0 text-sm font-medium text-link no-underline hover:text-link hover:underline"
                onClick={() => setMessageChannelTab(nextChannelTab)}
              >
                {getContinueToNextLabel(nextChannelTab)}
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              </Button>
            ) : useSingleSchedule ? (
              <Button
                type="button"
                intent="primary"
                className="h-9 rounded-md px-4"
                onClick={handleOpenScheduleDialog}
              >
                Schedule Send
              </Button>
            ) : (
              <div className="inline-flex w-full min-w-0 sm:w-auto">
                <Button
                  type="button"
                  intent="primary"
                  className="h-9 shrink-0 rounded-l-md rounded-r-none border-r-0 px-4"
                  onClick={() => {
                    handleOpenScheduleDialog()
                  }}
                >
                  Schedule Send
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      intent="primary"
                      className="h-9 rounded-l-none rounded-r-md px-2.5"
                      aria-label="More send options"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleSendNow()}>
                      Send now (prototype)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setScheduleDialogOpen(true)}>
                      Choose date and time
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          ) : null}
        </div>
      </div>
      {isBenefitClassChange ? (
        <EditEmailTemplateSheet
          key={bccEditSession}
          open={bccEditEmailOpen}
          onOpenChange={setBccEditEmailOpen}
          initialHtml={bccEditInitialHtml}
          onSave={({ templateName, html }) => {
            setBccCustomContentHtml(html)
            if (templateName) {
              toast.success(`Template “${templateName}” saved to this communication (prototype).`)
            } else {
              toast.success('Content saved to this communication (prototype).')
            }
          }}
        />
      ) : null}
      {isUserId ? (
        <EditEmailTemplateSheet
          key={userIdEditSession}
          open={userIdEditEmailOpen}
          onOpenChange={setUserIdEditEmailOpen}
          initialHtml={userIdEditInitialHtml}
          onSave={({ templateName, html }) => {
            setUserIdCustomContentHtml(html)
            if (templateName) {
              toast.success(`Template “${templateName}” saved to this communication (prototype).`)
            } else {
              toast.success('Content saved to this communication (prototype).')
            }
          }}
        />
      ) : null}
      {isEnrollmentWindow ? (
        <EditEmailTemplateSheet
          key={enrollmentEditSession}
          open={enrollmentEditEmailOpen}
          onOpenChange={setEnrollmentEditEmailOpen}
          initialHtml={enrollmentEditInitialHtml}
          onSave={({ templateName, html }) => {
            setEnrollmentCustomContentHtml(html)
            if (templateName) {
              toast.success(`Template “${templateName}” saved to this communication (prototype).`)
            } else {
              toast.success('Content saved to this communication (prototype).')
            }
          }}
        />
      ) : null}
      <ScheduleSendDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSchedule={handleScheduleFromModal}
      />
    </Card>
  )
}
