import { Button } from '@/shared/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { useSyncExternalStore, useState, useCallback } from 'react'

interface ScrollToTopButtonProps {
  isVisible?: boolean
  onClick?: () => void
  containerRef?: React.RefObject<HTMLDivElement | null>
  className?: string
}

export function ScrollToTopButton({ 
  isVisible, 
  onClick, 
  containerRef, 
  className = "absolute bottom-6 right-6 h-10 w-10 bg-blue-500/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-blue-500/30 transition-all duration-200 z-30"
}: ScrollToTopButtonProps) {
  const [internalVisible, setInternalVisible] = useState(false)

  // If no onClick is provided, create a default scroll to top function
  const handleClick = onClick || (() => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  })

  // If no isVisible is provided, create internal visibility logic - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      if (isVisible !== undefined) return () => {}

      const container = containerRef?.current || window
      const handleScroll = () => {
        if (containerRef?.current) {
          setInternalVisible(containerRef.current.scrollTop > 200)
        } else {
          setInternalVisible(window.pageYOffset > 200)
        }
      }

      if (container) {
        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
      }
      return () => {}
    }, [containerRef, isVisible]),
    () => null,
    () => null
  )

  const shouldShow = isVisible !== undefined ? isVisible : internalVisible

  if (!shouldShow) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleClick}
      title="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  )
}
