import { PromptInputActions } from "@/components/prompt-kit/prompt-input"
import { useEffect, useRef } from "react"
import { actionButtonRegistry } from "./registry/action-button-registry"
import { registerDefaultActions } from "./actions/register-default-actions"
import type { ExpandedActionsBarContext } from "./types/expanded-actions-context"

interface ExpandedActionsBarProps extends ExpandedActionsBarContext {}

export function ExpandedActionsBar(props: ExpandedActionsBarProps) {
  const contextRef = useRef(props)
  contextRef.current = props

  // Register default actions on mount
  useEffect(() => {
    // Clear any existing registrations
    const existingButtons = actionButtonRegistry.getAll()
    existingButtons.forEach((btn) => actionButtonRegistry.unregister(btn.id))

    // Register default actions with current context
    registerDefaultActions(contextRef.current)

    // Cleanup on unmount
    return () => {
      const buttons = actionButtonRegistry.getAll()
      buttons.forEach((btn) => actionButtonRegistry.unregister(btn.id))
    }
  }, []) // Only register once on mount

  // Re-register when key props change (for conditional buttons)
  useEffect(() => {
    const existingButtons = actionButtonRegistry.getAll()
    existingButtons.forEach((btn) => actionButtonRegistry.unregister(btn.id))
    registerDefaultActions(contextRef.current)
  }, [
    // Re-register when these key props change (affects conditional buttons)
    props.isGoogleModelSelected,
    props.showLocalControlInPrompt,
    props.groundingEnabled,
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

  return (
    <PromptInputActions className="flex items-center justify-between gap-2 pt-0">
      <div className="flex items-center gap-2">
        {leftSideButtons.map((config) => (
          <div key={config.id}>{renderComponent(config)}</div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {rightSideButtons.map((config) => (
          <div key={config.id}>{renderComponent(config)}</div>
        ))}
      </div>
    </PromptInputActions>
  )
}

