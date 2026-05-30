import type { LucideIcon } from "lucide-react"

/** Dark / light mode — controls Tailwind `dark:` class on `<html>`. */
export type AppearanceModeId = "dark" | "light"

/** Palette preset — controls CSS variables via `data-theme` on `<html>`. */
export type AppearancePaletteId = "neutral" | "mono" | "glass" | "charcoal"

export interface AppearanceModeDefinition {
  id: AppearanceModeId
  label: string
  description?: string
  icon: LucideIcon
}

export interface AppearancePaletteDefinition {
  id: AppearancePaletteId
  label: string
  description?: string
  /** Swatch colors shown in settings (light bg, dark bg). */
  preview: { light: string; dark: string }
  /** Optional swatch style in the appearance picker. */
  previewVariant?: "default" | "glass"
}
