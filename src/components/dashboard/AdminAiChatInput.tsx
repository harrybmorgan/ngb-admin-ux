import { useState, useEffect, useRef } from 'react'
import { Mic, Send, Clock, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from 'framer-motion'

const PLACEHOLDER_PREFIX = 'Ask me... '

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
  onSendClick: () => void
}

export function AdminAiChatInput({ value, onChange, onMicClick, onSendClick }: AdminAiChatInputProps) {
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
    onChange(fullSuggestion(query))
    setIsDropdownOpen(false)
    setIsFocused(true)
    inputRef.current?.focus()
  }

  const barClassName = `relative z-10 flex w-full items-center justify-between gap-2 rounded-full border border-[#e3e7f4] bg-white/80 py-[11px] pl-4 pr-2 shadow-sm backdrop-blur-[2px] transition-shadow duration-200 sm:pl-[25px] sm:pr-[17px] ${
    isDropdownOpen ? 'shadow-md' : ''
  } focus-within:ring-2 focus-within:ring-[#3958c3]/25 focus-within:ring-offset-2 motion-safe:focus-within:scale-[1.01]`

  if (prefersReducedMotion) {
    return (
      <div
        ref={containerRef}
        className="relative w-full"
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
              className="w-full border-0 bg-transparent text-[15px] text-[#14182c] outline-none placeholder:text-[#9aa3bd]"
              placeholder={showPlaceholder ? `${PLACEHOLDER_PREFIX}${QUERIES[queryIndex]}` : undefined}
              aria-label="Ask a question"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-[8px]">
            <button
              type="button"
              onClick={onMicClick}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#eef2ff] bg-[#eef2ff] transition-colors duration-150 hover:bg-[#e0e7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 sm:h-[35px] sm:w-[35px]"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4 text-[#3958c3] sm:h-[14px] sm:w-[14px]" />
            </button>
            <button
              type="button"
              onClick={onSendClick}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#25146f] transition-all duration-150 hover:bg-[rgba(37,20,111,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 sm:h-[35px] sm:w-[35px]"
              style={{
                backgroundImage:
                  'linear-gradient(133.514deg, rgba(37, 20, 111, 0.1) 2.4625%, rgba(200, 16, 46, 0.1) 100%)',
              }}
              aria-label="Send question"
            >
              <Send className="h-4 w-4 text-[#25146f] sm:h-[14px] sm:w-[14px]" />
            </button>
          </div>
        </div>

        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-[24px] border border-[#e3e7f4] bg-white py-2 shadow-[0_4px_20px_rgba(43,49,78,0.08)]">
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
      className="relative w-full"
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
            className="w-full border-0 bg-transparent text-[15px] text-[#14182c] outline-none placeholder-transparent"
            aria-label="Ask a question"
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
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#eef2ff] bg-[#eef2ff] transition-colors duration-150 hover:bg-[#e0e7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 sm:h-[35px] sm:w-[35px]"
            aria-label="Voice input"
          >
            <Mic className="h-4 w-4 text-[#3958c3] sm:h-[14px] sm:w-[14px]" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onSendClick}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#25146f] transition-all duration-150 hover:bg-[rgba(37,20,111,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3958c3]/30 sm:h-[35px] sm:w-[35px]"
            style={{
              backgroundImage:
                'linear-gradient(133.514deg, rgba(37, 20, 111, 0.1) 2.4625%, rgba(200, 16, 46, 0.1) 100%)',
            }}
            aria-label="Send question"
          >
            <Send className="h-4 w-4 text-[#25146f] sm:h-[14px] sm:w-[14px]" />
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
            className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-[24px] border border-[#e3e7f4] bg-white py-2 shadow-[0_4px_20px_rgba(43,49,78,0.08)]"
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
