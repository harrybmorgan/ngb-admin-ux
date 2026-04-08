import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, FloatLabel, Alert, AlertDescription } from '@wexinc-healthbenefits/ben-ui-kit'
import { Eye, EyeOff, Info } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { EMPLOYER } from '@/data/adminMockData'

type Step = 'credentials' | 'reset'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const wexLogoUrl = `${import.meta.env.BASE_URL}WEX_Logo_Red_Vector.svg`
  const loginBgUrl = `${import.meta.env.BASE_URL}wexbrand_loginbg.svg`

  const [step, setStep] = useState<Step>('credentials')
  const [username, setUsername] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showTemp, setShowTemp] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCredentialsContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !tempPassword) {
      setError('Enter the username and temporary password from your welcome email.')
      return
    }
    setStep('reset')
  }

  const onResetComplete = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 10) {
      setError('Use at least 10 characters for your new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation must match.')
      return
    }
    login()
    navigate('/', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBgUrl})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <img src={wexLogoUrl} alt="WEX" className="mx-auto h-12 w-auto" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Employer admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">{EMPLOYER.name}</p>
        </div>

        <Card className="border-border/80 shadow-lg">
          <CardContent className="space-y-6 p-6 sm:p-8">
            {step === 'credentials' && (
              <form onSubmit={onCredentialsContinue} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">First-time sign in</h2>
                  <p className="text-sm text-muted-foreground">
                    Use the username and temporary password your broker sent to {EMPLOYER.hrAdminEmail}.
                  </p>
                </div>

                <Alert intent="info">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    After you sign in, you’ll create a new password before reaching your dashboard.
                  </AlertDescription>
                </Alert>

                <FloatLabel label="Username">
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </FloatLabel>

                <FloatLabel label="Temporary password">
                  <div className="relative">
                    <input
                      id="temp-password"
                      name="password"
                      type={showTemp ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowTemp(!showTemp)}
                      aria-label={showTemp ? 'Hide password' : 'Show password'}
                    >
                      {showTemp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FloatLabel>

                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={onResetComplete} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Create your password</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose a strong password for <span className="font-medium text-foreground">{username}</span>.
                  </p>
                </div>

                <FloatLabel label="New password">
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowNew(!showNew)}
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FloatLabel>

                <FloatLabel label="Confirm new password">
                  <input
                    id="confirm-password"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </FloatLabel>

                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" className="sm:flex-1" onClick={() => setStep('credentials')}>
                    Back
                  </Button>
                  <Button type="submit" className="sm:flex-1">
                    Save & sign in
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need help? Contact your broker or WEX support. This is a prototype — any credentials work for the reset step.
        </p>
      </div>
    </div>
  )
}
