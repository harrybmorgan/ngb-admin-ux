import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Building2, ChevronDown, LayoutDashboard, LogOut, Menu, Search, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { EMPLOYER } from '@/data/adminMockData'

const mainNav = [
  { to: '/', label: 'Home' },
  { to: '/enrollment', label: 'Enrollment' },
  { to: '/billing', label: 'Billing & Invoicing' },
  { to: '/reports', label: 'Reporting & Analytics' },
  { to: '/content', label: 'Content' },
  { to: '/communications', label: 'Communications' },
] as const

interface AdminNavigationProps {
  hideNav?: boolean
}

export function AdminNavigation({ hideNav = false }: AdminNavigationProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const wexLogoUrl = `${import.meta.env.BASE_URL}WEX_Logo_Red_Vector.svg`

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/' || location.pathname === ''
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={wexLogoUrl} alt="WEX" className="h-8 w-auto" />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Employer admin
            </span>
            <span className="max-w-[200px] truncate text-sm font-medium text-foreground">
              {EMPLOYER.name}
            </span>
          </div>
        </Link>

        {!hideNav && (
          <>
            <nav className="ml-2 hidden flex-1 flex-wrap items-center gap-1 lg:flex">
              {mainNav.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link
                to="/setup"
                className={`ml-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/setup')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Setup wizard
              </Link>
              <Link
                to="/theming"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/theming')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Branding
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden gap-2 sm:inline-flex"
                onClick={() => navigate('/enrollment')}
              >
                <Search className="h-4 w-4" />
                Find person
              </Button>

              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-[min(100vw-2rem,360px)] flex-col gap-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Building2 className="h-5 w-5" />
                    Menu
                  </div>
                  <nav className="flex flex-col gap-1">
                    {mainNav.map(({ to, label }) => (
                      <Link
                        key={to}
                        to={to}
                        className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                          isActive(to) ? 'bg-primary/10 text-primary' : 'text-foreground'
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                    <Link
                      to="/setup"
                      className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                        isActive('/setup') ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                    >
                      Setup wizard
                    </Link>
                    <Link
                      to="/theming"
                      className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                        isActive('/theming') ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                    >
                      Branding
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-1">
                    <User className="h-4 w-4" />
                    <span className="hidden max-w-[120px] truncate sm:inline">{EMPLOYER.hrAdminName}</span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
