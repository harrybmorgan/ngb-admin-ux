import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FloatLabel,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Calendar, Clock3, Mail, Monitor, Search, Smartphone, Sparkles, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { EMPLOYER } from '@/data/adminMockData'
import { cn } from '@/lib/utils'

type CampaignStatus = 'draft' | 'scheduled' | 'live'
type CampaignKind = 'automated' | 'digest' | 'broadcast'

type CampaignRow = {
  id: string
  title: string
  subtitle: string
  status: CampaignStatus
  kind: CampaignKind
  updatedLabel: string
}

const CAMPAIGNS: CampaignRow[] = [
  {
    id: 'oe-2026',
    title: 'Open enrollment 2026',
    subtitle: 'Triggered by enrollment window',
    status: 'draft',
    kind: 'automated',
    updatedLabel: 'Edited 2h ago',
  },
  {
    id: 'life-event',
    title: 'Life event confirmations',
    subtitle: 'Member-initiated workflow',
    status: 'live',
    kind: 'broadcast',
    updatedLabel: 'Live · v3',
  },
  {
    id: 'payroll-sync',
    title: 'Payroll sync digest',
    subtitle: 'Weekly summary to finance',
    status: 'scheduled',
    kind: 'digest',
    updatedLabel: 'Next send Mon 8am',
  },
  {
    id: 'cobra-notice',
    title: 'COBRA qualifying event',
    subtitle: 'Compliance · email only',
    status: 'draft',
    kind: 'automated',
    updatedLabel: 'Edited yesterday',
  },
]

const statusBadge = (s: CampaignStatus) => {
  if (s === 'live') return { label: 'Live', intent: 'success' as const }
  if (s === 'scheduled') return { label: 'Scheduled', intent: 'info' as const }
  return { label: 'Draft', intent: 'outline' as const }
}

function CampaignKindIcon({
  kind,
  className,
  'aria-hidden': ariaHidden,
}: {
  kind: CampaignKind
  className?: string
  'aria-hidden'?: boolean
}) {
  if (kind === 'automated') return <Zap className={className} aria-hidden={ariaHidden} />
  if (kind === 'digest') return <Clock3 className={className} aria-hidden={ariaHidden} />
  return <Mail className={className} aria-hidden={ariaHidden} />
}

const outlineSpark =
  'rounded-xl border-[#3958c3] font-medium text-[#3958c3] hover:bg-[#3958c3]/5'

type ListFilter = 'all' | CampaignStatus

export type CommunicationsBuilderProps = {
  /** Hide breadcrumb when embedded (e.g. under Automations). */
  hideBreadcrumb?: boolean
}

