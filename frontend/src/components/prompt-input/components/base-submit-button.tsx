import { Button } from "@/shared/components/ui/button"
import { ArrowUp, Square } from "lucide-react"
import { PROMPT_INPUT_CONSTANTS } from "../constants/prompt-input-constants"
import { cn } from "@/lib/utils"

interface BaseSubmitButtonProps {
  isLoading: boolean
  canSubmit: boolean
  onSubmit: () => void
  onStop?: () => void
  className?: string
  tooltip?: string
  wrapper?: (children: React.ReactNode) => React.ReactNode
}

/**
 * Base submit button component with shared logic and styling
 * Can be wrapped with different UI components (e.g., PromptInputAction)
 */
export function BaseSubmitButton({
  isLoading,
  canSubmit,
  onSubmit,
  onStop,
  className,
  tooltip,
  wrapper,
}: BaseSubmitButtonProps) {
  const handleClick = () => {
    if (isLoading && onStop) {
      onStop()
    } else {
      onSubmit()
    }
  }

  const isDisabled = !isLoading && !canSubmit
  const ariaLabel = isLoading ? "Stop generation" : "Send message"

  const button = (
    <Button
      variant="default"
      size="icon"
      className={cn(
        PROMPT_INPUT_CONSTANTS.SUBMIT_BUTTON.SIZE,
        PROMPT_INPUT_CONSTANTS.SUBMIT_BUTTON.CLASSES,
        className
      )}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={tooltip || ariaLabel}
    >
      {isLoading ? (
        <Square className="size-4 fill-current" />
      ) : (
        <ArrowUp className="size-4" />
      )}
    </Button>
  )

  return wrapper ? wrapper(button) : button
}

