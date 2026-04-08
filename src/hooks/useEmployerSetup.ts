import { useCallback, useSyncExternalStore } from 'react'

export const SETUP_STORAGE_KEY = 'ngb_admin_employer_setup'

export type EmployerSetupState = {
  onboardingComplete: boolean
  planReady: boolean
  launchComplete: boolean
}

const defaults: EmployerSetupState = {
  onboardingComplete: false,
  planReady: false,
  launchComplete: false,
}

/** Parse localStorage; reuse `defaults` when empty so callers get a stable reference. */
function parseSetup(raw: string | null): EmployerSetupState {
  if (!raw) return defaults
  try {
    return { ...defaults, ...JSON.parse(raw) as Partial<EmployerSetupState> }
  } catch {
    return defaults
  }
}

let snapshotKey: string | null = null
let snapshotState: EmployerSetupState = defaults

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener('ngb-admin-setup', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('ngb-admin-setup', callback)
  }
}

function getSnapshot(): EmployerSetupState {
  if (typeof window === 'undefined') return defaults
  const raw = localStorage.getItem(SETUP_STORAGE_KEY)
  const key = raw === null ? '' : raw
  if (key !== snapshotKey) {
    snapshotKey = key
    snapshotState = parseSetup(raw)
  }
  return snapshotState
}

function getServerSnapshot(): EmployerSetupState {
  return defaults
}

export function emitSetupChanged() {
  window.dispatchEvent(new Event('ngb-admin-setup'))
}

export function writeEmployerSetup(partial: Partial<EmployerSetupState>) {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(SETUP_STORAGE_KEY) : null
  const next = { ...parseSetup(raw), ...partial }
  localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(next))
  emitSetupChanged()
}

export function useEmployerSetup() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const update = useCallback((partial: Partial<EmployerSetupState>) => {
    writeEmployerSetup(partial)
  }, [])
  return { ...state, update }
}
