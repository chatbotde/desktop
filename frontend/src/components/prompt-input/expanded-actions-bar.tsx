import { PromptInputActions } from "@/components/prompt-kit/prompt-input"
import { useRef, useSyncExternalStore, useCallback } from "react"
import { cn } from "@/lib/utils"
import { actionButtonRegistry } from "./registry/action-button-registry"
import { registerDefaultActions } from "./actions/register-default-actions"
import type { ExpandedActionsBarContext } from "./types/expanded-actions-context"

interface ExpandedActionsBarProps extends ExpandedActionsBarContext {
  className?: string
}

export function ExpandedActionsBar(props: ExpandedActionsBarProps) {
  const { className } = props
  const contextRef = useRef(props)

  // Update ref immediately on each render to ensure latest values
  contextRef.current = props

  // Register default actions - using syncExternalStore for lifecycle
  useSyncExternalStore(
    useCallback((_callback) => {
      // Clear any existing registrations
      const existingButtons = actionButtonRegistry.getAll()
      existingButtons.forEach((btn) => actionButtonRegistry.unregister(btn.id))

      // Register default actions with a function that reads from contextRef
      registerDefaultActions(() => contextRef.current)

      // Cleanup on unmount
      return () => {
        const buttons = actionButtonRegistry.getAll()
        buttons.forEach((btn) => actionButtonRegistry.unregister(btn.id))
      }
    }, [
      // Re-register when these key props change (affects conditional buttons visibility)
      props.isGoogleModelSelected,
      props.showLocalControlInPrompt,
      props.onReferenceAdd,
    ]),
    () => null,
    () => null
  )

  // Get all registered buttons and render them
  const leftSideButtons = actionButtonRegistry
    .getAll()
    .filter((btn) => (btn.order ?? 0) < 10)
  const rightSideButtons = actionButtonRegistry
    .getAll()
    .filter((btn) => (btn.order ?? 0) >= 10)

  const renderComponent = (config: typeof leftSideButtons[0]) => {
    if (typeof config.component === "function") {
      return config.component()
    }
    return config.component
  }

  // Create dynamic key for submit button to force re-render when canSubmit changes
  const getButtonKey = (config: typeof leftSideButtons[0]) => {
    if (config.id === "submit") {
      return `${config.id}-${props.canSubmit}-${props.isLoading}`
    }
    return config.id
  }

  return (
    <PromptInputActions className={cn("flex items-center justify-between gap-2 pt-0", className)}>
      <div className="flex items-center gap-2">
        {leftSideButtons.map((config) => (
          <div key={getButtonKey(config)}>{renderComponent(config)}</div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {rightSideButtons.map((config) => (
          <div key={getButtonKey(config)}>{renderComponent(config)}</div>
        ))}
      </div>
    </PromptInputActions>
  )
}

