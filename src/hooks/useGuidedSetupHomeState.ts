import { useSyncExternalStore } from 'react'
import { readGuidedDraftSnapshot, type GuidedDraftSnapshot } from '@/lib/guidedSetupHome'

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener('ngb-admin-setup', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('ngb-admin-setup', callback)
  }
}

let cachedKey = ''
let cachedSnapshot: GuidedDraftSnapshot | null = null

function getSnapshot(): GuidedDraftSnapshot | null {
  const next = readGuidedDraftSnapshot()
  const key = next ? `${next.stepIndex}:${next.outcomes.join('')}` : ''
  if (key !== cachedKey) {
    cachedKey = key
    cachedSnapshot = next
  }
  return cachedSnapshot
}

function getServerSnapshot(): GuidedDraftSnapshot | null {
  return null
}

/**
 * Live read of guided setup wizard draft for homepage “Setup tasks” summaries.
 * Subscribes to the same `ngb-admin-setup` channel as `useEmployerSetup`.
 */
export function useGuidedSetupHomeState() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return snapshot
}
