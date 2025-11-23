import { ReactNode, useEffect, useRef } from 'react'
import { useClickThrough } from '@/hooks/useClickThrough'
import { cn } from '@/lib/utils'

export interface ClickThroughProviderProps {
  children: ReactNode
  /**
   * Automatically disable click-through when mouse enters this component
   * @default true
   */
  autoDisableOnHover?: boolean
  /**
   * Automatically enable click-through when mouse leaves this component
   * @default false
   */
  autoEnableOnLeave?: boolean
  /**
   * Additional className for the wrapper
   */
  className?: string
  /**
   * Disable click-through management (just render children)
   */
  disabled?: boolean
}

/**
 * Provider component that automatically manages click-through based on mouse interaction
 * 
 * This component is completely general - it works with ANY UI structure.
 * It wraps your UI and automatically disables click-through when the user
 * hovers over it, making it easy to create interactive UIs without manual
 * click-through management.
 * 
 * Works in ANY scenario:
 * - ✅ Direct access (no iframes) - uses chatInputAPI directly
 * - ✅ In iframes - uses postMessage to parent
 * - ✅ Works with any container structure
 * - ✅ Works even when there are NO iframes at all
 * 
 * @example
 * ```tsx
 * <ClickThroughProvider>
 *   <YourUIComponent />
 * </ClickThroughProvider>
 * ```
 * 
 * @example With custom behavior
 * ```tsx
 * <ClickThroughProvider 
 *   autoDisableOnHover={true}
 *   autoEnableOnLeave={false}
 * >
 *   <YourUIComponent />
 * </ClickThroughProvider>
 * ```
 */
export function ClickThroughProvider({
  children,
  autoDisableOnHover = true,
  autoEnableOnLeave = false,
  className,
  disabled = false
}: ClickThroughProviderProps) {
  const { enable, disable, enabled } = useClickThrough()
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (disabled) return

    const container = containerRef.current
    if (!container) return

    const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }

      if (autoDisableOnHover && enabled) {
        disable()
      }
    }

    const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }

      if (autoEnableOnLeave && !enabled) {
        // Small delay to prevent flickering
        hoverTimeoutRef.current = setTimeout(() => {
          enable()
        }, 100)
      }
    }

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [autoDisableOnHover, autoEnableOnLeave, enabled, enable, disable, disabled])

  return (
    <div
      ref={containerRef}
      className={cn('clickthrough-provider', className)}
      data-clickthrough-managed="true"
    >
      {children}
    </div>
  )
}

