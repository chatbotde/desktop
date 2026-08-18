import type { GlassEffect, PaletteColorTokens, ThemePaletteDefinition } from "./themes"
import { THEME_PALETTES } from "./themes"

const STYLE_ELEMENT_ID = "app-palette-vars"

const TOKEN_CSS_MAP: Record<keyof PaletteColorTokens, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  sidebarPrimary: "--sidebar-primary",
}

function tokensToCssBlock(tokens: PaletteColorTokens): string {
  return Object.entries(TOKEN_CSS_MAP)
    .map(([key, cssVar]) => `  ${cssVar}: ${tokens[key as keyof PaletteColorTokens]};`)
    .join("\n")
}

function glassVars(glass: GlassEffect, mode: "light" | "dark"): string {
  const overrides = mode === "dark" ? glass.dark : undefined
  const blur = overrides?.blur ?? glass.blur
  const surfaceOpacity = overrides?.surfaceOpacity ?? glass.surfaceOpacity
  const borderOpacity = overrides?.borderOpacity ?? glass.borderOpacity

  const lines = [
    `  --appearance-blur: ${blur};`,
    `  --appearance-surface-opacity: ${surfaceOpacity};`,
  ]
  if (borderOpacity != null) {
    lines.push(`  --appearance-border-opacity: ${borderOpacity};`)
  }
  return lines.join("\n")
}

function paletteGlassVars(palette: ThemePaletteDefinition, mode: "light" | "dark"): string {
  if (!palette.glass) return ""
  return `\n${glassVars(palette.glass, mode)}`
}

/** Generates the full palette stylesheet from THEME_PALETTES. */
export function generatePaletteStylesheet(): string {
  const blocks = THEME_PALETTES.flatMap((palette) => [
    `:root[data-theme="${palette.id}"] {\n${tokensToCssBlock(palette.light)}${paletteGlassVars(palette, "light")}\n}`,
    `.dark[data-theme="${palette.id}"] {\n${tokensToCssBlock(palette.dark)}${paletteGlassVars(palette, "dark")}\n}`,
  ])

  return `/* Auto-generated from lib/appearance/themes.ts — do not edit manually */\n${blocks.join("\n\n")}`
}

/** Injects or updates the palette stylesheet in the document head. */
export function injectPaletteStylesheet(): void {
  if (typeof document === "undefined") return

  const css = generatePaletteStylesheet()
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null

  if (!el) {
    el = document.createElement("style")
    el.id = STYLE_ELEMENT_ID
    document.head.appendChild(el)
  }

  el.textContent = css
}
