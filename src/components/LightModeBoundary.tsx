import * as React from 'react'

export function LightModeBoundary({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const hadDarkClass = root.classList.contains('dark')
    root.classList.remove('dark')
    return () => {
      if (hadDarkClass) root.classList.add('dark')
    }
  }, [])
  return <>{children}</>
}
