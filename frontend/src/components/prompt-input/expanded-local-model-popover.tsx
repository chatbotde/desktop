import { Cpu } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { cn } from "@/lib/utils"
import { unifiedLocalLLMService } from "@/lib/ai/local-llm"

interface ExpandedLocalModelPopoverProps {
  ollamaRunning: boolean | null
  ollamaModels: string[]
  selectedLocalModelName: string | null
  onModelSelect: (modelName: string) => void
  isDarkTheme: boolean
  themeClasses: {
    containerBg: string
    icon: string
    fileText: string
  }
  hoverClass: string
}

export function ExpandedLocalModelPopover({
  ollamaRunning,
  ollamaModels,
  selectedLocalModelName,
  onModelSelect,
  isDarkTheme,
  themeClasses,
  hoverClass,
}: ExpandedLocalModelPopoverProps) {
  return (
    <PromptInputAction tooltip="Local model (Ollama)">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              hoverClass
            )}
            aria-label="Local model (Ollama)"
            type="button"
          >
            <Cpu className={`size-5 ${themeClasses.icon}`} />
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
              {ollamaRunning === false || ollamaModels.length === 0 ? (
                <div className={cn(
                  "px-2 py-4 text-xs text-center",
                  isDarkTheme ? "text-zinc-500" : "text-zinc-400"
                )}>
                  {ollamaRunning === false
                    ? "Ollama is not running"
                    : "No models available"}
                </div>
              ) : (
                ollamaModels.map((modelName) => {
                  const isSelected = selectedLocalModelName === modelName
                  return (
                    <button
                      key={modelName}
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
                        unifiedLocalLLMService.setModel(modelName)
                        onModelSelect(modelName)
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Cpu className={`size-3 ${themeClasses.icon}`} />
                          <div className={cn(
                            "font-medium text-sm truncate",
                            themeClasses.fileText
                          )}>
                            {modelName}
                          </div>
                        </div>

                        {isSelected && (
                          <div className={cn(
                            "h-2 w-2 rounded-full mt-1 shrink-0",
                            isDarkTheme ? "bg-green-400" : "bg-green-500"
                          )} />
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </PromptInputAction>
  )
}