export function CommunicationsBuilder({ hideBreadcrumb = false }: CommunicationsBuilderProps) {
  const [campaignId, setCampaignId] = useState(CAMPAIGNS[0]!.id)
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [listQuery, setListQuery] = useState('')
  const [editorTab, setEditorTab] = useState<'compose' | 'preview'>('compose')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [subject, setSubject] = useState('Open enrollment starts Monday — action needed')
  const [preheader, setPreheader] = useState('Review your 2026 elections in the Summit Ridge benefits portal.')
  const [body, setBody] = useState(
    'Hi {{first_name}},\n\nOpen enrollment begins Monday, November 3. Log in to review your medical, dental, and voluntary benefits and confirm dependents.\n\nQuestions? Reply to this email or visit the help center from your portal.\n\n— Summit Ridge Benefits',
  )
  const [automated, setAutomated] = useState(true)
  const [emailOn, setEmailOn] = useState(true)
  const [smsOn, setSmsOn] = useState(true)
  const [audience, setAudience] = useState('active-retail')

  const active = useMemo(() => CAMPAIGNS.find((c) => c.id === campaignId) ?? CAMPAIGNS[0]!, [campaignId])

  const filteredCampaigns = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    return CAMPAIGNS.filter((c) => {
      if (listFilter !== 'all' && c.status !== listFilter) return false
      if (!q) return true
      return (
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    })
  }, [listFilter, listQuery])

  return (
    <div className={cn('space-y-5', hideBreadcrumb && 'space-y-0')}>
      {!hideBreadcrumb ? (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Communications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="rounded-2xl border border-[#e3e7f4] bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e8ecf4] px-5 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#14182c] sm:text-2xl">Message builder</h1>
              <Badge
                intent={statusBadge(active.status).intent}
                className={cn(
                  'shrink-0 text-[10px] font-semibold uppercase tracking-wide',
                  active.status === 'draft' && 'border border-[#d0d7e6] bg-transparent font-semibold text-[#5f6a94]',
                )}
              >
                {statusBadge(active.status).label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Design messages once, personalize with tokens, and preview across email and SMS before you publish.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <p className="text-center text-xs text-muted-foreground sm:text-right">Last saved · just now (prototype)</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('rounded-xl', outlineSpark)}
                onClick={() => toast.message('Preview opens in a new tab in production.')}
              >
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('rounded-xl', outlineSpark)}
                onClick={() => toast.success('Test send queued (prototype).')}
              >
                Send test
              </Button>
              <Button type="button" size="sm" className="rounded-xl" onClick={() => toast.success('Draft saved (prototype).')}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                intent="primary"
                onClick={() => toast.message('Publishing is not enabled in this prototype.')}
              >
                Publish
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-[#eef1f7]/80 p-4 sm:p-5 lg:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,288px)_minmax(0,1fr)_minmax(0,300px)] xl:gap-5">
            {/* Library */}
            <Card className="h-fit border-[#e3e7f4] bg-white/95 shadow-sm lg:sticky lg:top-24">
              <CardHeader className="space-y-3 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Messages</CardTitle>
                  <span className="text-xs font-medium text-muted-foreground">{CAMPAIGNS.length} total</span>
                </div>
                <ButtonGroup className="flex w-full flex-wrap rounded-xl border border-[#d0d7e6] p-0.5">
                  {(
                    [
                      ['all', 'All'],
                      ['draft', 'Draft'],
                      ['scheduled', 'Sched.'],
                      ['live', 'Live'],
                    ] as const
                  ).map(([key, label]) => (
                    <Button
                      key={key}
                      type="button"
                      variant={listFilter === key ? 'solid' : 'ghost'}
                      intent={listFilter === key ? 'primary' : undefined}
                      size="sm"
                      className="flex-1 rounded-lg px-2 text-xs sm:text-sm"
                      onClick={() => setListFilter(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </ButtonGroup>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    placeholder="Search messages…"
                    value={listQuery}
                    onChange={(e) => setListQuery(e.target.value)}
                    className="rounded-xl border-[#e8ecf4] pl-9"
                    aria-label="Search messages"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <ul className="max-h-[min(52vh,26rem)] space-y-1.5 overflow-y-auto pr-0.5">
                  {filteredCampaigns.length === 0 ? (
                    <li className="rounded-xl border border-dashed border-[#d0d7e6] px-3 py-8 text-center text-sm text-muted-foreground">
                      No messages match this filter.
                    </li>
                  ) : (
                    filteredCampaigns.map((c) => {
                      const sel = c.id === campaignId
                      const b = statusBadge(c.status)
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => setCampaignId(c.id)}
                            className={cn(
                              'flex w-full gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                              sel
                                ? 'border-[#3958c3]/55 bg-[#f0f3ff] shadow-[inset_0_0_0_1px_rgba(57,88,195,0.08)]'
                                : 'border-transparent hover:border-[#e8ecf4] hover:bg-muted/30',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e8ecf4] bg-white text-[#3958c3]',
                                sel && 'border-[#3958c3]/25 bg-white',
                              )}
                              aria-hidden
                            >
                              <CampaignKindIcon kind={c.kind} className="h-4 w-4" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold leading-snug text-[#14182c]">{c.title}</span>
                                <Badge
                                  intent={b.intent}
                                  className="shrink-0 text-[9px] font-bold uppercase tracking-wide"
                                >
                                  {b.label}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">{c.subtitle}</p>
                              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#8b94b8]">
                                {c.updatedLabel}
                              </p>
                            </div>
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl text-[#3958c3] hover:bg-[#3958c3]/5"
                  onClick={() => toast.message('New message flow is not wired in this prototype.')}
                >
                  + New message
                </Button>
              </CardContent>
            </Card>

            {/* Editor workspace */}
            <div className="min-w-0 space-y-3">
              <Card className="border-[#e3e7f4] bg-white shadow-sm">
                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as 'compose' | 'preview')}>
                  <CardHeader className="space-y-3 pb-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e8ecf4] bg-[#f7f8fc] text-[#3958c3]">
                          <CampaignKindIcon kind={active.kind} className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-tight">{active.title}</CardTitle>
                          <CardDescription className="mt-1">{active.subtitle}</CardDescription>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5 rounded-xl border-[#e8ecf4] font-normal text-[#3958c3]"
                        onClick={() => toast.message('AI assist is not enabled in this prototype.')}
                      >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        AI assist
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eef1f6] pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#5f6a94]">Channels</span>
                        <ButtonGroup className="rounded-lg border border-[#d0d7e6] p-0.5">
                          <Button
                            type="button"
                            variant={emailOn ? 'solid' : 'ghost'}
                            intent={emailOn ? 'primary' : undefined}
                            size="sm"
                            className="gap-1 rounded-md px-2.5"
                            onClick={() => setEmailOn((v) => !v)}
                          >
                            <Mail className="h-3.5 w-3.5" aria-hidden />
                            Email
                          </Button>
                          <Button
                            type="button"
                            variant={smsOn ? 'solid' : 'ghost'}
                            intent={smsOn ? 'primary' : undefined}
                            size="sm"
                            className="gap-1 rounded-md px-2.5"
                            onClick={() => setSmsOn((v) => !v)}
                          >
                            <Smartphone className="h-3.5 w-3.5" aria-hidden />
                            SMS
                          </Button>
                        </ButtonGroup>
                      </div>
                      <TabsList className="h-auto w-fit gap-0 rounded-xl border border-[#d0d7e6] bg-muted/40 p-0.5">
                        <TabsTrigger value="compose" className="rounded-lg px-3 text-xs sm:text-sm">
                          Compose
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="rounded-lg px-3 text-xs sm:text-sm">
                          Preview
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <TabsContent value="compose" className="mt-0 space-y-4 focus-visible:outline-none">
                      <FloatLabel label="Subject line" id="comm-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                      <FloatLabel label="Preheader" id="comm-preheader" value={preheader} onChange={(e) => setPreheader(e.target.value)} />
                      <div className="space-y-2">
                        <Label htmlFor="comm-body" className="text-xs font-medium text-muted-foreground">
                          Body
                        </Label>
                        <Textarea
                          id="comm-body"
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          className="min-h-[180px] resize-y rounded-xl border-[#e8ecf4] bg-[#fafbff] text-sm leading-relaxed"
                          aria-label="Message body"
                        />
                      </div>
                      <button
                        type="button"
                        className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#c8d0ef] bg-[#f8f9fc] px-3 py-2.5 text-xs font-semibold text-[#5f6a94] transition-colors hover:border-[#3958c3]/40 hover:bg-[#f0f3ff] hover:text-[#3958c3]"
                        onClick={() => toast.message('Content blocks are not wired in this prototype.')}
                      >
                        + Add content block
                      </button>
                    </TabsContent>
                    <TabsContent value="preview" className="mt-0 focus-visible:outline-none">
                      <p className="mb-3 text-xs text-muted-foreground">Read-only preview of the active channel layout.</p>
                      <EmailPreviewFrame
                        subject={subject}
                        preheader={preheader}
                        body={body}
                        device={previewDevice}
                      />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>

              {editorTab === 'compose' ? (
                <div className="rounded-2xl border border-[#e3e7f4] bg-gradient-to-b from-[#f4f6fb] to-[#e8ecf4]/60 p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5f6a94]">Live preview</span>
                    <ButtonGroup className="rounded-lg border border-[#d0d7e6] bg-white/90 p-0.5">
                      <Button
                        type="button"
                        variant={previewDevice === 'desktop' ? 'solid' : 'ghost'}
                        intent={previewDevice === 'desktop' ? 'primary' : undefined}
                        size="sm"
                        className="gap-1 rounded-md px-2.5"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor className="h-3.5 w-3.5" aria-hidden />
                        Desktop
                      </Button>
                      <Button
                        type="button"
                        variant={previewDevice === 'mobile' ? 'solid' : 'ghost'}
                        intent={previewDevice === 'mobile' ? 'primary' : undefined}
                        size="sm"
                        className="gap-1 rounded-md px-2.5"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone className="h-3.5 w-3.5" aria-hidden />
                        Mobile
                      </Button>
                    </ButtonGroup>
                  </div>
                  <EmailPreviewFrame subject={subject} preheader={preheader} body={body} device={previewDevice} />
                </div>
              ) : null}
            </div>

            {/* Properties */}
            <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
              <Card className="border-[#e3e7f4] bg-white/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Send & schedule</CardTitle>
                  <CardDescription>Delivery mode for this message.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setAutomated(true)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                      automated ? 'border-[#3958c3]/45 bg-[#f0f3ff]' : 'border-[#e8ecf4] hover:bg-muted/40',
                    )}
                  >
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#3958c3]" aria-hidden />
                    <span>
                      <span className="block text-sm font-semibold">Automated</span>
                      <span className="text-xs text-muted-foreground">Tied to dates, life events, or enrollment.</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutomated(false)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                      !automated ? 'border-[#3958c3]/45 bg-[#f0f3ff]' : 'border-[#e8ecf4] hover:bg-muted/40',
                    )}
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#3958c3]" aria-hidden />
                    <span>
                      <span className="block text-sm font-semibold">On-demand</span>
                      <span className="text-xs text-muted-foreground">You pick audience and send time.</span>
                    </span>
                  </button>
                </CardContent>
              </Card>

              <Card className="border-[#e3e7f4] bg-white/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Channels</CardTitle>
                  <CardDescription>Enable delivery per channel (mirrors toolbar).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-[#e8ecf4] px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-[#3958c3]" aria-hidden />
                      Email
                    </span>
                    <Switch checked={emailOn} onCheckedChange={setEmailOn} />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-[#e8ecf4] px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Smartphone className="h-4 w-4 text-[#3958c3]" aria-hidden />
                      SMS
                    </span>
                    <Switch checked={smsOn} onCheckedChange={setSmsOn} />
                  </label>
                </CardContent>
              </Card>

              <Card className="border-[#e3e7f4] bg-white/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Audience</CardTitle>
                  <CardDescription>Segment for this draft.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger className="rounded-xl border-[#e8ecf4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active-retail">Active · Retail + Production</SelectItem>
                      <SelectItem value="cobra">COBRA participants</SelectItem>
                      <SelectItem value="new-hires">New hires (90 days)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-start gap-2 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] px-3 py-2.5 text-xs text-muted-foreground">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#3958c3]" aria-hidden />
                    <span>
                      <span className="font-semibold text-[#14182c]">{EMPLOYER.name}</span>
                      <span className="mx-1 text-[#c8cfdf]">·</span>
                      Est. reach <span className="font-medium text-[#14182c]">~1,240</span> eligible members for this
                      segment (mock).
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailPreviewFrame({
  subject,
  preheader,
  body,
  device,
}: {
  subject: string
  preheader: string
  body: string
  device: 'desktop' | 'mobile'
}) {
  const narrow = device === 'mobile'
  return (
    <div
      className={cn(
        'mx-auto w-full rounded-xl border border-[#e0e5ef] bg-white shadow-[0_12px_40px_rgba(43,49,78,0.08)] transition-[max-width] duration-300',
        narrow ? 'max-w-[375px]' : 'max-w-[640px]',
      )}
    >
      <div className="flex items-center justify-between border-b border-[#eef1f6] px-3 py-2 sm:px-4">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#5f6a94]">Inbox preview</span>
        <span className="truncate text-[10px] text-[#8b94b8]">benefits@{EMPLOYER.name.toLowerCase().replace(/\s+/g, '')}.com</span>
      </div>
      <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#3958c3]">
            <Mail className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-semibold leading-snug text-[#14182c]">{subject || '—'}</p>
            <p className="mt-0.5 text-xs text-[#5f6a94]">{preheader || '—'}</p>
          </div>
        </div>
        <div className="rounded-lg border border-[#eef1f6] bg-[#fafbff] px-3 py-3 text-sm leading-relaxed text-[#374056]">
          <p className="whitespace-pre-wrap break-words">{body || '…'}</p>
        </div>
      </div>
    </div>
  )
}
