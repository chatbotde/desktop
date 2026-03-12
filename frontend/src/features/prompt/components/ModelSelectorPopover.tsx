import { useEffect, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { Settings2, Cloud, User, Image, Code } from "lucide-react"
import {
  getAvailableModels,
  getSelectedModel,
  setSelectedModel,
  type AIModel,
} from "@/lib/ai/model-config"
import { getVisibleModels, MODEL_VISIBILITY_CHANGED_EVENT } from "@/lib/settings/model-visibility"
import { CUSTOM_PROVIDERS_CHANGED_EVENT } from "@/lib/settings/custom-providers"
import { cn } from "@/shared/lib"
import { unifiedLocalLLMService, type LocalLLMModel, toggleLocalLLMCapability } from "@/lib/ai/local-llm"

interface ModelSelectorPopoverProps {
  isDarkTheme?: boolean
  themeClasses: {
    containerBg: string
    icon: string
    fileText: string
  }
  // Local model props from ExpandedActionsBarContext
  ollamaRunning?: boolean | null
  ollamaModels?: LocalLLMModel[]
  selectedLocalModelName?: string | null
  onModelSelect?: (modelName: string) => void
}

export function ModelSelectorPopover({
  isDarkTheme = true,
  themeClasses,
  ollamaRunning,
  ollamaModels = [],
  selectedLocalModelName,
  onModelSelect,
}: ModelSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedModel, setSelectedModelState] = useState<AIModel | null>(null)
  const [visibleModels, setVisibleModels] = useState<AIModel[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load visible models
  const loadModels = () => {
    const allModels = getAvailableModels()
    const visibleIds = getVisibleModels()

    // Filter to only show visible models
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

  // Reload when popover opens or config changes
  useEffect(() => {
    if (isOpen) {
      loadModels()
    }
  }, [isOpen, refreshTrigger])

  // Listen for visibility changes from settings
  useEffect(() => {
    const handler = () => loadModels()
    window.addEventListener(MODEL_VISIBILITY_CHANGED_EVENT, handler)
    window.addEventListener('local-model-config-changed', () => setRefreshTrigger(t => t + 1))
    return () => {
      window.removeEventListener(MODEL_VISIBILITY_CHANGED_EVENT, handler)
      window.removeEventListener('local-model-config-changed', () => setRefreshTrigger(t => t + 1))
    }
  }, [])

  // Listen for custom provider changes
  useEffect(() => {
    const handler = () => loadModels()
    window.addEventListener(CUSTOM_PROVIDERS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(CUSTOM_PROVIDERS_CHANGED_EVENT, handler)
  }, [])

  const handleModelChange = (modelId: string) => {
    // Clear local model selection if a cloud model is selected
    if (onModelSelect && selectedLocalModelName) {
      onModelSelect("") // Hack to clear it in the parent context
    }

    const success = setSelectedModel(modelId)
    if (success) {
      const newModel = visibleModels.find(m => m.id === modelId)
      setSelectedModelState(newModel || null)
      setIsOpen(false)
    }
  }

  const handleLocalModelChange = (modelName: string) => {
    if (onModelSelect) {
      unifiedLocalLLMService.setModel(modelName)
      onModelSelect(modelName)
      setIsOpen(false)
    }
  }

  const handleToggleLocalCapability = (e: React.MouseEvent, modelName: string, capability: any) => {
    e.stopPropagation()
    toggleLocalLLMCapability(modelName, capability)
  }

  // Split into cloud and custom
  const cloudModels = visibleModels.filter(m => !m.isCustom).sort((a, b) => a.displayName.localeCompare(b.displayName))
  const customModels = visibleModels.filter(m => m.isCustom).sort((a, b) => a.displayName.localeCompare(b.displayName))

  const hasLocalModels = ollamaRunning && ollamaModels.length > 0
  const hasAnyCustomOrLocal = customModels.length > 0 || hasLocalModels

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          data-no-clickthrough
          title="Select model"
        >
          <Settings2 className={`size-5 ${themeClasses.icon}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-64 p-0 border shadow-xl overflow-hidden rounded-xl",
          isDarkTheme ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-white"
        )}
        style={{ backgroundColor: themeClasses.containerBg, zIndex: 9999 }}
        align="start"
        side="top"
        sideOffset={16}
        data-no-clickthrough
      >
        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
          {/* Cloud Models Section */}
          <div className="p-2">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider",
              isDarkTheme ? "text-zinc-500" : "text-zinc-400"
            )}>
              <Cloud className="size-3" />
              Cloud Models
            </div>

            {cloudModels.length === 0 ? (
              <div className={cn(
                "px-3 py-4 text-center text-sm",
                isDarkTheme ? "text-zinc-500" : "text-zinc-400"
              )}>
                No cloud models enabled
              </div>
            ) : (
              cloudModels.map((model) => (
                <button
                  key={model.id}
                  className={cn(
                    "w-full px-3 py-2 text-left transition-all rounded-lg mb-0.5 group",
                    isDarkTheme
                      ? "hover:bg-zinc-800"
                      : "hover:bg-zinc-50",
                    selectedModel?.id === model.id && !selectedLocalModelName && (
                      isDarkTheme
                        ? "bg-blue-900/20 border border-blue-800/50"
                        : "bg-blue-50 border border-blue-200"
                    ),
                    !(selectedModel?.id === model.id && !selectedLocalModelName) && "border border-transparent"
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

                    {selectedModel?.id === model.id && !selectedLocalModelName && (
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                        isDarkTheme ? "bg-blue-400" : "bg-blue-500"
                      )} />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Custom & Local Models Section */}
          <div className={cn(
            "p-2 border-t",
            isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/30"
          )}>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider",
              isDarkTheme ? "text-zinc-500" : "text-zinc-400"
            )}>
              <User className="size-3" />
              Custom & Local
            </div>

            {!hasAnyCustomOrLocal ? (
              <div className={cn(
                "px-3 py-4 text-center text-xs italic",
                isDarkTheme ? "text-zinc-600" : "text-zinc-400"
              )}>
                Configure custom APIs or run Ollama locally to see models here
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* Custom API Models */}
                {customModels.map((model) => (
                  <button
                    key={model.id}
                    className={cn(
                      "w-full px-3 py-2 text-left transition-all rounded-lg group",
                      isDarkTheme
                        ? "hover:bg-zinc-800"
                        : "hover:bg-zinc-50",
                      selectedModel?.id === model.id && !selectedLocalModelName && (
                        isDarkTheme
                          ? "bg-purple-900/20 border border-purple-800/50"
                          : "bg-purple-50 border border-purple-200"
                      ),
                      !(selectedModel?.id === model.id && !selectedLocalModelName) && "border border-transparent"
                    )}
                    onClick={() => handleModelChange(model.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={cn(
                          "font-medium text-sm truncate",
                          themeClasses.fileText
                        )}>
                          {model.displayName}
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.5 text-[9px] rounded uppercase font-bold tracking-tighter",
                          isDarkTheme ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-700"
                        )}>
                          Custom
                        </span>
                      </div>

                      {selectedModel?.id === model.id && !selectedLocalModelName && (
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]",
                          isDarkTheme ? "bg-purple-400" : "bg-purple-500"
                        )} />
                      )}
                    </div>
                  </button>
                ))}

                {/* Local Ollama Models */}
                {ollamaModels.map((model) => {
                  const isSelected = selectedLocalModelName === model.name
                  return (
                    <button
                      key={model.name}
                      className={cn(
                        "w-full px-3 py-2 text-left transition-all rounded-lg group",
                        isDarkTheme
                          ? "hover:bg-zinc-800"
                          : "hover:bg-zinc-50",
                        isSelected && (
                          isDarkTheme
                            ? "bg-green-900/20 border border-green-800/50"
                            : "bg-green-50 border border-green-200"
                        ),
                        !isSelected && "border border-transparent"
                      )}
                      onClick={() => handleLocalModelChange(model.name)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={cn(
                            "font-medium text-sm truncate",
                            themeClasses.fileText
                          )}>
                            {model.displayName}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 text-[9px] rounded uppercase font-bold tracking-tighter",
                            isDarkTheme ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-700"
                          )}>
                            Local
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Capability Toggles */}
                          <button
                            onClick={(e) => handleToggleLocalCapability(e, model.name, 'supportsImages')}
                            className={cn(
                              "p-1 rounded hover:bg-zinc-700/50 transition-colors",
                              model.supportsImages ? "text-emerald-400" : "text-zinc-600 grayscale opacity-40 hover:grayscale-0 hover:opacity-100"
                            )}
                            title={model.supportsImages ? "Vision enabled" : "Click to enable vision support"}
                          >
                            <Image className="size-3" />
                          </button>

                          {model.category === 'coding' && (
                            <Code className="size-3 text-blue-400" />
                          )}

                          {isSelected && (
                            <div className={cn(
                              "h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)] ml-1",
                              isDarkTheme ? "bg-green-400" : "bg-green-500"
                            )} />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>


        </div>
      </PopoverContent>
    </Popover>
  )
}
