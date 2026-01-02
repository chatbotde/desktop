/**
 * Media Upload Card Component
 * 
 * A modular, extensible component for handling media uploads including:
 * - File uploads (documents, images, videos, audio)
 * - Screenshot capture (quick and area selection)
 * - Screen recording
 * - Feature flag-based option visibility
 */

export { MediaUploadCard } from "./media-upload-card"
export type { MediaUploadCardProps, MediaOption, ScreenshotData } from "./types/media-upload-types"
export { MEDIA_UPLOAD_CONSTANTS } from "./constants/media-upload-constants"
export { useFileInputs, useFileHandler, useScreenshotHandlers, useMediaOptions } from "./hooks"
export { screenshotToFile, validateCaptureAPI, validateCaptureAPIMethod } from "./utils/screenshot-to-file"

