# Model Profile List Settings

## Overview

The **Model Profile List** settings page allows you to control which AI models appear in the model selector popover. This gives you a cleaner, more focused experience by hiding models you don't use.

## Features

### ✨ Toggle Visibility
- **Switch Button**: Each model has a toggle switch to show/hide it
- **Real-time Updates**: Changes are saved immediately to localStorage
- **Visual Feedback**: Models show "Visible" or "Hidden" status

### 📊 Statistics
- **Total Models**: Shows the total number of available models
- **Visible Count**: Number of models currently visible in the popover
- **Hidden Count**: Number of models currently hidden

### 🎯 Quick Actions

#### Show All
Enables all models at once - useful when you want to start fresh

#### Hide All
Disables all models - useful when you want to manually select only the ones you need

#### Reset to Defaults
Removes all custom settings and shows all models (default behavior)

#### Refresh
Reloads the model list from the configuration

### ⚠️ Warning Alert
If you hide all models, you'll see a warning that at least one model should be visible for the selector to work properly.

## How It Works

### Architecture

1. **Storage**: Uses localStorage with key `visible-models`
2. **Default Behavior**: If no settings exist, all models are visible
3. **Filter Logic**: The model selector popover filters models based on your settings

### Files Created

```
src/
├── lib/
│   └── settings/
│       └── model-visibility.ts       # Core logic for visibility settings
└── components/
    └── settings/
        └── sections/
            └── ModelProfileListSection.tsx  # UI component
```

### Integration Points

- **`model-selector-popover.tsx`**: Updated to filter models based on visibility settings
- **`menu.ts`**: Added new "model-profiles" section to settings menu
- **`SettingsCard.tsx`**: Added routing for the new section

## Usage

1. Open Settings (gear icon)
2. Click "Model Profile List" in the sidebar
3. Toggle models on/off as needed
4. Close settings - changes are saved automatically

## API Reference

### `model-visibility.ts`

#### `getVisibleModels(): string[] | null`
Returns array of visible model IDs, or `null` if all models are visible (default)

#### `setVisibleModels(modelIds: string[]): void`
Sets the list of visible model IDs

#### `isModelVisible(modelId: string): boolean`
Checks if a specific model is visible

#### `toggleModelVisibility(modelId: string, visible: boolean): void`
Toggles visibility of a specific model

#### `resetModelVisibility(): void`
Clears all settings and shows all models

## UI Components

### Layout
- Follows the same structure as "Local LLM" settings page
- Responsive and clean design
- Dark/Light theme support

### Model Cards
Each model displays:
- Display name
- Category badge
- Description
- Visible/Hidden status
- Toggle switch

### Grouping
Models are grouped by provider (Google, OpenAI, Anthropic, etc.)

## Example Use Cases

### Scenario 1: Focus on OpenAI Models
1. Click "Hide All"
2. Manually enable only GPT models
3. Your popover now shows only OpenAI models

### Scenario 2: Hide Experimental Models
1. Scroll to models marked as "experimental"
2. Toggle them off
3. Your popover is now cleaner without experimental options

### Scenario 3: Reset Everything
1. Click "Reset to Defaults"
2. All models are visible again

## Styling

- Uses Tailwind CSS classes
- Theme-aware components (dark/light)
- Consistent with existing settings pages
- Shadcn/ui components (Switch, Badge, Button, Alert)

## Future Enhancements

Potential improvements:
- Bulk actions per provider (show/hide all Google models)
- Search/filter models by name or category
- Sort options (by name, provider, category)
- Import/export visibility settings
- Favorites/starred models

## Technical Notes

- Settings persist across sessions (localStorage)
- No backend required
- Changes take effect immediately
- Compatible with existing model configuration system
- Type-safe with TypeScript

## Related Files

- `lib/ai/model-config.ts` - Model definitions
- `components/model-selector-popover.tsx` - Model picker UI
- `components/settings/menu.ts` - Settings navigation
- `components/settings/SettingsCard.tsx` - Settings container

