import { useCallback, useSyncExternalStore } from 'react'

export const COBRA_TERMINATION_STORAGE_KEY = 'ngb_admin_cobra_termination_proto_v1'

export type CobraTerminationPhase = 'notice_sent' | 'election_review'

export type CobraTerminationActiveCase = {
  enrollmentRowId: string
  employeeName: string
  terminationDate: string
  reason: string
  phase: CobraTerminationPhase
  updatedAt: string
}

export type CobraTerminationState = {
  activeCase: CobraTerminationActiveCase | null
}

const emptyState: CobraTerminationState = { activeCase: null }

function parseState(raw: string | null): CobraTerminationState {
  if (!raw) return emptyState
  try {
    const parsed = JSON.parse(raw) as Partial<CobraTerminationState>
    if (!parsed || typeof parsed !== 'object') return emptyState
    const c = parsed.activeCase
    if (!c || typeof c.enrollmentRowId !== 'string') return emptyState
    if (c.phase !== 'notice_sent' && c.phase !== 'election_review') return emptyState
    return {
      activeCase: {
        enrollmentRowId: c.enrollmentRowId,
        employeeName: String(c.employeeName ?? ''),
        terminationDate: String(c.terminationDate ?? ''),
        reason: String(c.reason ?? ''),
        phase: c.phase,
        updatedAt: String(c.updatedAt ?? new Date().toISOString()),
      },
    }
  } catch {
    return emptyState
  }
}

let snapshotKey: string | null = null
let snapshotState: CobraTerminationState = emptyState

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener('ngb-cobra-termination-proto', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('ngb-cobra-termination-proto', callback)
  }
}

function getSnapshot(): CobraTerminationState {
  if (typeof window === 'undefined') return emptyState
  const raw = localStorage.getItem(COBRA_TERMINATION_STORAGE_KEY)
  const key = raw === null ? '' : raw
  if (key !== snapshotKey) {
    snapshotKey = key
    snapshotState = parseState(raw)
  }
  return snapshotState
}

function getServerSnapshot(): CobraTerminationState {
  return emptyState
}

export function emitCobraTerminationProtoChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('ngb-cobra-termination-proto'))
}

export function writeCobraTerminationState(next: CobraTerminationState) {
  if (typeof window === 'undefined') return
  if (next.activeCase === null) {
    localStorage.removeItem(COBRA_TERMINATION_STORAGE_KEY)
  } else {
    localStorage.setItem(COBRA_TERMINATION_STORAGE_KEY, JSON.stringify(next))
  }
  snapshotKey = null
  emitCobraTerminationProtoChanged()
}

export function clearCobraTerminationPrototype() {
  writeCobraTerminationState({ activeCase: null })
}

export function setCobraTerminationActiveCase(caseData: Omit<CobraTerminationActiveCase, 'updatedAt'> & { updatedAt?: string }) {
  const activeCase: CobraTerminationActiveCase = {
    ...caseData,
    updatedAt: caseData.updatedAt ?? new Date().toISOString(),
  }
  writeCobraTerminationState({ activeCase })
}

export function advanceCobraTerminationPhase() {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(COBRA_TERMINATION_STORAGE_KEY) : null
  const parsed = parseState(raw)
  if (!parsed.activeCase) return
  if (parsed.activeCase.phase === 'notice_sent') {
    writeCobraTerminationState({
      activeCase: {
        ...parsed.activeCase,
        phase: 'election_review',
        updatedAt: new Date().toISOString(),
      },
    })
  }
}

export function useCobraTerminationPrototype() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setCase = useCallback((c: Omit<CobraTerminationActiveCase, 'updatedAt'> & { updatedAt?: string }) => {
    setCobraTerminationActiveCase(c)
  }, [])

  const clear = useCallback(() => {
    clearCobraTerminationPrototype()
  }, [])

  const advancePhase = useCallback(() => {
    advanceCobraTerminationPhase()
  }, [])

  return {
    activeCase: state.activeCase,
    setCase,
    clear,
    advancePhase,
  }
}
