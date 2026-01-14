import { useCallback, useRef, useState } from 'react'
import { Copy, Check, Send } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { MessageContent } from '@/shared/components/message'
import type { ChatMessage } from '../types'
import { TextSelectionActions } from './TextSelectionActions'

// Types are defined in @/types/electron.d.ts

interface AssistantMessageBubbleProps {
  message: ChatMessage
  isDarkTheme: boolean
  id?: string
  onAddSelectedText?: (text: string) => void
  onAskSelectedText?: (text: string) => void | Promise<void>
  onExplainSelectedText?: (text: string, position?: { x: number; y: number }) => void | Promise<void>
}

export function AssistantMessageBubble({
  message,
  isDarkTheme,
  id,
  onAddSelectedText,
  onAskSelectedText,
  onExplainSelectedText,
}: AssistantMessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [isInserting, setIsInserting] = useState(false)
  const [insertSuccess, setInsertSuccess] = useState(false)
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const [selectionText, setSelectionText] = useState('')
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isSelectionVisible, setIsSelectionVisible] = useState(false)

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
      console.error('[AssistantMessageBubble] Error inserting text:', error)
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

  return (
    <div id={id} className="flex w-full group justify-start">
      <div className="w-full break-words relative pb-6 items-start">
        {/* Message content */}
        <div
          className={cn(
            "break-words overflow-hidden relative bg-transparent",
            isDarkTheme ? "px-4 py-1 text-zinc-100" : "px-4 py-1 text-zinc-900"
          )}
          ref={contentContainerRef}
          onMouseUp={updateSelectionFromDOM}
          onKeyUp={updateSelectionFromDOM}
          onTouchEnd={updateSelectionFromDOM}
        >
          <div className="relative">
            <MessageContent
              markdown={true}
              className={cn(
                "max-w-none break-words whitespace-pre-wrap bg-transparent p-0",
                isDarkTheme
                  ? "prose prose-invert prose-zinc prose-headings:text-zinc-100 prose-p:text-zinc-100 prose-strong:text-white prose-code:text-zinc-100 !text-zinc-100"
                  : "prose prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-900 prose-strong:text-zinc-900 prose-code:text-zinc-900 !text-zinc-900",
                "text-[15px] leading-[1.7] tracking-[0.01em]",
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
                // Improve text readability near math blocks in light theme
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
                  console.error('[AssistantMessageBubble] Failed to ask about selection:', err)
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
                  console.error('[AssistantMessageBubble] Failed to explain selection:', err)
                }
              }
              : undefined
          }
          isDarkTheme={isDarkTheme}
        />

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
