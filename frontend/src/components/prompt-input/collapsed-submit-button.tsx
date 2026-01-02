import { Button } from "@/shared/components/ui/button"
import { ArrowUp, Square, ChevronsUp } from "lucide-react"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"
import { cn } from "@/lib/utils"

interface CollapsedSubmitButtonProps {
  isLoading: boolean
  canSubmit: boolean
  onSubmit: () => void
  onStop?: () => void
  onExpand?: () => void
}

export function CollapsedSubmitButton({
  isLoading,
  canSubmit,
  onSubmit,
  onStop,
  onExpand,
}: CollapsedSubmitButtonProps) {
  const handleClick = () => {
    if (isLoading && onStop) {
      onStop()
    } else if (canSubmit) {
      onSubmit()
    } else if (onExpand) {
      onExpand()
    }
  }

  const isDisabled = !isLoading && !canSubmit && !onExpand

  const getAriaLabel = () => {
    if (isLoading) return "Stop generation"
    if (canSubmit) return "Send message"
    return "Expand input"
  }

  return (
    <Button
      variant="default"
      size="icon"
      className={cn(
        PROMPT_INPUT_CONSTANTS.SUBMIT_BUTTON.SIZE,
        PROMPT_INPUT_CONSTANTS.SUBMIT_BUTTON.CLASSES,
        "ml-2"
      )}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={getAriaLabel()}
    >
      {isLoading ? (
        <Square className="size-4 fill-current" />
      ) : canSubmit ? (
        <ArrowUp className="size-4" />
      ) : (
        <ChevronsUp className="size-4" />
      )}
    </Button>
  )
}

