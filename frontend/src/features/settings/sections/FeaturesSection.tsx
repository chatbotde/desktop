import { cn } from "@/shared/lib/utils"
import { DynamicFeatureList } from "@/components/features/feature-active"
import { Button } from "@/shared/components/ui/button"
import { useTheme, useIsDark } from "@/shared/providers"
import { getThemeClasses } from "@/shared/utils/theme"

export function FeaturesSection() {
  const { theme, toggleTheme, setTheme, availableThemes, themeConfig } = useTheme()
  const isDark = useIsDark()

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <div className={getThemeClasses(isDark, {
          dark: "text-zinc-100",
          light: "text-zinc-900"
        }, "flex items-center gap-2 text-sm font-medium")}>
          Features
        </div>
        <p className={getThemeClasses(isDark, {
          dark: "text-zinc-400",
          light: "text-zinc-600"
        }, "text-xs mt-1")}>
          Enable or disable features to customize your experience.
        </p>
      </div>
      
      {/* Theme Selection */}
      <div className={getThemeClasses(isDark, {
        dark: "border-zinc-800 bg-zinc-900/50",
        light: "border-zinc-200 bg-zinc-50"
      }, "flex items-center justify-between p-4 rounded-lg border")}>
        <div className="flex flex-col gap-1">
          <div className={getThemeClasses(isDark, {
            dark: "text-zinc-100",
            light: "text-zinc-900"
          }, "text-sm font-medium")}>
            Theme
          </div>
          <div className={getThemeClasses(isDark, {
            dark: "text-zinc-400",
            light: "text-zinc-600"
          }, "text-xs")}>
            {themeConfig[theme].description || `Switch between ${availableThemes.join(' and ')} mode`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {availableThemes.length > 2 ? (
            <select
              value={theme}
              onChange={(e) => {
                const newTheme = e.target.value as typeof theme
                setTheme(newTheme)
              }}
              className={getThemeClasses(isDark, {
                dark: "bg-zinc-800 border-zinc-700 text-zinc-100",
                light: "bg-white border-zinc-300 text-zinc-900"
              }, "px-3 py-1.5 rounded-md border text-sm")}
            >
              {availableThemes.map((t) => (
                <option key={t} value={t}>
                  {themeConfig[t].displayName}
                </option>
              ))}
            </select>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className={cn(
                "h-9 w-9",
                isDark 
                  ? "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700" 
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
              )}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="m4.93 4.93 1.41 1.41"></path>
                  <path d="m17.66 17.66 1.41 1.41"></path>
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="m6.34 17.66-1.41 1.41"></path>
                  <path d="m19.07 4.93-1.41 1.41"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
              )}
            </Button>
          )}
        </div>
      </div>

      <DynamicFeatureList includeIds={["clipboard", "text-selection", "exclude-from-screenshot", "output-window"]} />
    </div>
  )
}









