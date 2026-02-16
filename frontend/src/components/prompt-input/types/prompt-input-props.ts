/**
 * Shared types and interfaces for prompt input components
 */

export interface BasePromptInputProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  files: File[]
  clipboardItems?: string[]
  onSubmit: () => void
  onStop?: () => void
  onHide: () => void
  isDarkTheme?: boolean
  onFilesAdded?: (files: File[]) => void
  onMoreClick?: () => void
  onClipboardItemAdd?: (text: string) => void
  onRemoveClipboardItem?: (index: number) => void
  onThemeChange?: (isDark: boolean) => void
  isOutputVisible?: boolean
  onToggleOutput?: () => void
  dragControls?: any
}

export interface PromptInputCollapsedProps extends BasePromptInputProps {
  onExpand: () => void
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile?: (index: number) => void
  setClipboardItems?: React.Dispatch<React.SetStateAction<string[]>>
  setIsExpanded?: (expanded: boolean) => void
}

export interface PromptInputExpandedProps extends BasePromptInputProps {
  onCollapse: () => void
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
  setClipboardItems?: React.Dispatch<React.SetStateAction<string[]>>
  setIsExpanded?: (expanded: boolean) => void
}

export interface FileItemsBaseProps {
  files: File[]
  clipboardItems?: string[]
  onRemoveFile?: (index: number) => void
  onRemoveClipboardItem?: (index: number) => void
  themeClasses: {
    fileItem: string
    icon: string
    fileText?: string
  }
}

