# Adding New Action Buttons

To add a new action button to the expanded prompt input, follow these steps:

## Step 1: Create Your Button Component

Create a new component file (e.g., `my-custom-button.tsx`):

```tsx
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"

export function MyCustomButton({ isDarkTheme, themeClasses, hoverClass }) {
  return (
    <PromptInputAction tooltip="My Custom Action">
      <button
        onClick={() => {
          // Your action logic here
        }}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          hoverClass
        )}
      >
        <MyIcon className={`size-5 ${themeClasses.icon}`} />
      </button>
    </PromptInputAction>
  )
}
```

## Step 2: Register Your Button

In `register-default-actions.tsx`, add your button:

```tsx
import { MyCustomButton } from "../my-custom-button"

export function registerDefaultActions(context: ExpandedActionsBarContext) {
  // ... existing registrations ...

  // Add your button
  actionButtonRegistry.register({
    id: "my-custom-button",
    order: 4, // Order: 0-9 for left side, 10+ for right side
    condition: () => {
      // Optional: Only show if condition is met
      return someCondition
    },
    component: (
      <MyCustomButton
        key="my-custom-button"
        isDarkTheme={context.isDarkTheme}
        themeClasses={context.themeClasses}
        hoverClass={context.hoverClass}
      />
    ),
  })
}
```

## Step 3: That's It!

Your button will automatically appear in the actions bar. No need to modify `expanded-actions-bar.tsx`!

## Order Guidelines

- **Left side buttons**: Order 0-9
  - 0: Media upload
  - 1: Model selector
  - 2: Grounding (conditional)
  - 3: Local model (conditional)
  - 4-9: Available for custom buttons

- **Right side buttons**: Order 10+
  - 10: Voice input
  - 11: Submit button
  - 12+: Available for custom buttons

## Conditional Buttons

Use the `condition` function to show/hide buttons based on state:

```tsx
actionButtonRegistry.register({
  id: "conditional-button",
  order: 5,
  condition: () => {
    return context.someFeatureEnabled && context.someState
  },
  component: <MyButton />
})
```

