import { useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/shared/lib"

interface ExpandableSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isDarkTheme?: boolean
  className?: string
}

export function ExpandableSearchInput({
  value,
  onChange,
  placeholder = "Search models…",
  isDarkTheme = true,
  className,
}: ExpandableSearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isActive = isExpanded || value.length > 0

  const expand = () => {
    setIsExpanded(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const collapse = () => {
    if (value.length > 0) return
    setIsExpanded(false)
  }

  const clear = () => {
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center overflow-hidden rounded-lg border transition-colors",
        isDarkTheme
          ? "border-zinc-700/80 bg-zinc-800/50 hover:border-zinc-600"
          : "border-zinc-200 bg-zinc-50 hover:border-zinc-300",
        className
      )}
      animate={{ width: isActive ? "100%" : 32 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      onMouseEnter={expand}
      onMouseLeave={collapse}
    >
      <button
        type="button"
        onClick={expand}
        aria-label={placeholder}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center transition-colors",
          isDarkTheme ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <Search className="size-3.5" />
      </button>

      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            key="search-field"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex min-w-0 flex-1 items-center pr-1.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              onBlur={collapse}
              placeholder={placeholder}
              className={cn(
                "min-w-0 flex-1 bg-transparent py-1.5 pr-1 text-xs focus:outline-none",
                isDarkTheme
                  ? "text-zinc-200 placeholder:text-zinc-500"
                  : "text-zinc-900 placeholder:text-zinc-400"
              )}
            />
            <AnimatePresence initial={false}>
              {value.length > 0 && (
                <motion.button
                  key="clear"
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.12 }}
                  onClick={clear}
                  aria-label="Clear search"
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full p-0.5 transition-colors",
                    isDarkTheme
                      ? "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200"
                      : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                  )}
                >
                  <X className="size-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
