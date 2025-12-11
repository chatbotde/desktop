import { useState } from 'react'
import { Copy, Check, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InsertButton } from '../insert-button'
import { MessageContent } from '../prompt-kit/message'
import type { ChatMessage, MediaAttachment } from './types'

interface MessageBubbleProps {
  message: ChatMessage
  isDarkTheme: boolean
  id?: string
}

const LONG_CONTENT_CHAR_THRESHOLD = 450

export function MessageBubble({ message, isDarkTheme, id }: MessageBubbleProps) {
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
        'border border-blue-600',
        'shadow-lg shadow-blue-500/20',
        'px-4 py-2',
        'hover:shadow-xl hover:shadow-blue-500/30',
        'transition-all duration-300 ease-in-out'
      )
      : cn(
        'bg-transparent px-4 py-3',
        isDarkTheme ? 'text-zinc-100' : 'text-zinc-900'
      )
  )

  return (
    <div id={id} className={cn(
      "flex w-full group",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        isUser
          ? "max-w-[85%] md:max-w-[75%] lg:max-w-[65%] break-words relative"
          : "w-full break-words relative",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Display attachments (images) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn(
            "mb-2 space-y-2",
            isUser ? "flex flex-col items-end" : "flex flex-col items-start"
          )}>
            {message.attachments.map((attachment) => (
              attachment.mediaType === 'image' && (
                <div
                  key={attachment.id}
                  className={cn(
                    "rounded-lg overflow-hidden",
                    isUser ? "max-w-full" : "max-w-full",
                    "shadow-md"
                  )}
                >
                  <img
                    src={attachment.data}
                    alt={attachment.name}
                    className={cn(
                      "max-w-full h-auto",
                      "max-h-[400px] object-contain",
                      isUser ? "rounded-lg" : "rounded-lg"
                    )}
                    loading="lazy"
                  />
                </div>
              )
            ))}
          </div>
        )}
        <div className={messageStyles}>
          <div className={cn(
            "relative",
            !isExpanded && isLongContent ? "max-h-48 overflow-hidden" : ""
          )}>
            <MessageContent
              markdown={message.role === 'assistant'}
              className={cn(
                "max-w-none break-words whitespace-pre-wrap bg-transparent p-0",
                isUser
                  ? "!text-white"
                  : isDarkTheme
                    ? "prose prose-invert prose-zinc prose-headings:text-zinc-100 prose-p:text-zinc-100 prose-strong:text-white prose-code:text-zinc-100 !text-zinc-100"
                    : "prose prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-900 prose-strong:text-zinc-900 prose-code:text-zinc-900 !text-zinc-900",
                "text-[15px] leading-[1.7] tracking-[0.01em]",
                "[&_p]:mb-3 [&_p]:mt-0",
                "[&_ul]:my-3 [&_ol]:my-3",
                "[&_li]:mb-1.5",
                "[&_pre]:!bg-transparent [&_code]:!bg-transparent",
                "[&_pre]:my-3 [&_pre]:rounded-lg",
                "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:mx-0.5",
                "[&_h1]:mt-4 [&_h1]:mb-3 [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:mt-3 [&_h3]:mb-2",
                // Only override main text elements for theme
                isDarkTheme
                  ? "[&_p]:!text-zinc-100 [&_h1]:!text-zinc-100 [&_h2]:!text-zinc-100 [&_h3]:!text-zinc-100 [&_strong]:!text-white [&_code]:!text-zinc-100"
                  : "[&_p]:!text-zinc-900 [&_h1]:!text-zinc-900 [&_h2]:!text-zinc-900 [&_h3]:!text-zinc-900 [&_strong]:!text-zinc-900 [&_code]:!text-zinc-900"
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
            "absolute -bottom-8 right-0 p-1.5 rounded-full text-xs",
            isDarkTheme
              ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border-zinc-200",
            "border shadow-sm",
            isDarkTheme ? "border-zinc-700" : "border-zinc-200"
          )}
          title={copied ? "Copied!" : "Copy"}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>

        {/* Insert button - only show for AI messages */}
        {!isUser && (
          <InsertButton
            content={message.content}
            variant="ghost"
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "absolute -bottom-8 right-8 p-0 h-[26px] w-[26px] rounded-full text-xs gap-0",
              isDarkTheme
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-normal"
                : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border-zinc-200",
              "border shadow-sm",
              isDarkTheme ? "border-zinc-700" : "border-zinc-200"
            )}
          >
            <CornerDownLeft className="w-3 h-3" />
          </InsertButton>
        )}

        {/* Replace button */}

      </div>
    </div>
  )
}
