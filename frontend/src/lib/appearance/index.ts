/**
 * @deprecated Import from `@/lib/appearance/themes` instead.
 * Re-exports kept for backward compatibility.
 */
export type {
  AppearanceModeId,
  AppearancePaletteDefinition,
  AppearanceModeDefinition,
  ThemePaletteId as AppearancePaletteId,
} from "./themes"

export {
  APPEARANCE_MODES,
  APPEARANCE_PALETTES,
  DEFAULT_APPEARANCE_MODE,
  DEFAULT_THEME_PALETTE as DEFAULT_APPEARANCE_PALETTE,
  THEME_PALETTES,
  THEME_PALETTE_MAP,
  type ThemePaletteId,
  type ThemePaletteDefinition,
  type PaletteColorTokens,
  type GlassEffect,
  isGlassCapablePalette,
} from "./themes"

export { APP_SURFACES, surface, surfaceClass } from "./surfaces"
export { generatePaletteStylesheet, injectPaletteStylesheet } from "./palette-css"
export {
  APPEARANCE_STORAGE_KEYS,
  SURFACE_OPACITY,
  clampSurfaceOpacity,
  readStoredSurfaceOpacity,
  readStoredAccentColor,
} from "./constants"
export { hexToHslChannels, isValidHexColor, contrastForegroundHsl } from "./color-utils"

export { APPEARANCE_MODE_MAP, APPEARANCE_PALETTE_MAP, normalizeAppearancePalette, normalizeAppearanceMode, isAppearanceMode, isAppearancePalette } from "./registry"
