import { useRef, useState, useEffect } from 'react'
import { Copy, Check, Send, Play } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { ChatMessage } from '../types'

interface UserMessageBubbleProps {
  message: ChatMessage
  isDarkTheme: boolean
  id?: string
}

export function UserMessageBubble({
  message,
  isDarkTheme,
  id,
}: UserMessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [isInserting, setIsInserting] = useState(false)
  const [insertSuccess, setInsertSuccess] = useState(false)
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())

  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowMore, setShouldShowMore] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && !isExpanded) {
        const { scrollHeight, clientHeight } = contentRef.current
        if (scrollHeight > clientHeight) {
          setShouldShowMore(true)
        }
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [message.content, isExpanded])

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
    if (!window.tsfAPI) return

    setIsInserting(true)
    setInsertSuccess(false)

    try {
      const text = message.content.trim()
      if (!text) {
        setIsInserting(false)
        return
      }

      await window.tsfAPI.initialize()
      const success = await window.tsfAPI.focusAndInsertText(text)

      if (success) {
        setInsertSuccess(true)
        setTimeout(() => setInsertSuccess(false), 2000)
      }
    } catch (error) {
      console.error('[UserMessageBubble] Error inserting text:', error)
    } finally {
      setIsInserting(false)
    }
  }

  return (
    <div id={id} className="flex w-full group justify-end">
      <div className="max-w-[75%] break-words relative pb-6 items-end">
        {/* Display attachments (images and videos) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 space-y-2 flex flex-wrap gap-2 justify-end">
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

        {/* Message content */}
        <div className="break-words overflow-hidden relative text-white bg-blue-500 rounded-2xl px-3.5 py-2 shadow-sm">
          <div 
            ref={contentRef}
            className={cn(
              "relative",
              !isExpanded && "line-clamp-[8]"
            )}
          >
            <p className="max-w-none break-words whitespace-pre-wrap bg-transparent p-0 text-white text-sm leading-relaxed">
              {message.content}
            </p>
          </div>
          {shouldShowMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-[10px] font-semibold text-blue-100/90 hover:text-white transition-colors uppercase tracking-wider"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-0 right-0 flex items-center gap-2">
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
