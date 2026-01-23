import { create } from 'zustand'
import type { ChatMessage } from './types'

interface ChatState {
    messages: ChatMessage[]
    isStreaming: boolean
    setMessages: (messages: ChatMessage[]) => void
    addMessage: (message: ChatMessage) => void
    setStreaming: (isStreaming: boolean) => void
    clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isStreaming: false,
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),
    setStreaming: (isStreaming) => set({ isStreaming }),
    clearMessages: () => set({ messages: [] }),
}))
