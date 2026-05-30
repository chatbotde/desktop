import { cn } from "@/shared/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { useTheme, useIsDark } from "@/shared/providers"
import { getThemeClasses } from "@/shared/utils/theme"
import {
  APPEARANCE_MODES,
  APPEARANCE_PALETTES,
  type AppearanceModeId,
  type AppearancePaletteId,
} from "@/lib/appearance"

export function AppearanceSection() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme()
  const isDark = useIsDark()

  const rowBorder = getThemeClasses(isDark, {
    dark: "border-zinc-700",
    light: "border-zinc-200",
  })

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <div
          className={getThemeClasses(isDark, {
            dark: "text-zinc-100",
            light: "text-zinc-900",
          }, "text-sm font-medium")}
        >
          Appearance
        </div>
        <p
          className={getThemeClasses(isDark, {
            dark: "text-zinc-400",
            light: "text-zinc-600",
          }, "text-xs mt-1")}
        >
          Global look — mode and palette presets.
        </p>
      </div>

      <TooltipProvider delayDuration={200}>
        {/* Mode */}
        <div className={cn("flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5", rowBorder)}>
          <span
            className={getThemeClasses(isDark, {
              dark: "text-zinc-400",
              light: "text-zinc-500",
            }, "text-xs font-medium uppercase tracking-wide")}
          >
            Mode
          </span>
          <div className="flex items-center gap-1.5">
            {APPEARANCE_MODES.map((mode) => {
              const Icon = mode.icon
              const isActive = theme === mode.id

              return (
                <Tooltip key={mode.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setTheme(mode.id as AppearanceModeId)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? isDark
                            ? "bg-zinc-100 text-zinc-900"
                            : "bg-zinc-900 text-zinc-100"
                          : isDark
                            ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                      )}
                      aria-label={mode.label}
                      aria-pressed={isActive}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <p className="font-medium">{mode.label}</p>
                    {mode.description ? (
                      <p className="mt-0.5 font-normal text-zinc-400">{mode.description}</p>
                    ) : null}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Palette */}
        <div className={cn("flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5", rowBorder)}>
          <span
            className={getThemeClasses(isDark, {
              dark: "text-zinc-400",
              light: "text-zinc-500",
            }, "text-xs font-medium uppercase tracking-wide shrink-0")}
          >
            Palette
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {APPEARANCE_PALETTES.map((palette) => {
              const isActive = colorTheme === palette.id
              const isGlassSwatch = palette.previewVariant === "glass"

              return (
                <Tooltip key={palette.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setColorTheme(palette.id as AppearancePaletteId)}
                      className={cn(
                        "relative h-9 w-9 overflow-hidden rounded-full border-2 transition-all",
                        isActive
                          ? isDark
                            ? "border-zinc-100 ring-2 ring-zinc-100/30"
                            : "border-zinc-900 ring-2 ring-zinc-900/20"
                          : isDark
                            ? "border-zinc-600 hover:border-zinc-400"
                            : "border-zinc-300 hover:border-zinc-500",
                        isGlassSwatch && "border-white/40"
                      )}
                      aria-label={palette.label}
                      aria-pressed={isActive}
                    >
                      {isGlassSwatch ? (
                        <>
                          <span
                            className="absolute inset-0 bg-gradient-to-br from-sky-100/90 via-white/60 to-indigo-200/70 backdrop-blur-sm"
                            aria-hidden
                          />
                          <span
                            className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-bl from-slate-800/80 to-slate-950/90 backdrop-blur-sm"
                            aria-hidden
                          />
                        </>
                      ) : (
                        <>
                          <span
                            className="absolute inset-0 left-0 w-1/2"
                            style={{ backgroundColor: palette.preview.light }}
                          />
                          <span
                            className="absolute inset-0 right-0 w-1/2"
                            style={{ backgroundColor: palette.preview.dark }}
                          />
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <p className="font-medium">{palette.label}</p>
                    {palette.description ? (
                      <p className="mt-0.5 font-normal text-zinc-400">{palette.description}</p>
                    ) : null}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
