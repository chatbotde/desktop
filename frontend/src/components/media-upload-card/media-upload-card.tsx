import { Card, CardContent } from "@/shared/components/ui/card"
import { useMemo, useState } from "react"
import { getThemeClasses } from "@/features/prompt"
import { SettingsModal } from "@/features/settings"
import { cn } from "@/lib/utils"
import { MEDIA_UPLOAD_CONSTANTS } from "./constants/media-upload-constants"
import { useFileInputs } from "./hooks/use-file-inputs"
import { useFileHandler } from "./hooks/use-file-handler"
import { useScreenshotHandlers } from "./hooks/use-screenshot-handlers"
import { useMediaOptions } from "./hooks/use-media-options"
import { HiddenFileInputs } from "./components/hidden-file-inputs"
import { MediaOptionButton } from "./components/media-option-button"
import type { MediaUploadCardProps } from "./types/media-upload-types"

export function MediaUploadCard({
  onFileUpload,
  className,
  isDarkTheme = true,
  onScreenshot,
}: MediaUploadCardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])

  // Hooks
  const fileInputRefs = useFileInputs()
  const handleFileChange = useFileHandler(onFileUpload)
  const { isCapturing, handleQuickScreenshot, handleAreaScreenshot } = useScreenshotHandlers({
    onFileUpload,
    onScreenshot,
  })
  const { options } = useMediaOptions({
    isCapturing,
    onSettingsOpen: () => setIsSettingsOpen(true),
    fileInputRefs,
    screenshotHandlers: {
      handleQuickScreenshot,
      handleAreaScreenshot,
    },
  })

  return (
    <>
      <Card
        className={cn(
          MEDIA_UPLOAD_CONSTANTS.CARD.WIDTH,
          MEDIA_UPLOAD_CONSTANTS.CARD.CLASSES,
          themeClasses.containerBorder,
          className
        )}
        style={{ backgroundColor: themeClasses.containerBg, zIndex: MEDIA_UPLOAD_CONSTANTS.Z_INDEX }}
        data-no-clickthrough
      >
        <HiddenFileInputs
          docInputRef={fileInputRefs.docInputRef}
          imageInputRef={fileInputRefs.imageInputRef}
          videoInputRef={fileInputRefs.videoInputRef}
          audioInputRef={fileInputRefs.audioInputRef}
          onFileChange={handleFileChange}
        />

        <CardContent className="p-1.5">
          <div className="flex flex-col">
            {options.map((option) => (
              <MediaOptionButton key={option.id} option={option} themeClasses={themeClasses} />
            ))}
          </div>
        </CardContent>
      </Card>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}

