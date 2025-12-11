export interface MediaAttachment {
  id: string
  name: string
  type: string
  size: number
  data: string // base64 data URL or object URL
  source: string
  mediaType: 'image' | 'video' | 'audio'
  dimensions?: { width: number; height: number }
  duration?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: MediaAttachment[]
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}
