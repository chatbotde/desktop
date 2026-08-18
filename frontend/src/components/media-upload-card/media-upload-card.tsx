import { useCallback, useMemo } from "react"
import { getThemeClasses } from "@/features/prompt"
import { cn } from "@/lib/utils"
import { useFilePicker, type FileKind } from "@/components/file-picker"
import { MEDIA_UPLOAD_CONSTANTS } from "./constants/media-upload-constants"
import { useScreenshotHandlers } from "./hooks/use-screenshot-handlers"
import { useMediaOptions } from "./hooks/use-media-options"
import { MediaOptionButton } from "./components/media-option-button"
import type { MediaUploadCardProps } from "./types/media-upload-types"
import { useAppState } from "@/app/context/AppContext"

const UPLOAD_TITLES: Record<FileKind, string> = {
  document: "Select documents",
  image: "Select images",
  video: "Select videos",
  audio: "Select audio",
}

export function MediaUploadCard({
  onFileUpload,
  className,
  isDarkTheme = true,
  onScreenshot,
}: MediaUploadCardProps) {
  const { uiState } = useAppState()
  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])
  const { pickFiles } = useFilePicker()

  const handleUpload = useCallback(
    async (kind: FileKind) => {
      const files = await pickFiles({ kind, multiple: true, title: UPLOAD_TITLES[kind] })
      if (files.length > 0) {
        onFileUpload?.(files)
      }
    },
    [pickFiles, onFileUpload]
  )

  const { isCapturing, handleQuickScreenshot, handleAreaScreenshot } = useScreenshotHandlers({
    onFileUpload,
    onScreenshot,
  })
  const { options } = useMediaOptions({
    isCapturing,
    onSettingsOpen: () => uiState.setShowSettings(true),
    onUpload: handleUpload,
    screenshotHandlers: {
      handleQuickScreenshot,
      handleAreaScreenshot,
    },
  })

  return (
    <div
      className={cn(
        MEDIA_UPLOAD_CONSTANTS.PANEL.WIDTH_CLASS,
        MEDIA_UPLOAD_CONSTANTS.PANEL.MAX_HEIGHT_CLASS,
        MEDIA_UPLOAD_CONSTANTS.PANEL.CLASSES,
        themeClasses.containerBorder,
        className
      )}
      style={{ backgroundColor: themeClasses.containerBg, zIndex: MEDIA_UPLOAD_CONSTANTS.Z_INDEX }}
      data-no-clickthrough
    >
      <div
        className={cn(
          "flex flex-col overflow-y-auto custom-scrollbar p-1.5 min-h-0",
          MEDIA_UPLOAD_CONSTANTS.PANEL.MAX_HEIGHT_CLASS
        )}
      >
        {options.map((option) => (
          <MediaOptionButton key={option.id} option={option} themeClasses={themeClasses} />
        ))}
      </div>
    </div>
  )
}
