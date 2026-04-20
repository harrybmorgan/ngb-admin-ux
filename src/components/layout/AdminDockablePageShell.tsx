import type { ReactNode } from 'react'

/**
 * Wraps page body so {@link AdminAssistWorkspace} can dock WEXly beside content on any admin route
 * (same `#page-content-wrapper` / `#docked-sidebar-container` contract as the dashboard).
 */
export function AdminDockablePageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-1">
      <div
        id="page-content-wrapper"
        className="group flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300"
      >
        {children}
      </div>
      <div
        id="docked-sidebar-container"
        className="shrink-0 overflow-hidden transition-all duration-300"
        aria-hidden
      />
    </div>
  )
}
