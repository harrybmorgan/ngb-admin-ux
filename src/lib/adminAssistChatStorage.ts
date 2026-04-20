/** Persisted employer-admin AI assistant sessions (prototype). */

export const ADMIN_ASSIST_STORAGE_KEY = 'ngb-admin-assist-chats-v1'

const MAX_SESSIONS = 40
const MAX_MESSAGES_PER_SESSION = 80

export type AssistMessageRole = 'user' | 'assistant'

export type AssistMessage = {
  id: string
  role: AssistMessageRole
  text: string
  at: string
}

export type AssistSession = {
  id: string
  title: string
  updatedAt: string
  messages: AssistMessage[]
}

function nowIso() {
  return new Date().toISOString()
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function titleFromFirstMessage(text: string, maxLen = 52) {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen - 1)}…`
}

export function loadSessions(): AssistSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ADMIN_ASSIST_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidSession)
  } catch {
    return []
  }
}

function isValidSession(s: unknown): s is AssistSession {
  if (!s || typeof s !== 'object') return false
  const o = s as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.updatedAt === 'string' &&
    Array.isArray(o.messages)
  )
}

export function saveSessions(sessions: AssistSession[]) {
  if (typeof window === 'undefined') return
  const trimmed = sessions
    .slice(0, MAX_SESSIONS)
    .map((s) => ({
      ...s,
      messages: s.messages.slice(-MAX_MESSAGES_PER_SESSION),
    }))
  window.localStorage.setItem(ADMIN_ASSIST_STORAGE_KEY, JSON.stringify(trimmed))
}

export function createSession(firstUserText: string): AssistSession {
  const id = newId('sess')
  const at = nowIso()
  const userMsg: AssistMessage = {
    id: newId('msg'),
    role: 'user',
    text: firstUserText.trim(),
    at,
  }
  return {
    id,
    title: titleFromFirstMessage(firstUserText),
    updatedAt: at,
    messages: [userMsg],
  }
}

export function appendMessage(session: AssistSession, role: AssistMessageRole, text: string): AssistSession {
  const at = nowIso()
  const msg: AssistMessage = {
    id: newId('msg'),
    role,
    text: text.trim(),
    at,
  }
  return {
    ...session,
    updatedAt: at,
    messages: [...session.messages, msg].slice(-MAX_MESSAGES_PER_SESSION),
  }
}

export function upsertSessionInList(sessions: AssistSession[], session: AssistSession): AssistSession[] {
  const others = sessions.filter((s) => s.id !== session.id)
  return [session, ...others].slice(0, MAX_SESSIONS)
}

export function sessionsForSidebar(sessions: AssistSession[]) {
  const sorted = [...sessions].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recent = sorted.filter((s) => new Date(s.updatedAt).getTime() >= cutoff)
  const older = sorted.filter((s) => new Date(s.updatedAt).getTime() < cutoff)
  return { recent, older }
}
