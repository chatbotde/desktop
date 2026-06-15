import { useState, useSyncExternalStore, useCallback } from "react"
import { PromptInput } from "@/components/prompt-kit/prompt-input"
import { cn } from "@/lib/utils"
import { usePasteHandler } from "./prompt-shared"
import { ExpandedFileItems } from "./expanded-file-items"
import { ExpandedCollapseButton } from "./expanded-collapse-button"
import { ExpandedActionsBar } from "./expanded-actions-bar"
import { useExpandedLocalLLM } from "./hooks/use-expanded-local-llm"
import { useImageUrlCleanup } from "./hooks/use-image-url-cleanup"
import { useTextareaAutoResize } from "./hooks/use-textarea-auto-resize"
import { usePromptTheme } from "./hooks/use-prompt-theme"
import { useCanSubmit } from "./hooks/use-can-submit"
import { useKeyboardSubmit } from "./hooks/use-keyboard-submit"
import { PromptInputHeader } from "./components/prompt-input-header"
import type { PromptInputExpandedProps } from "./types/prompt-input-props"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"

export function PromptInputExpanded({
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
  onCollapse,
  onHide,
  onRemoveFile,
  isDarkTheme = true,
  onFilesAdded,
  onMoreClick,
  onClipboardItemAdd,
  onRemoveClipboardItem,
  onThemeChange,
  isOutputVisible,
  onToggleOutput,
  setClipboardItems,
  setIsExpanded,
}: PromptInputExpandedProps) {
  const { themeClasses, hoverClass } = usePromptTheme(isDarkTheme)
  const textareaRef = useTextareaAutoResize(input)
  useImageUrlCleanup(files)
  const {
    ollamaRunning,
    ollamaModels,
    selectedLocalModelName,
    setSelectedLocalModelName,
    showLocalControlInPrompt,
    groundingEnabled,
    isGoogleModelSelected,
    handleToggleGrounding,
  } = useExpandedLocalLLM()

  const canSubmit = useCanSubmit({ input, files, clipboardItems, references })
  const handleKeyDown = useKeyboardSubmit(onSubmit)

  const [isAnimatingIn, setIsAnimatingIn] = useState(true)

  // Animation timing on mount - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      const timer = setTimeout(() => setIsAnimatingIn(false), 50)
      return () => clearTimeout(timer)
    }, []),
    () => null,
    () => null
  )

  const clipboardSetter = setClipboardItems ?? (() => { })
  const expandedSetter = setIsExpanded ?? (() => { })

  const handlePaste = usePasteHandler({
    onFilesAdded,
    setClipboardItems: clipboardSetter,
    setIsExpanded: expandedSetter,
  })

  return (
    <div
      className={cn(
        "relative flex items-start gap-2 mx-0 mb-0 overflow-visible",
        isAnimatingIn
          ? "animate-in fade-in zoom-in-95 duration-200 ease-out"
          : "animate-in fade-in zoom-in-95 duration-200 ease-out"
      )}
      style={{ zIndex: 100 }}
    >
      <PromptInputHeader
        onClipboardItemAdd={onClipboardItemAdd}
        setInput={setInput}
        input={input}
        onFilesAdded={onFilesAdded}
        isDarkTheme={isDarkTheme}
        themeClasses={themeClasses}
      />
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={onSubmit}
        className={cn(
          "flex-1 flex flex-col rounded-2xl border px-3 py-2 transition-all duration-200 ease-out overflow-visible",
          themeClasses.containerBorder,
          isAnimatingIn ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
        style={{
          backgroundColor: themeClasses.containerBg,
          transitionProperty: "opacity, transform, box-shadow, border-color, background-color",
        }}
      >
        {files.length === 0 && (
          <ExpandedCollapseButton
            onCollapse={onCollapse}
            themeClasses={themeClasses}
            hoverClass={hoverClass}
          />
        )}

        <ExpandedFileItems
          files={files}
          clipboardItems={clipboardItems}
          references={references}
          selectedLocalModelName={selectedLocalModelName}
          onRemoveFile={onRemoveFile}
          onRemoveClipboardItem={onRemoveClipboardItem}
          onRemoveReference={onRemoveReference}
          isDarkTheme={isDarkTheme}
          themeClasses={themeClasses}
          hoverClass={hoverClass}
          onLocalModelClear={() => setSelectedLocalModelName(null)}
        />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask me anything..."
          aria-label="Message input"
          className={cn(
            "w-full bg-transparent border-0 focus:outline-none focus:ring-0 overflow-y-auto resize-none px-0 py-0 flex-shrink",
            themeClasses.textarea
          )}
          style={{
            minHeight: `${PROMPT_INPUT_CONSTANTS.TEXTAREA.MIN_HEIGHT}px`,
            maxHeight: `${PROMPT_INPUT_CONSTANTS.TEXTAREA.MAX_HEIGHT}px`,
          }}
          rows={1}
        />

        <ExpandedActionsBar
          onFilesAdded={onFilesAdded}
          isDarkTheme={isDarkTheme}
          onMoreClick={onMoreClick}
          onThemeChange={onThemeChange}
          themeClasses={themeClasses}
          hoverClass={hoverClass}
          isLoading={isLoading}
          canSubmit={canSubmit}
          onSubmit={onSubmit}
          onStop={onStop}
          onHide={onHide}
          onToggleOutput={onToggleOutput}
          isOutputVisible={isOutputVisible}
          isGoogleModelSelected={isGoogleModelSelected}
          groundingEnabled={groundingEnabled}
          onToggleGrounding={handleToggleGrounding}
          showLocalControlInPrompt={showLocalControlInPrompt}
          ollamaRunning={ollamaRunning}
          ollamaModels={ollamaModels}
          selectedLocalModelName={selectedLocalModelName}
          onModelSelect={setSelectedLocalModelName}
          references={references}
          onReferenceAdd={onReferenceAdd}
          className="relative z-10 shrink-0"
        />
      </PromptInput>
    </div>
  )
}
