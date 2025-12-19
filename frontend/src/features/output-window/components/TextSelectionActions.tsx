import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Send, ArrowRight, HelpCircle, Replace } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { InsertButton } from '@/shared/components/actions/InsertButton'
import { ReplaceButton } from '@/shared/components/actions/ReplaceButton'

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
   * Callback when "Ask" button is clicked - sends message to model
   */
  onAsk?: (text: string) => void
  
  /**
   * Callback when "Explain" button is clicked - explains the selected text
   */
  onExplain?: (text: string, position?: { x: number; y: number }) => void | Promise<void>
  
  /**
   * Dark theme mode
   */
  isDarkTheme?: boolean
}

/**
 * Text Selection Actions Component
 * 
 * Shows pill-style buttons (Add, Ask, Explain, Insert, Replace) when text is selected.
 * - Add: Adds selected text to prompt-input in compact form
 * - Ask: Sends message to model
 * - Explain: Explains the selected text and shows explanation in Explanation component
 * - Insert: Uses InsertButton component to insert text at cursor position in focused application
 * - Replace: Uses ReplaceButton component to replace selected text in focused application
 */
export function TextSelectionActions({
  selectedText,
  position,
  isVisible,
  onClose,
  onAdd,
  onAsk,
  onExplain,
  isDarkTheme = true,
}: TextSelectionActionsProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to keep popup within viewport
  useEffect(() => {
    if (!isVisible || !popupRef.current) return

    const popup = popupRef.current
    const rect = popup.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x
    let y = position.y

    // Adjust horizontal position
    // `position.x` is treated as the horizontal center of the popup.
    const halfW = rect.width / 2
    if (x + halfW > viewportWidth - 10) {
      x = viewportWidth - 10 - halfW
    }
    if (x - halfW < 10) {
      x = 10 + halfW
    }

    // Adjust vertical position (show above selection)
    if (y + rect.height > viewportHeight) {
      y = position.y - rect.height - 10
    }
    if (y < 10) {
      y = 10
    }

    setAdjustedPosition({ x, y })
  }, [position, isVisible])

  // Close popup when clicking outside
  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        // Check if user is selecting text (don't close if still selecting)
        const selection = window.getSelection()
        if (!selection || selection.toString().trim().length === 0) {
          onClose()
        }
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Delay to avoid immediate close on selection
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 100)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  const handleAdd = useCallback(() => {
    if (selectedText.trim() && onAdd) {
      onAdd(selectedText.trim())
      onClose()
    }
  }, [selectedText, onAdd, onClose])

  const handleAsk = useCallback(() => {
    if (selectedText.trim() && onAsk) {
      onAsk(selectedText.trim())
      onClose()
    }
  }, [selectedText, onAsk, onClose])

  const handleExplain = useCallback(async () => {
    if (selectedText.trim() && onExplain) {
      try {
        await onExplain(selectedText.trim(), position)
        onClose()
      } catch (err) {
        console.error('[TextSelectionActions] Failed to explain selection:', err)
      }
    }
  }, [selectedText, onExplain, onClose, position])

  if (!isVisible || !selectedText.trim()) {
    return null
  }

  const bgColor = isDarkTheme 
    ? 'bg-zinc-800/95 border-zinc-700 backdrop-blur-md' 
    : 'bg-white/95 border-zinc-200 backdrop-blur-md'
  const textColor = isDarkTheme ? 'text-zinc-100' : 'text-zinc-900'
  const buttonHover = isDarkTheme 
    ? 'hover:bg-zinc-700' 
    : 'hover:bg-zinc-100'

  return (
    <div
      ref={popupRef}
      className={cn(
        'fixed z-[10001] flex items-center gap-2 px-2 py-1.5 rounded-full shadow-lg border',
        // Smooth "appear" (no flying). Position changes are eased too.
        'animate-in fade-in zoom-in-95 duration-150',
        'transition-[left,top] duration-100 ease-out',
        bgColor,
        textColor
      )}
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translate(-50%, 0)',
      }}
      data-no-clickthrough
    >
      {/* Add Button - Pill Style */}
      {onAdd && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className={cn(
            'h-8 px-4 rounded-full gap-1.5 text-xs font-medium transition-all',
            buttonHover,
            isDarkTheme ? 'text-zinc-200' : 'text-zinc-700'
          )}
          title="Add to prompt"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      )}

      {/* Ask Button - Pill Style */}
      {onAsk && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAsk}
          className={cn(
            'h-8 px-4 rounded-full gap-1.5 text-xs font-medium transition-all',
            buttonHover,
            isDarkTheme ? 'text-zinc-200' : 'text-zinc-700'
          )}
          title="Ask about this"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Ask</span>
        </Button>
      )}

      {/* Explain Button - Pill Style */}
      {onExplain && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExplain}
          className={cn(
            'h-8 px-4 rounded-full gap-1.5 text-xs font-medium transition-all',
            buttonHover,
            isDarkTheme ? 'text-zinc-200' : 'text-zinc-700'
          )}
          title="Explain this text"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Explain</span>
        </Button>
      )}

      {/* Insert Button - Pill Style */}
      <InsertButton
        text={selectedText.trim()}
        variant="ghost"
        size="sm"
        showSuccess={true}
        icon={<ArrowRight className="h-3.5 w-3.5" />}
        onInserted={(success) => {
          if (success) {
            // Close after successful insert
            setTimeout(() => onClose(), 500)
          }
        }}
        className={cn(
          'h-8 px-4 rounded-full gap-1.5 text-xs font-medium transition-all',
          buttonHover,
          isDarkTheme 
            ? 'text-zinc-200' 
            : 'text-zinc-700'
        )}
        label="Insert"
      />

      {/* Replace Button - Pill Style */}
      <ReplaceButton
        text={selectedText.trim()}
        variant="ghost"
        size="sm"
        showSuccess={true}
        icon={<Replace className="h-3.5 w-3.5" />}
        onReplaced={(success) => {
          if (success) {
            // Close after successful replace
            setTimeout(() => onClose(), 500)
          }
        }}
        className={cn(
          'h-8 px-4 rounded-full gap-1.5 text-xs font-medium transition-all',
          buttonHover,
          isDarkTheme 
            ? 'text-zinc-200' 
            : 'text-zinc-700'
        )}
        label="Replace"
      />
    </div>
  )
}
