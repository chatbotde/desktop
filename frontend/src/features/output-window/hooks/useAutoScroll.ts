import { useRef, useSyncExternalStore, useCallback } from 'react'

export function useAutoScroll(messages: any[]) {
  const prevLengthRef = useRef(messages.length)

  // Use syncExternalStore for lifecycle-based scroll behavior
  useSyncExternalStore(
    useCallback(() => {
      // Only scroll if a NEW message is added
      if (messages.length > prevLengthRef.current) {
        const lastMessage = messages[messages.length - 1]
        // Use setTimeout to ensure DOM is rendered
        const timeoutId = setTimeout(() => {
          const element = document.getElementById(`message-${lastMessage.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
        prevLengthRef.current = messages.length
        return () => clearTimeout(timeoutId)
      }
      prevLengthRef.current = messages.length
      return () => {}
    }, [messages]),
    () => null,
    () => null
  )
}
