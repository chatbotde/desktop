import { useCallback, useRef, useState } from 'react'
import { Copy, Check, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageContent } from '../prompt-kit/message'
import type { ChatMessage } from './types'
import { TextSelectionActions } from './TextSelectionActions'

interface MessageBubbleProps {
  message: ChatMessage
  isDarkTheme: boolean
  id?: string
  onAddSelectedText?: (text: string) => void
  onAskSelectedText?: (text: string) => void | Promise<void>
  onExplainSelectedText?: (text: string, position?: { x: number; y: number }) => void | Promise<void>
}

const LONG_CONTENT_CHAR_THRESHOLD = 450

export function MessageBubble({
  message,
  isDarkTheme,
  id,
  onAddSelectedText,
  onAskSelectedText,
  onExplainSelectedText,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isInserting, setIsInserting] = useState(false)
  const [insertSuccess, setInsertSuccess] = useState(false)
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const [selectionText, setSelectionText] = useState('')
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isSelectionVisible, setIsSelectionVisible] = useState(false)

  const isLongContent = message.role === 'user' && message.content.length > LONG_CONTENT_CHAR_THRESHOLD

  // Extract plain text from message content (removes markdown formatting)
  const getPlainText = (content: string): string => {
    // Remove markdown code blocks
    let text = content.replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    text = text.replace(/`[^`]*`/g, '')
    // Remove markdown links but keep text
    text = text.replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
    // Remove markdown headers
    text = text.replace(/^#{1,6}\s+/gm, '')
    // Remove markdown bold/italic
    text = text.replace(/\*\*([^*]*)\*\*/g, '$1')
    text = text.replace(/\*([^*]*)\*/g, '$1')
    text = text.replace(/__([^_]*)__/g, '$1')
    text = text.replace(/_([^_]*)_/g, '$1')
    // Remove markdown lists
    text = text.replace(/^[\s]*[-*+]\s+/gm, '')
    text = text.replace(/^[\s]*\d+\.\s+/gm, '')
    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n').trim()
    return text
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleInsert = async () => {
    if (!window.tsfAPI) {
      console.error('[MessageBubble] TSF API is not available')
      return
    }

    setIsInserting(true)
    setInsertSuccess(false)

    try {
      // Get plain text from message content
      const plainText = getPlainText(message.content)
      
      if (!plainText || plainText.trim().length === 0) {
        console.warn('[MessageBubble] No text to insert')
        setIsInserting(false)
        return
      }

      // Initialize TSF if needed
      await window.tsfAPI.initialize()

      // Insert text into the last focused application (not current)
      // This focuses the last external app and inserts text there
      const success = await window.tsfAPI.focusAndInsertText(plainText)

      if (success) {
        setInsertSuccess(true)
        setTimeout(() => setInsertSuccess(false), 2000)
      } else {
        console.error('[MessageBubble] Failed to insert text')
      }
    } catch (error) {
      console.error('[MessageBubble] Error inserting text:', error)
    } finally {
      setIsInserting(false)
    }
  }

  const isUser = message.role === 'user'

  const hideSelectionActions = useCallback(() => {
    setIsSelectionVisible(false)
    setSelectionText('')
  }, [])

  const updateSelectionFromDOM = useCallback(() => {
    const container = contentContainerRef.current
    if (!container) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      hideSelectionActions()
      return
    }

    const text = selection.toString().trim()
    if (!text) {
      hideSelectionActions()
      return
    }

    const anchorNode = selection.anchorNode
    const focusNode = selection.focusNode
    const isInside =
      (anchorNode && container.contains(anchorNode)) ||
      (focusNode && container.contains(focusNode))

    if (!isInside) {
      hideSelectionActions()
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      hideSelectionActions()
      return
    }

    // `TextSelectionActions` uses `position: fixed`, so viewport coords are correct.
    const x = rect.left + rect.width / 2

    setSelectionText(text)
    setSelectionPos({ x, y: rect.top + rect.height / 2 }) // Use center of selection for explanation positioning
    setIsSelectionVisible(true)
  }, [hideSelectionActions])

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
        <div
          className={messageStyles}
          ref={contentContainerRef}
          onMouseUp={updateSelectionFromDOM}
          onKeyUp={updateSelectionFromDOM}
          onTouchEnd={updateSelectionFromDOM}
        >
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

        <TextSelectionActions
          selectedText={selectionText}
          position={selectionPos}
          isVisible={isSelectionVisible}
          onClose={hideSelectionActions}
          onAdd={onAddSelectedText}
          onAsk={
            onAskSelectedText
              ? async (t) => {
                  try {
                    await onAskSelectedText(t)
                  } catch (err) {
                    console.error('[MessageBubble] Failed to ask about selection:', err)
                  }
                }
              : undefined
          }
          onExplain={
            onExplainSelectedText
              ? async (t) => {
                  try {
                    // Pass both text and position to the handler
                    await onExplainSelectedText(t, selectionPos)
                  } catch (err) {
                    console.error('[MessageBubble] Failed to explain selection:', err)
                  }
                }
              : undefined
          }
          isDarkTheme={isDarkTheme}
        />
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

        {/* Action buttons */}
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "absolute -bottom-8 right-0 flex items-center gap-1.5"
        )}>
          {/* Insert button */}
          <button
            onClick={handleInsert}
            disabled={isInserting || !window.tsfAPI}
            className={cn(
              "p-1.5 rounded-full text-xs transition-colors",
              isDarkTheme
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed border-zinc-200",
              "border shadow-sm",
              isDarkTheme ? "border-zinc-700" : "border-zinc-200"
            )}
            title={insertSuccess ? "Inserted!" : isInserting ? "Inserting..." : "Insert text"}
          >
            {insertSuccess ? (
              <Check className="w-3 h-3" />
            ) : isInserting ? (
              <Send className="w-3 h-3 animate-pulse" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={cn(
              "p-1.5 rounded-full text-xs",
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
        </div>

      </div>
    </div>
  )
}
