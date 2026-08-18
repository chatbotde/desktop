import { useState, useCallback, useMemo, useSyncExternalStore } from "react"
import type { PromptReference } from "./types/prompt-reference"
import { PromptInputCollapsed } from "./prompt-input-collapsed"
import { PromptInputExpanded } from "./prompt-input-expanded"
import { DropZone } from "@/components/drop-zone"
import { ValidationErrorPopup } from "./validation-error-popup"
import { useFileToAttachment } from "./hooks/use-file-to-attachment"
import { usePromptInputHandler } from "./hooks/use-prompt-input-handler"
import { usePromptFileHandlers } from "./hooks/use-prompt-file-handlers"
import { usePromptDropHandlers } from "./hooks/use-prompt-drop-handlers"
import { usePromptWindowEvents } from "./hooks/use-prompt-window-events"
import { usePromptSubmit } from "./hooks/use-prompt-submit"
import { usePromptReferences } from "./hooks/use-prompt-references"
import { useValidationErrorTimeout } from "./hooks/use-validation-error-timeout"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"
import { registerPromptFilesHandler } from "./prompt-files-bridge"
import type { MediaAttachment } from '@/features/chat'
import { cn } from "@/lib/utils"
import { useFeature } from "@/shared/providers"

interface PromptInputWithActionsProps {
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  isDarkTheme?: boolean;
  onSendMessage?: (
    message: string,
    attachments?: MediaAttachment[],
    options?: import('@/features/chat/types/send-message-options').SendMessageOptions
  ) => void | Promise<void>;
  onStop?: () => void;
  onAudioClick?: () => void;
  onMoreClick?: () => void;
  onThemeChange?: (isDark: boolean) => void;
  isOutputVisible?: boolean;
  onToggleOutput?: () => void;
}

