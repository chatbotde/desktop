import { useState, useRef } from 'react'
import { Play, Pause } from 'lucide-react'

export interface MediaAttachment {
  id: string
  name: string
  type: string
  size: number
  data: string
  source: string
  mediaType: 'image' | 'video' | 'audio'
  dimensions?: { width: number; height: number }
  duration?: number
}

interface MediaAttachmentProps {
  attachment: MediaAttachment
  compact?: boolean
}

export function MediaAttachmentComponent({ attachment, compact = false }: MediaAttachmentProps) {
  const { mediaType, data, name, dimensions, duration, type } = attachment
  const maxDimensions = { maxWidth: 400, maxHeight: 300 }
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const mediaInfo = (
    <div className="mt-2 text-xs text-gray-400 space-y-0.5">
      <div className="font-medium truncate">{name}</div>
      {dimensions && <div>{dimensions.width} × {dimensions.height}</div>}
      {duration && <div>{Math.round(duration)}s</div>}
    </div>
  )

  // Compact mode for user messages
  if (compact) {
    switch (mediaType) {
      case 'image':
        return (
          <div className="media-attachment">
            <img
              src={data}
              alt={name}
              className="w-16 h-16 object-cover rounded-lg border border-gray-600/20"
              loading="lazy"
            />
          </div>
        )

      case 'video':
        const handlePlayPause = () => {
          const video = videoRef.current
          if (!video) return
          
          if (isPlaying) {
            video.pause()
            setIsPlaying(false)
          } else {
            video.play()
            setIsPlaying(true)
          }
        }

        const handleVideoEnded = () => {
          setIsPlaying(false)
        }

        return (
          <div className="media-attachment relative group">
            <video
              ref={videoRef}
              preload="metadata"
              className="w-16 h-16 object-cover rounded-lg border border-gray-600/20"
              onEnded={handleVideoEnded}
              onClick={handlePlayPause}
            >
              <source src={data} type={type} />
              Your browser does not support the video element.
            </video>
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 rounded-lg transition-colors"
              >
                <Play className="size-6 text-white" />
              </button>
            )}
            {duration && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                {Math.round(duration)}s
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Full mode
  switch (mediaType) {
    case 'image':
      return (
        <div className="media-attachment">
          <img
            src={data}
            alt={name}
            className="max-w-full max-h-64 rounded-lg border border-gray-600/20"
            style={maxDimensions}
          />
          {mediaInfo}
        </div>
      )

    case 'video':
      return (
        <div className="media-attachment">
          <video
            controls
            preload="metadata"
            className="max-w-full max-h-64 rounded-lg border border-gray-600/20"
            style={maxDimensions}
          >
            <source src={data} type={type} />
            Your browser does not support the video element.
          </video>
          {mediaInfo}
        </div>
      )

    case 'audio':
      return (
        <div className="media-attachment">
          <audio controls preload="metadata" className="w-full">
            <source src={data} type={type} />
            Your browser does not support the audio element.
          </audio>
          {mediaInfo}
        </div>
      )

    default:
      return null
  }
}
