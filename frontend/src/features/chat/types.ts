/**
 * Chat Feature Types
 */

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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: MediaAttachment[]
}
