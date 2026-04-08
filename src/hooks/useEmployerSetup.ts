import { useCallback, useSyncExternalStore } from 'react'

export const SETUP_STORAGE_KEY = 'cxr_admin_employer_setup'

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

function readSetup(): EmployerSetupState {
  if (typeof window === 'undefined') return defaults
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener('cxr-admin-setup', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('cxr-admin-setup', callback)
  }
}

function getSnapshot(): EmployerSetupState {
  return readSetup()
}

function getServerSnapshot(): EmployerSetupState {
  return defaults
}

export function emitSetupChanged() {
  window.dispatchEvent(new Event('cxr-admin-setup'))
}

export function writeEmployerSetup(partial: Partial<EmployerSetupState>) {
  const next = { ...readSetup(), ...partial }
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
