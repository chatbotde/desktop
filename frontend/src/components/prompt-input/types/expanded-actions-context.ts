export interface ExpandedActionsBarContext {
  onFilesAdded?: (files: File[]) => void
  isDarkTheme: boolean
  onMoreClick?: () => void
  onThemeChange?: (isDark: boolean) => void
  themeClasses: {
    icon: string
    containerBg: string
    fileText: string
  }
  hoverClass: string
  isLoading: boolean
  canSubmit: boolean
  onSubmit: () => void
  onStop?: () => void
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

