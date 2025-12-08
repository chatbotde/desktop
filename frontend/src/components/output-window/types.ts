export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}
