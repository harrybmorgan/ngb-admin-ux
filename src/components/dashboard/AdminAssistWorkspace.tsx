import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@wexinc-healthbenefits/ben-ui-kit'
import { ArrowLeftToLine, Clock, Menu, Mic, PanelRightDashed, Plus, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  appendMessage,
  createSession,
  loadSessions,
  saveSessions,
  sessionsForSidebar,
  upsertSessionInList,
  type AssistMessage,
  type AssistSession,
} from '@/lib/adminAssistChatStorage'
import { cn } from '@/lib/utils'
import { WEXLY_GRADIENT, WEXLY_GRADIENT_SHADOW } from '@/lib/wexlyBrand'
import { WexlyAvatar } from '@/components/wexly/WexlyAvatar'
import { WexlySparkleIcon } from '@/components/wexly/WexlySparkleIcon'

function newestSessionId(list: AssistSession[]) {
  if (!list.length) return null
  const sorted = [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  return sorted[0].id
}

const DOCK_WIDTH_PX = 400

const MOCK_ASSISTANT =
  "I'm WEXly (prototype mode). Your message was received — in production, answers would draw from your employer configuration, policies, and support knowledge."

function formatMessageTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function AssistantMessageBlock({ message }: { message: AssistMessage }) {
  return (
    <div className="min-w-0 max-w-full pr-2 sm:pr-8">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <WexlyAvatar size={28} />
        <span className="text-[14px] font-semibold tracking-tight text-[#14182c]">WEXly</span>
        <span className="text-xs text-[#5f6a94]">{formatMessageTime(message.at)}</span>
      </div>
      <div className="pl-9 text-[15px] leading-relaxed tracking-tight text-[#14182c]">{message.text}</div>
    </div>
  )
}

export type AdminAssistWorkspaceProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set while opening, seeds a new session with this user message (trimmed). */
  initialUserMessage?: string | null
  /** Increment on each hero search submit so the same text can start a new session. */
  seedVersion: number
  /** When true, the bottom-right WEXly FAB is always shown while closed (global shell). */
  alwaysShowFabWhenClosed?: boolean
}

