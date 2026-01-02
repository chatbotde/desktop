/**
 * EXAMPLE: How to create and register a custom action button
 * 
 * This file demonstrates how to add a new button to the prompt input.
 * Copy this pattern to create your own custom buttons.
 */

import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { cn } from "@/lib/utils"
import { registerActionButton } from "./register-action-button"
import type { ExpandedActionsBarContext } from "../types/expanded-actions-context"
import { Settings } from "lucide-react"

// Step 1: Create your button component
interface ExampleCustomButtonProps {
  isDarkTheme: boolean
  themeClasses: {
    icon: string
  }
  hoverClass: string
  onClick?: () => void
}

function ExampleCustomButton({
  isDarkTheme,
  themeClasses,
  hoverClass,
  onClick,
}: ExampleCustomButtonProps) {
  return (
    <PromptInputAction tooltip="Example Custom Action">
      <button
        onClick={onClick}
        aria-label="Example custom action"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          hoverClass
        )}
      >
        <Settings className={`size-5 ${themeClasses.icon}`} />
      </button>
    </PromptInputAction>
  )
}

// Step 2: Register your button (call this function when you want to add the button)
export function registerExampleCustomButton(context: ExpandedActionsBarContext) {
  registerActionButton({
    id: "example-custom-button",
    order: 4, // Position: 0-9 for left side, 10+ for right side
    condition: () => {
      // Optional: Only show button if condition is met
      // return context.someFeatureEnabled
      return true // Always show for this example
    },
    component: (
      <ExampleCustomButton
        key="example-custom-button"
        isDarkTheme={context.isDarkTheme}
        themeClasses={context.themeClasses}
        hoverClass={context.hoverClass}
        onClick={() => {
          console.log("Example custom button clicked!")
          // Your custom logic here
        }}
      />
    ),
  })
}

// To use this button, import and call registerExampleCustomButton(context)
// in register-default-actions.tsx or wherever you initialize actions

