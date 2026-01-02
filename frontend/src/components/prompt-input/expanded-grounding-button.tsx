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
  themeClasses,
  hoverClass,
}: ExpandedGroundingButtonProps) {
  return (
    <PromptInputAction tooltip={groundingEnabled ? "Click to disable search grounding" : "Click to enable search grounding"}>
      <button
        onClick={onToggle}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          hoverClass,
          groundingEnabled && (isDarkTheme ? "bg-blue-600/30 border border-blue-500/50" : "bg-blue-100 border border-blue-300")
        )}
        aria-label={groundingEnabled ? "Disable search grounding" : "Enable search grounding"}
        type="button"
      >
        <Search className={cn(
          "size-5",
          groundingEnabled 
            ? (isDarkTheme ? "text-blue-400" : "text-blue-600")
            : themeClasses.icon
        )} />
      </button>
    </PromptInputAction>
  )
}

