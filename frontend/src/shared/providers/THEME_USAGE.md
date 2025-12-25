# Global Theme System

The theme system has been centralized to eliminate the need to pass theme props through every component. All theme management happens in one place: `ThemeProvider`.

## Quick Start

### Using Theme in Components

```tsx
import { useTheme, useIsDark } from '@/shared/providers'
import { getThemeClasses } from '@/shared/utils/theme'

function MyComponent() {
  // Option 1: Get full theme context
  const { theme, isDark, isLight, toggleTheme, setTheme } = useTheme()
  
  // Option 2: Just check if dark (most common use case)
  const isDark = useIsDark()
  
  // Option 3: Use utility for theme-aware classes
  const className = getThemeClasses(isDark, {
    dark: 'bg-zinc-900 text-zinc-100',
    light: 'bg-white text-zinc-900'
  }, 'p-4 rounded-lg')
  
  return <div className={className}>Content</div>
}
```

## Available Hooks

### `useTheme()`
Returns the full theme context:
- `theme`: Current theme ('dark' | 'light')
- `isDark`: Boolean for dark theme
- `isLight`: Boolean for light theme
- `toggleTheme()`: Toggle between dark/light
- `setTheme(theme)`: Set a specific theme
- `availableThemes`: Array of available themes
- `themeConfig`: Configuration object for all themes

### `useIsDark()`
Simple hook that returns `true` if dark theme is active.

### `useThemeClass(darkClass, lightClass)`
Hook that returns the appropriate class based on current theme.

## Utility Functions

### `getThemeClass(isDark, darkClass, lightClass, baseClass?)`
Utility function for conditional class names:
```tsx
const className = getThemeClass(isDark, 'bg-zinc-900', 'bg-white', 'p-4')
```

### `getThemeClasses(isDark, classes, baseClass?)`
Utility function for multiple class variants:
```tsx
const className = getThemeClasses(isDark, {
  dark: 'bg-zinc-900 text-zinc-100 border-zinc-800',
  light: 'bg-white text-zinc-900 border-zinc-200'
}, 'p-4 rounded-lg')
```

## Adding New Themes

To add a new theme (e.g., 'blue', 'green'):

1. Update `Theme` type in `ThemeProvider.tsx`:
```tsx
export type Theme = 'dark' | 'light' | 'blue'
export const AVAILABLE_THEMES: Theme[] = ['dark', 'light', 'blue']
```

2. Add theme configuration:
```tsx
export const THEME_CONFIG: Record<Theme, ThemeConfig> = {
  // ... existing themes
  blue: {
    name: 'blue',
    displayName: 'Blue',
    description: 'Blue theme for a calming experience'
  }
}
```

3. Add CSS classes in your global styles or Tailwind config for the new theme.

## Migration Guide

### Before (Passing Props)
```tsx
// ❌ Old way - passing props everywhere
function Parent() {
  const [isDark, setIsDark] = useState(true)
  return <Child isDarkTheme={isDark} onThemeChange={setIsDark} />
}

function Child({ isDarkTheme, onThemeChange }) {
  return <div className={isDarkTheme ? 'dark' : 'light'}>Content</div>
}
```

### After (Using Context)
```tsx
// ✅ New way - use global context
function Parent() {
  return <Child />
}

function Child() {
  const isDark = useIsDark()
  return <div className={isDark ? 'dark' : 'light'}>Content</div>
}
```

## Benefits

1. **No Prop Drilling**: Theme is available anywhere via context
2. **Single Source of Truth**: Theme state managed in one place
3. **Easy to Extend**: Add new themes by updating ThemeProvider
4. **Type Safe**: Full TypeScript support
5. **Persistent**: Theme preference saved to localStorage automatically

