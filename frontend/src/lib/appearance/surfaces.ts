/**
 * Global semantic surface classes.
 * Use these instead of per-component dark/light zinc conditionals.
 * Palette + mode are applied automatically via CSS variables on <html>.
 */
export const APP_SURFACES = {
  /** Primary panel / card background */
  base: "app-surface glass-surface rounded-lg",
  /** Elevated panel with subtle shadow */
  elevated: "app-surface-elevated glass-surface rounded-lg shadow-sm",
  /** Muted secondary panel */
  muted: "app-surface-muted glass-surface rounded-lg",
  /** Floating overlay / modal shell */
  overlay: "app-surface-overlay glass-surface rounded-xl",
  /** Text input / textarea styling */
  input: "app-input bg-transparent",
  /** Muted helper text */
  textMuted: "text-muted-foreground",
  /** Icon default color */
  icon: "text-muted-foreground",
  /** Interactive hover surface */
  hover: "app-hover rounded-md transition-colors",
  /** Small chip / file item */
  chip: "app-surface-muted glass-surface rounded-md border px-2 py-1",
  /** Border-only wrapper (background from parent surface) */
  border: "border border-border",
} as const

export type AppSurfaceKey = keyof typeof APP_SURFACES

/** Get a semantic surface class by key */
export function surface(key: AppSurfaceKey): string {
  return APP_SURFACES[key]
}

/** Combine semantic surfaces with extra classes */
export function surfaceClass(key: AppSurfaceKey, ...extra: (string | undefined | false)[]): string {
  return [APP_SURFACES[key], ...extra.filter(Boolean)].join(" ")
}
