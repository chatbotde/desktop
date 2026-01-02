import { useMemo } from "react"
import { getThemeClasses, getHoverClass } from "../prompt-input-theme"

/**
 * Shared hook to get theme classes and hover class
 */
export function usePromptTheme(isDarkTheme: boolean) {
  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])
  const hoverClass = useMemo(() => getHoverClass(isDarkTheme), [isDarkTheme])

  return { themeClasses, hoverClass }
}

