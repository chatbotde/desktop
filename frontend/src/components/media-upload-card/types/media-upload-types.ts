import type { LucideIcon } from "lucide-react"

/**
 * Screenshot data structure
 */
export interface ScreenshotData {
  name: string
  type: string
  size: number
  data: string
}

/**
 * Media upload option configuration
 */
export interface MediaOption {
  id: string
  label: string
  icon: LucideIcon
  action: () => void
  disabled?: boolean
}

/**
 * File input type configuration
 */
export interface FileInputConfig {
  type: 'document' | 'image' | 'video' | 'audio'
  accept: string
  multiple?: boolean
}

/**
 * Props for MediaUploadCard component
 */
export interface MediaUploadCardProps {
  onFileUpload?: (files: File[]) => void
  className?: string
  isDarkTheme?: boolean
  onScreenshot?: (screenshot: ScreenshotData) => void
  onMoreClick?: () => void
  onThemeChange?: (isDark: boolean) => void
}

