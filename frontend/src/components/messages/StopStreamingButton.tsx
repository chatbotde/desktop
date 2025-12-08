import { Button } from '@/components/ui/button'
import { Square } from 'lucide-react'

interface StopStreamingButtonProps {
  onStop: () => void
}

export function StopStreamingButton({ onStop }: StopStreamingButtonProps) {
  return (
    <div className="absolute bottom-4 right-4 z-30">
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 flex items-center justify-center bg-oklch(12.9% 0.042 264.695) from-red-500 via-red-600 to-rose-500 text-white rounded-full border-2 border-white/40 backdrop-blur-lg shadow-xl hover:scale-105 transition-transform duration-150 p-0"
        onClick={onStop}
        title="Stop streaming"
      >
        <Square className="w-4 h-4 mr-2 fill-current" />
      </Button>
    </div>
  )
}
