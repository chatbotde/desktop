import { Search } from "lucide-react"
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { cn } from "@/lib/utils"

interface ExpandedGroundingButtonProps {
  groundingEnabled: boolean
  onToggle: () => void
  isDarkTheme: boolean
  themeClasses: {
    icon: string
  }
  hoverClass: string
}

export function ExpandedGroundingButton({
  groundingEnabled,
  onToggle,
  isDarkTheme,
}: ExpandedGroundingButtonProps) {
  return (
    <PromptInputAction tooltip={groundingEnabled ? "Click to disable fact check" : "Click to enable fact check"}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onToggle()
        }}
        className={cn(
          "flex items-center gap-1.5 h-7 rounded-full transition-all duration-200 ease-out cursor-pointer select-none",
          "border px-2.5",
          // Enabled state
          groundingEnabled
            ? isDarkTheme
              ? "bg-blue-500/25 border-blue-400/70 hover:bg-blue-500/35"
              : "bg-blue-100 border-blue-400 hover:bg-blue-200"
            : // Disabled state
            isDarkTheme
              ? "bg-transparent border-white/25 hover:border-white/40 hover:bg-white/10"
              : "bg-transparent border-gray-300 hover:border-gray-400 hover:bg-gray-100",
          // Active press effect
          "active:scale-95"
        )}
        aria-label={groundingEnabled ? "Disable fact check" : "Enable fact check"}
        aria-pressed={groundingEnabled}
        type="button"
      >
        {/* Search Icon */}
        <Search
          className={cn(
            "size-3.5 transition-colors duration-200",
            groundingEnabled
              ? isDarkTheme ? "text-blue-400" : "text-blue-600"
              : isDarkTheme ? "text-white/70" : "text-gray-500"
          )}
        />

        {/* Search Text Label */}
        <span
          className={cn(
            "text-xs font-medium transition-colors duration-200",
            groundingEnabled
              ? isDarkTheme ? "text-blue-400" : "text-blue-600"
              : isDarkTheme ? "text-white/70" : "text-gray-500"
          )}
        >
          Search
        </span>
      </button>
    </PromptInputAction>
  )
}
