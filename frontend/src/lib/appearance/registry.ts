import {
  APPEARANCE_MODES,
  APPEARANCE_PALETTES,
  DEFAULT_THEME_PALETTE,
  type AppearanceModeDefinition,
  type AppearanceModeId,
  type AppearancePaletteDefinition,
  type ThemePaletteId,
} from "./themes"

export {
  APPEARANCE_MODES,
  APPEARANCE_PALETTES,
  DEFAULT_APPEARANCE_MODE,
} from "./themes"

export { DEFAULT_THEME_PALETTE as DEFAULT_APPEARANCE_PALETTE } from "./themes"

export const APPEARANCE_MODE_MAP = Object.fromEntries(
  APPEARANCE_MODES.map((m) => [m.id, m])
) as Record<AppearanceModeId, AppearanceModeDefinition>

export const APPEARANCE_PALETTE_MAP = Object.fromEntries(
  APPEARANCE_PALETTES.map((p) => [p.id, p])
) as Record<ThemePaletteId, AppearancePaletteDefinition>

const VALID_PALETTES = new Set(APPEARANCE_PALETTES.map((p) => p.id))

export function normalizeAppearancePalette(raw: string | null | undefined): ThemePaletteId {
  if (!raw) return DEFAULT_THEME_PALETTE
  const clean = raw.replace(/^"|"$/g, "")
  if (VALID_PALETTES.has(clean as ThemePaletteId)) return clean as ThemePaletteId
  if (clean === "zinc") return "neutral"
  return DEFAULT_THEME_PALETTE
}

export function normalizeAppearanceMode(raw: string | null | undefined): "dark" | "light" {
  if (!raw) return "dark"
  const clean = raw.replace(/^"|"$/g, "")
  return clean === "light" ? "light" : "dark"
}

export function isAppearanceMode(value: string): value is AppearanceModeId {
  return value === "system" || value === "dark" || value === "light"
}

export function isAppearancePalette(value: string): value is ThemePaletteId {
  return VALID_PALETTES.has(value as ThemePaletteId)
}
