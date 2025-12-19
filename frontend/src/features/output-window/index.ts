/**
 * Output Window Feature
 * 
 * Floating output window with messages and controls
 * 
 * @example
 * import { OutputWindow, WindowControls } from '@/features/output-window'
 */

// Components
export { 
  DragButton,
  ResizeHandle,
  WindowControls,
  ThinkingIndicator,
  TextSelectionActions,
  MessageBubble
} from './components'

// Hooks
export { useDraggable, useResizable, useAutoScroll } from './hooks'

// Theme
export { getThemeClasses } from './theme'
export type { ThemeClasses } from './theme'

// Types
export type { ChatMessage, MediaAttachment, Position, Size } from './types'
