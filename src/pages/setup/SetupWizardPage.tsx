import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
  Progress,
  Separator,
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
import { ChevronLeft, ChevronRight, Save, SkipForward } from 'lucide-react'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { CONNECTORS, EMPLOYER, PRODUCT_OPTIONS } from '@/data/adminMockData'
import { emitSetupChanged, writeEmployerSetup } from '@/hooks/useEmployerSetup'

const WIZARD_DRAFT_KEY = 'cxr_admin_wizard_draft'

const STEP_LABELS = [
  'Company profile',
  'Add employees',
  'Choose products',
  'Configure plans',
  'Plans & rates',
  'Eligibility rules',
  'Data integrations',
  'Branding note',
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
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100)

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
              Pulled automatically from your broker file and IRS records. Shelly can correct details with one support
              ticket if anything looks off.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatLabel label="Company name">
                <input
                  readOnly
                  className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                  value={EMPLOYER.name}
                />
              </FloatLabel>
              <FloatLabel label="Federal Tax ID (EIN)">
                <input
                  readOnly
                  className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                  value={EMPLOYER.ein}
                />
              </FloatLabel>
              <FloatLabel label="Payroll frequency">
                <input
                  readOnly
                  className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                  value={EMPLOYER.payrollFrequency}
                />
              </FloatLabel>
              <FloatLabel label="Total employees">
                <input
                  readOnly
                  className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                  value={String(EMPLOYER.employeeCount)}
                />
              </FloatLabel>
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              High-impact customization for the employee portal: site-wide colors, typography, logo, hero imagery, and
              navigation labels. Use the same studio Shelly’s broker previewed (Elizabeth’s flow).
            </p>
            <Button asChild>
              <Link to="/theming">Open branding studio</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              When you’re done in the studio, return here and continue to Review & launch. This step can be skipped and
              finished later.
            </p>
          </div>
        )
      case 8:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pre-launch checklist</CardTitle>
                <CardDescription>Shelly confirms the essentials before employees receive invites.</CardDescription>
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
    <div className="flex min-h-screen flex-col bg-muted/20">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Guided employer setup</h1>
            <Badge intent="info">
              Step {stepIndex + 1} of {totalSteps}
            </Badge>
          </div>
          <Progress value={progressPct} className="h-2" />
          <p className="text-sm text-muted-foreground">{STEP_LABELS[stepIndex]}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{STEP_LABELS[stepIndex]}</CardTitle>
            <CardDescription>Progress saves automatically in this browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">{stepBody}</CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={stepIndex === 0} onClick={() => go(-1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex >= totalSteps - 1}
              onClick={() => go(1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => saveDraft(draft)}>
              <Save className="h-4 w-4" />
              Saved
            </Button>
            <Button type="button" variant="outline" className="gap-1" onClick={skip} disabled={stepIndex >= totalSteps - 1}>
              <SkipForward className="h-4 w-4" />
              Skip for now
            </Button>
          </div>
        </div>

        <Separator className="my-8" />
        <nav aria-label="Setup steps" className="flex flex-wrap gap-2">
          {STEP_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, stepIndex: i }))}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                i === stepIndex ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </nav>
      </main>
      <AdminFooter />
    </div>
  )
}
