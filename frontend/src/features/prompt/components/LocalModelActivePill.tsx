import { Cpu } from "lucide-react"
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { unifiedLocalLLMService } from "@/lib/ai/local-llm"
import { PromptTogglePill } from "./PromptTogglePill"

interface LocalModelActivePillProps {
  modelName: string
  onClear: () => void
  isDarkTheme: boolean
  themeClasses: {
    icon: string
  }
}

export function LocalModelActivePill({
  modelName,
  onClear,
  isDarkTheme,
  themeClasses,
}: LocalModelActivePillProps) {
  const handleDeactivate = () => {
    unifiedLocalLLMService.clearModel()
    onClear()
  }

  return (
    <PromptInputAction tooltip={`Local model: ${modelName} — hover to remove`}>
      <PromptTogglePill
        icon={<Cpu className={`size-3.5 ${themeClasses.icon}`} aria-hidden="true" />}
        label={modelName}
        active
        onActivate={() => {}}
        onDeactivate={handleDeactivate}
        variant="green"
        isDarkTheme={isDarkTheme}
        maxLabelWidth={200}
        deactivateAriaLabel="Clear local model selection"
      />
    </PromptInputAction>
  )
}
