// Re-export all shared components and utilities for backward compatibility
export { NetworkOfflineIndicator } from "./network-offline-indicator"
export { getFileIcon } from "./utils/file-icon"
export { SmartClipboardPill } from "./smart-clipboard-pill"
export { usePasteHandler } from "./hooks/use-paste-handler"

// Re-export shared hooks
export { useCanSubmit } from "./hooks/use-can-submit"
export { useKeyboardSubmit } from "./hooks/use-keyboard-submit"
export { usePromptTheme } from "./hooks/use-prompt-theme"

// Re-export shared components
export { PromptInputHeader } from "./components/prompt-input-header"
export { FileRemoveButton } from "./components/file-remove-button"
export { BaseSubmitButton } from "./components/base-submit-button"

// Re-export shared types
export type {
  BasePromptInputProps,
  PromptInputCollapsedProps,
  PromptInputExpandedProps,
  FileItemsBaseProps,
} from "./types/prompt-input-props"

// Re-export constants
export { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"