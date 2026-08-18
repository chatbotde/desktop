import { cn } from '@/shared/lib/utils'

/**
 * @deprecated Prefer semantic classes from `@/lib/appearance/surfaces` (APP_SURFACES).
 * These helpers remain for gradual migration away from zinc conditionals.
 */
export function getThemeClass(
  isDark: boolean,
  darkClass: string,
  lightClass: string,
  baseClass?: string
): string {
  return cn(baseClass, isDark ? darkClass : lightClass)
}

/** @deprecated Prefer APP_SURFACES from `@/lib/appearance/surfaces`. */
export function getThemeClasses(
  isDark: boolean,
  classes: { dark: string; light: string },
  baseClass?: string
): string {
  return cn(baseClass, isDark ? classes.dark : classes.light)
}
