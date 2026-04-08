import { Link } from 'react-router-dom'
import { Button, Card, CardContent } from '@wexinc-healthbenefits/ben-ui-kit'
import { ExternalLink } from 'lucide-react'
import { LoginPortalFooter } from '@/components/layout/LoginPortalFooter'

const MEMBER_PORTAL_URL = import.meta.env.VITE_MEMBER_PORTAL_URL as string | undefined

/**
 * After choosing “Employee” on sign-in, users land here (public) with a link to the consumer / member prototype.
 */
export default function MemberHandoffPage() {
  const wexLogoUrl = `${import.meta.env.BASE_URL}WEX_Logo_Red_Vector.svg`
  const target = MEMBER_PORTAL_URL?.trim() || 'http://localhost:5173'

  return (
    <div className="login-portal-bg flex min-h-screen flex-col">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10">
        <Card
          variant="elevated"
          className="w-full max-w-[402px] overflow-hidden border-0 shadow-lg"
          style={{ borderRadius: '16px' }}
        >
          <CardContent className="space-y-6 p-8" style={{ borderRadius: '16px' }}>
            <div className="flex flex-col items-center gap-6">
              <div className="h-[50px] w-[150px]">
                <img src={wexLogoUrl} alt="WEX" className="h-full w-full object-contain" />
              </div>
              <div className="space-y-2 text-center">
                <h1 className="text-[18px] font-semibold leading-6 tracking-[-0.252px] text-foreground">
                  Member portal
                </h1>
                <p className="max-w-[328px] text-[16px] font-normal leading-6 tracking-[-0.176px] text-foreground">
                  In this prototype, the employee experience runs as a separate app. Open the member portal to continue
                  as an employee.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                className="h-10 w-full rounded-lg text-[14px] font-medium"
                onClick={() => window.open(target, '_blank', 'noopener,noreferrer')}
              >
                <span className="inline-flex items-center gap-2">
                  Open member portal
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </span>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Default URL: <span className="font-mono text-[11px]">{target}</span>
                {!MEMBER_PORTAL_URL && (
                  <>
                    {' '}
                    — set <span className="font-mono">VITE_MEMBER_PORTAL_URL</span> in <span className="font-mono">.env</span>{' '}
                    to match your local cxr-ux port.
                  </>
                )}
              </p>
              <Button type="button" variant="outline" className="h-10 w-full rounded-lg" asChild>
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <LoginPortalFooter />
    </div>
  )
}
