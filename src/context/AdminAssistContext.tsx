import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AdminAssistWorkspace } from '@/components/dashboard/AdminAssistWorkspace'

export type AdminAssistContextValue = {
  /** Whether the WEXly workspace panel is open. */
  open: boolean
  /** Open WEXly; pass `seedText` to start a thread from the dashboard/reports search bar. */
  openAssistant: (opts?: { seedText?: string | null }) => void
  closeAssistant: () => void
}

const AdminAssistContext = createContext<AdminAssistContextValue | null>(null)

export function AdminAssistProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialUserMessage, setInitialUserMessage] = useState<string | null>(null)
  const [seedVersion, setSeedVersion] = useState(0)

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setInitialUserMessage(null)
  }, [])

  const openAssistant = useCallback((opts?: { seedText?: string | null }) => {
    const t = opts?.seedText?.trim()
    if (t) {
      setInitialUserMessage(t)
      setSeedVersion((n) => n + 1)
    } else {
      setInitialUserMessage(null)
    }
    setOpen(true)
  }, [])

  const closeAssistant = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const value = useMemo(
    () => ({
      open,
      openAssistant,
      closeAssistant,
    }),
    [open, openAssistant, closeAssistant],
  )

  return (
    <AdminAssistContext.Provider value={value}>
      {children}
      <AdminAssistWorkspace
        open={open}
        onOpenChange={onOpenChange}
        initialUserMessage={initialUserMessage}
        seedVersion={seedVersion}
        alwaysShowFabWhenClosed
      />
    </AdminAssistContext.Provider>
  )
}

export function useAdminAssist(): AdminAssistContextValue {
  const ctx = useContext(AdminAssistContext)
  if (!ctx) {
    throw new Error('useAdminAssist must be used within AdminAssistProvider')
  }
  return ctx
}
