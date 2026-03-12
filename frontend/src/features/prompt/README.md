# Prompt Input Feature Guide

This directory (`src/features/prompt`) serves as the main integration point and API for the application's Prompt Input functionality. It manages the user interface for text & voice input, file attachments, model selection, and the prompt's thematic styling.

## 🎯 Architecture Overview

The Prompt functionality is currently split between two locations for architectural reasons:
1. **`src/features/prompt/`** (Here): The main facade/public API for the prompt feature. It exports the primary `PromptInput` components, the `ModelSelector`, and manages theming.
2. **`src/components/prompt-input/`**: The core, lower-level UI implementation details of the prompt. (Some internal components may eventually migrate here as dependencies are finalized).

---

## 🚀 How to Expand & Add Features

Here is how you can seamlessly add new functionality to the prompt input:

### 1. Adding a New Button or Action to the Prompt
The Prompt Input uses a highly extensible **Plugin/Registry Pattern** for its action buttons. **You do NOT need to modify the core `prompt-input.tsx` component to add new buttons!**

To add a new button (like a "Chat format", "Smart AI toggle", or custom tool):
1. **Create your button component**: Add a new file in `src/components/prompt-input/actions/` (e.g., `my-custom-button.tsx`).
2. **Register the button**: Open `src/components/prompt-input/actions/register-default-actions.tsx`.
3. **Add it to the registry**:
   ```tsx
   import { MyCustomButton } from "../my-custom-button"

   // Inside the registerDefaultActions function:
   actionButtonRegistry.register({
     id: "my-custom-button",
     order: 4, // 0-9 for left side (models, attachments), 10+ for right side (voice, submit)
     component: (
       <MyCustomButton
         key="my-custom-button"
         isDarkTheme={context.isDarkTheme}
         themeClasses={context.themeClasses}
         hoverClass={context.hoverClass}
         onClick={() => { /* Your Interaction Logic */ }}
       />
     ),
   })
   ```
*For deep details on the action registry, read `src/components/prompt-input/EXTENSIBILITY.md`.*

### 2. Adding a New AI Model to the Selector
The `ModelSelector` dropdown (found in `src/features/prompt/components/ModelSelector.tsx`) reads its models dynamically. 
To add a new AI model (e.g., a new local model or cloud API provider):
1. Navigate to **`src/lib/ai/model-config.ts`**.
2. Add your new model's definition to the configuration list. The dropdown will automatically pick it up, group it by provider, and display the correct icon based on whatever capabilities you define (Image generation, Reasoner, Code, Audio, etc.).

### 3. Modifying Prompt Input Styling / Theme
The theme for the prompt input is managed directly in this folder inside **`theme.ts`**.
If you want to change colors, hover styles, or adjustments for the prompt globally without digging into complex React structures:
1. Open `src/features/prompt/theme.ts`.
2. Update the `getThemeClasses(isDarkTheme)` map. These utility classes are passed down to all internal prompt subcomponents to ensure a cohesive look that matches your main `GLOBAL_THEME`.

---

## 🛠️ Summary of Key Files

- **`index.ts`**: The public bridge. It exports `PromptInput`, `ModelSelector`, and theme configs for the rest of the application to import.
- **`theme.ts`**: The single source of truth for the prompt's unified styling (backgrounds, text sizes, border coloring).
- **`components/ModelSelector.tsx`**: The dropdown UI that lets users quickly swap between different AI models.
- **`components/ModelSelectorPopover.tsx`**: An alternative popover-based UI variant used in some parts of the layout.
- **`src/components/prompt-input/actions/*`** *(External)*: The registry where all dynamic UI buttons (Grounding, Voice, Models, Settings) are injected into the prompt.

**Bottom Line:** 
* To add a **new tool/button**, use the Action Registry in `components/prompt-input/actions`.
* To add a **new Model**, change `lib/ai/model-config.ts`.
* To make a **visual/color change**, tweak `src/features/prompt/theme.ts`.
