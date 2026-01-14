import { Image, FileText, Cpu, Power } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFileIcon } from "./prompt-shared"
import { unifiedLocalLLMService } from "@/lib/ai/local-llm"
import { FileRemoveButton } from "./components/file-remove-button"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"

interface ExpandedFileItemsProps {
  files: File[]
  clipboardItems?: string[]
  selectedLocalModelName: string | null
  onRemoveFile: (index: number) => void
  onRemoveClipboardItem?: (index: number) => void
  onDisableAutoScreenshot: () => void
  isAutoScreenshot: (file: File) => boolean
  isDarkTheme: boolean
  themeClasses: {
    fileItem: string
    fileText: string
    icon: string
  }
  hoverClass: string
  onLocalModelClear: () => void
}

export function ExpandedFileItems({
  files,
  clipboardItems,
  selectedLocalModelName,
  onRemoveFile,
  onRemoveClipboardItem,
  onDisableAutoScreenshot,
  isAutoScreenshot,
  isDarkTheme,
  themeClasses,
  hoverClass,
  onLocalModelClear,
}: ExpandedFileItemsProps) {
  if (!selectedLocalModelName && files.length === 0 && (!clipboardItems || clipboardItems.length === 0)) {
    return null
  }

  return (
    <div
      className="flex flex-wrap gap-2 pb-1 overflow-y-auto"
      style={{ maxHeight: `${PROMPT_INPUT_CONSTANTS.FILE_ITEMS.EXPANDED_MAX_HEIGHT}px` }}
    >
      {selectedLocalModelName && (
        <div
          key={`selected-local-${selectedLocalModelName}`}
          className={cn(
            "flex items-center gap-2 rounded-full px-2 py-1 text-xs border max-w-[260px]",
            themeClasses.fileItem,
            isDarkTheme ? "border-green-600" : "border-green-400"
          )}
          onClick={(e) => e.stopPropagation()}
          title={`Chat using local model: ${selectedLocalModelName}`}
        >
          <Cpu className={`size-3 ${themeClasses.icon} shrink-0`} aria-hidden="true" />
          <span className={cn("truncate", themeClasses.fileText)}>{selectedLocalModelName}</span>
          <FileRemoveButton
            onClick={(e) => {
              e.stopPropagation()
              unifiedLocalLLMService.clearModel()
              onLocalModelClear()
            }}
            ariaLabel="Clear local model selection"
            themeClasses={themeClasses}
            hoverClass={hoverClass}
            size="sm"
          />
        </div>
      )}

      {clipboardItems?.map((item, index) => (
        <div
          key={`clipboard-${index}`}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1 text-sm border max-w-[200px]",
            themeClasses.fileItem
          )}
          onClick={e => e.stopPropagation()}
          title={item}
        >
          <FileText className={`size-4 ${themeClasses.icon} shrink-0`} aria-hidden="true" />
          <FileRemoveButton
            onClick={() => onRemoveClipboardItem?.(index)}
            ariaLabel="Remove clipboard item"
            themeClasses={themeClasses}
            hoverClass={hoverClass}
            size="sm"
          />
        </div>
      ))}

      {files.map((file, index) => {
        const isAuto = isAutoScreenshot(file)

        // For auto-screenshots, show expanded horizontal layout with preview
        if (isAuto) {
          return (
            <div
              key={`${file.name}-${index}`}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-2",
                themeClasses.fileItem
              )}
              onClick={e => e.stopPropagation()}
            >
              <Image className={`size-4 ${themeClasses.icon} shrink-0`} />

              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDisableAutoScreenshot()
                  }}
                  aria-label="Disable auto-screenshot"
                  className={cn(
                    "rounded-full p-1.5 transition-colors",
                    isDarkTheme ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                  )}
                  title="Disable auto-screenshot"
                >
                  <Power className="size-4" />
                </button>
                <FileRemoveButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFile(index)
                  }}
                  ariaLabel={`Remove ${file.name}`}
                  themeClasses={themeClasses}
                  hoverClass={hoverClass}
                />
              </div>
            </div>
          )
        }

        // For regular files, show compact icon form
        return (
          <div
            key={`${file.name}-${index}`}
            className={cn(
              "flex items-center gap-2 rounded-lg px-1 py-1 text-sm border",
              themeClasses.fileItem
            )}
            onClick={e => e.stopPropagation()}
          >
            {getFileIcon(file, themeClasses)}
            <FileRemoveButton
              onClick={() => onRemoveFile(index)}
              ariaLabel={`Remove ${file.name}`}
              themeClasses={themeClasses}
              hoverClass={hoverClass}
            />
          </div>
        )
      })}
    </div>
  )
}

