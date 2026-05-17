import { createContext, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocalStorageStore } from '@/shared/hooks/useLocalStorageStore'

/**
 * Theme Mode controls Tailwind's `dark:` variants (class-based dark mode).
 * Keep this separate from palette presets so you can have many themes without
 * exploding variants like "ocean-dark", "ocean-light", etc.
 */
export type Theme = 'dark' | 'light'
export const AVAILABLE_THEMES: Theme[] = ['dark', 'light']

/**
 * Palette preset controls CSS variables (shadcn/ui tokens) via `data-theme`.
 * Add new presets by extending this union and defining CSS overrides in `src/index.css`.
 */
export type ColorTheme = 'zinc' | 'ocean' | 'rose' | 'emerald'
export const AVAILABLE_COLOR_THEMES: ColorTheme[] = ['zinc', 'ocean', 'rose', 'emerald']

// Theme configuration - easily add more themes here
export interface ThemeConfig {
  name: string
  displayName: string
  description?: string
}

export const THEME_CONFIG: Record<Theme, ThemeConfig> = {
  dark: {
    name: 'dark',
    displayName: 'Dark',
    description: 'Dark mode for comfortable viewing in low light'
  },
  light: {
    name: 'light',
    displayName: 'Light',
    description: 'Light mode for bright environments'
  }
}

export interface ColorThemeConfig {
  name: string
  displayName: string
  description?: string
}

export const COLOR_THEME_CONFIG: Record<ColorTheme, ColorThemeConfig> = {
  zinc: { name: 'zinc', displayName: 'Zinc', description: 'Neutral default palette' },
  ocean: { name: 'ocean', displayName: 'Ocean', description: 'Cool blue palette' },
  rose: { name: 'rose', displayName: 'Rose', description: 'Warm pink/red palette' },
  emerald: { name: 'emerald', displayName: 'Emerald', description: 'Green palette' }
}

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore-backed reactive stores — no useState, no useEffect for reads.
  // Reads localStorage synchronously; all subscribers update in one pass.
  const [theme, setThemeRaw] = useLocalStorageStore<Theme>('app-theme', 'dark')
  const [colorTheme, setColorThemeRaw] = useLocalStorageStore<ColorTheme>('app-color-theme', 'zinc')

  // ✅ Legitimate useEffect: syncing React state → external DOM system.
  // This is the ONE correct use: the DOM is a true external system.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.setAttribute('data-theme', colorTheme)
  }, [theme, colorTheme])

  const toggleTheme = () => setThemeRaw(theme === 'dark' ? 'light' : 'dark')

  const setTheme = (newTheme: Theme) => {
    if (AVAILABLE_THEMES.includes(newTheme)) setThemeRaw(newTheme)
    else console.warn(`Theme "${newTheme}" is not available. Available themes: ${AVAILABLE_THEMES.join(', ')}`)
  }

  const setColorTheme = (newTheme: ColorTheme) => {
    if (AVAILABLE_COLOR_THEMES.includes(newTheme)) setColorThemeRaw(newTheme)
    else console.warn(`Color theme "${newTheme}" is not available. Available themes: ${AVAILABLE_COLOR_THEMES.join(', ')}`)
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
    colorThemeConfig: COLOR_THEME_CONFIG
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

/**
 * Hook to get boolean indicating if dark theme is active
 * Useful for backward compatibility and conditional rendering
 */
export function useIsDark() {
  const { isDark } = useTheme()
  return isDark
}

/**
 * Hook to get theme-aware class names
 * @param darkClass - Class to apply when dark theme is active
 * @param lightClass - Class to apply when light theme is active
 * @returns The appropriate class based on current theme
 */
export function useThemeClass(darkClass: string, lightClass: string): string {
  const { isDark } = useTheme()
  return isDark ? darkClass : lightClass
}
