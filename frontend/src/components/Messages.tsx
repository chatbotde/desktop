import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { SmartMessage } from './SmartMessage'

export interface MediaAttachment {
  id: string
  name: string
  type: string
  size: number
  data: string // base64 data URL or object URL
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
  onCopyMessage: (text: string) => void
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
  scrollToBottom: () => void
  scrollToTop: () => void
  showScrollToTop: boolean
  isNearBottom: boolean
}

export function Messages({ 
  messages, 
  isTyping, 
  onCopyMessage,
  messagesContainerRef,
  messagesEndRef,
  onScroll,
  scrollToBottom,
  scrollToTop,
  showScrollToTop,
  isNearBottom
}: MessagesProps) {
  // No auto-scroll - users can manually scroll using scroll buttons

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Render media attachment
  const renderMediaAttachment = (attachment: MediaAttachment) => {
    const { mediaType, data, name, size, dimensions, duration } = attachment

    if (mediaType === 'image') {
      return (
        <div className="media-attachment image-attachment">
          <img 
            src={data} 
            alt={name}
            className="max-w-full max-h-64 rounded-lg border border-gray-600/20"
            style={{ 
              maxWidth: dimensions?.width ? Math.min(dimensions.width, 400) : 400,
              maxHeight: dimensions?.height ? Math.min(dimensions.height, 300) : 300
            }}
          />
          <div className="mt-2 text-xs text-gray-400">
            <div className="font-medium">{name}</div>
            <div>{formatFileSize(size)}</div>
            {dimensions && <div>{dimensions.width} × {dimensions.height}</div>}
          </div>
        </div>
      )
    }

    if (mediaType === 'video') {
      return (
        <div className="media-attachment video-attachment">
          <video 
            controls 
            preload="metadata"
            className="max-w-full max-h-64 rounded-lg border border-gray-600/20"
            style={{ 
              maxWidth: dimensions?.width ? Math.min(dimensions.width, 400) : 400,
              maxHeight: dimensions?.height ? Math.min(dimensions.height, 300) : 300
            }}
          >
            <source src={data} type={attachment.type} />
            Your browser does not support the video element.
          </video>
          <div className="mt-2 text-xs text-gray-400">
            <div className="font-medium">{name}</div>
            <div>{formatFileSize(size)}</div>
            {dimensions && <div>{dimensions.width} × {dimensions.height}</div>}
            {duration && <div>{Math.round(duration)}s</div>}
          </div>
        </div>
      )
    }

    if (mediaType === 'audio') {
      return (
        <div className="media-attachment audio-attachment">
          <audio 
            controls 
            preload="metadata"
            className="w-full"
          >
            <source src={data} type={attachment.type} />
            Your browser does not support the audio element.
          </audio>
          <div className="mt-2 text-xs text-gray-400">
            <div className="font-medium">{name}</div>
            <div>{formatFileSize(size)}</div>
            {duration && <div>{Math.round(duration)}s</div>}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col relative h-full">
      <div 
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="px-8 py-6 space-y-4 min-h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            data-message-type={message.role}
            className={`message-appear flex ${
              message.role === 'user' 
                ? 'justify-end pl-20' 
                : 'justify-start pr-20'
            }`}
          >
            <div className="max-w-full break-words overflow-hidden">
              {/* Media attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {renderMediaAttachment(attachment)}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Text content */}
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
          <div className="flex justify-start pr-20 message-appear">
            <div className="max-w-full break-words overflow-hidden">
              <div className="bg-transparent text-white px-2 py-1">
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-white/70 mr-2">AI is thinking</div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll controls - positioned fixed */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        {/* Scroll to top button */}
        {showScrollToTop && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 bg-blue-500/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-blue-500/30 transition-all duration-200"
            onClick={scrollToTop}
            title="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        )}
        
        {/* Scroll to bottom button - only show when not near bottom */}
        {!isNearBottom && messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 bg-green-500/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-green-500/30 transition-all duration-200"
            onClick={scrollToBottom}
            title="Scroll to bottom"
          >
            <ArrowUp className="w-5 h-5 rotate-180" />
          </Button>
        )}
      </div>
    </div>
  )
}