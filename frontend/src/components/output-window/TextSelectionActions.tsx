import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Send, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { InsertButton } from '../insert-button'

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
   * Callback when "Add" button is clicked
   */
  onAdd?: (text: string) => void
  
  /**
   * Callback when "Send" button is clicked
   */
  onSend?: (text: string) => void
  
  /**
   * Dark theme mode
   */
  isDarkTheme?: boolean
}

/**
 * Text Selection Actions Popup
 * 
 * Shows three action buttons (Add, Send, Insert) when text is selected
 * in the output window.
 */
export function TextSelectionActions({
  selectedText,
  position,
  isVisible,
  onClose,
  onAdd,
  onSend,
  isDarkTheme = true,
}: TextSelectionActionsProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to keep popup within viewport
  useEffect(() => {
    if (!isVisible) {
      setAdjustedPosition(position)
      return
    }

    // Use a small delay to ensure the popup is rendered before calculating
    const timeout = setTimeout(() => {
      if (!popupRef.current) {
        setAdjustedPosition(position)
        return
      }

      const popup = popupRef.current
      const rect = popup.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y

      // Adjust horizontal position (center the popup on selection)
      const popupWidth = rect.width || 250 // Fallback width if not rendered yet
      x = x - (popupWidth / 2)
      
      if (x + popupWidth > viewportWidth) {
        x = viewportWidth - popupWidth - 10
      }
      if (x < 10) {
        x = 10
      }

      // Adjust vertical position (show above selection if near bottom)
      const popupHeight = rect.height || 40 // Fallback height
      if (y + popupHeight > viewportHeight) {
        y = position.y - popupHeight - 20
      }
      if (y < 10) {
        y = 10
      }

      setAdjustedPosition({ x, y })
    }, 10)

    return () => clearTimeout(timeout)
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

  const handleSend = useCallback(() => {
    if (selectedText.trim() && onSend) {
      onSend(selectedText.trim())
      onClose()
    }
  }, [selectedText, onSend, onClose])

  // Debug logging
  useEffect(() => {
    if (isVisible && selectedText.trim()) {
      console.log('[TextSelectionActions] Rendering popup:', {
        selectedText: selectedText.substring(0, 50),
        position,
        adjustedPosition
      })
    }
  }, [isVisible, selectedText, position, adjustedPosition])

  if (!isVisible || !selectedText.trim()) {
    return null
  }

  const bgColor = isDarkTheme 
    ? 'bg-zinc-800 border-zinc-700' 
    : 'bg-white border-zinc-200'
  const textColor = isDarkTheme ? 'text-zinc-100' : 'text-zinc-900'

  return (
    <div
      ref={popupRef}
      className={cn(
        'fixed z-[10001] flex items-center gap-2 px-2 py-1.5 rounded-lg shadow-lg border',
        'animate-in fade-in slide-in-from-bottom-2 duration-200',
        bgColor,
        textColor
      )}
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
      data-no-clickthrough
    >
      {/* Add Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAdd}
        className={cn(
          'h-8 px-3 gap-1.5',
          isDarkTheme 
            ? 'hover:bg-zinc-700 text-zinc-200' 
            : 'hover:bg-zinc-100 text-zinc-700'
        )}
        title="Add to conversation"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Add</span>
      </Button>

      {/* Send Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSend}
        className={cn(
          'h-8 px-3 gap-1.5',
          isDarkTheme 
            ? 'hover:bg-zinc-700 text-zinc-200' 
            : 'hover:bg-zinc-100 text-zinc-700'
        )}
        title="Send as message"
      >
        <Send className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Send</span>
      </Button>

      {/* Insert Button */}
      <InsertButton
        text={selectedText.trim()}
        variant="ghost"
        size="sm"
        showSuccess={true}
        icon={<ArrowRight className="h-3.5 w-3.5" />}
        label="Insert"
        onInserted={(success) => {
          if (success) {
            // Close after successful insert
            setTimeout(() => onClose(), 500)
          }
        }}
        className={cn(
          'h-8 px-3 gap-1.5',
          isDarkTheme 
            ? 'hover:bg-zinc-700 text-zinc-200' 
            : 'hover:bg-zinc-100 text-zinc-700'
        )}
      />
    </div>
  )
}



