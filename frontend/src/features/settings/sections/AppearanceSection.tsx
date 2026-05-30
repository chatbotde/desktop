import { cn } from "@/shared/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { useTheme, useIsDark } from "@/shared/providers"
import { getThemeClasses } from "@/shared/utils/theme"
import { APPEARANCE_MODES, type AppearanceModeId } from "@/lib/appearance"

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const isDark = useIsDark()

  const rowBorder = getThemeClasses(isDark, {
    dark: "border-zinc-700",
    light: "border-zinc-200",
  })

  const selectTriggerClass = getThemeClasses(isDark, {
    dark: "bg-zinc-800 border-zinc-700 text-zinc-100",
    light: "bg-white border-zinc-300 text-zinc-900",
  }, "h-8 min-w-[7.5rem] text-xs")

  const selectContentClass = getThemeClasses(isDark, {
    dark: "bg-zinc-800 border-zinc-700 text-zinc-100",
    light: "bg-white border-zinc-300 text-zinc-900",
  }, "z-[9999999]")

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
          Choose light, dark, or match your system.
        </p>
      </div>

      <div className={cn("flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5", rowBorder)}>
        <span
          className={getThemeClasses(isDark, {
            dark: "text-zinc-400",
            light: "text-zinc-500",
          }, "text-xs font-medium uppercase tracking-wide")}
        >
          Mode
        </span>
        <Select
          value={theme}
          onValueChange={(value) => setTheme(value as AppearanceModeId)}
        >
          <SelectTrigger className={selectTriggerClass} size="sm">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            {APPEARANCE_MODES.map((mode) => (
              <SelectItem key={mode.id} value={mode.id}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
