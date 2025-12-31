import { cn } from "@/shared/lib/utils"

export function GeneralSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  return (
    <div className="space-y-6">
      <p className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
        General settings content will go here.
      </p>
    </div>
  )
}
















