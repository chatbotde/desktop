import { cn } from "@/lib/utils"
import { BlockSettings } from "@/components/settings/BlockSettings"

export function BlockingSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  return (
    <div className="space-y-4">
      <p className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
        Manage which apps are blocked when focus lock is enabled.
      </p>
      <BlockSettings isDarkTheme={isDarkTheme} />
    </div>
  )
}
