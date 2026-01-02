import { NetworkOfflineIndicator, SmartClipboardPill } from "../prompt-shared"

interface PromptInputHeaderProps {
  onClipboardItemAdd?: (text: string) => void
  setInput: (value: string) => void
  input: string
  onFilesAdded?: (files: File[]) => void
  isDarkTheme: boolean
  themeClasses: {
    icon: string
  }
}

/**
 * Shared header component for prompt input (collapsed and expanded)
 * Contains NetworkOfflineIndicator and SmartClipboardPill
 */
export function PromptInputHeader({
  onClipboardItemAdd,
  setInput,
  input,
  onFilesAdded,
  isDarkTheme,
  themeClasses,
}: PromptInputHeaderProps) {
  return (
    <>
      <NetworkOfflineIndicator themeClasses={themeClasses} />
      <SmartClipboardPill
        onClipboardItemAdd={onClipboardItemAdd}
        setInput={setInput}
        input={input}
        onFilesAdded={onFilesAdded}
        isDarkTheme={isDarkTheme}
      />
    </>
  )
}

