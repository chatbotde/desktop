import { cn } from "@/shared/lib"
import type { SettingsMenuItem, SettingsSectionId } from "../menu"

type SettingsSidebarProps = {
  items: SettingsMenuItem[]
  activeSection: SettingsSectionId
  onSelect: (id: SettingsSectionId) => void
  isDarkTheme?: boolean
}

export function SettingsSidebar({ items, activeSection, onSelect, isDarkTheme = false }: SettingsSidebarProps) {
  return (
    <aside
      className={cn(
        "w-56 shrink-0 border-r overflow-y-auto",
        isDarkTheme ? "border-zinc-800" : "border-zinc-200"
      )}
    >
      <div className="p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                isActive
                  ? isDarkTheme
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-zinc-100 text-zinc-900"
                  : isDarkTheme
                    ? "text-zinc-300 hover:bg-zinc-800/60"
                    : "text-zinc-700 hover:bg-zinc-100/60"
              )}
              type="button"
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
