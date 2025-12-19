# Feature Registry System

A **zero-configuration** feature registry that automatically discovers and displays features in the UI. Simply create a feature definition file, and it will automatically appear in the Features section.

## 🎯 Overview

The feature registry uses Vite's `import.meta.glob` to automatically discover all feature definitions at build time. This means:

- ✅ **No manual registration** - Just create a file and it's included
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Auto-sorted** - Features are alphabetically sorted by label
- ✅ **Side-effect support** - Optional effects system for Electron APIs, listeners, etc.

## 📁 File Structure

```
src/features/feature-flags/
├── README.md                          # This file
├── index.ts                           # Public API exports
├── types.ts                           # TypeScript types and interfaces
├── registry.ts                        # Auto-discovery and registry logic
├── FeatureEffects.tsx                 # Global effects component
├── definitions/                       # Feature definitions (auto-discovered)
│   ├── text-selection.feature.ts
│   ├── clipboard.feature.ts
│   ├── auto-screenshot.feature.ts
│   └── exclude-from-screenshot.feature.ts
└── effects/                          # Feature side-effects (optional)
    └── exclude-from-screenshot.effect.tsx
```

## 🚀 Quick Start: Adding a New Feature

### Simple Feature (Just a Toggle Pill)

1. **Create a feature definition file:**

   ```typescript
   // src/features/feature-flags/definitions/voice-input.feature.ts
   import { Mic } from "lucide-react"
   import type { FeatureDefinition } from "../types"

   export const feature: FeatureDefinition = {
     id: "voice-input",
     label: "Voice Input",
     icon: Mic,
     defaultEnabled: false,
   }
   ```

2. **That's it!** The feature will automatically:
   - Appear in the Features section UI
   - Be toggleable via the pill button
   - Persist state in localStorage
   - Be available via `useFeature()` hook

### Feature with Side-Effects (Electron APIs, Listeners, etc.)

If your feature needs to interact with Electron APIs or set up listeners:

1. **Create the feature definition** (same as above)

2. **Create an effect file:**

   ```typescript
   // src/features/feature-flags/effects/voice-input.effect.tsx
   import { useEffect } from "react"
   import { useFeature } from "@/contexts/FeatureContext"

   export const featureId = "voice-input"

   export function FeatureEffect() {
     const { isFeatureEnabled } = useFeature()
     const enabled = isFeatureEnabled(featureId)

     useEffect(() => {
       if (enabled) {
         // Set up listeners, call Electron APIs, etc.
         window.someAPI?.enableVoiceInput()
       } else {
         // Clean up
         window.someAPI?.disableVoiceInput()
       }
     }, [enabled])

     return null // Effects don't render anything
   }
   ```

3. **The effect is automatically mounted** globally via `<FeatureEffects />` in `main.tsx`

## 📚 Feature Definition API

### `FeatureDefinition` Interface

```typescript
interface FeatureDefinition {
  id: FeatureId                    // Unique identifier (string)
  label: string                    // Display name in UI
  description?: string             // Optional description
  icon: React.ComponentType        // Lucide React icon component
  defaultEnabled?: boolean         // Default state (defaults to false)
  showInFeaturesList?: boolean     // Show in UI (defaults to true)
}
```

### Field Details

- **`id`**: Must be unique. Used as the key in localStorage and for toggling.
- **`label`**: Displayed text on the feature pill button.
- **`description`**: Optional tooltip/help text (currently not displayed, reserved for future use).
- **`icon`**: Any Lucide React icon component (e.g., `Mic`, `Camera`, `Type`).
- **`defaultEnabled`**: If `true`, feature is enabled on first run (when no localStorage exists). Defaults to `false`.
- **`showInFeaturesList`**: If `false`, feature won't appear in the UI but can still be toggled programmatically. Defaults to `true`.

## 🔧 Using Features in Your Code

### Check if a Feature is Enabled

```typescript
import { useFeature } from "@/contexts/FeatureContext"

function MyComponent() {
  const { isFeatureEnabled } = useFeature()
  
  if (isFeatureEnabled("voice-input")) {
    // Feature is enabled
  }
}
```

### Toggle a Feature Programmatically

```typescript
import { useFeature } from "@/contexts/FeatureContext"

function MyComponent() {
  const { toggleFeature, setFeatureEnabled } = useFeature()
  
  // Toggle on/off
  toggleFeature("voice-input")
  
  // Set specific state
  setFeatureEnabled("voice-input", true)
}
```

