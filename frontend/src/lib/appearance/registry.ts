import { Monitor, Moon, Sun } from "lucide-react"

import type {
  AppearanceModeDefinition,
  AppearanceModeId,
  AppearancePaletteDefinition,
  AppearancePaletteId,
} from "./types"

/**
 * Global appearance registry.
 * Add new modes or palettes here, then define CSS in `src/index.css`.
 */
export const APPEARANCE_MODES: AppearanceModeDefinition[] = [
  {
    id: "system",
    label: "System",
    description: "Match your device appearance",
    icon: Monitor,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Black background, light text",
    icon: Moon,
  },
  {
    id: "light",
    label: "Light",
    description: "White background, dark text",
    icon: Sun,
  },
]

export const APPEARANCE_PALETTES: AppearancePaletteDefinition[] = [
  {
    id: "neutral",
    label: "Neutral",
    description: "Soft grayscale — easy on the eyes",
    preview: { light: "#f4f4f5", dark: "#18181b" },
  },
  {
    id: "mono",
    label: "Mono",
    description: "Pure black & white — high contrast",
    preview: { light: "#ffffff", dark: "#000000" },
  },
  {
    id: "glass",
    label: "Glass",
    description: "Frosted translucent surfaces — cool & airy",
    preview: { light: "#e8eef6", dark: "#1e2638" },
    previewVariant: "glass",
  },
  {
    id: "charcoal",
    label: "Charcoal",
    description: "Deep warm grays — soft & refined",
    preview: { light: "#f5f3f0", dark: "#1c1917" },
  },
]

export const DEFAULT_APPEARANCE_MODE: AppearanceModeId = "dark"
export const DEFAULT_APPEARANCE_PALETTE: AppearancePaletteId = "neutral"

export const APPEARANCE_MODE_MAP = Object.fromEntries(
  APPEARANCE_MODES.map((m) => [m.id, m])
) as Record<AppearanceModeId, AppearanceModeDefinition>

export const APPEARANCE_PALETTE_MAP = Object.fromEntries(
  APPEARANCE_PALETTES.map((p) => [p.id, p])
) as Record<AppearancePaletteId, AppearancePaletteDefinition>

/** Maps legacy localStorage values to the current palette ids. */
const VALID_PALETTES = new Set(APPEARANCE_PALETTES.map((p) => p.id))

export function normalizeAppearancePalette(raw: string | null | undefined): AppearancePaletteId {
  if (raw && VALID_PALETTES.has(raw as AppearancePaletteId)) return raw as AppearancePaletteId
  if (raw === "zinc") return "neutral"
  return DEFAULT_APPEARANCE_PALETTE
}

export function isAppearanceMode(value: string): value is AppearanceModeId {
  return value === "system" || value === "dark" || value === "light"
}

export function isAppearancePalette(value: string): value is AppearancePaletteId {
  return VALID_PALETTES.has(value as AppearancePaletteId)
}
