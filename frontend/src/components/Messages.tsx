import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, ArrowUp, Check } from 'lucide-react'
import { MessageContent } from '@/components/prompt-kit/message'
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MessagesProps {
  messages: ChatMessage[]
  isTyping: boolean
  onCopyMessage: (text: string) => void
}

export function Messages({ messages, isTyping, onCopyMessage }: MessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle copy with indication
  const handleCopyMessage = (messageId: string, text: string) => {
    onCopyMessage(text)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000) // Clear after 2 seconds
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  return (
    <div className="flex-1 flex flex-col min-h-full relative">
      <div className="flex-1 px-6 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`message-appear flex ${
            message.role === 'user' 
              ? 'justify-end pl-16' 
              : 'justify-start pr-16'
          }`}>
            <div className={`group ${
              message.role === 'user' 
                ? 'max-w-full' 
                : 'max-w-full'
            }`}>
              <div className="relative">
                <MessageContent
                  markdown={message.role === 'assistant'}
                  className={`
                    backdrop-blur-lg text-white transition-all duration-300 hover:shadow-lg
                    ${message.role === 'user'
                      ? 'bg-blue-600/80 hover:bg-blue-600/90 border border-blue-400/30 rounded-2xl rounded-br-sm shadow-lg'
                      : 'bg-gray-800/60 hover:bg-gray-800/70 border border-gray-600/20 rounded-2xl shadow-md'
                    }
                    px-4 py-3 leading-relaxed
                  `}
                >
                  {message.content}
                </MessageContent>

                {/* Copy button - appears on hover */}
                <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  message.role === 'user' ? 'left-2' : 'right-2'
                }`}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm rounded-full ${
                            copiedMessageId === message.id 
                              ? 'bg-green-500/40 text-green-300' 
                              : 'bg-black/30'
                          }`}
                          onClick={() => handleCopyMessage(message.id, message.content)}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
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
        <div ref={messagesEndRef} className="h-1" />
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