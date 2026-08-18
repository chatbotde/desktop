/**
 * Prompt input theme — preserves original pill/rounded design.
 * Uses CSS variables for palette colors only; shape stays component-defined.
 */

export interface ThemeClasses {
  /** Background for inline styles (supports glass opacity via CSS vars) */
  containerBg: string
  /** Optional glass blur hook — no border/radius */
  containerSurface: string
  /** Border color token only — pair with `border` on the element */
  containerBorder: string
  buttonBg: string
  buttonHover: string
  buttonBorder: string
  input: string
  textarea: string
  icon: string
  fileItem: string
  fileText: string
}

const SURFACE_BG = 'hsl(var(--card) / var(--appearance-surface-opacity, 1))'

export function getThemeClasses(_isDarkTheme?: boolean): ThemeClasses {
  return {
    containerBg: SURFACE_BG,
    containerSurface: 'glass-surface',
    containerBorder: 'border-border',
    buttonBg: SURFACE_BG,
    buttonHover: 'hover:bg-muted/80',
    buttonBorder: 'border-border',
    input: 'text-foreground placeholder:text-muted-foreground',
    textarea: 'text-foreground placeholder:text-muted-foreground',
    icon: 'text-muted-foreground',
    fileItem: 'bg-muted/80 border-border rounded-lg border',
    fileText: 'text-foreground',
  }
}

/** Circular-friendly hover — no rectangular app-hover rounding */
export function getHoverClass(_isDarkTheme?: boolean): string {
  return 'hover:bg-muted/80 transition-colors'
}

export const promptInputTheme = {
  getThemeClasses,
  getHoverClass,
}
