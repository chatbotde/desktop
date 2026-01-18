import { useEffect, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { Settings2 } from "lucide-react"
import {
  getAvailableModels,
  getSelectedModel,
  setSelectedModel,
  type AIModel,
} from "@/lib/ai/model-config"
import { getVisibleModels, MODEL_VISIBILITY_CHANGED_EVENT } from "@/lib/settings/model-visibility"
import { CUSTOM_PROVIDERS_CHANGED_EVENT } from "@/lib/settings/custom-providers"
import { cn } from "@/shared/lib"

interface ModelSelectorPopoverProps {
  isDarkTheme?: boolean
  themeClasses: {
    containerBg: string
    icon: string
    fileText: string
  }
}

export function ModelSelectorPopover({
  isDarkTheme = true,
  themeClasses
}: ModelSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedModel, setSelectedModelState] = useState<AIModel | null>(null)
  const [visibleModels, setVisibleModels] = useState<AIModel[]>([])

  // Load visible models
  const loadModels = () => {
    const allModels = getAvailableModels()
    const visibleIds = getVisibleModels()

    // Filter to only show visible models
    // Custom models (id starts with 'custom-') are always shown if not explicitly hidden
    const models = visibleIds === null
      ? allModels // null means show all
      : allModels.filter((m) => visibleIds.includes(m.id) || m.id.startsWith('custom-'))

    setVisibleModels(models)
    setSelectedModelState(getSelectedModel())
  }

  // Initial load
  useEffect(() => {
    loadModels()
  }, [])

  // Reload when popover opens
  useEffect(() => {
    if (isOpen) {
      loadModels()
    }
  }, [isOpen])

  // Listen for visibility changes from settings
  useEffect(() => {
    const handler = () => {
      loadModels()
    }
    window.addEventListener(MODEL_VISIBILITY_CHANGED_EVENT, handler)
    return () => window.removeEventListener(MODEL_VISIBILITY_CHANGED_EVENT, handler)
  }, [])

  // Listen for custom provider changes
  useEffect(() => {
    const handler = () => {
      loadModels()
    }
    window.addEventListener(CUSTOM_PROVIDERS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(CUSTOM_PROVIDERS_CHANGED_EVENT, handler)
  }, [])

  const handleModelChange = (modelId: string) => {
    const success = setSelectedModel(modelId)
    if (success) {
      const newModel = visibleModels.find(m => m.id === modelId)
      setSelectedModelState(newModel || null)
      setIsOpen(false)
    }
  }

  // Sort alphabetically
  const sortedModels = [...visibleModels].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          data-no-clickthrough
        >
          <Settings2 className={`size-5 ${themeClasses.icon}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-60 p-0 border z-[1002]",
          isDarkTheme ? "border-zinc-700" : "border-zinc-200"
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
        align="start"
        data-no-clickthrough
      >
        <div className="max-h-[400px] overflow-y-auto">
          <div className="p-2">
            {sortedModels.length === 0 ? (
              <div className={cn(
                "px-3 py-4 text-center text-sm",
                isDarkTheme ? "text-zinc-500" : "text-zinc-400"
              )}>
                No models enabled
              </div>
            ) : (
              sortedModels.map((model) => (
                <button
                  key={model.id}
                  className={cn(
                    "w-full px-3 py-2 text-left transition-colors rounded-lg",
                    isDarkTheme ? "hover:bg-zinc-800" : "hover:bg-zinc-50",
                    selectedModel?.id === model.id && (
                      isDarkTheme
                        ? "bg-blue-900/30 border border-blue-700"
                        : "bg-blue-50 border border-blue-200"
                    )
                  )}
                  onClick={() => handleModelChange(model.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "font-medium text-sm truncate",
                      themeClasses.fileText
                    )}>
                      {model.displayName}
                    </span>

                    {selectedModel?.id === model.id && (
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        isDarkTheme ? "bg-blue-400" : "bg-blue-500"
                      )} />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
