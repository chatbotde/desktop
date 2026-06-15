import { useRef, useState, useSyncExternalStore, useCallback } from 'react'
import { Copy, Check, Send, Play, AtSign, FileText } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { openRecordedImageViewer } from '@/lib/events/recorded-image-player'
import type { ChatMessage } from '../types'

interface ParsedMessageContent {
  displayText: string
  references: { label: string; kind: 'integration' | 'note'; payload: string; connected?: boolean }[]
}

function parseMessageContent(content: string): ParsedMessageContent {
  const result: ParsedMessageContent = {
    displayText: content,
    references: []
  }

  if (!content.startsWith('### Task references\n')) {
    return result
  }

  const endIndex = content.indexOf('\n\nUse the references above when completing this task.')
  if (endIndex === -1) {
    return result
  }

  // Extract the reference block and the remaining typed text
  const referenceBlock = content.substring(0, endIndex)
  const remainingText = content.substring(endIndex + '\n\nUse the references above when completing this task.'.length).trim()

  result.displayText = remainingText

  // Parse lines inside the reference block
  const lines = referenceBlock.split('\n').slice(1) // Skip "### Task references"
  for (const line of lines) {
    // Check if integration reference:
    // "- **GitHub** (connected integration, slug: `github`) — Buddy can call this app's Composio tools for this message."
    const integrationRegex = /^-\s+\*\*(.*?)\*\*\s+\((connected|not connected)\s+integration,\s+slug:\s+`(.*?)`\)/
    const noteRegex = /^-\s+\*\*Context note:\*\*\s+(.*)$/

    const integrationMatch = line.match(integrationRegex)
    if (integrationMatch) {
      const label = integrationMatch[1]
      const status = integrationMatch[2]
      const slug = integrationMatch[3]
      result.references.push({
        label,
        kind: 'integration',
        payload: slug,
        connected: status === 'connected'
      })
      continue
    }

    const noteMatch = line.match(noteRegex)
    if (noteMatch) {
      const payload = noteMatch[1]
      const preview = payload.length > 40 ? `${payload.slice(0, 40)}…` : payload
      result.references.push({
        label: preview || "Note",
        kind: 'note',
        payload
      })
    }
  }

  return result
}

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
  const { displayText, references } = parseMessageContent(message.content)
  const [insertSuccess, setInsertSuccess] = useState(false)
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())

  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowMore, setShouldShowMore] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Check overflow and listen for resize - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
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
    }, [displayText, isExpanded]),
    () => null,
    () => null
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText)
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
      const text = displayText.trim()
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
                    <button
                      type="button"
                      onClick={() => openRecordedImageViewer(attachment.data, attachment.name)}
                      className="block cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                      aria-label={`View ${attachment.name}`}
                      title="View image"
                    >
                      <img
                        src={attachment.data}
                        alt={attachment.name}
                        className="w-16 h-16 object-cover pointer-events-none"
                        loading="lazy"
                        draggable={false}
                      />
                    </button>
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
            {displayText && (
              <p className="max-w-none break-words whitespace-pre-wrap bg-transparent p-0 text-white text-sm leading-relaxed">
                {displayText}
              </p>
            )}

            {references.length > 0 && (
              <div className={cn(
                "flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10",
                !displayText && "mt-0 pt-0 border-t-0"
              )}>
                {references.map((ref, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] bg-white/15 text-white border border-white/10 max-w-[180px] shrink-0"
                    title={ref.kind === "note" ? ref.payload : `${ref.label} integration`}
                  >
                    {ref.kind === "integration" ? (
                      <AtSign className="size-2.5 shrink-0 text-blue-200" />
                    ) : (
                      <FileText className="size-2.5 shrink-0 text-blue-200" />
                    )}
                    <span className="truncate">{ref.label}</span>
                  </div>
                ))}
              </div>
            )}
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
