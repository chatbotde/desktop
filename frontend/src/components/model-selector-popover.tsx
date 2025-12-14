import { useState, useEffect } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Cpu } from "lucide-react"
import {
  getAvailableModels,
  getSelectedModel,
  setSelectedModel,
  type AIModel,
} from "@/lib/ai/model-config"
import {
  unifiedLocalLLMService,
  getLocalLLMModels,
  type LocalLLMModel,
} from "@/lib/ai/local-llm"
import { cn } from "@/lib/utils"

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
  const [selectedModel, setSelectedModelState] = useState<AIModel | LocalLLMModel | null>(null)
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [localLLMModels, setLocalLLMModels] = useState<LocalLLMModel[]>([])
  const [selectedLocalModel, setSelectedLocalModel] = useState<LocalLLMModel | null>(null)
  const [isLocalLLMLoading, setIsLocalLLMLoading] = useState(false)
  const [isUsingLocalLLM, setIsUsingLocalLLM] = useState(false)

  useEffect(() => {
    // Load cloud models
    const models = getAvailableModels()
    const currentModel = getSelectedModel()
    setAvailableModels(models)
    setSelectedModelState(currentModel)
    setIsUsingLocalLLM(false)

    // Load local LLM models
    loadLocalLLMModels()
  }, [])

  const loadLocalLLMModels = async () => {
    setIsLocalLLMLoading(true)
    try {
      const initResult = await unifiedLocalLLMService.initialize()
      if (initResult.success) {
        const models = unifiedLocalLLMService.getAvailableModels()
        setLocalLLMModels(models)
        
        // Check if a local model is currently selected
        const currentLocalModel = unifiedLocalLLMService.getCurrentModel()
        if (currentLocalModel) {
          setSelectedLocalModel(currentLocalModel)
          setIsUsingLocalLLM(true)
        }
      }
    } catch (error) {
      console.error('Failed to load local LLM models:', error)
    } finally {
      setIsLocalLLMLoading(false)
    }
  }

  const handleModelChange = (modelId: string) => {
    const success = setSelectedModel(modelId)
    if (success) {
      const newModel = availableModels.find(m => m.id === modelId)
      setSelectedModelState(newModel || null)
      setSelectedLocalModel(null)
      setIsUsingLocalLLM(false)
      setIsOpen(false)
    }
  }

  const handleLocalLLMModelChange = async (modelIdOrName: string) => {
    try {
      console.log('Setting local LLM model:', modelIdOrName);
      // Ensure service is initialized first
      await unifiedLocalLLMService.initialize();
      
      // Set the model
      unifiedLocalLLMService.setModel(modelIdOrName)
      
      // Verify it was set
      const currentModel = unifiedLocalLLMService.getCurrentModel();
      console.log('Local LLM model set to:', currentModel?.displayName, '(', currentModel?.name, ')');
      
      const newModel = localLLMModels.find(m => m.id === modelIdOrName || m.name === modelIdOrName) || currentModel
      setSelectedLocalModel(newModel || null)
      setSelectedModelState(null)
      setIsUsingLocalLLM(true)
      setIsOpen(false)
      
      console.log('✅ Local LLM model selection complete');
    } catch (error) {
      console.error('❌ Failed to set local LLM model:', error)
    }
  }

  const modelsByProvider = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<string, AIModel[]>)

  const getCategoryIcon = (category: string) => {
    const iconClass = `size-3 ${themeClasses.icon}`
    switch (category) {
      case 'multimodal':
        return <Sparkles className={iconClass} />
      case 'reasoning':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
            <path d="M8.5 8.5v.01" />
            <path d="M16 15.5v.01" />
            <path d="M12 12v.01" />
          </svg>
        )
      default:
        return <Sparkles className={iconClass} />
    }
  }

  const getLocalLLMCategoryIcon = (category: string) => {
    const iconClass = `size-3 ${themeClasses.icon}`
    switch (category) {
      case 'multimodal':
        return <Sparkles className={iconClass} />
      case 'coding':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        )
      default:
        return <Cpu className={iconClass} />
    }
  }



  // Refresh local models when popover opens
  useEffect(() => {
    if (isOpen) {
      loadLocalLLMModels()
    }
  }, [isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          data-no-clickthrough
        >
          <Sparkles className={`size-5 ${themeClasses.icon}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-60 p-0 border",
          isDarkTheme
            ? "border-zinc-700"
            : "border-zinc-200"
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
        align="start"
        data-no-clickthrough
      >
        <div className="max-h-[400px] overflow-y-auto">
          <div className="p-2">
            {/* Local LLM Models Section */}
            {localLLMModels.length > 0 && (
              <div className="mb-4">
                <div className={cn(
                  "px-2 py-2 text-xs font-medium uppercase border-b flex items-center gap-2",
                  isDarkTheme
                    ? "text-zinc-400 border-zinc-700"
                    : "text-zinc-500 border-zinc-200"
                )}>
                  <Cpu className="size-3" />
                  Local LLM Models
                </div>

                {isLocalLLMLoading ? (
                  <div className={cn(
                    "px-2 py-4 text-xs text-center",
                    isDarkTheme ? "text-zinc-500" : "text-zinc-400"
                  )}>
                    Loading local models...
                  </div>
                ) : (
                  localLLMModels.map((model) => {
                    const isSelected = selectedLocalModel?.id === model.id || selectedLocalModel?.name === model.name
                    return (
                      <button
                        key={model.id}
                        className={cn(
                          "w-full p-1 text-left transition-colors rounded-lg mt-1",
                          isDarkTheme
                            ? "hover:bg-zinc-800"
                            : "hover:bg-zinc-50",
                          isSelected && (
                            isDarkTheme
                              ? "bg-green-900/30 border border-green-700"
                              : "bg-green-50 border border-green-200"
                          )
                        )}
                        onClick={() => {
                          console.log('Model clicked:', model.id, 'or', model.name);
                          handleLocalLLMModelChange(model.id || model.name);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getLocalLLMCategoryIcon(model.category)}
                            <div className="min-w-0 flex-1">
                              <div className={cn(
                                "font-medium text-sm truncate",
                                themeClasses.fileText
                              )}>
                                {model.displayName}
                              </div>
                              {model.size && (
                                <div className={cn(
                                  "text-xs mt-0.5",
                                  isDarkTheme ? "text-zinc-500" : "text-zinc-400"
                                )}>
                                  {model.size}
                                </div>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <div className={cn(
                              "h-2 w-2 rounded-full mt-1 shrink-0",
                              isDarkTheme ? "bg-green-400" : "bg-green-500"
                            )} />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              isDarkTheme
                                ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200"
                            )}
                          >
                            {model.category}
                          </Badge>
                          {model.recommended && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                isDarkTheme
                                  ? "bg-green-900/20 text-green-400 border-green-700"
                                  : "bg-green-50 text-green-700 border-green-200"
                              )}
                            >
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {/* Cloud Models Section */}
            {Object.entries(modelsByProvider).map(([provider, models]) => (
              <div key={provider} className="mb-4 last:mb-0">
                <div className={cn(
                  "px-2 py-2 text-xs font-medium uppercase border-b",
                  isDarkTheme
                    ? "text-zinc-400 border-zinc-700"
                    : "text-zinc-500 border-zinc-200"
                )}>
                  {provider} Models
                </div>

                {models.map((model) => (
                  <button
                    key={model.id}
                    className={cn(
                      "w-full p-1 text-left transition-colors rounded-lg mt-1",
                      isDarkTheme
                        ? "hover:bg-zinc-800"
                        : "hover:bg-zinc-50",
                      selectedModel?.id === model.id && !isUsingLocalLLM && (
                        isDarkTheme
                          ? "bg-blue-900/30 border border-blue-700"
                          : "bg-blue-50 border border-blue-200"
                      )
                    )}
                    onClick={() => handleModelChange(model.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getCategoryIcon(model.category)}
                        <div className="min-w-0 flex-1">
                          <div className={cn(
                            "font-medium text-sm truncate",
                            themeClasses.fileText
                          )}>
                            {model.displayName}
                          </div>
                        </div>
                      </div>

                      {selectedModel?.id === model.id && !isUsingLocalLLM && (
                        <div className={cn(
                          "h-2 w-2 rounded-full mt-1 shrink-0",
                          isDarkTheme ? "bg-blue-400" : "bg-blue-500"
                        )} />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          isDarkTheme
                            ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                            : "bg-zinc-100 text-zinc-700 border-zinc-200"
                        )}
                      >
                        {model.category}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
