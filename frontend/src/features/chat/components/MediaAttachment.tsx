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
}

export function MediaAttachmentComponent({ attachment }: MediaAttachmentProps) {
  const { mediaType, data, name, dimensions, duration, type } = attachment
  const maxDimensions = { maxWidth: 400, maxHeight: 300 }

  const mediaInfo = (
    <div className="mt-2 text-xs text-gray-400 space-y-0.5">
      <div className="font-medium truncate">{name}</div>
      {dimensions && <div>{dimensions.width} × {dimensions.height}</div>}
      {duration && <div>{Math.round(duration)}s</div>}
    </div>
  )

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
