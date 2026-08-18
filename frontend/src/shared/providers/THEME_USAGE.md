# Global Theme System

All palettes are defined in **one command file**: `src/lib/appearance/themes.ts`.

CSS variables are injected automatically at runtime — no need to edit `index.css` when adding a palette.

## Quick Start

```tsx
import { useTheme } from '@/shared/providers'
import { APP_SURFACES, surface } from '@/lib/appearance'

function MyPanel() {
  const { surfaces, isGlassPalette, colorTheme } = useTheme()

  return (
    <div className={surfaces.base}>
      <p className={surfaces.textMuted}>Glass active: {String(isGlassPalette)}</p>
      <input className={surface('input')} placeholder="Type here…" />
    </div>
  )
}
```

## Semantic Surface Classes

Use these instead of `isDark ? 'bg-zinc-900' : 'bg-white'`:

| Class / constant | Purpose |
|------------------|---------|
| `APP_SURFACES.base` | Primary panel / card |
| `APP_SURFACES.elevated` | Panel with shadow |
| `APP_SURFACES.muted` | Secondary / chip background |
| `APP_SURFACES.overlay` | Modal / floating shell |
| `APP_SURFACES.input` | Text input styling |
| `APP_SURFACES.textMuted` | Helper text |
| `APP_SURFACES.icon` | Icon color |
| `APP_SURFACES.hover` | Interactive hover |
| `APP_SURFACES.chip` | File / tag chip |

Glass blur applies automatically when the **Glass** palette is selected (`html[data-glass="true"]`).

## Adding a New Palette

Edit **`lib/appearance/themes.ts`** only:

```typescript
{
  id: "ocean",
  label: "Ocean",
  description: "Cool blue tones",
  preview: { light: "#e0f2fe", dark: "#0c4a6e" },
  // Optional glassmorphism:
  glass: { blur: "18px", surfaceOpacity: 0.65, dark: { surfaceOpacity: 0.5 } },
  light: { ...BASE_LIGHT, primary: "200 80% 40%", /* … */ },
  dark: { ...BASE_DARK, primary: "200 80% 70%", /* … */ },
},
```

The palette appears in Settings → Appearance automatically.

## Mode vs Palette

| Setting | Storage key | Controls |
|---------|-------------|----------|
| **Mode** | `app-theme` | `dark` / `light` / `system` → `.dark` class on `<html>` |
| **Palette** | `app-color-theme` | `data-theme` + CSS variables |

## Hooks

- `useTheme()` — full context including `colorTheme`, `setColorTheme`, `isGlassPalette`, `surfaces`
- `useIsDark()` — boolean dark mode
- `useThemeClass(dark, light)` — legacy helper; prefer `APP_SURFACES`

## Inline Styles (legacy)

For components not yet migrated to classes:

```tsx
import { GLOBAL_THEME } from '@/global/theme'

style={{ backgroundColor: GLOBAL_THEME.vars.card }}
```

## Migration

**Before:**
```tsx
className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}
```

**After:**
```tsx
className={APP_SURFACES.base}
```
