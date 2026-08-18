import { useMemo } from "react"
import { getThemeClasses, getHoverClass } from "../prompt-input-theme"

/** Shared hook — theme is global; isDarkTheme kept for backward-compatible call sites. */
export function usePromptTheme(_isDarkTheme?: boolean) {
  const themeClasses = useMemo(() => getThemeClasses(), [])
  const hoverClass = useMemo(() => getHoverClass(), [])

  return { themeClasses, hoverClass }
}
