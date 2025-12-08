import { useState, useEffect } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import {
  getAvailableModels,
  getSelectedModel,
  setSelectedModel,
  type AIModel,
} from "@/lib/ai/model-config"
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
  const [selectedModel, setSelectedModelState] = useState<AIModel | null>(null)
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])

  useEffect(() => {
    const models = getAvailableModels()
    const currentModel = getSelectedModel()
    setAvailableModels(models)
    setSelectedModelState(currentModel)
  }, [])

  const handleModelChange = (modelId: string) => {
    const success = setSelectedModel(modelId)
    if (success) {
      const newModel = availableModels.find(m => m.id === modelId)
      setSelectedModelState(newModel || null)
      setIsOpen(false)
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
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
            <path d="M8.5 8.5v.01"/>
            <path d="M16 15.5v.01"/>
            <path d="M12 12v.01"/>
          </svg>
        )
      default:
        return <Sparkles className={iconClass} />
    }
  }

  const getProviderColor = (provider: string) => {
    if (isDarkTheme) {
      switch (provider) {
        case 'google':
          return 'bg-blue-900/50 text-blue-300 border-blue-700'
        case 'openai':
          return 'bg-green-900/50 text-green-300 border-green-700'
        case 'anthropic':
          return 'bg-purple-900/50 text-purple-300 border-purple-700'
        case 'openrouter':
          return 'bg-orange-900/50 text-orange-300 border-orange-700'
        default:
          return 'bg-zinc-800 text-zinc-300 border-zinc-700'
      }
    } else {
      switch (provider) {
        case 'google':
          return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'openai':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'anthropic':
          return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'openrouter':
          return 'bg-orange-100 text-orange-800 border-orange-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
  }

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
          "w-96 p-0 border",
          isDarkTheme 
            ? "border-zinc-700" 
            : "border-zinc-200"
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
        align="start"
        data-no-clickthrough
      >
        <div className="max-h-[400px] overflow-y-auto">
          <div 
            className={cn(
              "p-4 border-b sticky top-0 z-10",
              isDarkTheme ? "border-zinc-700" : "border-zinc-200"
            )}
            style={{ backgroundColor: themeClasses.containerBg }}
          >
            <h3 className={cn(
              "font-semibold text-sm",
              themeClasses.fileText
            )}>
              Choose AI Model
            </h3>
            <p className={cn(
              "text-xs mt-1",
              themeClasses.icon
            )}>
              Select the AI model for your conversations
            </p>
          </div>
          
          <div className="p-2">
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
                      "w-full p-3 text-left transition-colors rounded-lg mt-1",
                      isDarkTheme 
                        ? "hover:bg-zinc-800" 
                        : "hover:bg-zinc-50",
                      selectedModel?.id === model.id && (
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
                          <div className={cn(
                            "text-xs mt-0.5 line-clamp-2",
                            themeClasses.icon
                          )}>
                            {model.description}
                          </div>
                        </div>
                      </div>
                      
                      {selectedModel?.id === model.id && (
                        <div className={cn(
                          "h-2 w-2 rounded-full mt-1 shrink-0",
                          isDarkTheme ? "bg-blue-400" : "bg-blue-500"
                        )} />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getProviderColor(model.provider))}
                      >
                        {model.provider}
                      </Badge>
                      
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
