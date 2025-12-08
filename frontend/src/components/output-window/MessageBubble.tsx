import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageContent } from '../prompt-kit/message'
import type { ChatMessage } from './types'

interface MessageBubbleProps {
  message: ChatMessage
  isDarkTheme: boolean
}

const LONG_CONTENT_CHAR_THRESHOLD = 450

export function MessageBubble({ message, isDarkTheme }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const isLongContent = message.role === 'user' && message.content.length > LONG_CONTENT_CHAR_THRESHOLD

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const isUser = message.role === 'user'
  
  const messageStyles = cn(
    "transition-all duration-300 break-words overflow-hidden relative",
    "leading-[1.7] tracking-normal font-normal antialiased",
    isUser
      ? cn(
          'text-white',
          'bg-blue-600',
          'rounded-2xl',
          'border-7 border-blue-600',
          'shadow-lg shadow-blue-500/20',
          'px-1 py-0',
          'hover:shadow-xl hover:shadow-blue-500/30',
          'transition-all duration-300 ease-in-out'
        )
      : cn(
          'bg-transparent px-4 py-3',
          isDarkTheme ? 'text-white' : 'text-black'
        )
  )

  return (
    <div className={cn(
      "flex w-full group",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        isUser
          ? "max-w-[85%] md:max-w-[75%] lg:max-w-[65%] break-words relative"
          : "w-full break-words relative",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={messageStyles}>
          <div className={cn(
            "relative",
            !isExpanded && isLongContent ? "max-h-48 overflow-hidden" : ""
          )}>
            <MessageContent
              markdown={message.role === 'assistant'}
              className={cn(
                "max-w-none break-words whitespace-pre-wrap bg-transparent p-0",
                isDarkTheme ? "prose prose-invert" : "prose prose-zinc",
                "text-[15px] leading-[1.7] tracking-[0.01em]",
                "[&_p]:mb-3 [&_p]:mt-0",
                "[&_ul]:my-3 [&_ol]:my-3",
                "[&_li]:mb-1.5",
                "[&_pre]:!bg-transparent [&_code]:!bg-transparent",
                "[&_pre]:my-3 [&_pre]:rounded-lg",
                "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:mx-0.5",
                "[&_h1]:mt-4 [&_h1]:mb-3 [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:mt-3 [&_h3]:mb-2"
              )}
            >
              {message.content}
            </MessageContent>
            {!isExpanded && isLongContent && (
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 h-16 pointer-events-none bg-gradient-to-t",
                  isDarkTheme
                    ? "from-black/60 via-black/20 to-transparent"
                    : "from-white via-white/70 to-transparent"
                )}
              />
            )}
          </div>
        </div>
        {isLongContent && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "mt-2 text-xs font-medium transition-colors",
              isUser
                ? "text-blue-100 hover:text-white"
                : isDarkTheme
                  ? "text-zinc-300 hover:text-white"
                  : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "absolute -bottom-8 p-1.5 rounded-full text-xs",
            isDarkTheme 
              ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" 
              : "bg-white text-zinc-600 hover:bg-zinc-50",
            "border shadow-sm",
            isDarkTheme ? "border-zinc-700" : "border-zinc-200",
            isUser ? "right-0" : "left-0"
          )}
          title={copied ? "Copied!" : "Copy"}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    </div>
  )
}
