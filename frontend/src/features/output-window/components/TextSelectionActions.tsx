import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import { Plus, ArrowRight, Replace, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { InsertButton } from '@/shared/components/actions/InsertButton'
import { ReplaceButton } from '@/shared/components/actions/ReplaceButton'
import { TextSelectionInput } from '@/features/text-selection/components/TextSelection'
import { TextSelectionOutput } from '@/features/text-selection/components/TextSelectionOutput'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'

interface TextSelectionActionsProps {
  /**
   * Selected text
   */
  selectedText: string

  /**
   * Position where the popup should appear
   */
  position: { x: number; y: number }

  /**
   * Whether the popup is visible
   */
  isVisible: boolean

  /**
   * Callback when popup should be hidden
   */
  onClose: () => void

  /**
   * Callback when "Add" button is clicked - adds text to prompt-input in compact form
   */
  onAdd?: (text: string) => void

  /**
   * Dark theme mode
   */
  isDarkTheme?: boolean
}

/**
 * Text Selection Actions Component
 * 
 * Compact pill-style buttons when text is selected with smooth animations.
 * - Add: Adds selected text to prompt-input
 * - Insert: Inserts text at cursor position
 * - Replace: Replaces selected text
 * - Expand: Shows input field to ask AI about selected text
 */
export function TextSelectionActions({
  selectedText,
  position,
  isVisible,
  onClose,
  onAdd,
  isDarkTheme = true,
}: TextSelectionActionsProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const [isExpanded, setIsExpanded] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const [showContent, setShowContent] = useState(false)

  // Smooth entrance animation - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (isVisible) {
        const timer = setTimeout(() => setShowContent(true), 50)
        return () => clearTimeout(timer)
      } else {
        setShowContent(false)
        return () => {}
      }
    }, [isVisible]),
    () => null,
    () => null
  )

  // Reset state when popup becomes invisible - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (!isVisible) {
        setIsExpanded(false)
        setPrompt('')
        setIsGenerating(false)
        setGeneratedOutput(null)
        setShowContent(false)
      }
      return () => {}
    }, [isVisible]),
    () => null,
    () => null
  )

  // Adjust position to keep popup within viewport - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (!isVisible || !popupRef.current) return () => {}

      const popup = popupRef.current
      const rect = popup.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y

      const halfW = rect.width / 2
      if (x + halfW > viewportWidth - 10) {
        x = viewportWidth - 10 - halfW
      }
      if (x - halfW < 10) {
        x = 10 + halfW
      }

      if (y + rect.height > viewportHeight - 10) {
        y = position.y - rect.height - 10
      }
      if (y < 10) {
        y = 10
      }

      setAdjustedPosition({ x, y })
      return () => {}
    }, [position, isVisible, isExpanded, generatedOutput]),
    () => null,
    () => null
  )

  // Close popup when clicking outside - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (!isVisible) return () => {}

      const handleClickOutside = (event: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
          const selection = window.getSelection()
          if (!selection || selection.toString().trim().length === 0) {
            onClose()
          }
        }
      }

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          if (isExpanded) {
            setIsExpanded(false)
            setPrompt('')
            setGeneratedOutput(null)
          } else {
            onClose()
          }
        }
      }

      const timeout = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
      }, 100)

      return () => {
        clearTimeout(timeout)
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [isVisible, onClose, isExpanded]),
    () => null,
    () => null
  )

  const handleAdd = useCallback(() => {
    if (selectedText.trim() && onAdd) {
      onAdd(selectedText.trim())
      onClose()
    }
  }, [selectedText, onAdd, onClose])

  const handleExpand = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const handleCloseExpanded = useCallback(() => {
    setIsExpanded(false)
    setPrompt('')
    setGeneratedOutput(null)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    let message = prompt.trim()
    if (selectedText) {
      message = `${message}\n\nSelected text:\n"${selectedText}"`
    }

    setIsGenerating(true)
    setGeneratedOutput(null)

    try {
      const localModel = unifiedLocalLLMService.getCurrentModel()

      let responseStream: AsyncGenerator<string, void, unknown>;

      if (localModel) {
        const init = await unifiedLocalLLMService.initialize()
        if (!init.success) {
          throw new Error(init.message)
        }
        responseStream = await unifiedLocalLLMService.sendMessage(
          message,
          undefined,
          localModel.name
        )
      } else {
        responseStream = await sendCloudMessage(message, undefined)
      }

      let fullResponse = ''
      for await (const chunk of responseStream) {
        fullResponse += chunk
        setGeneratedOutput(fullResponse)
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown error'
      setGeneratedOutput(`Sorry, I could not generate a response right now. (${errorMessage})`)
      console.error('AI generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, selectedText, isGenerating])

  const handleInsert = useCallback(async () => {
    if (!generatedOutput) return

    try {
      const tsfAPI = (window as any).tsfAPI;
      if (!tsfAPI) {
        console.warn('TSF API not available for text insertion')
        return
      }

      await tsfAPI.initialize()

      const selectedTextTrimmed = selectedText?.trim() || ''

      if (selectedTextTrimmed) {
        // Prepend a space if there's selected text to maintain separation
        let textToInsert = ` ${generatedOutput}`
        
        // Use the new method that appends instead of replacing
        if (tsfAPI.focusAndInsertAtEnd) {
          await tsfAPI.focusAndInsertAtEnd(textToInsert)
        } else {
          // Fallback for older interface-window version
          let fallbackText = `${selectedTextTrimmed} ${generatedOutput}`
          await tsfAPI.focusAndReplaceText(fallbackText)
        }
      } else {
        await tsfAPI.focusAndInsertText(generatedOutput)
      }
    } catch (error) {
      console.error('Error inserting text:', error)
    }
  }, [generatedOutput, selectedText])

  const handleReplace = useCallback(async () => {
    if (!generatedOutput) return

    try {
      const tsfAPI = (window as any).tsfAPI;
      if (!tsfAPI) {
        console.warn('TSF API not available for text replacement')
        return
      }

      await tsfAPI.initialize()
      await tsfAPI.focusAndReplaceText(generatedOutput)
    } catch (error) {
      console.error('Error replacing text:', error)
    }
  }, [generatedOutput])

  const handleCopy = useCallback(() => {
    console.log('Content copied to clipboard')
  }, [])

  if (!isVisible || !selectedText.trim()) {
    return null
  }

  // Compact sizes for pill buttons
  const buttonClasses = cn(
    'h-6 px-2.5 rounded-full gap-1 text-[11px] font-medium transition-all duration-200',
    isDarkTheme
      ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700/80'
      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
  )

  const iconSize = 'h-3 w-3'

  return (
    <div
      ref={popupRef}
      className="fixed z-[10001]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translate(-50%, 0)',
      }}
      data-no-clickthrough
    >
      {/* Collapsed Pill State - Compact & Smooth */}
      <div
        className={cn(
          'flex items-center gap-1 px-1 py-0.5 rounded-full shadow-xl border',
          // Smooth entrance animation
          'transition-all duration-300 ease-out',
          showContent && !isExpanded
            ? 'opacity-100 scale-100 translate-y-0'
            : isExpanded
              ? 'opacity-0 scale-90 -translate-y-2 pointer-events-none absolute'
              : 'opacity-0 scale-75 translate-y-2',
          isDarkTheme
            ? 'bg-zinc-900/95 border-zinc-700/80 backdrop-blur-xl'
            : 'bg-white/95 border-zinc-200/80 backdrop-blur-xl'
        )}
      >
        {/* Add Button - Compact */}
        {onAdd && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            className={buttonClasses}
            title="Add to prompt"
          >
            <Plus className={iconSize} />
            <span>Add</span>
          </Button>
        )}

        {/* Insert Button - Compact */}
        <InsertButton
          text={selectedText.trim()}
          variant="ghost"
          size="sm"
          showSuccess={true}
          icon={<ArrowRight className={iconSize} />}
          onInserted={(success) => {
            if (success) {
              setTimeout(() => onClose(), 400)
            }
          }}
          className={buttonClasses}
          label="Insert"
        />

        {/* Replace Button - Compact */}
        <ReplaceButton
          text={selectedText.trim()}
          variant="ghost"
          size="sm"
          showSuccess={true}
          icon={<Replace className={iconSize} />}
          onReplaced={(success) => {
            if (success) {
              setTimeout(() => onClose(), 400)
            }
          }}
          className={buttonClasses}
          label="Replace"
        />

        {/* Divider */}
        <div className={cn(
          "w-px h-3.5",
          isDarkTheme ? "bg-zinc-700/60" : "bg-zinc-200/60"
        )} />

        {/* Expand Button - Compact sparkle icon */}
        <button
          onClick={handleExpand}
          className={cn(
            'flex items-center justify-center h-6 w-6 rounded-full transition-all duration-200',
            isDarkTheme
              ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/20'
              : 'text-purple-600 hover:text-purple-500 hover:bg-purple-100'
          )}
          title="Ask AI about this"
        >
          <Sparkles className={iconSize} />
        </button>
      </div>

      {/* Expanded State with Input - Smooth transition */}
      <div
        className={cn(
          'flex flex-col gap-0 w-[380px]',
          'transition-all duration-300 ease-out',
          isExpanded && showContent
            ? 'opacity-100 scale-100 translate-y-0 relative'
            : 'opacity-0 scale-95 translate-y-3 pointer-events-none absolute'
        )}
      >
        <TextSelectionInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          onClose={handleCloseExpanded}
          placeholder="Ask about this..."
          isGenerating={isGenerating}
          isDarkTheme={isDarkTheme}
        />
        {(generatedOutput || isGenerating) && (
          <TextSelectionOutput
            content={generatedOutput || ""}
            isStreaming={isGenerating}
            onInsert={handleInsert}
            onReplace={handleReplace}
            onCopy={handleCopy}
            isDarkTheme={isDarkTheme}
          />
        )}
      </div>
    </div>
  )
}
