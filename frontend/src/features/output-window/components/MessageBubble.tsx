import type { ChatMessage } from '../types'
import { UserMessageBubble } from './UserMessageBubble'
import { AssistantMessageBubble } from './AssistantMessageBubble'

interface MessageBubbleProps {
  message: ChatMessage
  isDarkTheme: boolean
  id?: string
  onAddSelectedText?: (text: string) => void
  onAskSelectedText?: (text: string) => void | Promise<void>
  onExplainSelectedText?: (text: string, position?: { x: number; y: number }) => void | Promise<void>
}

/**
 * MessageBubble - A wrapper component that renders either UserMessageBubble or AssistantMessageBubble
 * based on the message role. This allows for better separation of concerns and easier UI customization.
 */
export function MessageBubble({
  message,
  isDarkTheme,
  id,
  onAddSelectedText,
}: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <UserMessageBubble
        message={message}
        isDarkTheme={isDarkTheme}
        id={id}
      />
    )
  }

  return (
    <AssistantMessageBubble
      message={message}
      isDarkTheme={isDarkTheme}
      id={id}
      onAddSelectedText={onAddSelectedText}
    />
  )
}
