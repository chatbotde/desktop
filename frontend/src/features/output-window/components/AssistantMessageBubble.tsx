import { useCallback, useRef, useState, useMemo, memo, useSyncExternalStore } from 'react'
import { Copy, Check, Send } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { MessageContent } from '@/shared/components/message'
import type { ChatMessage } from '../types'
import { TextSelectionActions } from './TextSelectionActions'

interface AssistantMessageBubbleProps {
  message: ChatMessage
  isDarkTheme: boolean
  id?: string
  onAddSelectedText?: (text: string) => void
}

// Memoize action button component
const ActionButton = memo(function ActionButton({
  onClick,
  disabled,
  title,
  isDark,
  isLoading,
  isSuccess,
  iconType
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  isDark: boolean
  isLoading?: boolean
  isSuccess?: boolean
  iconType: 'copy' | 'send'
}) {
  const Icon = iconType === 'copy' ? Copy : Send
  const SuccessIcon = Check

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1 rounded-full text-xs transition-colors shadow-sm backdrop-blur-sm",
        isDark
          ? "bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          : "bg-white/90 text-zinc-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      title={title}
    >
      {isSuccess ? (
        <SuccessIcon className="w-2.5 h-2.5" />
      ) : isLoading ? (
        <Icon className="w-2.5 h-2.5 animate-pulse" />
      ) : (
        <Icon className="w-2.5 h-2.5" />
      )}
    </button>
  )
})

// Memoize message content classes - these are expensive to compute
function useMessageContentClasses(isDarkTheme: boolean) {
  return useMemo(() => cn(
    "max-w-none break-words whitespace-pre-wrap bg-transparent p-0",
    // Base prose styles
    isDarkTheme
      ? "prose prose-invert prose-zinc prose-headings:text-zinc-100 prose-p:text-zinc-100 prose-strong:text-white prose-code:text-zinc-100 !text-zinc-100"
      : "prose prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-900 prose-strong:text-zinc-900 prose-code:text-zinc-900 !text-zinc-900",
    // Typography
    "text-[15px] leading-[1.7] tracking-[0.01em]",
    // Element spacing
    "[&_p]:mb-1.5 [&_p]:mt-0",
    "[&_ul]:my-1.5 [&_ol]:my-1.5",
    "[&_li]:mb-0.5",
    // Code styling
    "[&_pre]:!bg-transparent [&_code]:!bg-transparent",
    "[&_pre]:my-1.5 [&_pre]:rounded-lg",
    "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:mx-0.5",
    // Header spacing
    "[&_h1]:mt-2 [&_h1]:mb-1.5 [&_h2]:mt-1.5 [&_h2]:mb-1 [&_h3]:mt-1.5 [&_h3]:mb-1",
    // Math equation styling
    "[&_.math-block]:my-2 [&_.math-block]:w-full [&_.math-block]:overflow-x-auto [&_.math-block]:overflow-y-visible",
    "[&_.math-inline]:inline [&_.math-inline]:align-middle",
    "[&_.katex]:!text-current [&_.katex-display]:!block [&_.katex-display]:!w-full",
    "[&_.katex-display_.katex]:!max-w-full [&_.katex-display_.katex]:!overflow-x-auto",
    // Theme-specific math styling
    isDarkTheme
      ? "[&_.katex]:!text-zinc-100 [&_.math-block]:bg-zinc-800/30 [&_.math-inline]:bg-zinc-800/20"
      : "[&_.katex]:!text-zinc-950 [&_.math-block]:bg-zinc-100/50 [&_.math-inline]:bg-zinc-100/40 [&_.math-block]:border [&_.math-block]:border-zinc-200",
    // Text element theming
    isDarkTheme
      ? "[&_p]:!text-zinc-100 [&_h1]:!text-zinc-100 [&_h2]:!text-zinc-100 [&_h3]:!text-zinc-100 [&_strong]:!text-white [&_code]:!text-zinc-100"
      : "[&_p]:!text-zinc-800 [&_h1]:!text-zinc-900 [&_h2]:!text-zinc-900 [&_h3]:!text-zinc-900 [&_strong]:!text-zinc-950 [&_code]:!text-zinc-800 [&_span]:!text-zinc-800 [&_li]:!text-zinc-800"
  ), [isDarkTheme])
}

// Main component
export const AssistantMessageBubble = memo(function AssistantMessageBubble({
  message,
  isDarkTheme,
  id,
  onAddSelectedText,
}: AssistantMessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [isInserting, setIsInserting] = useState(false)
  const [insertSuccess, setInsertSuccess] = useState(false)
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const [selectionText, setSelectionText] = useState('')
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isSelectionVisible, setIsSelectionVisible] = useState(false)

  // Memoize classes
  const contentClasses = useMessageContentClasses(isDarkTheme)
  const containerClasses = useMemo(() => cn(
    "break-words overflow-hidden relative bg-transparent",
    isDarkTheme ? "px-4 py-1 text-zinc-100" : "px-4 py-1 text-zinc-900"
  ), [isDarkTheme])

  // Intercept link clicks to open in system browser - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      const container = contentContainerRef.current
      if (!container) return () => {}

      const handleLinkClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        const anchor = target.closest('a')
        if (!anchor) return

        const href = anchor.getAttribute('href')
        if (!href) return

        // Only handle http/https/mailto links
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        // Use Electron's shell.openExternal if available
        if (window.electronAPI?.shell?.openExternal) {
          window.electronAPI.shell.openExternal(href).catch((error: Error) => {
            console.error('[AssistantMessageBubble] Failed to open external link:', error)
            window.open(href, '_blank', 'noopener,noreferrer')
          })
        } else {
          window.open(href, '_blank', 'noopener,noreferrer')
        }
      }

      container.addEventListener('click', handleLinkClick, true)
      return () => container.removeEventListener('click', handleLinkClick, true)
    }, []),
    () => null,
    () => null
  )

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [message.content])

  const handleInsert = useCallback(async () => {
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
  }, [message.content])

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

    const x = rect.left + rect.width / 2
    setSelectionText(text)
    setSelectionPos({ x, y: rect.top + rect.height / 2 })
    setIsSelectionVisible(true)
  }, [hideSelectionActions])



  return (
    <div id={id} className="flex w-full group justify-start">
      <div className="w-full break-words relative pb-6 items-start">
        {/* Message content */}
        <div
          className={containerClasses}
          ref={contentContainerRef}
          onMouseUp={updateSelectionFromDOM}
          onKeyUp={updateSelectionFromDOM}
          onTouchEnd={updateSelectionFromDOM}
          data-on-clickthrough
        >
          <div className="relative">
            <MessageContent
              markdown={true}
              className={contentClasses}
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
          isDarkTheme={isDarkTheme}
        />

        {/* Action buttons */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-0 right-0 flex items-center gap-2">
          <ActionButton
            onClick={handleInsert}
            disabled={isInserting || !window.tsfAPI}
            title={insertSuccess ? "Inserted!" : isInserting ? "Inserting..." : "Insert text"}
            isDark={isDarkTheme}
            isLoading={isInserting}
            isSuccess={insertSuccess}
            iconType="send"
          />
          <ActionButton
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy"}
            isDark={isDarkTheme}
            isSuccess={copied}
            iconType="copy"
          />
        </div>
      </div>
    </div>
  )
})
