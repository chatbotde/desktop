import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

// Define available themes - easily extensible
export type Theme = 'dark' | 'light'
export const AVAILABLE_THEMES: Theme[] = ['dark', 'light']

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

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  isLight: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  availableThemes: Theme[]
  themeConfig: Record<Theme, ThemeConfig>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const savedTheme = localStorage.getItem('app-theme') as Theme | null
    if (savedTheme && AVAILABLE_THEMES.includes(savedTheme)) {
      return savedTheme
    }
    return 'dark'
  })

  // Update document class and localStorage when theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    // Remove all theme classes
    AVAILABLE_THEMES.forEach(t => root.classList.remove(t))
    // Add current theme class
    root.classList.add(theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const setTheme = (newTheme: Theme) => {
    if (AVAILABLE_THEMES.includes(newTheme)) {
      setThemeState(newTheme)
    } else {
      console.warn(`Theme "${newTheme}" is not available. Available themes: ${AVAILABLE_THEMES.join(', ')}`)
    }
  }

  const contextValue = useMemo<ThemeContextType>(() => ({
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
    availableThemes: AVAILABLE_THEMES,
    themeConfig: THEME_CONFIG
  }), [theme])

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
