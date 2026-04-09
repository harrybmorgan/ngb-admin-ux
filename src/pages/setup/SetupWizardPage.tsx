import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmbeddedThemingStudio } from '@/pages/theming-engine/EmbeddedThemingStudio'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FloatLabel,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Check, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { CONNECTORS, EMPLOYER, PRODUCT_OPTIONS } from '@/data/adminMockData'
import { emitSetupChanged, writeEmployerSetup } from '@/hooks/useEmployerSetup'

const WIZARD_DRAFT_KEY = 'ngb_admin_wizard_draft'

const STEP_LABELS = [
  'Company profile',
  'Add employees',
  'Choose products',
  'Configure plans',
  'Plans & rates',
  'Eligibility rules',
  'Data integrations',
  'Branding',
  'Review & launch',
] as const

type Draft = {
  stepIndex: number
  selectedProducts: string[]
  eligibilityNotes: string
  mappingStep: number
}

const defaultDraft: Draft = {
  stepIndex: 0,
  selectedProducts: ['medical', 'dental', 'hsa'],
  eligibilityNotes:
    'IF employment type is full-time AND hire date is more than 60 days ago THEN eligible for medical on the first of next month.\nIF average hours are under 30 THEN offer limited medical only.',
  mappingStep: 0,
}

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY)
    if (!raw) return { ...defaultDraft }
    return { ...defaultDraft, ...JSON.parse(raw) }
  } catch {
    return { ...defaultDraft }
  }
}

function saveDraft(d: Draft) {
  localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(d))
  emitSetupChanged()
}

