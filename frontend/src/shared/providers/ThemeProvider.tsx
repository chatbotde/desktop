import { createContext, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocalStorageStore } from '@/shared/hooks/useLocalStorageStore'
import {
  APPEARANCE_MODES,
  APPEARANCE_PALETTES,
  DEFAULT_APPEARANCE_MODE,
  DEFAULT_APPEARANCE_PALETTE,
  normalizeAppearancePalette,
  isAppearanceMode,
  isAppearancePalette,
  type AppearanceModeId,
  type AppearancePaletteId,
} from '@/lib/appearance'

/** @deprecated Use AppearanceModeId from `@/lib/appearance` */
export type Theme = AppearanceModeId

/** @deprecated Use AppearancePaletteId from `@/lib/appearance` */
export type ColorTheme = AppearancePaletteId

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

/** Derived from global appearance registry — add modes in `lib/appearance/registry.ts`. */
export const THEME_CONFIG: Record<Theme, ThemeConfig> = Object.fromEntries(
  APPEARANCE_MODES.map((m) => [
    m.id,
    { name: m.id, displayName: m.label, description: m.description },
  ])
) as Record<Theme, ThemeConfig>

/** Derived from global appearance registry — add palettes in `lib/appearance/registry.ts`. */
export const COLOR_THEME_CONFIG: Record<ColorTheme, ColorThemeConfig> = Object.fromEntries(
  APPEARANCE_PALETTES.map((p) => [
    p.id,
    { name: p.id, displayName: p.label, description: p.description },
  ])
) as Record<ColorTheme, ColorThemeConfig>

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  isLight: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  availableThemes: Theme[]
  themeConfig: Record<Theme, ThemeConfig>

  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  availableColorThemes: ColorTheme[]
  colorThemeConfig: Record<ColorTheme, ColorThemeConfig>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function readStoredPalette(): ColorTheme {
  if (typeof localStorage === 'undefined') return DEFAULT_APPEARANCE_PALETTE
  return normalizeAppearancePalette(localStorage.getItem('app-color-theme'))
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeRaw] = useLocalStorageStore<Theme>('app-theme', DEFAULT_APPEARANCE_MODE)
  const [colorTheme, setColorThemeRaw] = useLocalStorageStore<ColorTheme>(
    'app-color-theme',
    readStoredPalette()
  )

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.setAttribute('data-theme', colorTheme)
  }, [theme, colorTheme])

  const toggleTheme = () => setThemeRaw(theme === 'dark' ? 'light' : 'dark')

  const setTheme = (newTheme: Theme) => {
    if (isAppearanceMode(newTheme)) setThemeRaw(newTheme)
    else console.warn(`Theme "${newTheme}" is not available.`)
  }

  const setColorTheme = (newTheme: ColorTheme) => {
    if (isAppearancePalette(newTheme)) setColorThemeRaw(newTheme)
    else console.warn(`Palette "${newTheme}" is not available.`)
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
  }), [theme, colorTheme])

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
