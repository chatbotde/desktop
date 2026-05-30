import { cn } from "@/shared/lib"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import type { SettingsMenuGroup, SettingsSectionId } from "../menu"

type SettingsSidebarProps = {
  groups: SettingsMenuGroup[]
  activeSection: SettingsSectionId
  onSelect: (id: SettingsSectionId) => void
  isDarkTheme?: boolean
}

export function SettingsSidebar({
  groups,
  activeSection,
  onSelect,
  isDarkTheme = false,
}: SettingsSidebarProps) {
  return (
    <aside
      className={cn(
        "w-[52px] shrink-0 border-r overflow-y-auto",
        isDarkTheme ? "border-zinc-800" : "border-zinc-200"
      )}
      aria-label="Settings sections"
    >
      <TooltipProvider delayDuration={200}>
        <nav className="flex flex-col items-center py-2 gap-0.5">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="flex flex-col items-center w-full">
              {groupIndex > 0 && (
                <div
                  className={cn(
                    "my-1.5 h-px w-6",
                    isDarkTheme ? "bg-zinc-700" : "bg-zinc-200"
                  )}
                  aria-hidden
                />
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelect(item.id)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? isDarkTheme
                              ? "bg-zinc-800 text-zinc-100"
                              : "bg-zinc-100 text-zinc-900"
                            : isDarkTheme
                              ? "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                              : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-800"
                        )}
                        type="button"
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="max-w-[220px]">
                      <p className="font-medium">{item.label}</p>
                      {item.description ? (
                        <p className="mt-0.5 text-zinc-400 font-normal">{item.description}</p>
                      ) : null}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </nav>
      </TooltipProvider>
    </aside>
  )
}