export default function SetupWizardPage() {
  const [draft, setDraft] = useState<Draft>(() => loadDraft())
  const [mappingOpen, setMappingOpen] = useState(false)

  useEffect(() => {
    saveDraft(draft)
  }, [draft])

  const stepIndex = draft.stepIndex
  const totalSteps = STEP_LABELS.length

  const go = useCallback((delta: number) => {
    setDraft((d) => {
      const next = Math.min(Math.max(0, d.stepIndex + delta), totalSteps - 1)
      return { ...d, stepIndex: next }
    })
  }, [totalSteps])

  const skip = () => go(1)

  const toggleProduct = (id: string) => {
    setDraft((d) => {
      const set = new Set(d.selectedProducts)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...d, selectedProducts: [...set] }
    })
  }

  const launch = () => {
    writeEmployerSetup({
      onboardingComplete: true,
      planReady: true,
      launchComplete: true,
    })
    setDraft((d) => ({ ...d, stepIndex: totalSteps - 1 }))
  }

  const mappingSteps = useMemo(
    () => ['Connect to ADP', 'Authorize WEX secure handshake', 'Preview field mapping', 'Activate sync'],
    [],
  )

  const stepBody = (() => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pulled automatically from your broker file and IRS records. You can correct details with one support ticket
              if anything looks off.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatLabel
                label="Company name"
                readOnly
                className="bg-muted/50"
                value={EMPLOYER.name}
              />
              <FloatLabel label="Federal Tax ID (EIN)" readOnly className="bg-muted/50" value={EMPLOYER.ein} />
              <FloatLabel
                label="Payroll frequency"
                readOnly
                className="bg-muted/50"
                value={EMPLOYER.payrollFrequency}
              />
              <FloatLabel
                label="Total employees"
                readOnly
                className="bg-muted/50"
                value={String(EMPLOYER.employeeCount)}
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import roster</CardTitle>
                <CardDescription>Upload a CSV with name, hire date, job title, and work email.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" variant="outline">
                  Download template
                </Button>
                <Button type="button">Upload CSV</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add manually</CardTitle>
                <CardDescription>For one-off hires or corrections before your HRIS sync is live.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline">
                  Open quick add employee
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      case 2:
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {PRODUCT_OPTIONS.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
              >
                <Checkbox
                  checked={draft.selectedProducts.includes(p.id)}
                  onCheckedChange={() => toggleProduct(p.id)}
                />
                <span className="text-sm font-medium">{p.label}</span>
              </label>
            ))}
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure the plan <em>framework</em> once — names, carriers, networks, effective dates — without entering
              rates yet.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Effective</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Summit PPO Gold</TableCell>
                  <TableCell>Medical PPO</TableCell>
                  <TableCell>UHC</TableCell>
                  <TableCell>Jan 1, 2026</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bright Smile PPO</TableCell>
                  <TableCell>Dental</TableCell>
                  <TableCell>Guardian</TableCell>
                  <TableCell>Jan 1, 2026</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">HSA election</TableCell>
                  <TableCell>CDH</TableCell>
                  <TableCell>WEX</TableCell>
                  <TableCell>Jan 1, 2026</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm">
              Add plan row
            </Button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rates and eligibility classes attach to your plan framework so you never duplicate the same plan shell for
              each contribution tier.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan shell</TableHead>
                  <TableHead>Rate table</TableHead>
                  <TableHead>Eligibility class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Summit PPO Gold</TableCell>
                  <TableCell>2026 EE-only / EE+children / family</TableCell>
                  <TableCell>Full-time</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Summit PPO Gold</TableCell>
                  <TableCell>2026 part-time buy-up</TableCell>
                  <TableCell>Part-time (25+ hrs)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => writeEmployerSetup({ planReady: true })}
            >
              Mark plan framework ready (demo)
            </Button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Plain-English rules with presets for full-time, part-time, dependents, domestic partners, and waiting
              periods.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Full-time (30+ hrs)', 'Part-time carve-out', 'Dependents to age 26', 'Domestic partners', '60-day wait'].map(
                (label) => (
                  <Badge key={label} intent="default" className="cursor-default">
                    {label}
                  </Badge>
                ),
              )}
            </div>
            <textarea
              rows={8}
              value={draft.eligibilityNotes}
              onChange={(e) => setDraft((d) => ({ ...d, eligibilityNotes: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pre-built bi-directional connectors for brokers, carriers, and payroll. Census, eligibility, CDH, and
              COBRA/Direct Bill share one WEX file standard where file-based delivery is used.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CONNECTORS.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.name}</CardTitle>
                    <CardDescription>
                      {c.category} · {c.direction}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button type="button" variant="outline" size="sm" onClick={() => setMappingOpen(true)}>
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Sheet open={mappingOpen} onOpenChange={setMappingOpen}>
              <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Mapping wizard (ADP)</SheetTitle>
                </SheetHeader>
                <ol className="space-y-2 text-sm">
                  {mappingSteps.map((label, i) => (
                    <li
                      key={label}
                      className={`rounded-md border px-3 py-2 ${
                        i === draft.mappingStep ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      {i + 1}. {label}
                    </li>
                  ))}
                </ol>
                <div className="mt-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        mappingStep: Math.max(0, d.mappingStep - 1),
                      }))
                    }
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      setDraft((d) => {
                        const next = Math.min(mappingSteps.length - 1, d.mappingStep + 1)
                        return { ...d, mappingStep: next }
                      })
                    }}
                  >
                    Next
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )
      case 7:
        return (
          <>
            <div className="shrink-0 space-y-2 px-6 pb-3 pt-0">
              <p className="text-sm text-muted-foreground">
                High-impact customization for the employee portal: site-wide colors, typography, logo, hero imagery, and
                navigation labels. Adjust below or use <strong className="font-medium text-foreground">Skip for now</strong>{' '}
                to finish later — the same studio is available anytime from your account menu.
              </p>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-border">
              <EmbeddedThemingStudio variant="embedded" />
            </div>
          </>
        )
      case 8:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pre-launch checklist</CardTitle>
                <CardDescription>You confirm the essentials before employees receive invites.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Test employees created (Jordan Lee, Priya Shah)
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Payroll deduction codes mapped
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox />
                  Carrier eligibility files tested
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  Employee portal branding published
                </label>
              </CardContent>
            </Card>
            <div className="flex flex-wrap gap-3">
              <Button type="button" size="lg" className="gap-2" onClick={launch}>
                Launch employer portal
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/">Back to dashboard</Link>
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  })()

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main
        className={cn(
          'mx-auto flex w-full max-w-none flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
          stepIndex === 7 && 'min-h-0',
        )}
      >
        <header className="mb-6 shrink-0 lg:mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Guided employer setup</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps} · {STEP_LABELS[stepIndex]}
          </p>
        </header>

        <div
          className={cn(
            'flex flex-col gap-8 lg:flex-row lg:gap-10',
            stepIndex === 7 ? 'min-h-0 flex-1 lg:items-stretch' : 'lg:items-start',
          )}
        >
          <aside className="order-2 shrink-0 lg:order-1 lg:w-52 xl:w-56">
            <nav aria-label="Setup steps" className="lg:sticky lg:top-24">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Steps</p>
              <ol className="scrollbar-hide flex flex-nowrap gap-1 overflow-x-auto pb-1 lg:flex-col lg:flex-wrap lg:gap-0 lg:overflow-visible lg:pb-0">
                {STEP_LABELS.map((label, i) => {
                  const done = i < stepIndex
                  const current = i === stepIndex
                  return (
                    <li key={label} className="shrink-0 lg:w-full lg:shrink">
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, stepIndex: i }))}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-md py-1.5 text-left text-[13px] leading-tight transition-colors lg:border-l-2 lg:border-transparent lg:py-2 lg:pl-3 lg:pr-2',
                          current &&
                            'bg-primary/8 font-medium text-foreground lg:border-primary lg:bg-primary/[0.06]',
                          done && !current && 'text-muted-foreground hover:text-foreground',
                          !done && !current && 'text-muted-foreground/80 hover:text-muted-foreground',
                        )}
                        aria-current={current ? 'step' : undefined}
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums lg:h-5 lg:w-5 lg:text-[9px]',
                            current && 'bg-primary text-primary-foreground',
                            done && !current && 'bg-emerald-600/90 text-white',
                            !done && !current && 'bg-muted/80 text-muted-foreground',
                          )}
                          aria-hidden
                        >
                          {done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
                        </span>
                        <span className="min-w-[8rem] max-w-[12rem] truncate sm:max-w-none lg:whitespace-normal lg:leading-snug">
                          {label}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </nav>
          </aside>

          <div
            className={cn(
              'order-1 min-w-0 flex-1 space-y-5',
              stepIndex === 7 && 'flex min-h-0 flex-col',
            )}
          >
            <Card className={cn('shadow-sm', stepIndex === 7 && 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
              <CardHeader className={cn('px-6 pb-4', stepIndex === 7 && 'shrink-0')}>
                <CardTitle className="text-xl">{STEP_LABELS[stepIndex]}</CardTitle>
                <CardDescription>Progress saves automatically in this browser.</CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  stepIndex === 7 ? 'flex min-h-0 flex-1 flex-col space-y-0 p-0' : 'space-y-6',
                )}
              >
                {stepBody}
              </CardContent>
            </Card>

            <div
              className={cn(
                'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                stepIndex === 7 && 'shrink-0',
              )}
            >
              <div className="flex flex-wrap gap-2">
                {stepIndex > 0 ? (
                  <Button type="button" variant="outline" onClick={() => go(-1)} className="gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : null}
              </div>
              {stepIndex < totalSteps - 1 ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" className="gap-1 text-muted-foreground" onClick={skip}>
                    <SkipForward className="h-4 w-4" />
                    Skip for now
                  </Button>
                  <Button type="button" variant="outline" className="gap-1" onClick={() => go(1)}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <AdminFooter />
    </div>
  )
}
