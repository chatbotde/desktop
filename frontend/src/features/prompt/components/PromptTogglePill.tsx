import { useState } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/shared/lib"

export type PromptTogglePillVariant = "default" | "green" | "blue"

export interface PromptTogglePillProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onActivate: () => void
  onDeactivate: () => void
  isDarkTheme?: boolean
  variant?: PromptTogglePillVariant
  className?: string
  maxLabelWidth?: number
  deactivateAriaLabel?: string
}

const variantStyles: Record<
  PromptTogglePillVariant,
  { active: { dark: string; light: string }; idle: { dark: string; light: string } }
> = {
  default: {
    active: {
      dark: "bg-white/10 border-white/30",
      light: "bg-gray-100 border-gray-400",
    },
    idle: {
      dark: "border-transparent hover:bg-white/10 hover:border-white/20",
      light: "border-transparent hover:bg-gray-100 hover:border-gray-300",
    },
  },
  green: {
    active: {
      dark: "bg-green-900/30 border-green-600",
      light: "bg-green-50 border-green-400",
    },
    idle: {
      dark: "border-transparent hover:bg-green-900/20 hover:border-green-700/50",
      light: "border-transparent hover:bg-green-50 hover:border-green-300",
    },
  },
  blue: {
    active: {
      dark: "bg-blue-500/25 border-blue-400/70",
      light: "bg-blue-100 border-blue-400",
    },
    idle: {
      dark: "border-transparent hover:bg-white/10 hover:border-white/25",
      light: "border-transparent hover:bg-gray-100 hover:border-gray-300",
    },
  },
}

const labelColors: Record<
  PromptTogglePillVariant,
  { active: { dark: string; light: string }; idle: { dark: string; light: string } }
> = {
  default: {
    active: { dark: "text-white/90", light: "text-gray-800" },
    idle: { dark: "text-white/70", light: "text-gray-600" },
  },
  green: {
    active: { dark: "text-green-400", light: "text-green-700" },
    idle: { dark: "text-white/70", light: "text-gray-600" },
  },
  blue: {
    active: { dark: "text-blue-400", light: "text-blue-600" },
    idle: { dark: "text-white/70", light: "text-gray-500" },
  },
}

export function PromptTogglePill({
  icon,
  label,
  active,
  onActivate,
  onDeactivate,
  isDarkTheme = true,
  variant = "default",
  className,
  maxLabelWidth = 180,
  deactivateAriaLabel,
}: PromptTogglePillProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isExpanded = active && isHovered
  const styles = variantStyles[variant]
  const colors = labelColors[variant]
  const surface = active ? styles.active : styles.idle
  const textColor = active ? colors.active : colors.idle

  if (!active) {
    return (
      <motion.button
        type="button"
        layout
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onActivate()
        }}
        whileTap={{ scale: 0.95 }}
        aria-label={label}
        title={label}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
          isDarkTheme ? surface.dark : surface.light,
          isDarkTheme ? textColor.dark : textColor.light,
          className
        )}
      >
        {icon}
      </motion.button>
    )
  }

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={label}
      className={cn(
        "flex h-7 shrink-0 items-center overflow-hidden rounded-full border transition-colors duration-200",
        isDarkTheme ? surface.dark : surface.light,
        className
      )}
      initial={false}
      animate={{
        width: isExpanded ? "auto" : 28,
      }}
      transition={{ type: "spring", stiffness: 480, damping: 34 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {!isExpanded ? (
          <motion.div
            key="icon"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="flex h-7 w-7 shrink-0 items-center justify-center"
          >
            {icon}
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="flex items-center gap-1 px-2 py-0.5 min-w-0"
          >
            <span
              className={cn(
                "truncate text-xs font-medium whitespace-nowrap",
                isDarkTheme ? textColor.dark : textColor.light
              )}
              style={{ maxWidth: maxLabelWidth }}
            >
              {label}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDeactivate()
              }}
              aria-label={deactivateAriaLabel ?? `Disable ${label}`}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full p-0.5 transition-colors",
                isDarkTheme
                  ? "text-white/50 hover:bg-white/10 hover:text-white/90"
                  : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              )}
            >
              <X className="size-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