## 📖 Examples

### Example 1: Simple Toggle Feature

```typescript
// src/features/feature-flags/definitions/dark-mode.feature.ts
import { Moon } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "dark-mode",
  label: "Dark Mode",
  icon: Moon,
  defaultEnabled: true,
}
```

### Example 2: Feature with Electron Side-Effect

**Definition:**
```typescript
// src/features/feature-flags/definitions/always-on-top.feature.ts
import { Pin } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "always-on-top",
  label: "Always on Top",
  icon: Pin,
  defaultEnabled: false,
}
```

**Effect:**
```typescript
// src/features/feature-flags/effects/always-on-top.effect.tsx
import { useEffect } from "react"
import { useFeature } from "@/contexts/FeatureContext"

export const featureId = "always-on-top"

export function FeatureEffect() {
  const { isFeatureEnabled } = useFeature()
  const enabled = isFeatureEnabled(featureId)

  useEffect(() => {
    if (typeof window !== "undefined" && window.interfaceAPI?.setAlwaysOnTop) {
      window.interfaceAPI.setAlwaysOnTop(enabled)
    }
  }, [enabled])

  return null
}
```

### Example 3: Hidden Feature (Not in UI)

```typescript
// src/features/feature-flags/definitions/internal-debug.feature.ts
import { Bug } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "internal-debug",
  label: "Debug Mode",
  icon: Bug,
  defaultEnabled: false,
  showInFeaturesList: false, // Hidden from UI, but can be toggled programmatically
}
```

## 🎨 Where Features Appear

Features automatically appear in:

- **Settings → Features Section**: Toggle pills (`src/features/settings/sections/FeaturesSection.tsx`)
- **Feature Context**: Available globally via `useFeature()` hook

The UI component (`src/features/feature-flags/` exports) automatically:
- Renders all features with `showInFeaturesList !== false`
- Sorts them alphabetically by label
- Shows active state (blue) vs inactive (gray)
- Handles click toggling

## 🔍 Registry Functions

### `getAllFeatures()`
Returns all feature definitions, sorted alphabetically.

### `getFeaturesForList()`
Returns features that should appear in the UI (`showInFeaturesList !== false`).

### `getDefaultEnabledFeatureIds()`
Returns IDs of features that should be enabled by default (for first-run initialization).

### `getAllFeatureModules()`
Returns raw feature modules (includes metadata).

## ⚠️ Important Notes

1. **File Naming**: Feature definition files must be named `*.feature.ts` and placed in `feature-flags/definitions/`
2. **Effect Naming**: Effect files must be named `*.effect.tsx` and placed in `feature-flags/effects/`
3. **Export Names**: Must export `feature` (definition) and `featureId` + `FeatureEffect` (effect)
4. **Icon Import**: Use icons from `lucide-react` package
5. **No Circular Imports**: Effects can use `useFeature()`, but definitions should not import FeatureContext

## 🐛 Troubleshooting

### Feature Not Appearing in UI

- ✅ Check file is named `*.feature.ts` (not `.tsx`)
- ✅ Check file is in `src/features/feature-flags/definitions/`
- ✅ Check `showInFeaturesList` is not `false`
- ✅ Restart dev server (Vite needs to re-scan glob patterns)

### Effect Not Running

- ✅ Check file is named `*.effect.tsx`
- ✅ Check file is in `src/features/feature-flags/effects/`
- ✅ Check exports `featureId` (string) and `FeatureEffect` (component)
- ✅ Verify `<FeatureEffects />` is mounted in `main.tsx`

### TypeScript Errors

- ✅ Ensure `feature` export matches `FeatureDefinition` interface
- ✅ Use `type FeatureDefinition` import (not value import)
- ✅ Icon must be a valid React component from `lucide-react`

## 📝 Current Features

- ✅ **Text Selection** (`text-selection`) - Default enabled
- ✅ **Clipboard** (`clipboard`) - Default enabled  
- ✅ **Auto Screenshot** (`auto-screenshot`) - Default disabled
- ✅ **Hide in Screen Capture** (`exclude-from-screenshot`) - Default disabled, has Electron effect

---

**Need help?** Check the existing feature definitions in `feature-flags/definitions/` for reference examples.
