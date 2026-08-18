/**
 * Constants for media upload card
 */

export const MEDIA_UPLOAD_CONSTANTS = {
  // Z-index
  Z_INDEX: 1002,

  // Compact panel — ~1/4 viewport (Electron overlay is fullscreen; menu must stay small)
  PANEL: {
    /** Fixed width with viewport cap */
    WIDTH_CLASS: "w-48 max-w-[25vw]",
    /** Scroll when options exceed 1/4 screen height */
    MAX_HEIGHT_CLASS: "max-h-[25vh]",
    CLASSES:
      "shrink-0 overflow-hidden shadow-xl rounded-xl border pointer-events-auto flex flex-col",
  },

  /** Popover wrapper — explicit size so Radix does not stretch to full screen */
  POPOVER_CONTENT_CLASS:
    "w-48 max-w-[25vw] max-h-[25vh] p-0 border-none bg-transparent shadow-none pointer-events-auto overflow-hidden",

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
