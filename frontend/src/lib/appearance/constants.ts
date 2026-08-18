export const APPEARANCE_STORAGE_KEYS = {
  surfaceOpacity: "app-surface-opacity",
  accentColor: "app-accent-color",
} as const

/** Surface opacity slider range (percent) */
export const SURFACE_OPACITY = {
  min: 15,
  max: 100,
  default: 100,
  step: 1,
} as const

export function clampSurfaceOpacity(value: number): number {
  return Math.min(SURFACE_OPACITY.max, Math.max(SURFACE_OPACITY.min, Math.round(value)))
}

export function readStoredSurfaceOpacity(): number {
  if (typeof localStorage === "undefined") return SURFACE_OPACITY.default
  const raw = localStorage.getItem(APPEARANCE_STORAGE_KEYS.surfaceOpacity)
  if (raw == null) return SURFACE_OPACITY.default
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? clampSurfaceOpacity(parsed) : SURFACE_OPACITY.default
}

export function readStoredAccentColor(): string | null {
  if (typeof localStorage === "undefined") return null
  const raw = localStorage.getItem(APPEARANCE_STORAGE_KEYS.accentColor)
  return raw && raw.length > 0 ? raw : null
}
