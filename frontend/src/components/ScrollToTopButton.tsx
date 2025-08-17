import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'

interface ScrollToTopButtonProps {
  isVisible: boolean
  onClick: () => void
}

export function ScrollToTopButton({ isVisible, onClick }: ScrollToTopButtonProps) {
  if (!isVisible) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className="absolute bottom-6 right-6 h-10 w-10 bg-blue-500/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-blue-500/30 transition-all duration-200 z-30"
      onClick={onClick}
      title="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  )
}
