import { Moon, Sun } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Label } from "@/shared/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group"
import { useTheme } from "@/shared/providers"
import {
  APPEARANCE_PALETTES,
  DEFAULT_APPEARANCE_PALETTE,
  SURFACE_OPACITY,
  isGlassCapablePalette,
  type ThemePaletteId,
} from "@/lib/appearance"
import { OpacityControl } from "../components/OpacityControl"

export function AppearanceSection() {
  const {
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    surfaceOpacity,
    canAdjustSurfaceOpacity,
    setSurfaceOpacity,
    resetSurfaceOpacity,
  } = useTheme()

  const selectMode = (mode: "light" | "dark") => {
    setTheme(mode)
    setColorTheme(DEFAULT_APPEARANCE_PALETTE)
    resetSurfaceOpacity()
  }

  const selectPalette = (id: ThemePaletteId) => {
    setColorTheme(id)
    if (!isGlassCapablePalette(id)) {
      resetSurfaceOpacity()
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
      </div>

      {/* Light / Dark — no system */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Theme</Label>
        <ToggleGroup
          type="single"
          value={theme}
          onValueChange={(value) => {
            if (value === "light" || value === "dark") selectMode(value)
          }}
          variant="outline"
          className="w-full"
        >
          <ToggleGroupItem value="light" className="flex-1 gap-1.5 text-xs">
            <Sun className="size-3.5" />
            Light
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" className="flex-1 gap-1.5 text-xs">
            <Moon className="size-3.5" />
            Dark
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Color palettes */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Color palette</Label>
        <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto pr-1">
          {APPEARANCE_PALETTES.map((palette) => {
            const active = colorTheme === palette.id
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => selectPalette(palette.id)}
                title={palette.label}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors",
                  active
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    : "hover:bg-muted/60"
                )}
              >
                <span
                  className={cn(
                    "h-7 w-full rounded-md border border-border/60",
                    palette.previewVariant === "glass" && "backdrop-blur-sm",
                    palette.previewVariant === "glass" && palette.previewGradient
                      ? "bg-gradient-to-br " + palette.previewGradient
                      : palette.previewVariant === "glass" && "bg-gradient-to-br from-pink-500/40 via-orange-400/30 to-violet-500/40"
                  )}
                  style={
                    palette.previewVariant === "glass"
                      ? undefined
                      : {
                          background: `linear-gradient(135deg, ${palette.preview.light} 50%, ${palette.preview.dark} 50%)`,
                        }
                  }
                />
                <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                  {palette.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Opacity — only dark + glass palette */}
      {canAdjustSurfaceOpacity && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="surface-opacity" className="text-xs text-muted-foreground">
              Opacity
            </Label>
            <span className="text-xs tabular-nums text-foreground">{surfaceOpacity}%</span>
          </div>
          <OpacityControl
            id="surface-opacity"
            value={surfaceOpacity}
            onChange={setSurfaceOpacity}
            min={SURFACE_OPACITY.min}
            max={SURFACE_OPACITY.max}
            step={SURFACE_OPACITY.step}
          />
        </div>
      )}
    </div>
  )
}
