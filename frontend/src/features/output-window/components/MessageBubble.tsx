import { useCallback, useRef, useState, useEffect } from 'react'
import { Copy, Check, Send } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { MessageContent } from '@/shared/components/message'
import type { ChatMessage } from '../types'
import { TextSelectionActions } from './TextSelectionActions'

interface MessageBubbleProps {
  message: ChatMessage
  isDarkTheme: boolean
  id?: string
  onAddSelectedText?: (text: string) => void
  onAskSelectedText?: (text: string) => void | Promise<void>
  onExplainSelectedText?: (text: string, position?: { x: number; y: number }) => void | Promise<void>
}

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
  const [isSingleLine, setIsSingleLine] = useState(true)

  const [selectionText, setSelectionText] = useState('')
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isSelectionVisible, setIsSelectionVisible] = useState(false)

  const isUser = message.role === 'user'

  // Detect if message is single line or multi-line
  useEffect(() => {
    if (isUser) {
      // Check if content has newlines or would wrap
      const plainText = getPlainText(message.content)
      const hasNewlines = plainText.includes('\n')
      const estimatedWidth = plainText.length * 8 // rough estimate: ~8px per character
      const maxWidth = 0.85 * (typeof window !== 'undefined' ? window.innerWidth : 1200) // 85% of screen width
      
      // Single line if no newlines and content fits in one line
      setIsSingleLine(!hasNewlines && estimatedWidth < maxWidth)
    }
  }, [message.content, isUser])

  // Also check after render using ResizeObserver for more accurate detection
  useEffect(() => {
    if (!isUser || !contentContainerRef.current) return

    const container = contentContainerRef.current
    const resizeObserver = new ResizeObserver(() => {
      const lineHeight = parseFloat(getComputedStyle(container).lineHeight) || 25.5
      const height = container.scrollHeight
      // Consider it single line if height is less than 2x line height
      setIsSingleLine(height <= lineHeight * 2.2)
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [isUser, message.content])

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
        isSingleLine ? 'rounded-full' : 'rounded-2xl',
        'border border-blue-600',
        'shadow-lg shadow-blue-500/20',
        'px-5 py-2.5',
        'hover:shadow-xl hover:shadow-blue-500/30',
        'transition-all duration-300 ease-in-out'
      )
      : cn(
        'bg-transparent',
        isDarkTheme ? 'px-4 py-3 text-zinc-100' : 'px-5 py-4 text-zinc-900'
      )
  )

  return (
    <div id={id} className={cn(
      "flex w-full group",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        isUser
          ? "max-w-[85%] break-words relative"
          : "w-full break-words relative",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Display attachments (images) - compact state only */}
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
                    "border-2",
                    isDarkTheme ? "border-zinc-700" : "border-zinc-200",
                    "shadow-sm"
                  )}
                >
                  <img
                    src={attachment.data}
                    alt={attachment.name}
                    className="w-16 h-16 object-cover"
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
            !isExpanded && isUser && !isSingleLine ? "line-clamp-3" : ""
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
                // Math equation styling - allow multi-line rendering
                "[&_.math-block]:my-4 [&_.math-block]:w-full [&_.math-block]:overflow-x-auto [&_.math-block]:overflow-y-visible",
                "[&_.math-inline]:inline [&_.math-inline]:align-middle",
                "[&_.katex]:!text-current [&_.katex-display]:!block [&_.katex-display]:!w-full",
                "[&_.katex-display_.katex]:!max-w-full [&_.katex-display_.katex]:!overflow-x-auto",
                isDarkTheme
                  ? "[&_.katex]:!text-zinc-100 [&_.math-block]:bg-zinc-800/30 [&_.math-inline]:bg-zinc-800/20"
                  : "[&_.katex]:!text-zinc-950 [&_.math-block]:bg-zinc-100/50 [&_.math-inline]:bg-zinc-100/40 [&_.math-block]:border [&_.math-block]:border-zinc-200",
                // Improve text readability near math blocks in light theme - target text in same container
                isDarkTheme
                  ? ""
                  : "[&_p:has(_.math-block)]:!text-zinc-800 [&_p:has(_.math-inline)]:!text-zinc-800 [&_p:has(_.katex)]:!text-zinc-800 [&_span:has(_.katex)]:!text-zinc-800 [&_span:has(_.math-inline)]:!text-zinc-800 [&_*:has(_.math-block)]:!text-zinc-800",
                // Only override main text elements for theme - improved contrast for light theme
                isDarkTheme
                  ? "[&_p]:!text-zinc-100 [&_h1]:!text-zinc-100 [&_h2]:!text-zinc-100 [&_h3]:!text-zinc-100 [&_strong]:!text-white [&_code]:!text-zinc-100"
                  : "[&_p]:!text-zinc-800 [&_h1]:!text-zinc-900 [&_h2]:!text-zinc-900 [&_h3]:!text-zinc-900 [&_strong]:!text-zinc-950 [&_code]:!text-zinc-800 [&_span]:!text-zinc-800 [&_li]:!text-zinc-800",
                // Ensure all text near math has good contrast in light theme
                isDarkTheme
                  ? ""
                  : "[&_p_.math-block+span]:!text-zinc-800 [&_p_span:not(:has(_.katex))]:!text-zinc-800 [&_p:has(_.math-block)_span]:!text-zinc-800 [&_p:has(_.math-inline)_span]:!text-zinc-800"
              )}
            >
              {message.content}
            </MessageContent>
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
        {isUser && !isSingleLine && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "mt-2 text-xs font-medium transition-colors",
              "text-blue-100 hover:text-white"
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
