import type { ChatMessage, MediaAttachment } from '@/features/output-window'

// Helper function to generate unique message IDs
export const generateMessageId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Helper function to create a chat message
export const createChatMessage = (
  content: string,
  role: 'user' | 'assistant' = 'assistant',
  attachments?: MediaAttachment[],
  generatedImages?: string[]
): ChatMessage => {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: new Date(),
    attachments,
    generatedImages
  }
}
