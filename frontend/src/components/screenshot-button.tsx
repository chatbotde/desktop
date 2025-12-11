import { useState, useCallback } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ScreenshotButtonProps {
  onScreenshot?: (screenshot: { name: string; type: string; size: number; data: string }) => void
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  isDarkTheme?: boolean
}

/**
 * Screenshot Button Component
 * Handles quick screenshot and area screenshot capture
 */
export function ScreenshotButton({
  onScreenshot,
  variant = 'ghost',
  size = 'default',
  className}: ScreenshotButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [] = useState(false)

  const handleQuickScreenshot = useCallback(async () => {
    if (!window.CaptureAPI) {
      console.error('CaptureAPI is not available')
      return
    }

    setIsCapturing(true)
    try {
      const result = await window.CaptureAPI.quickScreenshot()
      if (result.success && result.screenshot) {
        onScreenshot?.(result.screenshot)
      } else {
        console.error('Screenshot failed:', result.error)
      }
    } catch (error) {
      console.error('Error taking screenshot:', error)
    } finally {
      setIsCapturing(false)
    }
  }, [onScreenshot])


  const handleClick = useCallback(() => {
    if (isCapturing) return
    
    // For now, use quick screenshot
    // You can add a menu/dropdown later to choose between quick and area
    handleQuickScreenshot()
  }, [isCapturing, handleQuickScreenshot])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isCapturing}
      className={cn(className)}
      aria-label={isCapturing ? 'Capturing screenshot...' : 'Take screenshot'}
    >
      {isCapturing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Camera className="h-4 w-4" />
      )}
    </Button>
  )
}

