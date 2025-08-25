import { useRef, useEffect } from 'react'
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
}

export function Messages({ messages, isTyping, onCopyMessage }: MessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

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
    <div className="flex flex-col relative">
      <div className="px-4 py-2 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`message-appear flex ${
            message.role === 'user' 
              ? 'justify-end pl-16' 
              : 'justify-start pr-16'
          }`}>
            <div className="max-w-full">
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
              
              {/* Message timestamp */}
              <div className={`text-xs text-white/40 mt-1 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start pr-16 message-appear">
            <div className="max-w-full">
              <div className="bg-gray-800/60 backdrop-blur-lg text-white rounded-2xl p-4 border border-gray-600/20 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-white/70 mr-2">AI is typing</div>
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

      {/* Scroll to bottom indicator */}
      {messages.length > 0 && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 bg-blue-500/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-blue-500/30 transition-all duration-200"
            onClick={scrollToBottom}
            title="Scroll to bottom"
          >
            <ArrowUp className="w-4 h-4 rotate-180" />
          </Button>
        </div>
      )}
    </div>
  )
}