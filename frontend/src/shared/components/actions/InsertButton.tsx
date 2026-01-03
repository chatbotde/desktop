import { useState, useCallback } from 'react'
import { Send, Loader2, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib'

export interface RichContentData {
  text?: string;           // Plain text fallback
  html?: string;          // HTML content (for rich text editors)
  image?: string;         // Image as data URL (e.g., "data:image/png;base64,...")
  rtf?: string;           // RTF format (for Word, etc.)
}

interface InsertButtonProps {
  /**
   * Text to insert into the focused application
   * If richContent is provided, this is ignored
   */
  text?: string
  
  /**
   * Rich content to insert (HTML, images, RTF, etc.)
   * When provided, automatically uses clipboard + paste method (bypasses TSF)
   */
  richContent?: RichContentData
  
  /**
   * Callback fired when text is successfully inserted
   */
  onInserted?: (success: boolean) => void
  
  /**
   * Callback fired when insertion fails
   */
  onError?: (error: Error) => void
  
  /**
   * Use fallback method (clipboard + paste) instead of TSF
   * @deprecated - Rich content automatically uses clipboard method
   */
  useFallback?: boolean
  
  /**
   * Force insertion even if window is not detected as editable
   */
  force?: boolean
  
  /**
   * Button variant from shadcn/ui
   */
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link'
  
  /**
   * Button size from shadcn/ui
   */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Show success checkmark after insertion
   */
  showSuccess?: boolean
  
  /**
   * Custom icon to display instead of default Send icon
   */
  icon?: React.ReactNode
  
  /**
   * Disable the button
   */
  disabled?: boolean
  
  /**
   * Button label text (shown when not icon-only)
   */
  label?: string
}

/**
 * Insert Button Component
 * 
 * A reusable button component that uses TSF (Text Services Framework) to insert
 * text into any Windows application that accepts text input.
 * 
 * @example
 * ```tsx
 * <InsertButton 
 *   text="Hello, World!" 
 *   onInserted={(success) => console.log('Inserted:', success)}
 * />
 * ```
 */
export function InsertButton({
  text,
  richContent,
  onInserted,
  onError,
  useFallback = false,
  force = false,
  variant = 'default',
  size = 'default',
  className,
  showSuccess = true,
  icon,
  disabled = false,
  label,
}: InsertButtonProps) {
  const [isInserting, setIsInserting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleInsert = useCallback(async () => {
    // Check if rich content is provided
    const hasRichContent = richContent && (
      richContent.html || 
      richContent.image || 
      richContent.rtf || 
      (richContent.text && (richContent.html || richContent.image || richContent.rtf))
    )

    // Validate input
    if (hasRichContent) {
      // Rich content validation
      if (!richContent.text && !richContent.html && !richContent.image && !richContent.rtf) {
        const error = new Error('Rich content cannot be empty')
        onError?.(error)
        return
      }
    } else {
      // Plain text validation
      if (!text || text.trim().length === 0) {
        const error = new Error('Text cannot be empty')
        onError?.(error)
        return
      }
    }

    if (!window.tsfAPI) {
      const error = new Error('TSF API is not available. Please ensure the interface window is properly initialized.')
      console.error('[InsertButton]', error.message)
      onError?.(error)
      return
    }

    setIsInserting(true)
    setIsSuccess(false)

    try {
      // Initialize TSF if needed (even for rich content, as it initializes focus tracking)
      await window.tsfAPI.initialize()

      let success: boolean

      if (hasRichContent && window.tsfAPI.focusAndInsertRichContent) {
        // Use rich content insertion (clipboard + paste, bypasses TSF)
        console.log('[InsertButton] Using rich content insertion method')
        success = await window.tsfAPI.focusAndInsertRichContent(richContent!)
      } else {
        // Use plain text insertion (TSF or clipboard fallback)
        console.log('[InsertButton] Using plain text insertion method')
        success = await window.tsfAPI.focusAndInsertText(text!)
      }

      if (success) {
        if (showSuccess) {
          setIsSuccess(true)
          // Reset success state after 2 seconds
          setTimeout(() => setIsSuccess(false), 2000)
        }
        onInserted?.(true)
      } else {
        const error = new Error('Failed to insert content into focused application')
        onError?.(error)
        onInserted?.(false)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred')
      console.error('[InsertButton] Error inserting content:', err)
      onError?.(err)
      onInserted?.(false)
    } finally {
      setIsInserting(false)
    }
  }, [text, richContent, useFallback, force, showSuccess, onInserted, onError])

  // Determine which icon to show
  const renderIcon = () => {
    if (isInserting) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (isSuccess && showSuccess) {
      return <Check className="h-4 w-4" />
    }
    
    return icon || <Send className="h-4 w-4" />
  }

  // Determine if button should be disabled
  const hasRichContent = richContent && (
    richContent.html || 
    richContent.image || 
    richContent.rtf || 
    (richContent.text && (richContent.html || richContent.image || richContent.rtf))
  )
  const hasContent = hasRichContent || (text && text.trim().length > 0)
  const isDisabled = disabled || isInserting || !hasContent || !window.tsfAPI

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInsert}
      disabled={isDisabled}
      className={cn(className)}
      aria-label={isInserting ? 'Inserting text...' : 'Insert text'}
    >
      {renderIcon()}
      {label && size !== 'icon' && (
        <span className={cn(isInserting && 'opacity-70')}>
          {label}
        </span>
      )}
    </Button>
  )
}
