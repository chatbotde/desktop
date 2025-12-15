import { cn } from "@/lib/utils"
import { DynamicFeatureList } from "@/components/features/feature-active"

export function FeaturesSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
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
      <DynamicFeatureList />
    </div>
  )
}
