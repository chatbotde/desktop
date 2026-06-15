import { useState } from 'react'
import { Play, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'

interface YoutubeVideoPlayerProps {
  url: string
  className?: string
  onRemove?: () => void
  onOpenInOverlay?: () => void
  autoPlay?: boolean
}

export const extractVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function YoutubeVideoPlayer({ url, className, onRemove, onOpenInOverlay, autoPlay = false }: YoutubeVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  const videoId = extractVideoId(url)

  if (!videoId) {
    return null
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div className={cn("relative w-full max-w-[280px] aspect-video rounded-lg overflow-hidden shadow-md border border-white/10 group bg-black shrink-0", className)}>
      {!isPlaying ? (
        <div 
          className="absolute inset-0 cursor-pointer flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(true);
          }}
        >
          <img 
            src={thumbnailUrl} 
            alt="YouTube thumbnail" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.includes('maxresdefault')) {
                target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }
            }}
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
          <div className="absolute flex items-center justify-center w-12 h-12 bg-red-600/90 text-white rounded-full shadow-lg group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm">
            <Play className="w-5 h-5 ml-1" fill="currentColor" />
          </div>
        </div>
      ) : (
        <iframe
          className="w-full h-full border-0"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
        />
      )}
      
      {!isPlaying && (onOpenInOverlay || onRemove) && (
        <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
          {onOpenInOverlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInOverlay();
              }}
              className="w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              title="Open in player"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
