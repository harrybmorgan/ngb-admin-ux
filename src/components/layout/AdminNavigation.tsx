import { useState } from 'react'
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
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building2,
  ChevronDown,
  CreditCard,
  FolderOpen,
  Home,
  LogOut,
  Mail,
  Menu,
  Palette,
  Settings,
  Ticket,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { EMPLOYER } from '@/data/adminMockData'

type MainNavItem = { to: string; label: string; icon: LucideIcon }

const mainNav: MainNavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/enrollment', label: 'People', icon: Users },
  { to: '/billing', label: 'Billing & Invoicing', icon: CreditCard },
  { to: '/reports', label: 'Reporting & Analytics', icon: BarChart3 },
  { to: '/content', label: 'Content', icon: FolderOpen },
  { to: '/communications', label: 'Communications', icon: Mail },
]

interface AdminNavigationProps {
  hideNav?: boolean
}

export function AdminNavigation({ hideNav = false }: AdminNavigationProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const wexLogoUrl = `${import.meta.env.BASE_URL}WEX_Logo_Red_Vector.svg`

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
        <Link to="/" className="flex shrink-0 items-center" aria-label="WEX Employer admin home">
          <img src={wexLogoUrl} alt="WEX" className="h-8 w-auto" />
        </Link>

        {!hideNav && (
          <>
            {/* Push primary nav + account controls to the right (away from logo) */}
            <div className="min-w-0 flex-1" aria-hidden="true" />

            <nav className="hidden shrink-0 flex-wrap items-center gap-1 lg:flex">
              {mainNav.map(({ to, label, icon: Icon }) => {
                const active = isActive(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex min-h-11 flex-col justify-center rounded-md px-[17px] py-2 text-sm transition-colors hover:bg-black/5 ${
                      active ? 'text-[#3958c3]' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${active ? 'text-[#3958c3]' : 'text-muted-foreground'}`}
                        aria-hidden
                      />
                      <span className={`leading-6 tracking-[-0.084px] ${active ? 'font-semibold' : 'font-normal'}`}>
                        {label}
                      </span>
                    </div>
                    {active ? (
                      <span
                        className="absolute bottom-0 left-[17px] right-[17px] h-0.5 rounded-sm bg-[#3958c3]"
                        aria-hidden
                      />
                    ) : null}
                  </Link>
                )
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
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
                  <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
                    {mainNav.map(({ to, label, icon: Icon }) => {
                      const active = isActive(to)
                      return (
                        <Link
                          key={to}
                          to={to}
                          className={`relative flex flex-col rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 ${
                            active ? 'text-[#3958c3]' : 'text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`h-4 w-4 shrink-0 ${active ? 'text-[#3958c3]' : 'text-foreground'}`}
                              aria-hidden
                            />
                            <span className={active ? 'font-semibold' : 'font-medium'}>{label}</span>
                          </div>
                          {active ? (
                            <span className="mt-1 h-0.5 w-full rounded-sm bg-[#3958c3]" aria-hidden />
                          ) : null}
                        </Link>
                      )
                    })}
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
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/tickets')}>
                    <Ticket className="mr-2 h-4 w-4" />
                    Tickets
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/theming')}>
                    <Palette className="mr-2 h-4 w-4" />
                    Branding studio
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
