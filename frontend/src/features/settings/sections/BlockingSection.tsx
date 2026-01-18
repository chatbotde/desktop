import { cn } from "@/shared/lib/utils"
import { BlockSettings } from "../components/BlockSettings"

export function BlockingSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  return (
    <div className="space-y-4">
      <p className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
        Manage where you don't need help of this application
      </p>
      <BlockSettings isDarkTheme={isDarkTheme} />
    </div>
  )
}




















