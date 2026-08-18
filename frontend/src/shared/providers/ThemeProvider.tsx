import { createContext, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocalStorageStore } from '@/shared/hooks/useLocalStorageStore'
import {
  APPEARANCE_MODES,
  APPEARANCE_PALETTES,
  DEFAULT_APPEARANCE_PALETTE,
  injectPaletteStylesheet,
  normalizeAppearancePalette,
  normalizeAppearanceMode,
  isAppearancePalette,
  isGlassCapablePalette,
  APP_SURFACES,
  readStoredSurfaceOpacity,
  clampSurfaceOpacity,
  SURFACE_OPACITY,
  type AppearanceModeId,
  type ThemePaletteId,
} from '@/lib/appearance'

/** @deprecated Use AppearanceModeId from `@/lib/appearance` */
export type Theme = AppearanceModeId

/** @deprecated Use ThemePaletteId from `@/lib/appearance` */
export type ColorTheme = ThemePaletteId

type ResolvedMode = 'dark' | 'light'

export const AVAILABLE_THEMES: Theme[] = APPEARANCE_MODES.map((m) => m.id)
export const AVAILABLE_COLOR_THEMES: ColorTheme[] = APPEARANCE_PALETTES.map((p) => p.id)

export interface ThemeConfig {
  name: string
  displayName: string
  description?: string
}

export interface ColorThemeConfig {
  name: string
  displayName: string
  description?: string
}

export const THEME_CONFIG: Record<Theme, ThemeConfig> = Object.fromEntries(
  APPEARANCE_MODES.map((m) => [
    m.id,
    { name: m.id, displayName: m.label, description: m.description },
  ])
) as Record<Theme, ThemeConfig>

export const COLOR_THEME_CONFIG: Record<ColorTheme, ColorThemeConfig> = Object.fromEntries(
  APPEARANCE_PALETTES.map((p) => [
    p.id,
    { name: p.id, displayName: p.label, description: p.description },
  ])
) as Record<ColorTheme, ColorThemeConfig>

export const CUSTOM_CURSOR_STORAGE_KEY = 'app-custom-cursor'

interface ThemeContextType {
  theme: ResolvedMode
  isDark: boolean
  isLight: boolean
  toggleTheme: () => void
  setTheme: (theme: ResolvedMode) => void
  availableThemes: Theme[]
  themeConfig: Record<Theme, ThemeConfig>

  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  availableColorThemes: ColorTheme[]
  colorThemeConfig: Record<ColorTheme, ColorThemeConfig>
  isGlassPalette: boolean
  surfaces: typeof APP_SURFACES

  surfaceOpacity: number
  canAdjustSurfaceOpacity: boolean
  setSurfaceOpacity: (value: number) => void
  resetSurfaceOpacity: () => void

  customCursor: boolean
  setCustomCursor: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function readStoredTheme(): ResolvedMode {
  if (typeof localStorage === 'undefined') return 'dark'
  const raw = localStorage.getItem('app-theme')
  if (raw === null) return 'dark'
  try {
    const parsed = JSON.parse(raw)
    return normalizeAppearanceMode(parsed)
  } catch {
    return normalizeAppearanceMode(raw)
  }
}

function readStoredPalette(): ColorTheme {
  if (typeof localStorage === 'undefined') return DEFAULT_APPEARANCE_PALETTE
  const raw = localStorage.getItem('app-color-theme')
  if (raw === null) return DEFAULT_APPEARANCE_PALETTE
  try {
    const parsed = JSON.parse(raw)
    return normalizeAppearancePalette(parsed)
  } catch {
    return normalizeAppearancePalette(raw)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    injectPaletteStylesheet()
  }, [])

  const [rawTheme, setThemeRaw] = useLocalStorageStore<string>('app-theme', readStoredTheme())
  const theme = normalizeAppearanceMode(rawTheme)

  const [rawColorTheme, setColorThemeRaw] = useLocalStorageStore<string>(
    'app-color-theme',
    readStoredPalette()
  )
  const colorTheme = normalizeAppearancePalette(rawColorTheme)
  const [customCursor, setCustomCursorRaw] = useLocalStorageStore<boolean>(
    CUSTOM_CURSOR_STORAGE_KEY,
    false
  )
  const [surfaceOpacity, setSurfaceOpacityRaw] = useLocalStorageStore<number>(
    'app-surface-opacity',
    readStoredSurfaceOpacity()
  )

  const glassPaletteActive = isGlassCapablePalette(colorTheme)
  const canAdjustSurfaceOpacity = theme === 'dark' && glassPaletteActive
  const effectiveSurfaceOpacity = canAdjustSurfaceOpacity
    ? clampSurfaceOpacity(surfaceOpacity)
    : SURFACE_OPACITY.default

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.setAttribute('data-theme', colorTheme)

    root.style.setProperty(
      '--appearance-surface-opacity',
      String(effectiveSurfaceOpacity / 100)
    )

    const useGlass = theme === 'dark' && glassPaletteActive
    if (useGlass) {
      root.setAttribute('data-glass', 'true')
    } else {
      root.removeAttribute('data-glass')
    }
  }, [theme, colorTheme, effectiveSurfaceOpacity, glassPaletteActive])

  const isGlassPalette = theme === 'dark' && glassPaletteActive

  const toggleTheme = () => setThemeRaw(theme === 'dark' ? 'light' : 'dark')

  const setTheme = (newTheme: ResolvedMode) => {
    setThemeRaw(newTheme)
  }

  const setColorTheme = (newTheme: ColorTheme) => {
    if (isAppearancePalette(newTheme)) setColorThemeRaw(newTheme)
    else console.warn(`Palette "${newTheme}" is not available.`)
  }

  const setCustomCursor = (enabled: boolean) => setCustomCursorRaw(enabled)

  const setSurfaceOpacity = (value: number) => {
    if (!canAdjustSurfaceOpacity) return
    setSurfaceOpacityRaw(clampSurfaceOpacity(value))
  }

  const resetSurfaceOpacity = () => {
    setSurfaceOpacityRaw(SURFACE_OPACITY.default)
  }

  const contextValue = useMemo<ThemeContextType>(() => ({
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
    availableThemes: AVAILABLE_THEMES,
    themeConfig: THEME_CONFIG,

    colorTheme,
    setColorTheme,
    availableColorThemes: AVAILABLE_COLOR_THEMES,
    colorThemeConfig: COLOR_THEME_CONFIG,
    isGlassPalette,
    surfaces: APP_SURFACES,

    surfaceOpacity: effectiveSurfaceOpacity,
    canAdjustSurfaceOpacity,
    setSurfaceOpacity,
    resetSurfaceOpacity,

    customCursor,
    setCustomCursor,
  }), [
    theme,
    colorTheme,
    customCursor,
    isGlassPalette,
    surfaceOpacity,
    effectiveSurfaceOpacity,
    canAdjustSurfaceOpacity,
  ])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function useIsDark() {
  const { isDark } = useTheme()
  return isDark
}

export function useThemeClass(darkClass: string, lightClass: string): string {
  const { isDark } = useTheme()
  return isDark ? darkClass : lightClass
}
