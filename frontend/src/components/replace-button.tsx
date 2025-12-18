import { useState, useCallback } from 'react'
import { Replace, Loader2, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'

interface ReplaceButtonProps {
  /**
   * Text to replace the selected text with
   */
  text: string
  
  /**
   * Callback fired when text is successfully replaced
   */
  onReplaced?: (success: boolean) => void
  
  /**
   * Callback fired when replacement fails
   */
  onError?: (error: Error) => void
  
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
   * Show success checkmark after replacement
   */
  showSuccess?: boolean
  
  /**
   * Custom icon to display instead of default Replace icon
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
 * Replace Button Component
 * 
 * A reusable button component that uses TSF (Text Services Framework) to replace
 * selected text in any Windows application that accepts text input.
 * 
 * @example
 * ```tsx
 * <ReplaceButton 
 *   text="New text" 
 *   onReplaced={(success) => console.log('Replaced:', success)}
 * />
 * ```
 */
export function ReplaceButton({
  text,
  onReplaced,
  onError,
  variant = 'default',
  size = 'default',
  className,
  showSuccess = true,
  icon,
  disabled = false,
  label,
}: ReplaceButtonProps) {
  const [isReplacing, setIsReplacing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleReplace = useCallback(async () => {
    if (!text || text.trim().length === 0) {
      const error = new Error('Text cannot be empty')
      onError?.(error)
      return
    }

    if (!window.tsfAPI) {
      const error = new Error('TSF API is not available. Please ensure the interface window is properly initialized.')
      console.error('[ReplaceButton]', error.message)
      onError?.(error)
      return
    }

    setIsReplacing(true)
    setIsSuccess(false)

    try {
      // Initialize TSF if needed
      await window.tsfAPI.initialize()

      // Focus last window and replace selected text
      // This focuses the last external app and replaces selected text there
      const success = await window.tsfAPI.focusAndReplaceText(text)

      if (success) {
        if (showSuccess) {
          setIsSuccess(true)
          // Reset success state after 2 seconds
          setTimeout(() => setIsSuccess(false), 2000)
        }
        onReplaced?.(true)
      } else {
        const error = new Error('Failed to replace selected text in focused application')
        onError?.(error)
        onReplaced?.(false)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred')
      console.error('[ReplaceButton] Error replacing text:', err)
      onError?.(err)
      onReplaced?.(false)
    } finally {
      setIsReplacing(false)
    }
  }, [text, showSuccess, onReplaced, onError])

  // Determine which icon to show
  const renderIcon = () => {
    if (isReplacing) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (isSuccess && showSuccess) {
      return <Check className="h-4 w-4" />
    }
    
    return icon || <Replace className="h-4 w-4" />
  }

  // Determine if button should be disabled
  const isDisabled = disabled || isReplacing || !text || text.trim().length === 0 || !window.tsfAPI

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleReplace}
      disabled={isDisabled}
      className={cn(className)}
      aria-label={isReplacing ? 'Replacing text...' : 'Replace selected text'}
    >
      {renderIcon()}
      {label && size !== 'icon' && (
        <span className={cn(isReplacing && 'opacity-70')}>
          {label}
        </span>
      )}
    </Button>
  )
}

