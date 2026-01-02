import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFileIcon } from "./prompt-shared"
import type { FileItemsBaseProps } from "./types/prompt-input-props"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"

interface CollapsedFileItemsProps extends FileItemsBaseProps {}

export function CollapsedFileItems({
  files,
  clipboardItems,
  onRemoveFile,
  onRemoveClipboardItem,
  themeClasses,
}: CollapsedFileItemsProps) {
  if (files.length === 0 && (!clipboardItems || clipboardItems.length === 0)) {
    return null
  }

  return (
    <div 
      className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
      style={{ maxWidth: `${PROMPT_INPUT_CONSTANTS.FILE_ITEMS.COLLAPSED_MAX_WIDTH}px` }}
    >
      {clipboardItems?.map((item, index) => (
        <div
          key={`clipboard-${index}`}
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded bg-muted shrink-0 cursor-pointer",
            themeClasses.fileItem
          )}
          onClick={(e) => {
            e.stopPropagation()
            onRemoveClipboardItem?.(index)
          }}
          title={item}
        >
          <FileText className={`size-4 ${themeClasses.icon}`} />
        </div>
      ))}
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded bg-muted shrink-0 cursor-pointer",
            themeClasses.fileItem
          )}
          onClick={(e) => {
            e.stopPropagation()
            onRemoveFile?.(index)
          }}
          title={file.name}
        >
          {getFileIcon(file, themeClasses)}
        </div>
      ))}
    </div>
  )
}

