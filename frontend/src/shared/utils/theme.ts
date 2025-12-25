import { cn } from '@/shared/lib/utils'

/**
 * Utility function to get theme-aware class names
 * This is a helper for components that need conditional styling based on theme
 * 
 * @param isDark - Boolean indicating if dark theme is active
 * @param darkClass - Class to apply when dark theme is active
 * @param lightClass - Class to apply when light theme is active
 * @param baseClass - Optional base classes to always apply
 * @returns Combined class string
 * 
 * @example
 * const className = getThemeClass(isDark, 'bg-zinc-900', 'bg-white', 'p-4')
 */
export function getThemeClass(
  isDark: boolean,
  darkClass: string,
  lightClass: string,
  baseClass?: string
): string {
  return cn(baseClass, isDark ? darkClass : lightClass)
}

/**
 * Utility function to get theme-aware class names with multiple variants
 * 
 * @param isDark - Boolean indicating if dark theme is active
 * @param classes - Object with dark and light class strings
 * @param baseClass - Optional base classes to always apply
 * @returns Combined class string
 * 
 * @example
 * const className = getThemeClasses(isDark, {
 *   dark: 'bg-zinc-900 text-zinc-100',
 *   light: 'bg-white text-zinc-900'
 * }, 'p-4 rounded-lg')
 */
export function getThemeClasses(
  isDark: boolean,
  classes: { dark: string; light: string },
  baseClass?: string
): string {
  return cn(baseClass, isDark ? classes.dark : classes.light)
}

