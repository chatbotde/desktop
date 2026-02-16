import { Plus } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { MediaUploadCard } from "../media-upload-card"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { usePasteHandler } from "./prompt-shared"
import { MicHoverAudioPill } from "@/features/audio"
import { VideoHoverCapturePill } from "@/features/capture/components"
import { CollapsedFileItems } from "./collapsed-file-items"
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
  dragControls,
}: PromptInputCollapsedProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const { themeClasses, hoverClass } = usePromptTheme(isDarkTheme)
  const canSubmit = useCanSubmit({ input, files, clipboardItems })
  const handleKeyDown = useKeyboardSubmit(onSubmit)

  // Create a dummy setter if not provided (for backwards compatibility)
  const clipboardSetter = setClipboardItems ?? (() => { })
  const expandedSetter = setIsExpanded ?? onExpand

  const handlePaste = usePasteHandler({
    onFilesAdded,
    setClipboardItems: clipboardSetter,
    setIsExpanded: expandedSetter,
  })

  return (
    <div className="relative flex items-center gap-2 mx-0 mb-0 transition-all duration-300 ease-in-out" style={{ zIndex: PROMPT_INPUT_CONSTANTS.Z_INDEX.CONTAINER }}>
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
          <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none mb-2" align="start">
            <MediaUploadCard onFileUpload={onFilesAdded} isDarkTheme={isDarkTheme} onMoreClick={onMoreClick} onThemeChange={onThemeChange} />
          </PopoverContent>
        </Popover>

        <CollapsedFileItems
          files={files}
          clipboardItems={clipboardItems}
          onRemoveFile={onRemoveFile}
          onRemoveClipboardItem={onRemoveClipboardItem}
          themeClasses={themeClasses}
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
          dragControls={dragControls}
        />
      </div>
    </div>
  )
}
