import { FileText, PlaySquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFileIcon } from "./prompt-shared"
import type { FileItemsBaseProps } from "./types/prompt-input-props"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"
import { useFeature } from "@/shared/providers/FeatureProvider"
import { ReferenceChips } from "./components/reference-chips"
import type { PromptReference } from "./types/prompt-reference"

interface CollapsedFileItemsProps extends FileItemsBaseProps {
  references?: PromptReference[]
  onRemoveReference?: (id: string) => void
}

export function CollapsedFileItems({
  files,
  clipboardItems,
  references,
  onRemoveFile,
  onRemoveClipboardItem,
  onRemoveReference,
  themeClasses,
}: CollapsedFileItemsProps) {
  const { isFeatureEnabled } = useFeature()
  const isYoutubePlayerEnabled = isFeatureEnabled('youtube-player')

  const hasReferences = references && references.length > 0
  if (files.length === 0 && (!clipboardItems || clipboardItems.length === 0) && !hasReferences) {
    return null
  }

  return (
    <div 
      className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
      style={{ maxWidth: `${PROMPT_INPUT_CONSTANTS.FILE_ITEMS.COLLAPSED_MAX_WIDTH}px` }}
    >
      {hasReferences && onRemoveReference && (
        <ReferenceChips
          references={references}
          onRemoveReference={onRemoveReference}
          themeClasses={{ ...themeClasses, fileText: themeClasses.fileText ?? "" }}
          hoverClass=""
          variant="collapsed"
        />
      )}
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
          title={isYoutubePlayerEnabled && item.startsWith('[YouTube] ') ? 'YouTube Video' : item}
        >
          {isYoutubePlayerEnabled && item.startsWith('[YouTube] ') ? (
            <PlaySquare className={`size-4 ${themeClasses.icon}`} />
          ) : (
            <FileText className={`size-4 ${themeClasses.icon}`} />
          )}
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

