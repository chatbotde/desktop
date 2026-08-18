import { FileText, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"
import { unifiedLocalLLMService } from "@/lib/ai/local-llm"
import { FileRemoveButton } from "./components/file-remove-button"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"
import { YoutubeVideoPlayer, extractVideoId } from "./youtube-video-player"
import { PromptVideoPreview, isVideoFile } from "./prompt-video-preview"
import { PromptManimGeneratingPreview } from "./prompt-manim-generating-preview"
import { useManimGenerationStatus } from "./hooks/use-manim-generation-status"
import { PromptImagePreview, isImageFile } from "./prompt-image-preview"
import { PromptAudioPreview, isAudioFile } from "./prompt-audio-preview"
import { PromptGenericFilePreview } from "./prompt-generic-file-preview"
import { useFeature } from "@/shared/providers/FeatureProvider"
import { openYoutubePlayer, parseYoutubeClipboardUrl } from "@/lib/open-youtube-player"
import { ReferenceChips } from "./components/reference-chips"
import type { PromptReference } from "./types/prompt-reference"

interface ExpandedFileItemsProps {
  files: File[]
  clipboardItems?: string[]
  references?: PromptReference[]
  onRemoveReference?: (id: string) => void
  selectedLocalModelName: string | null
  onRemoveFile: (index: number) => void
  onRemoveClipboardItem?: (index: number) => void
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
  references,
  selectedLocalModelName,
  onRemoveFile,
  onRemoveClipboardItem,
  onRemoveReference,
  isDarkTheme,
  themeClasses,
  hoverClass,
  onLocalModelClear,
}: ExpandedFileItemsProps) {
  const { isFeatureEnabled } = useFeature()
  const isYoutubePlayerEnabled = isFeatureEnabled('youtube-player')
  const manimStatus = useManimGenerationStatus()
  const isManimGenerating = manimStatus.phase === 'generating'

  const hasReferences = references && references.length > 0
  if (!isManimGenerating && !selectedLocalModelName && files.length === 0 && (!clipboardItems || clipboardItems.length === 0) && !hasReferences) {
    return null
  }

  return (
    <div
      className="flex flex-wrap gap-2 pb-1 overflow-y-auto"
      style={{ maxHeight: `${PROMPT_INPUT_CONSTANTS.FILE_ITEMS.EXPANDED_MAX_HEIGHT}px` }}
    >
      {hasReferences && onRemoveReference && (
        <ReferenceChips
          references={references}
          onRemoveReference={onRemoveReference}
          themeClasses={themeClasses}
          hoverClass={hoverClass}
          variant="expanded"
        />
      )}

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

      {isManimGenerating && (
        <PromptManimGeneratingPreview
          topic={manimStatus.phase === 'generating' ? manimStatus.topic : undefined}
          variant="expanded"
        />
      )}

      {clipboardItems?.map((item, index) => {
        const url = isYoutubePlayerEnabled ? parseYoutubeClipboardUrl(item) : null

        if (url && extractVideoId(url)) {
            return (
              <div key={`clipboard-${index}`} className="relative shrink-0">
                <YoutubeVideoPlayer 
                  url={url} 
                  className="max-w-[200px]" 
                  onRemove={() => onRemoveClipboardItem?.(index)}
                  onOpenInOverlay={() => openYoutubePlayer(url)}
                />
              </div>
            );
        }
        
        return (
          <div
            key={`clipboard-${index}`}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1 text-sm border max-w-[200px]",
              themeClasses.fileItem
            )}
            onClick={e => e.stopPropagation()}
            title={item.startsWith('[YouTube] ') ? item.substring(10, 50) + '...' : item}
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
        );
      })}

      {files.map((file, index) => {
        if (isImageFile(file)) {
          return (
            <PromptImagePreview
              key={`${file.name}-${index}`}
              file={file}
              variant="expanded"
              onRemove={() => onRemoveFile(index)}
            />
          )
        }

        if (isVideoFile(file)) {
          return (
            <PromptVideoPreview
              key={`${file.name}-${index}`}
              file={file}
              variant="expanded"
              onRemove={() => onRemoveFile(index)}
            />
          )
        }

        if (isAudioFile(file)) {
          return (
            <PromptAudioPreview
              key={`${file.name}-${index}`}
              file={file}
              variant="expanded"
              isDarkTheme={isDarkTheme}
              themeClasses={themeClasses}
              onRemove={() => onRemoveFile(index)}
            />
          )
        }

        // PDF, documents, and any other attachment
        return (
          <PromptGenericFilePreview
            key={`${file.name}-${index}`}
            file={file}
            variant="expanded"
            themeClasses={themeClasses}
            hoverClass={hoverClass}
            onRemove={() => onRemoveFile(index)}
          />
        )
      })}
    </div>
  )
}

