import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { SmartMessage } from './SmartMessage'

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
    <div className="flex flex-col relative">
      <div className="px-4 py-2 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`message-appear flex ${
            message.role === 'user' 
              ? 'justify-end pl-16' 
              : 'justify-start pr-16'
          }`}>
            <div className="max-w-full">
              <SmartMessage
                content={message.content}
                role={message.role}
                onCopy={onCopyMessage}
              />
              
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