import { Button } from "@/shared/components/ui/button"
import { ArrowUp, Square, ChevronsUp, ChevronUp, ChevronDown, X } from "lucide-react"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback } from "react"

interface CollapsedSubmitButtonProps {
  isLoading: boolean
  canSubmit: boolean
  onSubmit: () => void
  onStop?: () => void
  onExpand?: () => void
  onHide?: () => void
  onToggleOutput?: () => void
  isOutputVisible?: boolean
  isDarkTheme?: boolean
  themeClasses?: {
    containerBg: string
    containerBorder: string
    buttonBg: string
    buttonHover: string
    buttonBorder: string
    icon: string
  }
}

/**
 * Submit button that reveals action panel on hover (like MicHoverAudioPill).
 * Hovering on the button reveals output toggle, close, and expand options.
 */
export function CollapsedSubmitButton({
  isLoading,
  canSubmit,
  onSubmit,
  onStop,
  onExpand,
  onHide,
  onToggleOutput,
  isOutputVisible,
  isDarkTheme = true,
  themeClasses,
}: CollapsedSubmitButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPanelActive, setIsPanelActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle mouse enter with a small delay to prevent accidental triggers
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true)
      setIsPanelActive(true)
    }, 150)
  }, [])

  // Handle mouse leave - hide after delay
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(false)
    hoverTimeoutRef.current = setTimeout(() => {
      setIsPanelActive(false)
    }, 300)
  }, [])

  // Handle panel mouse enter - keep it visible
  const handlePanelMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(true)
  }, [])

  // Handle panel mouse leave
  const handlePanelMouseLeave = useCallback(() => {
    setIsHovered(false)
    hoverTimeoutRef.current = setTimeout(() => {
      setIsPanelActive(false)
    }, 300)
  }, [])

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

  // Only show hover panel when input is empty (expand button state)
  const shouldShowPanel = (isPanelActive || isHovered) && !canSubmit && !isLoading

  // Default theme values if not provided
  const defaultTheme = {
    containerBg: isDarkTheme ? 'oklch(0.14 0.00 0)' : '#ffffff',
    containerBorder: isDarkTheme ? 'border-zinc-700' : 'border-zinc-200',
    buttonBg: isDarkTheme ? 'oklch(0.14 0.00 0)' : '#ffffff',
    buttonHover: isDarkTheme ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50',
    buttonBorder: isDarkTheme ? 'border-zinc-700' : 'border-zinc-200',
    icon: isDarkTheme ? 'text-zinc-300' : 'text-zinc-600',
  }

  const theme = themeClasses || defaultTheme

  const actionButtonClass = cn(
    "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 shrink-0 border",
    theme.buttonBorder,
    theme.buttonHover
  )

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Submit Button */}
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

      {/* Action Panel - appears on hover, positioned above the button */}
      {shouldShowPanel && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handlePanelMouseLeave}
          data-no-clickthrough
        >
          <div
            className={cn(
              "flex items-center gap-1.5 px-1.5 py-1.5 rounded-full border shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
              theme.containerBorder
            )}
            style={{ backgroundColor: theme.containerBg }}
          >
            {/* Output Toggle Button */}
            {onToggleOutput && (
              <button
                onClick={onToggleOutput}
                aria-label={isOutputVisible ? "Hide output" : "Show output"}
                className={actionButtonClass}
                style={{ backgroundColor: theme.buttonBg }}
                data-no-clickthrough
              >
                {isOutputVisible ? (
                  <ChevronDown className={`size-4 ${theme.icon}`} />
                ) : (
                  <ChevronUp className={`size-4 ${theme.icon}`} />
                )}
              </button>
            )}

            {/* Close/Hide Button */}
            {onHide && (
              <button
                onClick={onHide}
                aria-label="Hide input"
                className={actionButtonClass}
                style={{ backgroundColor: theme.buttonBg }}
                data-no-clickthrough
              >
                <X className={`size-4 ${theme.icon}`} />
              </button>
            )}

            {/* Expand Button */}
            {onExpand && (
              <button
                onClick={onExpand}
                aria-label="Expand input"
                className={cn(
                  actionButtonClass,
                  "bg-primary/90 hover:bg-primary text-primary-foreground border-primary/50"
                )}
                data-no-clickthrough
              >
                <ChevronsUp className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

