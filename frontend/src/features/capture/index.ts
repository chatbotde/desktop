/**
 * Capture Feature
 * 
 * Screenshot, video recording, and screen capture functionality
 * 
 * @example
 * import { ScreenCaptureModal, ScreenshotButton, VideoRecorderPill } from '@/features/capture'
 */

// Components
export {
  ScreenCaptureModal,
  AreaScreenshotOverlay,
  ScreenshotButton,
  VideoRecorderPill,
  VideoRecordButton
} from './components'

// Hooks (re-export from hooks folder)
export { useAutoScreenshot } from '@/hooks/useAutoScreenshot'
export { useVideoRecording } from '@/hooks/useVideoRecording'

