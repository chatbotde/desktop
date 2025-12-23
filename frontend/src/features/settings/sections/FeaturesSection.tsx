import { cn } from "@/shared/lib/utils"
import { DynamicFeatureList } from "@/components/features/feature-active"
import { Button } from "@/shared/components/ui/button"

type FeaturesSectionProps = {
  isDarkTheme?: boolean
  onThemeChange?: (isDark: boolean) => void
}

export function FeaturesSection({ isDarkTheme = false, onThemeChange }: FeaturesSectionProps) {
  const handleThemeToggle = () => {
    if (onThemeChange) {
      onThemeChange(!isDarkTheme)
    }
  }

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <div className={cn("flex items-center gap-2 text-sm font-medium", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
          Features
        </div>
        <p className={cn("text-xs mt-1", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
          Enable or disable features to customize your experience.
        </p>
      </div>
      
      {/* Theme Toggle Button */}
      <div className={cn("flex items-center justify-between p-4 rounded-lg border", isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50")}>
        <div className="flex flex-col gap-1">
          <div className={cn("text-sm font-medium", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
            Theme
          </div>
          <div className={cn("text-xs", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
            Switch between light and dark mode
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleThemeToggle}
          className={cn(
            "h-9 w-9",
            isDarkTheme 
              ? "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700" 
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
          )}
          title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkTheme ? (
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
      </div>

      <DynamicFeatureList />
    </div>
  )
}








