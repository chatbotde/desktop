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

// Store
export { useChatStore } from './store'

// Types
export type { ChatMessage, MediaAttachment } from './types'
