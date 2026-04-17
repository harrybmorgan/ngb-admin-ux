import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { clearGuidedSetupWizardDraft, writeEmployerSetup } from '@/hooks/useEmployerSetup'

interface AuthContextType {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth is in-memory only so a full page refresh requires signing in again
 * (prototype gate with fixed first-screen credentials).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const login = () => {
    if (typeof window !== 'undefined') {
      /** New sign-in starts pre-launch on the home hero; launch persists only until logout (localStorage otherwise outlives auth). */
      writeEmployerSetup({ launchComplete: false })
    }
    setIsAuthenticated(true)
  }
  const logout = () => {
    clearGuidedSetupWizardDraft()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
