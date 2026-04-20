import { useState, useEffect, useRef } from 'react'
import { Mic, Send, Clock, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { WEXLY_GRADIENT, WEXLY_GRADIENT_SHADOW } from '@/lib/wexlyBrand'

const PLACEHOLDER_PREFIX = 'Ask WEXly… '

/** Text shown after the prefix in the rotating placeholder and suggestions. */
const QUERIES = [
  'how do I process a life event?',
  "how do I update an employee's address?",
  'what is our plan renewal checklist?',
  'why is my payroll contribution file wrong?',
  'how do I grant admin access?',
  'where is my admin fee invoice?',
]

function fullSuggestion(suffix: string) {
  return `${PLACEHOLDER_PREFIX}${suffix}`
}

const placeholderContainerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.025 } },
}

const letterVariants = {
  initial: {
    opacity: 0,
    filter: 'blur(12px)',
    y: 10,
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      opacity: { duration: 0.25 },
      filter: { duration: 0.4 },
      y: { type: 'spring' as const, stiffness: 80, damping: 20 },
    },
  },
}

export type AdminAiChatInputProps = {
  value: string
  onChange: (value: string) => void
  onMicClick: () => void
  /** When set, Enter / send with non-empty text calls this with trimmed value (opens assistant workspace). */
  onSubmit?: (trimmed: string) => void
  /** Legacy: used when `onSubmit` is omitted (prototype toast). */
  onSendClick?: () => void
}

