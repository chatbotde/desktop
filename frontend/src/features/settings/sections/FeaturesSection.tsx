import { DynamicFeatureList } from "@/components/features/feature-active"
import { useIsDark } from "@/shared/providers"
import { getThemeClasses } from "@/shared/utils/theme"

export function FeaturesSection() {
  const isDark = useIsDark()

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <div
          className={getThemeClasses(isDark, {
            dark: "text-zinc-100",
            light: "text-zinc-900",
          }, "text-sm font-medium")}
        >
          Features
        </div>
        <p
          className={getThemeClasses(isDark, {
            dark: "text-zinc-400",
            light: "text-zinc-600",
          }, "text-xs mt-1")}
        >
          Enable or disable app capabilities.
        </p>
      </div>

      <DynamicFeatureList />
    </div>
  )
}