export function PromptInputWithActions({
  isVisible: controlledVisible,
  onVisibilityChange,
  isDarkTheme = true,
  onSendMessage,
  onStop,
  onMoreClick,
  onThemeChange,
  isOutputVisible,
  onToggleOutput,
}: PromptInputWithActionsProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [internalVisible, setInternalVisible] = useState(true)
  const [clipboardItems, setClipboardItems] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const attachInputContainer = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    requestAnimationFrame(() => {
      node
        .querySelector<HTMLElement>('[aria-label="Message input"]')
        ?.focus({ preventScroll: true })
    })
  }, [])

  // Hooks
  const { convertFilesToAttachments } = useFileToAttachment()
  const { handleInputChange, prevInputLengthRef } = usePromptInputHandler({
    input,
    setInput,
    validationError,
    setValidationError,
  })
  const {
    handleFileChange,
    handleFilesAdded,
    handleRemoveFile,
    handleClipboardItemAdd,
    handleRemoveClipboardItem,
  } = usePromptFileHandlers({
    setFiles,
    setClipboardItems,
    setInput,
    setIsExpanded,
    setValidationError,
    validationError,
  })
  const {
    handleFilesDropped,
    handleTextDropped,
    handleUrlDropped,
  } = usePromptDropHandlers({
    setFiles,
    setClipboardItems,
    setInput,
    setIsExpanded,
  })
  const { isFeatureEnabled } = useFeature()
  const isPromptReferencesEnabled = isFeatureEnabled("prompt-references")

  const {
    references,
    handleReferenceAdd,
    handleRemoveReference,
    clearReferences,
  } = usePromptReferences()

  const handleReferenceAddWithExpand = useCallback(
    (reference: PromptReference) => {
      handleReferenceAdd(reference)
      setIsExpanded(true)
    },
    [handleReferenceAdd]
  )

  const referenceHandlers = useMemo(
    () =>
      isPromptReferencesEnabled
        ? {
            references,
            onReferenceAdd: handleReferenceAddWithExpand,
            onRemoveReference: handleRemoveReference,
          }
        : {
            references: [] as typeof references,
            onReferenceAdd: undefined,
            onRemoveReference: handleRemoveReference,
          },
    [isPromptReferencesEnabled, references, handleReferenceAddWithExpand, handleRemoveReference]
  )

  const { handleSubmit } = usePromptSubmit({
    input,
    files,
    clipboardItems,
    references,
    setInput,
    setFiles,
    setClipboardItems,
    clearReferences,
    setValidationError,
    setIsLoading,
    setIsExpanded,
    prevInputLengthRef,
    convertFilesToAttachments,
    onSendMessage,
  })

  // Use controlled or internal visibility
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible

  const setIsVisible = (visible: boolean) => {
    if (onVisibilityChange) {
      onVisibilityChange(visible)
    } else {
      setInternalVisible(visible)
    }
  }

  // Window event handlers
  usePromptWindowEvents({
    setClipboardItems,
    onReferenceAdd: referenceHandlers.onReferenceAdd,
    setIsExpanded,
    setIsVisible,
    handleFilesAdded,
    handleSubmit,
  })

  useSyncExternalStore(
    useCallback((_callback) => {
      registerPromptFilesHandler(handleFilesAdded)
      return () => registerPromptFilesHandler(null)
    }, [handleFilesAdded]),
    () => null,
    () => null
  )

  // Auto-dismiss validation error after timeout
  useValidationErrorTimeout(validationError, () => setValidationError(null))

  // Hidden state - return null (RightTransparent will show the input)
  if (!isVisible) {
    return null
  }

  return (
    <DropZone
      onFilesDropped={handleFilesDropped}
      onTextDropped={handleTextDropped}
      onUrlDropped={handleUrlDropped}
      readCodeFileContents={true}
      isDarkTheme={isDarkTheme}
      className={cn(
        "relative w-full transition-all",
        isExpanded 
          ? "duration-200 ease-out" 
          : "duration-200 ease-in"
      )}
    >
      <div
        ref={attachInputContainer}
        style={{ zIndex: PROMPT_INPUT_CONSTANTS.Z_INDEX.CONTAINER }}
      >
        {validationError && (
          <ValidationErrorPopup
            error={validationError}
            onDismiss={() => setValidationError(null)}
            isExpanded={isExpanded}
            isDarkTheme={isDarkTheme}
          />
        )}

        {!isExpanded ? (
          <PromptInputCollapsed
            input={input}
            setInput={handleInputChange}
            isLoading={isLoading}
            files={files}
            clipboardItems={clipboardItems}
            {...referenceHandlers}
            onSubmit={handleSubmit}
            onStop={onStop}
            onExpand={() => setIsExpanded(true)}
            onHide={() => setIsVisible(false)}
            isDarkTheme={isDarkTheme}
            onFilesAdded={handleFilesAdded}
            onMoreClick={onMoreClick}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
            onClipboardItemAdd={handleClipboardItemAdd}
            onRemoveClipboardItem={handleRemoveClipboardItem}
            onThemeChange={onThemeChange}
            isOutputVisible={isOutputVisible}
            onToggleOutput={onToggleOutput}
            setClipboardItems={setClipboardItems}
            setIsExpanded={setIsExpanded}
          />
        ) : (
          <PromptInputExpanded
            input={input}
            setInput={handleInputChange}
            isLoading={isLoading}
            files={files}
            clipboardItems={clipboardItems}
            {...referenceHandlers}
            onSubmit={handleSubmit}
            onStop={onStop}
            onCollapse={() => setIsExpanded(false)}
            onHide={() => setIsVisible(false)}
            onFileChange={handleFileChange}
            onFilesAdded={handleFilesAdded}
            onRemoveFile={handleRemoveFile}
            isDarkTheme={isDarkTheme}
            onMoreClick={onMoreClick}
            onClipboardItemAdd={handleClipboardItemAdd}
            onRemoveClipboardItem={handleRemoveClipboardItem}
            onThemeChange={onThemeChange}
            isOutputVisible={isOutputVisible}
            onToggleOutput={onToggleOutput}
            setClipboardItems={setClipboardItems}
            setIsExpanded={setIsExpanded}
          />
        )}
      </div>
    </DropZone>
  )
}
