import { useEffect, useState } from "react"
import { Search, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Switch } from "@/shared/components/ui/switch"
import { Input } from "@/shared/components/ui/input"

import { getAvailableModels, type AIModel } from "@/lib/ai/model-config"
import {
  getVisibleModels,
  setVisibleModels,
} from "@/lib/settings/model-visibility"

export function ModelProfileListSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  const [allModels, setAllModels] = useState<AIModel[]>([])
  const [visibleModelIds, setVisibleModelIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Load models and visibility state
  useEffect(() => {
    const models = getAvailableModels()
    setAllModels(models)

    const savedVisible = getVisibleModels()
    if (savedVisible === null) {
      // No settings yet - all models are visible by default
      const allIds = models.map(m => m.id)
      setVisibleModelIds(allIds)
    } else {
      setVisibleModelIds(savedVisible)
    }
  }, [])

  const handleToggle = (modelId: string, isOn: boolean) => {
    let newVisible: string[]

    if (isOn) {
      // Add model to visible list
      newVisible = [...visibleModelIds, modelId]
    } else {
      // Remove model from visible list
      newVisible = visibleModelIds.filter(id => id !== modelId)
    }

    // Update local state
    setVisibleModelIds(newVisible)

    // Save to localStorage and emit event
    setVisibleModels(newVisible)
  }

  // Sort models alphabetically
  const sortedModels = [...allModels].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className={cn(
          "flex items-center gap-2 text-sm font-medium",
          isDarkTheme ? "text-zinc-100" : "text-zinc-900"
        )}>
          <Sparkles className="h-4 w-4" />
          Model Profile List
        </div>
        <p className={cn(
          "text-xs mt-1",
          isDarkTheme ? "text-zinc-400" : "text-zinc-600"
        )}>
          Toggle to show/hide models in the model selector.
        </p>
      </div>

      {/* Search Box */}
      <div className={cn(
        "sticky top-0 z-10 py-2 -mx-2 px-2",
        isDarkTheme ? "bg-[#09090b]" : "bg-white"
      )}>
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            isDarkTheme ? "text-zinc-400" : "text-zinc-500"
          )} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className={cn(
              "pl-9",
              isDarkTheme && "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
            )}
          />
        </div>
      </div>

      {/* Model List */}
      <div className="space-y-1">
        {sortedModels.map((model) => {
          const isVisible = visibleModelIds.includes(model.id)
          if (!model.displayName.toLowerCase().includes(searchQuery.toLowerCase())) return null

          return (
            <div
              key={model.id}
              className={cn(
                "flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
                isDarkTheme
                  ? "border-zinc-800 hover:bg-zinc-800/30"
                  : "border-zinc-200 hover:bg-zinc-50"
              )}
            >
              <div className="min-w-0 flex-1">
                <span className={cn(
                  "block text-sm font-medium truncate",
                  isDarkTheme ? "text-zinc-100" : "text-zinc-900"
                )}>
                  {model.displayName}
                </span>
              </div>

              <Switch
                checked={isVisible}
                onCheckedChange={(checked) => handleToggle(model.id, checked)}
                className={cn(
                  "shrink-0",
                  isDarkTheme
                    ? "data-[state=unchecked]:bg-zinc-700 data-[state=checked]:bg-emerald-600"
                    : "data-[state=unchecked]:bg-zinc-200 data-[state=checked]:bg-emerald-600"
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

