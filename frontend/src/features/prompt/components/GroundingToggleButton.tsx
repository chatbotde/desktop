import { Search } from "lucide-react"
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { cn } from "@/shared/lib"
import { PromptTogglePill } from "./PromptTogglePill"

interface GroundingToggleButtonProps {
  groundingEnabled: boolean
  onToggle: () => void
  isDarkTheme: boolean
}

export function GroundingToggleButton({
  groundingEnabled,
  onToggle,
  isDarkTheme,
}: GroundingToggleButtonProps) {
  return (
    <PromptInputAction
      tooltip={groundingEnabled ? "Fact check enabled — hover to disable" : "Enable fact check (audio → verify with web sources)"}
    >
      <PromptTogglePill
        icon={
          <Search
            className={cn(
              "size-3.5",
              groundingEnabled
                ? isDarkTheme
                  ? "text-blue-400"
                  : "text-blue-600"
                : isDarkTheme
                  ? "text-white/70"
                  : "text-gray-500"
            )}
          />
        }
        label="Fact check"
        active={groundingEnabled}
        onActivate={onToggle}
        onDeactivate={onToggle}
        variant="blue"
        isDarkTheme={isDarkTheme}
        deactivateAriaLabel="Disable fact check"
      />
    </PromptInputAction>
  )
}
