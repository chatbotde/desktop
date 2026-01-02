import { useCallback, useRef, useState, useEffect } from 'react'
import { Copy, Check, Send, Play } from 'lucide-react'
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
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())

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
    "break-words overflow-hidden relative",
    isUser
      ? cn(
        'text-white',
        'bg-gradient-to-r from-blue-500 to-blue-600',
        isSingleLine ? 'rounded-full' : 'rounded-xl',
        'px-3.5 py-1.5',
        'shadow-sm',
        'transition-all duration-200'
      )
      : cn(
        'bg-transparent',
        isDarkTheme ? 'px-4 py-1 text-zinc-100' : 'px-4 py-1 text-zinc-900'
      )
  )

  return (
    <div id={id} className={cn(
      "flex w-full group",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        isUser
          ? "max-w-[75%] break-words relative pb-6"
          : "w-full break-words relative pb-6",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Display attachments (images and videos) - compact state only */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn(
            "mb-2 space-y-2 flex flex-wrap gap-2",
            isUser ? "justify-end" : "justify-start"
          )}>
            {message.attachments.map((attachment) => (
              (attachment.mediaType === 'image' || attachment.mediaType === 'video') && (
                <div
                  key={attachment.id}
                  className={cn(
                    "rounded-lg overflow-hidden",
                    "border-2",
                    isDarkTheme ? "border-zinc-700" : "border-zinc-200",
                    "shadow-sm",
                    "relative"
                  )}
                >
                  {attachment.mediaType === 'image' ? (
                    <img
                      src={attachment.data}
                      alt={attachment.name}
                      className="w-16 h-16 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <>
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current.set(attachment.id, el)
                        }}
                        src={attachment.data}
                        className="w-16 h-16 object-cover"
                        preload="metadata"
                        onClick={() => {
                          const video = videoRefs.current.get(attachment.id)
                          if (!video) return
                          
                          if (playingVideos.has(attachment.id)) {
                            video.pause()
                            setPlayingVideos(prev => {
                              const next = new Set(prev)
                              next.delete(attachment.id)
                              return next
                            })
                          } else {
                            video.play()
                            setPlayingVideos(prev => new Set(prev).add(attachment.id))
                          }
                        }}
                        onEnded={() => {
                          setPlayingVideos(prev => {
                            const next = new Set(prev)
                            next.delete(attachment.id)
                            return next
                          })
                        }}
                      />
                      {!playingVideos.has(attachment.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const video = videoRefs.current.get(attachment.id)
                            if (!video) return
                            video.play()
                            setPlayingVideos(prev => new Set(prev).add(attachment.id))
                          }}
                          className={cn(
                            "absolute inset-0 flex items-center justify-center",
                            "bg-black/30 hover:bg-black/40 rounded-lg transition-colors"
                          )}
                        >
                          <Play className="size-6 text-white" />
                        </button>
                      )}
                      {attachment.duration && (
                        <div className={cn(
                          "absolute bottom-1 right-1 text-[10px] px-1 py-0.5 rounded",
                          isDarkTheme ? "bg-black/70 text-white" : "bg-white/90 text-zinc-900"
                        )}>
                          {Math.round(attachment.duration)}s
                        </div>
                      )}
                    </>
                  )}
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
                  ? "!text-white text-sm leading-relaxed"
                  : isDarkTheme
                    ? "prose prose-invert prose-zinc prose-headings:text-zinc-100 prose-p:text-zinc-100 prose-strong:text-white prose-code:text-zinc-100 !text-zinc-100"
                    : "prose prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-900 prose-strong:text-zinc-900 prose-code:text-zinc-900 !text-zinc-900",
                !isUser && "text-[15px] leading-[1.7] tracking-[0.01em]",
                "[&_p]:mb-1.5 [&_p]:mt-0",
                "[&_ul]:my-1.5 [&_ol]:my-1.5",
                "[&_li]:mb-0.5",
                "[&_pre]:!bg-transparent [&_code]:!bg-transparent",
                "[&_pre]:my-1.5 [&_pre]:rounded-lg",
                "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:mx-0.5",
                "[&_h1]:mt-2 [&_h1]:mb-1.5 [&_h2]:mt-1.5 [&_h2]:mb-1 [&_h3]:mt-1.5 [&_h3]:mb-1",
                // Math equation styling - allow multi-line rendering
                "[&_.math-block]:my-2 [&_.math-block]:w-full [&_.math-block]:overflow-x-auto [&_.math-block]:overflow-y-visible",
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
              "mt-1.5 text-xs font-medium transition-colors",
              "text-blue-200 hover:text-white"
            )}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Action buttons */}
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "absolute bottom-0 right-0 flex items-center gap-2"
        )}>
          {/* Insert button */}
          <button
            onClick={handleInsert}
            disabled={isInserting || !window.tsfAPI}
            className={cn(
              "p-1 rounded-full text-xs transition-colors",
              isDarkTheme
                ? "bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-white/90 text-zinc-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-sm backdrop-blur-sm"
            )}
            title={insertSuccess ? "Inserted!" : isInserting ? "Inserting..." : "Insert text"}
          >
            {insertSuccess ? (
              <Check className="w-2.5 h-2.5" />
            ) : isInserting ? (
              <Send className="w-2.5 h-2.5 animate-pulse" />
            ) : (
              <Send className="w-2.5 h-2.5" />
            )}
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={cn(
              "p-1 rounded-full text-xs transition-colors",
              isDarkTheme
                ? "bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700"
                : "bg-white/90 text-zinc-700 hover:bg-white",
              "shadow-sm backdrop-blur-sm"
            )}
            title={copied ? "Copied!" : "Copy"}
          >
            {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
          </button>
        </div>

      </div>
    </div>
  )
}
