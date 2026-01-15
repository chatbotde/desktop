export interface ExpandedActionsBarContext {
  onFilesAdded?: (files: File[]) => void
  isDarkTheme: boolean
  onMoreClick?: () => void
  onThemeChange?: (isDark: boolean) => void
  themeClasses: {
    icon: string
    containerBg: string
    containerBorder: string
    buttonBg: string
    buttonHover: string
    buttonBorder: string
    fileText: string
  }
  hoverClass: string
  isLoading: boolean
  canSubmit: boolean
  onSubmit: () => void
  onStop?: () => void
  // Window actions (for send button hover panel)
  onHide?: () => void
  onToggleOutput?: () => void
  isOutputVisible?: boolean
  // Grounding
  isGoogleModelSelected: boolean
  groundingEnabled: boolean
  onToggleGrounding: () => void
  // Local model
  showLocalControlInPrompt: boolean
  ollamaRunning: boolean | null
  ollamaModels: string[]
  selectedLocalModelName: string | null
  onModelSelect: (modelName: string) => void
}