export function AdminAssistWorkspace({
  open,
  onOpenChange,
  initialUserMessage,
  seedVersion,
  alwaysShowFabWhenClosed = false,
}: AdminAssistWorkspaceProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [sessions, setSessions] = useState<AssistSession[]>(() => loadSessions())
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => newestSessionId(loadSessions()))
  const [isDocked, setIsDocked] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [composerText, setComposerText] = useState('')

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null

  const scrollToBottom = () => {
    const el = scrollRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    if (!isDocked) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open, isDocked])

  useEffect(() => {
    const container = document.getElementById('docked-sidebar-container')
    const wrapper = document.getElementById('page-content-wrapper')
    if (!container) return

    if (open && isDocked) {
      container.style.width = `${DOCK_WIDTH_PX}px`
      wrapper?.classList.add('is-docked')
    } else {
      container.style.width = '0px'
      wrapper?.classList.remove('is-docked')
    }
    return () => {
      container.style.width = '0px'
      wrapper?.classList.remove('is-docked')
    }
  }, [open, isDocked])

  useEffect(() => {
    if (!open || !initialUserMessage?.trim()) return
    const trimmed = initialUserMessage.trim()
    const session = createSession(trimmed)
    setSessions((prev) => {
      const next = upsertSessionInList(prev, session)
      saveSessions(next)
      return next
    })
    setActiveSessionId(session.id)

    const sid = session.id
    const t = window.setTimeout(() => {
      setSessions((prev) => {
        const cur = prev.find((s) => s.id === sid)
        if (!cur) return prev
        const withReply = appendMessage(cur, 'assistant', MOCK_ASSISTANT)
        const next = upsertSessionInList(prev, withReply)
        saveSessions(next)
        return next
      })
    }, 900)
    return () => window.clearTimeout(t)
  }, [open, initialUserMessage, seedVersion])

  useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages.length, scrollToBottom])

  const handleComposerSend = () => {
    const text = composerText.trim()
    if (!text) return
    const sid = activeSessionId
    if (!sid) {
      toast.message('Tap New chat in WEXly or ask from a search bar on Dashboard or Reports.')
      return
    }
    setComposerText('')
    setSessions((prev) => {
      const base = prev.find((s) => s.id === sid)
      if (!base) return prev
      const withUser = appendMessage(base, 'user', text)
      const list = upsertSessionInList(prev, withUser)
      saveSessions(list)
      return list
    })
    window.setTimeout(() => {
      setSessions((prev) => {
        const base = prev.find((s) => s.id === sid)
        if (!base) return prev
        const withAssistant = appendMessage(base, 'assistant', MOCK_ASSISTANT)
        const list = upsertSessionInList(prev, withAssistant)
        saveSessions(list)
        return list
      })
    }, 700)
  }

  const handleStartNewChat = () => {
    const empty: AssistSession = {
      id: `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
      title: 'New chat',
      updatedAt: new Date().toISOString(),
      messages: [],
    }
    setSessions((prev) => {
      const next = upsertSessionInList(prev, empty)
      saveSessions(next)
      return next
    })
    setActiveSessionId(empty.id)
    setIsSidebarOpen(false)
    setComposerText('')
  }

  const selectSession = (id: string) => {
    setActiveSessionId(id)
    setIsSidebarOpen(false)
  }

  const { recent, older } = sessionsForSidebar(sessions)
  const hasResumeThread =
    activeSessionId !== null && (sessions.find((s) => s.id === activeSessionId)?.messages.length ?? 0) >= 1
  const showFabWhenClosed = alwaysShowFabWhenClosed || hasResumeThread

  if (!open) {
    const fabLabel = hasResumeThread ? 'Resume WEXly' : 'Open WEXly'
    const fab = showFabWhenClosed ? (
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={() => onOpenChange(true)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full border-0 text-white transition-transform hover:scale-105"
        style={{ background: WEXLY_GRADIENT, boxShadow: WEXLY_GRADIENT_SHADOW }}
        aria-label={fabLabel}
      >
        <WexlySparkleIcon size={26} />
      </motion.button>
    ) : null
    return <>{fab ? createPortal(fab, document.body) : null}</>
  }

  return (
    <div
      className={cn(
        'flex transition-all duration-300',
        isDocked
          ? 'fixed right-0 top-14 bottom-0 z-[45] items-stretch justify-end px-0'
          : 'fixed inset-x-0 bottom-0 top-14 z-[45] items-end justify-center px-4 sm:px-8',
      )}
      role="presentation"
    >
      {!isDocked && (
        <button
          type="button"
          aria-label="Close assistant"
          className="fixed inset-0 z-[44] bg-[rgba(10,14,20,0.62)] backdrop-blur-[18px] backdrop-saturate-150"
          onClick={() => onOpenChange(false)}
        />
      )}
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={isDocked ? { x: '100%', opacity: 0 } : { scale: 0.96, opacity: 0, y: 12 }}
        animate={isDocked ? { x: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
        exit={isDocked ? { x: '100%', opacity: 0 } : { scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className={cn(
          'relative z-[45] flex h-full w-full flex-col overflow-hidden outline-none lg:flex-row',
          isDocked
            ? 'max-w-[400px] rounded-none border-l border-[#e3e7f4] bg-white shadow-none'
            : 'mx-auto max-w-[min(100%,896px)] rounded-t-[24px] border-x border-t border-[#e3e7f4] shadow-[0_8px_16px_rgba(2,13,36,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-transparent',
        )}
        style={
          isDocked
            ? undefined
            : {
                background: `
                  radial-gradient(ellipse at 8% 28%, rgba(37,20,111,0.065) 0%, transparent 48%),
                  radial-gradient(ellipse at 92% 78%, rgba(200,16,46,0.055) 0%, transparent 42%),
                  linear-gradient(180deg, rgba(238,242,255,0.58) 0%, rgba(255,255,255,0.92) 42%)
                `,
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence>
          {isDocked && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-[rgba(18,24,29,0.45)] backdrop-blur-[2px] lg:block"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSidebarOpen ? (
            <motion.aside
              initial={isDocked ? { x: '-100%' } : { width: 64, opacity: 0 }}
              animate={isDocked ? { x: 0 } : { width: 308, opacity: 1 }}
              exit={isDocked ? { x: '-100%' } : { width: 64, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className={cn(
                'flex shrink-0 flex-col justify-between border-r border-[#e3e7f4] bg-white pb-4 pt-3',
                isDocked
                  ? 'absolute bottom-0 left-0 top-0 z-20 w-[308px] shadow-[4px_0_24px_rgba(0,0,0,0.12)]'
                  : 'hidden w-[308px] rounded-tl-[24px] lg:flex',
              )}
            >
              <div className="flex w-[308px] flex-col gap-6 overflow-y-auto px-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5f6a94] transition-colors hover:bg-[#f8f9fe]"
                    aria-label="Close chat history"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <ArrowLeftToLine className="h-4 w-4" />
                  </button>
                  <span className="text-[14px] font-semibold leading-6 text-[#14182c]">Chat history</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-[#e3e7f4] bg-[#f8f9fe] text-[14px] font-medium text-neutral-700 transition-colors hover:bg-[#eef2ff]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Start new chat
                </button>
                <div>
                  <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-[#7a87b2]">Recent</p>
                  <div className="flex flex-col gap-1">
                    {recent.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectSession(s.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] leading-snug transition-colors',
                          s.id === activeSessionId
                            ? 'bg-[#e1e8ff] font-semibold text-[#25146f]'
                            : 'text-[#5f6a94] hover:bg-[#f8f9fe]',
                        )}
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-2">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {older.length > 0 ? (
                  <div>
                    <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-[#7a87b2]">
                      Previous 30 days
                    </p>
                    <div className="flex flex-col gap-1">
                      {older.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => selectSession(s.id)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] leading-snug transition-colors',
                            s.id === activeSessionId
                              ? 'bg-[#e1e8ff] font-semibold text-[#25146f]'
                              : 'text-[#5f6a94] hover:bg-[#f8f9fe]',
                          )}
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2">{s.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.aside>
          ) : !isDocked ? (
            <aside className="hidden w-16 shrink-0 flex-col items-center rounded-tl-[24px] border-r border-[#e3e7f4] bg-white pt-3 lg:flex">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f6a94] transition-colors hover:bg-[#f8f9fe]"
                aria-label="Open chat history"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
            </aside>
          ) : null}
        </AnimatePresence>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header
            className={cn(
              'flex h-14 shrink-0 items-center justify-between border-b border-[#e3e7f4] bg-white px-4',
              !isDocked && 'rounded-tr-[24px] sm:px-6',
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {isDocked ? (
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#5f6a94] hover:bg-[#f8f9fe]"
                  aria-label="Chat history"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </button>
              ) : null}
              <div className="flex min-w-0 items-center gap-2">
                <WexlyAvatar size={26} />
                <h2 id={titleId} className="truncate text-[15px] font-semibold tracking-tight text-[#14182c]">
                  WEXly
                </h2>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[#5f6a94]"
                aria-label={isDocked ? 'Expand assistant' : 'Dock assistant to side'}
                onClick={() => setIsDocked((d) => !d)}
              >
                <PanelRightDashed className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[#5f6a94]"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {!activeSession || activeSession.messages.length === 0 ? (
              <div className="mx-auto max-w-md space-y-3 px-2 text-center">
                <p className="text-[15px] leading-relaxed tracking-tight text-[#14182c]">
                  I&apos;m{' '}
                  <span
                    className="font-bold"
                    style={{
                      background: WEXLY_GRADIENT,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    WEXly
                  </span>
                  , your benefits admin helper.
                </p>
                <p className="text-sm leading-relaxed text-[#5f6a94]">
                  Ask anything about your employer setup. Messages are saved in this browser only (prototype).
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-5">
                {activeSession.messages.map((m) => (
                  <li key={m.id} className={cn(m.role === 'user' ? 'flex justify-end' : '')}>
                    {m.role === 'assistant' ? (
                      <AssistantMessageBlock message={m} />
                    ) : (
                      <div className="max-w-[min(100%,76%)] rounded-[18px] rounded-br-sm bg-[#e3e7f4] px-4 py-2.5 text-[15px] leading-relaxed tracking-tight text-[#14182c]">
                        {m.text}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="shrink-0 border-t border-black/[0.07] bg-[rgba(248,249,253,0.92)] px-4 py-3 backdrop-blur-[20px] backdrop-saturate-180 sm:px-6">
            <p className="mb-2 text-center text-[11px] leading-snug text-[#7a87b2]">
              WEXly may make mistakes. Verify important details with your broker or WEX support.
            </p>
            <div className="flex items-center gap-2 rounded-full border border-black/[0.04] bg-white py-2 pl-3.5 pr-2 shadow-[0_2px_14px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] sm:pl-4">
              <input
                type="text"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleComposerSend()
                  }
                }}
                placeholder="Message WEXly…"
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] leading-[22px] tracking-tight text-[#14182c] outline-none placeholder:text-[#9aa3bd]"
                aria-label="Message WEXly"
              />
              <button
                type="button"
                onClick={() => toast.message('Voice input is not enabled in this prototype.')}
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-0 bg-[#f0f2f7] text-[#5f6a94] transition-colors hover:bg-[#e6e9f0]"
                aria-label="Voice input"
              >
                <Mic className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={handleComposerSend}
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-0 text-white transition-opacity hover:opacity-90"
                style={{ background: WEXLY_GRADIENT, boxShadow: WEXLY_GRADIENT_SHADOW }}
                aria-label="Send"
              >
                <Send className="h-[15px] w-[15px]" strokeWidth={2.5} style={{ marginLeft: 1 }} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
