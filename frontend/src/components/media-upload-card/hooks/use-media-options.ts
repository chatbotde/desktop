import { useMemo } from "react"
import { Image, Mic, Video, FileText, Camera, Circle, Settings, Crop, Clapperboard } from "lucide-react"
import { useFeature } from "@/contexts/FeatureContext"
import { MEDIA_UPLOAD_CONSTANTS } from "../constants/media-upload-constants"
import type { MediaOption } from "../types/media-upload-types"

interface UseMediaOptionsProps {
  isCapturing: boolean
  onSettingsOpen: () => void
  fileInputRefs: {
    docInputRef: React.RefObject<HTMLInputElement | null>
    imageInputRef: React.RefObject<HTMLInputElement | null>
    videoInputRef: React.RefObject<HTMLInputElement | null>
    audioInputRef: React.RefObject<HTMLInputElement | null>
  }
  screenshotHandlers: {
    handleQuickScreenshot: () => void
    handleAreaScreenshot: () => void
  }
}

/**
 * Hook to generate and filter media options based on feature flags
 */
export function useMediaOptions({
  isCapturing,
  onSettingsOpen,
  fileInputRefs,
  screenshotHandlers,
}: UseMediaOptionsProps) {
  const { isFeatureEnabled } = useFeature()

  const isOptionEnabled = (id: string) => {
    const featureFlag = MEDIA_UPLOAD_CONSTANTS.FEATURE_FLAGS[id as keyof typeof MEDIA_UPLOAD_CONSTANTS.FEATURE_FLAGS]
    return featureFlag ? isFeatureEnabled(featureFlag) : true
  }

  const allOptions = useMemo<MediaOption[]>(
    () => [
      {
        id: 'document',
        label: 'Upload document',
        icon: FileText,
        action: () => fileInputRefs.docInputRef.current?.click(),
      },
      {
        id: 'image',
        label: 'Upload Image',
        icon: Image,
        action: () => fileInputRefs.imageInputRef.current?.click(),
      },
      {
        id: 'screenshot',
        label: isCapturing ? 'Capturing...' : 'Take Screenshot',
        icon: Camera,
        action: screenshotHandlers.handleQuickScreenshot,
        disabled: isCapturing,
      },
      {
        id: 'area-screenshot',
        label: isCapturing ? 'Selecting area...' : 'Circle to ask',
        icon: Circle,
        action: screenshotHandlers.handleAreaScreenshot,
        disabled: isCapturing,
      },
      {
        id: 'set-capture-area',
        label: 'Set Auto-Capture Area',
        icon: Crop,
        action: () => window.dispatchEvent(new CustomEvent(MEDIA_UPLOAD_CONSTANTS.EVENTS.TRIGGER_SET_CAPTURE_AREA)),
        disabled: isCapturing,
      },
      {
        id: 'video-recording',
        label: 'Record Screen',
        icon: Clapperboard,
        action: () => window.dispatchEvent(new CustomEvent(MEDIA_UPLOAD_CONSTANTS.EVENTS.TRIGGER_VIDEO_RECORDING)),
        disabled: isCapturing,
      },
      {
        id: 'video',
        label: 'Upload Video',
        icon: Video,
        action: () => fileInputRefs.videoInputRef.current?.click(),
      },
      {
        id: 'audio',
        label: 'Upload Audio',
        icon: Mic,
        action: () => fileInputRefs.audioInputRef.current?.click(),
      },
    ],
    [isCapturing, fileInputRefs, screenshotHandlers]
  )

  const options = useMemo(() => {
    const enabledOptions = allOptions.filter((opt) => isOptionEnabled(opt.id))
    const systemOptions: MediaOption[] = [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        action: onSettingsOpen,
      },
    ]

    return [...enabledOptions, ...systemOptions]
  }, [allOptions, isOptionEnabled, onSettingsOpen])

  return { options }
}

