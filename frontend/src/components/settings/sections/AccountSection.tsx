import { cn } from "@/lib/utils"

export function AccountSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  return (
    <div className="space-y-6">
      <p className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
        Account settings content will go here.
      </p>
    </div>
  )
}
