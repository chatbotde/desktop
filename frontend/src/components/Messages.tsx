import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, ArrowUp } from 'lucide-react'
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

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  return (
    <div className="flex-1 flex flex-col min-h-full relative">
      <div className="flex-1 p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex justify-start message-appear">
            <div className="max-w-[70%] group">
              <div className="relative">
                <MessageContent
                  markdown={message.role === 'assistant'}
                  className={`bg-white/5 backdrop-blur-lg text-white/90 transition-all duration-200 hover:bg-white/10 ${
                    message.role === 'user'
                      ? 'border border-white/20'
                      : 'border-0'
                  }`}
                >
                  {message.content}
                </MessageContent>

                {/* Copy button - appears on hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-white/60 hover:text-white/90 hover:bg-white/20 transition-all duration-200 bg-black/20 backdrop-blur-sm"
                          onClick={() => onCopyMessage(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start message-appear">
            <div className="max-w-[70%]">
              <div className="bg-white/5 backdrop-blur-lg text-white/90 rounded-lg p-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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