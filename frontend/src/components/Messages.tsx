import {
  SmartMessage,
  MediaAttachmentComponent,
  TypingIndicator,
  StopStreamingButton,
  useAutoScroll
} from '@/features/chat'
import type { ChatMessage, MediaAttachment } from '@/features/chat'

// Re-export types for backward compatibility
export type { ChatMessage, MediaAttachment }

interface MessagesProps {
  messages: ChatMessage[]
  isTyping: boolean
  isStreaming: boolean
  onCopyMessage: (text: string) => void
  onStopStreaming: () => void
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
}



export function Messages({
  messages,
  isTyping,
  isStreaming,
  onCopyMessage,
  onStopStreaming,
  messagesContainerRef,
  messagesEndRef,
  onScroll
}: MessagesProps) {
  // Use auto-scroll hook
  useAutoScroll({
    messages,
    isStreaming,
    isTyping,
    messagesContainerRef
  })

  return (
    <div className="flex flex-col relative h-full">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="px-4 md:px-8 lg:px-12 py-6 space-y-6 min-h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            data-message-type={message.role}
            className={`message-appear flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
          >
            <div className={`break-words overflow-hidden ${message.role === 'user' ? 'max-w-[85%] md:max-w-[75%] lg:max-w-[65%]' : 'max-w-[90%] md:max-w-[85%] lg:max-w-[75%]'
              }`}>
              {/* Media attachments (if any) */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <MediaAttachmentComponent key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              )}

              {/* Message content */}
              {message.content && (
                <SmartMessage
                  content={message.content}
                  role={message.role}
                  onCopy={onCopyMessage}
                />
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Stop Streaming Button */}
      {isStreaming && <StopStreamingButton onStop={onStopStreaming} />}
    </div>
  )
}