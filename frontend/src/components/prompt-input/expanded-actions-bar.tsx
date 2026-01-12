import { PromptInputActions } from "@/components/prompt-kit/prompt-input"
import { useEffect, useRef } from "react"
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

  // Update ref when props change (especially canSubmit, isLoading)
  // The function components will read from this ref to get latest values
  useEffect(() => {
    contextRef.current = props
  }, [props])

  // Also update immediately on each render to ensure latest values
  contextRef.current = props

  // Register default actions on mount with a function that reads from ref
  // This allows buttons to always read the latest context values
  useEffect(() => {
    // Clear any existing registrations
    const existingButtons = actionButtonRegistry.getAll()
    existingButtons.forEach((btn) => actionButtonRegistry.unregister(btn.id))

    // Register default actions with a function that reads from contextRef
    // This makes the buttons reactive to context changes
    registerDefaultActions(() => contextRef.current)

    // Cleanup on unmount
    return () => {
      const buttons = actionButtonRegistry.getAll()
      buttons.forEach((btn) => actionButtonRegistry.unregister(btn.id))
    }
  }, []) // Only register once on mount

  // Re-register when key props change (for conditional buttons)
  // Note: Submit and Grounding buttons use function components, so they read latest values automatically
  useEffect(() => {
    const existingButtons = actionButtonRegistry.getAll()
    existingButtons.forEach((btn) => actionButtonRegistry.unregister(btn.id))
    registerDefaultActions(() => contextRef.current)
  }, [
    // Re-register when these key props change (affects conditional buttons visibility)
    props.isGoogleModelSelected,
    props.showLocalControlInPrompt,
    // Note: groundingEnabled is NOT here because it reads reactively from context function
  ])

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

