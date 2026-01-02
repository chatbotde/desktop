import { WindowActionControls } from "../window-action-controls"

interface PromptInputFooterProps {
  onHide: () => void
  onToggleOutput?: () => void
  isOutputVisible?: boolean
  themeClasses: {
    buttonBorder: string
    buttonHover: string
    buttonBg: string
    icon: string
  }
}

/**
 * Shared footer component for prompt input (collapsed and expanded)
 * Contains WindowActionControls
 */
export function PromptInputFooter({
  onHide,
  onToggleOutput,
  isOutputVisible,
  themeClasses,
}: PromptInputFooterProps) {
  return (
    <WindowActionControls
      onHide={onHide}
      onToggleOutput={onToggleOutput}
      isOutputVisible={isOutputVisible}
      themeClasses={themeClasses}
    />
  )
}