export function AdminAiChatInput({ value, onChange, onMicClick, onSubmit, onSendClick }: AdminAiChatInputProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isFocused, setIsFocused] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [queryIndex, setQueryIndex] = useState(0)
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const showPlaceholder = !isFocused && !value && !isDropdownOpen

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!showPlaceholder || !hasAnimatedIn) return
    const timeout = setTimeout(() => {
      setQueryIndex((prev) => (prev + 1) % QUERIES.length)
    }, 3000)
    return () => clearTimeout(timeout)
  }, [showPlaceholder, queryIndex, hasAnimatedIn])

  useEffect(() => {
    if (prefersReducedMotion && showPlaceholder) {
      const id = setInterval(() => {
        setQueryIndex((prev) => (prev + 1) % QUERIES.length)
      }, 3000)
      return () => clearInterval(id)
    }
  }, [prefersReducedMotion, showPlaceholder])

  const handleSuggestionClick = (query: string) => {
    if (onSubmit) {
      onSubmit(query.trim())
      setIsDropdownOpen(false)
      setIsFocused(false)
      return
    }
    onChange(fullSuggestion(query))
    setIsDropdownOpen(false)
    setIsFocused(true)
    inputRef.current?.focus()
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      toast.message('Message WEXly to get started (prototype).')
      return
    }
    if (onSubmit) onSubmit(trimmed)
    else onSendClick?.()
  }

  const barClassName = `relative z-10 flex w-full items-center justify-between gap-2 rounded-[32px] border border-[#e3e7f4] bg-white py-[11px] pl-4 pr-2 shadow-[0_2px_14px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-[2px] transition-shadow duration-200 sm:pl-[25px] sm:pr-[17px] ${
    isDropdownOpen ? 'shadow-md' : ''
  } focus-within:ring-2 focus-within:ring-[#3958c3]/25 focus-within:ring-offset-2 motion-safe:focus-within:scale-[1.01]`

  if (prefersReducedMotion) {
    return (
      <div
        ref={containerRef}
        className="relative z-[200] w-full"
        onMouseEnter={() => {
          if (isFocused && !value) setIsDropdownOpen(true)
        }}
        onMouseLeave={() => {
          if (!isFocused) setIsDropdownOpen(false)
        }}
      >
        <div className={barClassName}>
          <div className="relative min-h-[20px] flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                if (e.target.value.length > 0) {
                  setIsDropdownOpen(false)
                } else if (isFocused) {
                  setIsDropdownOpen(true)
                }
              }}
              onFocus={() => {
                setIsFocused(true)
                if (!value) setIsDropdownOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="w-full border-0 bg-transparent text-[15px] text-[#14182c] outline-none placeholder:text-[#9aa3bd]"
              placeholder={showPlaceholder ? `${PLACEHOLDER_PREFIX}${QUERIES[queryIndex]}` : undefined}
              aria-label="Message WEXly"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-[8px]">
            <button
              type="button"
              onClick={onMicClick}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-[#f0f2f7] text-[#5f6a94] transition-colors duration-150 hover:bg-[#e6e9f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 sm:h-[35px] sm:w-[35px]"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4 sm:h-[14px] sm:w-[14px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 sm:h-[35px] sm:w-[35px]"
              style={{ background: WEXLY_GRADIENT, boxShadow: WEXLY_GRADIENT_SHADOW }}
              aria-label="Send to WEXly"
            >
              <Send className="h-4 w-4 sm:h-[14px] sm:w-[14px]" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-[210] mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-[24px] border border-[#e3e7f4] bg-white py-2 shadow-[0_8px_32px_rgba(43,49,78,0.14)]">
            <button
              type="button"
              className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-[#f8f9fe]"
              onClick={() => handleSuggestionClick(QUERIES[0])}
            >
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#7a87b2]" />
              <span className="text-[14px] leading-snug text-[#14182c]">{fullSuggestion(QUERIES[0])}</span>
            </button>
            <div className="mx-4 my-1 h-px bg-[#e3e7f4]" />
            {QUERIES.slice(1).map((query, i) => (
              <button
                key={i}
                type="button"
                className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-[#f8f9fe]"
                onClick={() => handleSuggestionClick(query)}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#3958c3]" />
                <span className="text-[14px] leading-snug text-[#5f6a94]">{fullSuggestion(query)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative z-[200] w-full"
      onMouseEnter={() => {
        if (isFocused && !value) setIsDropdownOpen(true)
      }}
      onMouseLeave={() => {
        if (!isFocused) setIsDropdownOpen(false)
      }}
    >
      <div className={barClassName}>
        <div className="relative min-h-[20px] flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              if (e.target.value.length > 0) {
                setIsDropdownOpen(false)
              } else if (isFocused) {
                setIsDropdownOpen(true)
              }
            }}
            onFocus={() => {
              setIsFocused(true)
              if (!value) setIsDropdownOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSend()
              }
            }}
            className="w-full border-0 bg-transparent text-[15px] text-[#14182c] outline-none placeholder-transparent"
            aria-label="Message WEXly"
          />
          {showPlaceholder && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center overflow-hidden"
              style={{ perspective: '600px' }}
            >
              <motion.span
                className="absolute left-0 top-1/2 flex -translate-y-1/2 select-none items-center whitespace-nowrap text-[15px] text-[#7a87b2]"
                variants={placeholderContainerVariants}
                initial="initial"
                animate="animate"
                onAnimationComplete={() => setHasAnimatedIn(true)}
              >
                <span className="flex">
                  {PLACEHOLDER_PREFIX.split('').map((char, i) => (
                    <motion.span key={`p-${i}`} variants={letterVariants} style={{ display: 'inline-block' }}>
                      {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                  ))}
                </span>

                <div className="relative flex h-[20px] items-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={queryIndex}
                      className="absolute left-0 whitespace-nowrap italic"
                      style={{ transformOrigin: 'center bottom' }}
                      initial={
                        queryIndex === 0 && !hasAnimatedIn
                          ? false
                          : {
                              rotateX: 45,
                              y: 15,
                              opacity: 0,
                              filter: 'blur(12px)',
                            }
                      }
                      animate={{
                        rotateX: 0,
                        y: [15, 0],
                        opacity: 1,
                        filter: 'blur(0px)',
                        transition: {
                          duration: 0.6,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }}
                      exit={{
                        rotateX: [0, -15, -15],
                        y: [0, -4, -40],
                        opacity: [1, 0.8, 0.3],
                        filter: ['blur(0px)', 'blur(0px)', 'blur(12px)'],
                        transition: {
                          duration: 0.56,
                          ease: ['easeIn', 'linear'],
                          times: [0, 0.375, 1],
                        },
                      }}
                    >
                      {queryIndex === 0 && !hasAnimatedIn
                        ? QUERIES[0].split('').map((char, i) => (
                            <motion.span key={`q-${i}`} variants={letterVariants} style={{ display: 'inline-block' }}>
                              {char === ' ' ? '\u00A0' : char}
                            </motion.span>
                          ))
                        : QUERIES[queryIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-[8px]">
          <motion.button
            type="button"
            onClick={onMicClick}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-[#f0f2f7] text-[#5f6a94] transition-colors duration-150 hover:bg-[#e6e9f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 sm:h-[35px] sm:w-[35px]"
            aria-label="Voice input"
          >
            <Mic className="h-4 w-4 sm:h-[14px] sm:w-[14px]" strokeWidth={2} />
          </motion.button>
          <motion.button
            type="button"
            onClick={handleSend}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 sm:h-[35px] sm:w-[35px]"
            style={{ background: WEXLY_GRADIENT, boxShadow: WEXLY_GRADIENT_SHADOW }}
            aria-label="Send to WEXly"
          >
            <Send className="h-4 w-4 sm:h-[14px] sm:w-[14px]" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full z-[210] mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-[24px] border border-[#e3e7f4] bg-white py-2 shadow-[0_8px_32px_rgba(43,49,78,0.14)]"
          >
            <button
              type="button"
              className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-[#f8f9fe]"
              onClick={() => handleSuggestionClick(QUERIES[0])}
            >
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#7a87b2]" />
              <span className="text-[14px] leading-snug text-[#14182c]">{fullSuggestion(QUERIES[0])}</span>
            </button>
            <div className="mx-4 my-1 h-px bg-[#e3e7f4]" />
            {QUERIES.slice(1).map((query, i) => (
              <button
                key={i}
                type="button"
                className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-[#f8f9fe]"
                onClick={() => handleSuggestionClick(query)}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#3958c3]" />
                <span className="text-[14px] leading-snug text-[#5f6a94]">{fullSuggestion(query)}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
