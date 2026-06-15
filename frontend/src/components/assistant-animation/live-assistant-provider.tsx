import { createContext, useContext, type ReactNode } from 'react'
import {
  useLiveAssistantInternal,
  type LiveAssistantState,
} from './use-live-assistant'

const LiveAssistantContext = createContext<LiveAssistantState | null>(null)

export function LiveAssistantProvider({ children }: { children: ReactNode }) {
  const value = useLiveAssistantInternal()
  return (
    <LiveAssistantContext.Provider value={value}>
      {children}
    </LiveAssistantContext.Provider>
  )
}

export const useLiveAssistant = (): LiveAssistantState => {
  const context = useContext(LiveAssistantContext)
  if (!context) {
    throw new Error('useLiveAssistant must be used within LiveAssistantProvider')
  }
  return context
}
