import { FileText, PlaySquare } from "lucide-react"
import { PromptVideoPreview, isVideoFile } from "./prompt-video-preview"
import { PromptAudioPreview, isAudioFile } from "./prompt-audio-preview"
import { isImageFile } from "./prompt-image-preview"
import { cn } from "@/lib/utils"
import { getFileIcon } from "./prompt-shared"
import type { FileItemsBaseProps } from "./types/prompt-input-props"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"
import { useFeature } from "@/shared/providers/FeatureProvider"
import { openYoutubePlayer, parseYoutubeClipboardUrl } from "@/lib/open-youtube-player"
import { ReferenceChips } from "./components/reference-chips"
import type { PromptReference } from "./types/prompt-reference"

interface CollapsedFileItemsProps extends FileItemsBaseProps {
  references?: PromptReference[]
  onRemoveReference?: (id: string) => void
  isDarkTheme?: boolean
}

export function CollapsedFileItems({
  files,
  clipboardItems,
  references,
  onRemoveFile,
  onRemoveClipboardItem,
  onRemoveReference,
  themeClasses,
  isDarkTheme = true,
}: CollapsedFileItemsProps) {
  const { isFeatureEnabled } = useFeature()
  const isYoutubePlayerEnabled = isFeatureEnabled('youtube-player')

  const hasReferences = references && references.length > 0
  const inlineFiles = files
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => !isImageFile(file) && !isVideoFile(file))

  if (inlineFiles.length === 0 && (!clipboardItems || clipboardItems.length === 0) && !hasReferences) {
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
      {clipboardItems?.map((item, index) => {
        const youtubeUrl =
          isYoutubePlayerEnabled ? parseYoutubeClipboardUrl(item) : null

        return (
        <div
          key={`clipboard-${index}`}
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded bg-muted shrink-0 cursor-pointer",
            themeClasses.fileItem
          )}
          onClick={(e) => {
            e.stopPropagation()
            if (youtubeUrl) {
              openYoutubePlayer(youtubeUrl)
              return
            }
            onRemoveClipboardItem?.(index)
          }}
          title={youtubeUrl ? 'Open YouTube player' : item}
        >
          {youtubeUrl ? (
            <PlaySquare className={`size-4 ${themeClasses.icon}`} />
          ) : (
            <FileText className={`size-4 ${themeClasses.icon}`} />
          )}
        </div>
        )
      })}
      {inlineFiles.map(({ file, index }) =>
        isAudioFile(file) ? (
          <PromptAudioPreview
            key={`${file.name}-${index}`}
            file={file}
            variant="collapsed"
            isDarkTheme={isDarkTheme}
            themeClasses={themeClasses}
            onRemove={() => onRemoveFile?.(index)}
          />
        ) : (
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
        )
      )}
    </div>
  )
}

