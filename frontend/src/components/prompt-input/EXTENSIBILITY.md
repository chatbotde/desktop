# Prompt Input Extensibility Guide

This document explains how to easily add new features and buttons to the prompt input system.

## 🎯 Architecture Overview

The prompt input system now uses a **plugin/registry pattern** that makes adding new features extremely easy. You can add new buttons, features, or functionality without modifying core files.

## 📁 File Structure

```
prompt-input/
├── types/
│   ├── action-button.ts          # Type definitions
│   └── expanded-actions-context.ts  # Context interface
├── registry/
│   └── action-button-registry.ts    # Central registry
├── actions/
│   ├── register-default-actions.tsx # Default button registrations
│   ├── register-action-button.ts   # Helper functions
│   ├── example-custom-button.tsx    # Example implementation
│   └── README.md                    # Detailed guide
└── expanded-actions-bar.tsx         # Main component (auto-renders registered buttons)
```

## 🚀 Quick Start: Adding a New Button

### Step 1: Create Your Button Component

Create a new file: `my-custom-button.tsx`

```tsx
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { cn } from "@/lib/utils"
import { MyIcon } from "lucide-react"

interface MyCustomButtonProps {
  isDarkTheme: boolean
  themeClasses: { icon: string }
  hoverClass: string
  onClick?: () => void
}

export function MyCustomButton({
  isDarkTheme,
  themeClasses,
  hoverClass,
  onClick,
}: MyCustomButtonProps) {
  return (
    <PromptInputAction tooltip="My Custom Action">
      <button
        onClick={onClick}
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

### Step 2: Register Your Button

In `actions/register-default-actions.tsx`, add:

```tsx
import { MyCustomButton } from "../my-custom-button"

export function registerDefaultActions(context: ExpandedActionsBarContext) {
  // ... existing registrations ...

  // Add your button
  actionButtonRegistry.register({
    id: "my-custom-button",
    order: 4, // 0-9 = left side, 10+ = right side
    condition: () => {
      // Optional: Only show if condition is met
      return context.someFeatureEnabled
    },
    component: (
      <MyCustomButton
        key="my-custom-button"
        isDarkTheme={context.isDarkTheme}
        themeClasses={context.themeClasses}
        hoverClass={context.hoverClass}
        onClick={() => {
          // Your custom logic
        }}
      />
    ),
  })
}
```

### Step 3: Done! 🎉

Your button will automatically appear in the actions bar. No need to modify `expanded-actions-bar.tsx`!

## 📋 Button Order Guidelines

### Left Side (Order 0-9)
- `0`: Media upload
- `1`: Model selector
- `2`: Grounding button (conditional)
- `3`: Local model button (conditional)
- `4-9`: Available for custom buttons

### Right Side (Order 10+)
- `10`: Voice input
- `11`: Submit button
- `12+`: Available for custom buttons

## 🔧 Advanced Features

### Conditional Buttons

Buttons can be conditionally shown using the `condition` function:

```tsx
actionButtonRegistry.register({
  id: "conditional-button",
  order: 5,
  condition: () => {
    return context.isGoogleModelSelected && context.someOtherCondition
  },
  component: <MyButton />
})
```

### Dynamic Components

You can use a function to create components dynamically:

```tsx
actionButtonRegistry.register({
  id: "dynamic-button",
  order: 6,
  component: () => {
    // Create component with current context
    return <MyDynamicButton context={contextRef.current} />
  },
})
```

### Helper Functions

Use the helper functions for cleaner code:

```tsx
import { registerActionButton } from "./actions/register-action-button"

registerActionButton({
  id: "my-button",
  order: 4,
  component: <MyButton />
})
```

## 🎨 Example: Adding a Local Model Button

The local model button is already implemented using this pattern. See:
- `expanded-local-model-popover.tsx` - The button component
- `actions/register-default-actions.tsx` - How it's registered

## 📝 Best Practices

1. **Keep components small**: Each button should be in its own file
2. **Use consistent naming**: `*-button.tsx` or `*-popover.tsx`
3. **Follow the order guidelines**: Don't use conflicting order numbers
4. **Document your buttons**: Add comments explaining what they do
5. **Test conditionally**: Make sure conditional buttons work correctly

## 🔍 How It Works

1. `ExpandedActionsBar` component mounts
2. `registerDefaultActions()` is called, registering all buttons
3. Buttons are stored in `actionButtonRegistry`
4. `ExpandedActionsBar` automatically renders all registered buttons
5. Buttons are filtered by condition and sorted by order
6. Left side (order < 10) and right side (order >= 10) are rendered separately

## 🛠️ Future Extensibility

This pattern can be extended for:
- Media upload card options
- File item types
- Validation rules
- Submit handlers
- And more!

Just follow the same registry pattern!

