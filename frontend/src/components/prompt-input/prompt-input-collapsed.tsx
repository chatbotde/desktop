import { Plus } from "lucide-react"
import { ReferenceButton } from "./actions/reference-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { MediaUploadCard, MEDIA_UPLOAD_CONSTANTS } from "../media-upload-card"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { usePasteHandler } from "./prompt-shared"
import { MicHoverAudioPill } from "@/features/audio"
import { VideoHoverCapturePill } from "@/features/capture/components"
import { CollapsedFileItems } from "./collapsed-file-items"
import { PromptImagePreview, isImageFile } from "./prompt-image-preview"
import { PromptVideoPreview, isVideoFile } from "./prompt-video-preview"
import { PromptGenericFilePreview } from "./prompt-generic-file-preview"
import { PromptManimGeneratingPreview } from "./prompt-manim-generating-preview"
import { useManimGenerationStatus } from "./hooks/use-manim-generation-status"
import { CollapsedSubmitButton } from "./collapsed-submit-button"
import { usePromptTheme } from "./hooks/use-prompt-theme"
import { useCanSubmit } from "./hooks/use-can-submit"
import { useKeyboardSubmit } from "./hooks/use-keyboard-submit"
import { PromptInputHeader } from "./components/prompt-input-header"
import type { PromptInputCollapsedProps } from "./types/prompt-input-props"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"

export function PromptInputCollapsed({
  input,
  setInput,
  isLoading,
  files,
  clipboardItems,
  references = [],
  onReferenceAdd,
  onRemoveReference,
  onSubmit,
  onStop,
  onExpand,
  onHide,
  isDarkTheme = true,
  onFilesAdded,
  onMoreClick,
  onRemoveFile,
  onClipboardItemAdd,
  onRemoveClipboardItem,
  onThemeChange,
  isOutputVisible,
  onToggleOutput,
  setClipboardItems,
  setIsExpanded,
}: PromptInputCollapsedProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const { themeClasses, hoverClass } = usePromptTheme(isDarkTheme)
  const canSubmit = useCanSubmit({ input, files, clipboardItems, references })
  const handleKeyDown = useKeyboardSubmit(onSubmit)
  const manimStatus = useManimGenerationStatus()
  const isManimGenerating = manimStatus.phase === 'generating'

  // Create a dummy setter if not provided (for backwards compatibility)
  const clipboardSetter = setClipboardItems ?? (() => { })
  const expandedSetter = setIsExpanded ?? onExpand

  const handlePaste = usePasteHandler({
    onFilesAdded,
    setClipboardItems: clipboardSetter,
    setIsExpanded: expandedSetter,
  })

  const mediaFiles = files.filter((file) => isImageFile(file) || isVideoFile(file))
  const documentFiles = files.filter(
    (file) => !isImageFile(file) && !isVideoFile(file),
  )
  const showAttachmentRow =
    isManimGenerating || mediaFiles.length > 0 || documentFiles.length > 0

  return (
    <div className="relative flex flex-col gap-2 mx-0 mb-0 transition-all duration-300 ease-in-out" style={{ zIndex: PROMPT_INPUT_CONSTANTS.Z_INDEX.CONTAINER }}>
      {showAttachmentRow && (
        <div className="flex flex-wrap gap-2 justify-start px-1">
          {isManimGenerating && (
            <PromptManimGeneratingPreview
              topic={manimStatus.phase === 'generating' ? manimStatus.topic : undefined}
              variant="expanded"
            />
          )}
          {files.map((file, index) => {
            if (isImageFile(file)) {
              return (
                <PromptImagePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  variant="expanded"
                  onRemove={() => onRemoveFile?.(index)}
                />
              )
            }
            if (isVideoFile(file)) {
              return (
                <PromptVideoPreview
                  key={`${file.name}-${index}`}
                  file={file}
                  variant="expanded"
                  onRemove={() => onRemoveFile?.(index)}
                />
              )
            }
            return (
              <PromptGenericFilePreview
                key={`${file.name}-${index}`}
                file={file}
                variant="expanded"
                themeClasses={themeClasses}
                hoverClass={hoverClass}
                onRemove={() => onRemoveFile?.(index)}
              />
            )
          })}
        </div>
      )}
      <div className="relative flex items-center gap-2">
      <PromptInputHeader
        onClipboardItemAdd={onClipboardItemAdd}
        setInput={setInput}
        input={input}
        onFilesAdded={onFilesAdded}
        isDarkTheme={isDarkTheme}
        themeClasses={themeClasses}
      />
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-2 py-1 border flex-1 transition-all duration-300 ease-in-out",
          themeClasses.containerSurface,
          themeClasses.containerBorder
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Add media"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0",
                hoverClass
              )}
            >
              <Plus className={`size-4 ${themeClasses.icon}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className={MEDIA_UPLOAD_CONSTANTS.POPOVER_CONTENT_CLASS}
            align="start"
            side="top"
            sideOffset={8}
            collisionPadding={16}
            style={{ zIndex: 1002 }}
          >
            <MediaUploadCard onFileUpload={onFilesAdded} isDarkTheme={isDarkTheme} onMoreClick={onMoreClick} onThemeChange={onThemeChange} />
          </PopoverContent>
        </Popover>

        {onReferenceAdd && (
          <ReferenceButton
            isDarkTheme={isDarkTheme}
            themeClasses={themeClasses}
            hoverClass={hoverClass}
            selectedReferences={references}
            onReferenceAdd={onReferenceAdd}
          />
        )}

        <CollapsedFileItems
          files={files}
          clipboardItems={clipboardItems}
          references={references}
          onRemoveFile={onRemoveFile}
          onRemoveClipboardItem={onRemoveClipboardItem}
          onRemoveReference={onRemoveReference}
          themeClasses={themeClasses}
          isDarkTheme={isDarkTheme}
        />

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask anything..."
          aria-label="Message input"
          className={cn(
            "flex-1 bg-transparent text-base outline-none border-0 py-2 min-w-0",
            themeClasses.input
          )}
        />

        <MicHoverAudioPill
          isDarkTheme={isDarkTheme}
          className="h-8 w-8 shrink-0"
        />

        <VideoHoverCapturePill
          isDarkTheme={isDarkTheme}
          className="h-8 w-8 shrink-0"
        />

        <CollapsedSubmitButton
          isLoading={isLoading}
          canSubmit={canSubmit}
          onSubmit={onSubmit}
          onStop={onStop}
          onExpand={onExpand}
          onHide={onHide}
          onToggleOutput={onToggleOutput}
          isOutputVisible={isOutputVisible}
          isDarkTheme={isDarkTheme}
          themeClasses={themeClasses}
        />
      </div>
      </div>
    </div>
  )
}
