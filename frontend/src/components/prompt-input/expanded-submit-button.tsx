import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { BaseSubmitButton } from "./components/base-submit-button"

interface ExpandedSubmitButtonProps {
  isLoading: boolean
  canSubmit: boolean
  onSubmit: () => void
  onStop?: () => void
}

export function ExpandedSubmitButton({
  isLoading,
  canSubmit,
  onSubmit,
  onStop,
}: ExpandedSubmitButtonProps) {
  return (
    <BaseSubmitButton
      isLoading={isLoading}
      canSubmit={canSubmit}
      onSubmit={onSubmit}
      onStop={onStop}
      tooltip={isLoading ? "Stop generation" : "Send message"}
      wrapper={(children) => (
        <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
          {children}
        </PromptInputAction>
      )}
    />
  )
}

