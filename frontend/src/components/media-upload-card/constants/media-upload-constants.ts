/**
 * Constants for media upload card
 */

export const MEDIA_UPLOAD_CONSTANTS = {
  // Z-index
  Z_INDEX: 1002,

  // Card styling
  CARD: {
    WIDTH: "w-48",
    CLASSES: "overflow-hidden shadow-xl rounded-xl p-0 border",
  },

  // File input accept types
  FILE_ACCEPT: {
    DOCUMENT: ".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx",
    IMAGE: "image/*",
    VIDEO: "video/*",
    AUDIO: "audio/*",
  },

  // Feature flag mappings
  FEATURE_FLAGS: {
    'document': 'upload-document',
    'image': 'upload-image',
    'screenshot': 'quick-screenshot',
    'area-screenshot': 'area-screenshot',
    'set-capture-area': 'set-capture-area',
    'video-recording': 'video-recording',
    'video': 'upload-video',
    'audio': 'upload-audio',
  },

  // Custom event names
  EVENTS: {
    SHOW_AREA_SCREENSHOT: 'show-area-screenshot',
    TRIGGER_SET_CAPTURE_AREA: 'trigger-set-capture-area',
    TRIGGER_VIDEO_RECORDING: 'trigger-video-recording',
  },
} as const

