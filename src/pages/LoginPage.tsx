import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, FloatLabel } from '@wexinc-healthbenefits/ben-ui-kit'
import { AlertCircle, Building2, Check, Eye, EyeOff, User, UserLock, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { EMPLOYER } from '@/data/adminMockData'
import { LoginPortalFooter } from '@/components/layout/LoginPortalFooter'
import { cn } from '@/lib/utils'

type Step = 'credentials' | 'mfa' | 'selectAccount' | 'resetPassword'

function maskLoginIdentifier(value: string): string {
  const v = value.trim()
  if (!v) return '••••••••'
  if (v.includes('@')) {
    const [local, domain] = v.split('@')
    const ld = local.length > 0 ? local.slice(0, Math.min(4, local.length)) : ''
    const dd = domain.length > 0 ? domain.slice(0, Math.min(5, domain.length)) : ''
    return `${ld}******@${dd}*****`
  }
  if (v.length <= 4) return `${v}******`
  return `${v.slice(0, 3)}******${v.slice(-2)}`
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const wexLogoUrl = `${import.meta.env.BASE_URL}WEX_Logo_Red_Vector.svg`

  const [step, setStep] = useState<Step>('credentials')
  const [username, setUsername] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [showTemp, setShowTemp] = useState(false)
  const [generatedMfa, setGeneratedMfa] = useState('')
  const [mfaInput, setMfaInput] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [resendTimer, setResendTimer] = useState(13)
  const [selectedPersona, setSelectedPersona] = useState<'admin' | 'employee' | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordSubmitAttempted, setPasswordSubmitAttempted] = useState(false)

  const passwordMinLengthMet = newPassword.length >= 10
  const passwordsMatchMet = confirmPassword.length > 0 && newPassword === confirmPassword

  const issueMfaCode = () => {
    const code = String(Math.floor(10000 + Math.random() * 90000))
    setGeneratedMfa(code)
    setMfaInput('')
    setCodeError(false)
    setResendTimer(13)
    toast.info(`Your MFA code is: ${code}`, { duration: 30_000 })
  }

  useEffect(() => {
    if (step !== 'mfa' || resendTimer <= 0) return
    const t = window.setTimeout(() => setResendTimer((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [step, resendTimer])

  const onCredentialsContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !tempPassword) {
      setError('Enter your username and temporary password from your welcome email.')
      return
    }
    issueMfaCode()
    setStep('mfa')
  }

  const onMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mfaInput.trim() !== generatedMfa) {
      setCodeError(true)
      return
    }
    setCodeError(false)
    setSelectedPersona(null)
    setPasswordSubmitAttempted(false)
    setStep('resetPassword')
  }

  const onSelectAccountContinue = () => {
    if (!selectedPersona) {
      toast.error('Select an account to continue.')
      return
    }
    if (selectedPersona === 'employee') {
      navigate('/member-handoff', { replace: true })
      return
    }
    login()
    navigate('/', { replace: true })
  }

  const onResetComplete = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPasswordSubmitAttempted(true)
    if (!passwordMinLengthMet || !passwordsMatchMet) {
      return
    }
    setSelectedPersona('admin')
    setStep('selectAccount')
  }

  const handleResendMfa = () => {
    if (resendTimer > 0) return
    issueMfaCode()
  }

  const mfaChannelLabel = username.trim().includes('@') ? 'Email' : 'Username on file'
  const mfaMaskedValue = username.trim() ? maskLoginIdentifier(username) : maskLoginIdentifier(EMPLOYER.hrAdminEmail)

  const headerTitle =
    step === 'credentials'
      ? 'Welcome'
      : step === 'mfa'
        ? 'Verify your identity'
        : step === 'resetPassword'
          ? 'Set your new password'
          : 'Select an account'

  const headerSubtitle =
    step === 'credentials'
      ? 'Please enter your username and temporary password to get started.'
      : step === 'mfa'
        ? "We've sent an email with your code to the address you have on file."
        : step === 'resetPassword'
          ? 'Choose a strong password to secure your account.'
          : "Please select which account you'd like to access."

  return (
    <div className="login-portal-bg flex min-h-screen flex-col">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <Card
            variant="elevated"
            className="w-full max-w-[402px] overflow-hidden border-0 shadow-lg"
            style={{ borderRadius: '16px' }}
          >
            <CardContent className="p-8" style={{ borderRadius: '16px' }}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-6">
                  <div className="h-[50px] w-[150px]">
                    <img src={wexLogoUrl} alt="WEX" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-[18px] font-semibold leading-6 tracking-[-0.252px] text-foreground">
                      {headerTitle}
                    </h1>
                    <p className="max-w-[328px] text-[16px] font-normal leading-6 tracking-[-0.176px] text-foreground">
                      {headerSubtitle}
                    </p>
                  </div>
                </div>

                {step === 'credentials' && (
                  <>
                    <form onSubmit={onCredentialsContinue} className="flex flex-col gap-6">
                      <FloatLabel
                        label="Username"
                        id="username"
                        name="username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        size="lg"
                        className="text-[16px] leading-6 tracking-[-0.176px]"
                      />

                      <div className="relative">
                        <FloatLabel
                          label="Temporary password"
                          id="temp-password"
                          name="password"
                          type={showTemp ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          size="lg"
                          className="pr-10 text-[16px] leading-6 tracking-[-0.176px]"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowTemp(!showTemp)}
                          aria-label={showTemp ? 'Hide password' : 'Show password'}
                        >
                          {showTemp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {error && (
                        <p className="text-[12px] text-destructive" role="alert">
                          {error}
                        </p>
                      )}

                      <Button type="submit" className="h-10 w-full rounded-lg text-[14px] font-medium">
                        Continue
                      </Button>
                    </form>

                    <div className="flex w-full flex-col gap-5">
                      <div className="flex w-full items-center gap-3" aria-hidden="true">
                        <div className="h-px min-w-0 flex-1 bg-border" />
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                          OR
                        </span>
                        <div className="h-px min-w-0 flex-1 bg-border" />
                      </div>
                      <Button
                        type="button"
                        intent="primary"
                        variant="outline"
                        size="md"
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border-border text-[14px] font-medium text-foreground hover:bg-muted/50"
                        onClick={() => toast.message('Passkeys are not enabled in this prototype.')}
                      >
                        <UserLock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        Continue with Passkey
                      </Button>
                    </div>
                  </>
                )}

                {step === 'mfa' && (
                  <form onSubmit={onMfaSubmit} className="flex flex-col gap-[21px]">
                    <FloatLabel
                      label={mfaChannelLabel}
                      type="text"
                      value={mfaMaskedValue}
                      readOnly
                      size="lg"
                      className="cursor-default text-[16px] leading-6 tracking-[-0.176px]"
                    />

                    <div className="flex flex-col gap-1">
                      <FloatLabel
                        label="Enter the code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={mfaInput}
                        onChange={(e) => {
                          setMfaInput(e.target.value)
                          setCodeError(false)
                        }}
                        size="lg"
                        invalid={codeError}
                        className="text-[16px] leading-6 tracking-[-0.176px]"
                      />
                      {codeError && (
                        <p className="flex items-center gap-1 px-3 text-[12px] text-[hsl(var(--wex-destructive))]">
                          <AlertCircle className="h-3 w-3" />
                          The code you entered is invalid
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="h-10 w-full rounded-lg text-[14px] font-medium">
                      Continue
                    </Button>

                    <p className="text-[16px] leading-6 tracking-[-0.176px] text-foreground">
                      Didn&apos;t receive an email?{' '}
                      {resendTimer > 0 ? (
                        <span className="font-semibold">
                          Send again in 00:{resendTimer.toString().padStart(2, '0')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendMfa}
                          className="font-semibold text-[hsl(var(--wex-primary))] hover:underline"
                        >
                          Send again
                        </button>
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() => toast.message('Additional MFA methods are not enabled in this prototype.')}
                      className="text-left text-[16px] font-semibold leading-6 tracking-[-0.176px] text-[hsl(var(--wex-primary))] hover:underline"
                    >
                      Try another method
                    </button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-lg"
                      onClick={() => setStep('credentials')}
                    >
                      Back
                    </Button>
                  </form>
                )}

                {step === 'selectAccount' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {EMPLOYER.name}
                    </p>
                    <div className="flex flex-col gap-2">
                      <div role="radiogroup" aria-label="Choose how you want to sign in">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selectedPersona === 'admin'}
                          onClick={() => setSelectedPersona('admin')}
                          className={`w-full rounded-lg border p-4 text-left transition-colors ${
                            selectedPersona === 'admin'
                              ? 'border-[hsl(var(--wex-primary))] bg-[hsl(var(--wex-primary))]/5'
                              : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-4 w-4 shrink-0 rounded-full border-2 ${
                                selectedPersona === 'admin'
                                  ? 'border-[hsl(var(--wex-primary))] bg-[hsl(var(--wex-primary))]'
                                  : 'border-muted-foreground/50'
                              }`}
                              aria-hidden
                            />
                            <Building2 className="h-5 w-5 text-foreground" aria-hidden />
                            <div>
                              <p className="text-[16px] font-semibold leading-6 text-foreground">Admin</p>
                              <p className="text-[13px] leading-5 text-muted-foreground">
                                Plans, people, billing, and reporting for your organization
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                      <div
                        className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-left"
                        aria-disabled="true"
                      >
                        <div className="flex items-center gap-3 opacity-70">
                          <span
                            className="flex h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/35"
                            aria-hidden
                          />
                          <User className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                          <div className="min-w-0">
                            <p className="text-[16px] font-semibold leading-6 text-muted-foreground">Employee</p>
                            <p className="text-[13px] leading-5 text-muted-foreground">
                              Medical, spending, and claims in the member portal.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-left text-[14px] font-semibold text-[hsl(var(--wex-primary))] hover:underline"
                      onClick={() => toast.message('Account linking is not available in this prototype.')}
                    >
                      Link another account
                    </button>

                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        className="h-10 w-full rounded-lg text-[14px] font-medium"
                        onClick={onSelectAccountContinue}
                      >
                        Continue
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full rounded-lg text-[14px] font-medium"
                        onClick={() => setStep('resetPassword')}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}

                {step === 'resetPassword' && (
                  <form onSubmit={onResetComplete} className="flex flex-col gap-[21px]">
                    <div className="relative">
                      <FloatLabel
                        label="New password"
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        size="lg"
                        className="pr-10 text-[16px] leading-6 tracking-[-0.176px]"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowNew(!showNew)}
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <FloatLabel
                      label="Confirm new password"
                      id="confirm-password"
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      size="lg"
                      className="text-[16px] leading-6 tracking-[-0.176px]"
                    />

                    <ul
                      className="space-y-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-3"
                      role="list"
                      aria-label="Password requirements"
                    >
                      <li
                        className={cn(
                          'flex items-start gap-2 text-[13px] leading-5 transition-colors',
                          passwordMinLengthMet && 'text-emerald-700',
                          !passwordMinLengthMet && passwordSubmitAttempted && 'text-red-600',
                          !passwordMinLengthMet && !passwordSubmitAttempted && 'text-muted-foreground',
                        )}
                        role="listitem"
                        aria-invalid={!passwordMinLengthMet && passwordSubmitAttempted}
                      >
                        <span className="mt-0.5 shrink-0" aria-hidden>
                          {passwordMinLengthMet ? (
                            <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                          ) : passwordSubmitAttempted ? (
                            <X className="h-4 w-4 text-red-600" strokeWidth={2.5} />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-muted-foreground/40" />
                          )}
                        </span>
                        At least 10 characters
                      </li>
                      <li
                        className={cn(
                          'flex items-start gap-2 text-[13px] leading-5 transition-colors',
                          passwordsMatchMet && 'text-emerald-700',
                          !passwordsMatchMet && passwordSubmitAttempted && 'text-red-600',
                          !passwordsMatchMet && !passwordSubmitAttempted && 'text-muted-foreground',
                        )}
                        role="listitem"
                        aria-invalid={!passwordsMatchMet && passwordSubmitAttempted}
                      >
                        <span className="mt-0.5 shrink-0" aria-hidden>
                          {passwordsMatchMet ? (
                            <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                          ) : passwordSubmitAttempted ? (
                            <X className="h-4 w-4 text-red-600" strokeWidth={2.5} />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-muted-foreground/40" />
                          )}
                        </span>
                        New password and confirmation match
                      </li>
                    </ul>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 flex-1 rounded-lg"
                        onClick={() => {
                          setPasswordSubmitAttempted(false)
                          setStep('mfa')
                        }}
                      >
                        Back
                      </Button>
                      <Button type="submit" className="h-10 flex-1 rounded-lg text-[14px] font-medium">
                        Continue
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="px-4 pb-4 text-center text-xs text-muted-foreground">
          Need help? Contact your broker or WEX support. This is a prototype — use the MFA code from the toast to
          continue.
        </p>
      </div>

      <LoginPortalFooter />
    </div>
  )
}
