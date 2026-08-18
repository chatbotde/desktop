/**
 * Chat Feature
 * 
 * Message display, streaming responses, and conversation management
 * 
 * @example
 * import { useMessageManager, SmartMessage } from '@/features/chat'
 */

// Components
export {
  SmartMessage,
  MessageActions,
  TypingIndicator,
  ExpandToggle,
  MediaAttachmentComponent,
  StopStreamingButton
} from './components'

// Hooks
export { useMessageManager, useAutoScroll } from './hooks'

// Manim video helpers
export {
  isManimVideoPrompt,
  generateManimScriptPlan,
  generateManimCodeFromPlan,
  generateAllChapterCodes,
  ensureChapters,
  shouldRenderInChunks,
  applyTargetDurationToPlan,
  parseTargetDurationFromPrompt,
  formatDurationLabel,
  DEFAULT_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_DURATION_SECONDS,
  LONG_VIDEO_THRESHOLD_SECONDS,
  TARGET_DURATION_OPTIONS,
} from './lib/manim-video-request'
export type {
  ManimVideoAssets,
  ManimScriptPlan,
  ManimTimelineSection,
  ManimChapter,
  ManimChapterAssets,
} from './lib/manim-video-request'

// Store
export { useChatStore } from './store'

// Types
export type { ChatMessage, MediaAttachment } from './types'
