import { SmartMessage } from './SmartMessage'
import { Button } from '@/components/ui/button'
import { Square } from 'lucide-react'

export interface MediaAttachment {
  id: string
  name: string
  type: string
  size: number
  data: string
  source: string
  mediaType: 'image' | 'video' | 'audio'
  dimensions?: { width: number; height: number }
  duration?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: MediaAttachment[]
}

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
  // Simplified helper to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  // Extracted media attachment renderer
  const renderMediaAttachment = (attachment: MediaAttachment) => {
    const { mediaType, data, name, size, dimensions, duration, type } = attachment
    const maxDimensions = { maxWidth: 400, maxHeight: 300 }

    const mediaInfo = (
      <div className="mt-2 text-xs text-gray-400 space-y-0.5">
        <div className="font-medium truncate">{name}</div>
        <div>{formatFileSize(size)}</div>
        {dimensions && <div>{dimensions.width} × {dimensions.height}</div>}
        {duration && <div>{Math.round(duration)}s</div>}
      </div>
    )

    switch (mediaType) {
      case 'image':
        return (
          <div className="media-attachment">
            <img 
              src={data} 
              alt={name}
              className="max-w-full max-h-64 rounded-lg border border-gray-600/20"
              style={maxDimensions}
            />
            {mediaInfo}
          </div>
        )
      
      case 'video':
        return (
          <div className="media-attachment">
            <video 
              controls 
              preload="metadata"
              className="max-w-full max-h-64 rounded-lg border border-gray-600/20"
              style={maxDimensions}
            >
              <source src={data} type={type} />
              Your browser does not support the video element.
            </video>
            {mediaInfo}
          </div>
        )
      
      case 'audio':
        return (
          <div className="media-attachment">
            <audio controls preload="metadata" className="w-full">
              <source src={data} type={type} />
              Your browser does not support the audio element.
            </audio>
            {mediaInfo}
          </div>
        )
      
      default:
        return null
    }
  }

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
            className={`message-appear flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`break-words overflow-hidden ${
              message.role === 'user' ? 'max-w-[85%] md:max-w-[75%] lg:max-w-[65%]' : 'max-w-[90%] md:max-w-[85%] lg:max-w-[75%]'
            }`}>
              {/* Media attachments (if any) */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {renderMediaAttachment(attachment)}
                    </div>
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
        {isTyping && (
          <div className="flex justify-start message-appear">
            <div className="bg-transparent text-white px-4 py-2 max-w-[90%] md:max-w-[85%] lg:max-w-[75%]">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white/70 mr-2">AI is thinking</span>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Stop Streaming Button */}
      {isStreaming && (
        <div className="absolute bottom-4 right-4 z-30">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 flex items-center justify-center bg-oklch(12.9% 0.042 264.695) from-red-500 via-red-600 to-rose-500 text-white rounded-full border-2 border-white/40 backdrop-blur-lg shadow-xl hover:scale-105 transition-transform duration-150 p-0"
            onClick={onStopStreaming}
            title="Stop streaming"
          >
            <Square className="w-4 h-4 mr-2 fill-current" />
            
          </Button>
        </div>
      )}
    </div>
  )
}