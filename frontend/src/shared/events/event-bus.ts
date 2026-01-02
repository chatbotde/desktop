/**
 * Type-safe Event Bus
 * 
 * Centralized event system for inter-feature communication.
 * Provides type safety and prevents direct feature-to-feature dependencies.
 * 
 * @example
 * ```ts
 * // Emit an event
 * eventBus.emit('text:selected', { text: 'Hello', source: 'popup' })
 * 
 * // Listen to events
 * const unsubscribe = eventBus.on('text:selected', ({ text, source }) => {
 *   console.log(`Text selected: ${text} from ${source}`)
 * })
 * 
 * // React hook
 * useEvent('text:selected', ({ text }) => {
 *   setPromptText(text)
 * })
 * ```
 */

import React, { useEffect } from 'react'

/**
 * Event map defining all available events and their payload types
 * Add new events here to maintain type safety
 */
export type EventMap = {
  // Text selection events
  'text:selected': { text: string; source: string; timestamp?: number }
  
  // Model events
  'model:changed': { modelId: string; provider: string; previousModelId?: string }
  'model:config-changed': { modelId: string; config: Record<string, any> }
  
  // Chat events
  'chat:message-sent': { messageId: string; content: string; attachments?: any[] }
  'chat:response-received': { messageId: string; content: string; model: string }
  'chat:streaming-started': { messageId: string; model: string }
  'chat:streaming-completed': { messageId: string; totalTokens?: number }
  'chat:error': { messageId: string; error: Error }
  
  // Feature events
  'feature:toggled': { featureId: string; enabled: boolean }
  'feature:registered': { featureId: string; metadata?: Record<string, any> }
  
  // UI events
  'ui:theme-changed': { theme: 'light' | 'dark' | 'system' }
  'ui:window-resized': { width: number; height: number }
  'ui:modal-opened': { modalId: string }
  'ui:modal-closed': { modalId: string }
  
  // Settings events
  'settings:changed': { key: string; value: any; previousValue?: any }
  'settings:reset': { section?: string }
  
  // Audio events
  'audio:recording-started': { sessionId: string }
  'audio:recording-stopped': { sessionId: string; duration: number }
  'audio:transcription-completed': { sessionId: string; text: string }
  
  // Capture events
  'capture:screenshot-taken': { imageData: string; format: string }
  'capture:area-selected': { x: number; y: number; width: number; height: number }
  
  // Storage events
  'storage:changed': { key: string; value: any }
  'storage:cleared': { keys?: string[] }
}

/**
 * Event key type
 */
export type EventKey = keyof EventMap

/**
 * Event handler function type
 */
export type EventHandler<K extends EventKey> = (data: EventMap[K]) => void

/**
 * Typed Event Bus Class
 */
class TypedEventBus {
  private listeners = new Map<EventKey, Set<EventHandler<any>>>()

  /**
   * Emit an event
   * 
   * @param event Event key
   * @param data Event payload (must match EventMap type)
   */
  emit<K extends EventKey>(event: K, data: EventMap[K]): void {
    const handlers = this.listeners.get(event)
    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error)
        }
      })
    }
  }

  /**
   * Subscribe to an event
   * 
   * @param event Event key
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  on<K extends EventKey>(
    event: K,
    handler: EventHandler<K>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler)
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribes after first call)
   * 
   * @param event Event key
   * @param handler Event handler function
   */
  once<K extends EventKey>(
    event: K,
    handler: EventHandler<K>
  ): () => void {
    const unsubscribe = this.on(event, ((data: EventMap[K]) => {
      handler(data)
      unsubscribe()
    }) as EventHandler<K>)
    
    return unsubscribe
  }

  /**
   * Unsubscribe from an event
   * 
   * @param event Event key
   * @param handler Event handler function
   */
  off<K extends EventKey>(event: K, handler: EventHandler<K>): void {
    this.listeners.get(event)?.delete(handler)
  }

  /**
   * Remove all listeners for an event
   * 
   * @param event Event key
   */
  removeAllListeners(event?: EventKey): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Get listener count for an event
   * 
   * @param event Event key
   */
  listenerCount(event: EventKey): number {
    return this.listeners.get(event)?.size ?? 0
  }

  /**
   * Get all registered event keys
   */
  getEventKeys(): EventKey[] {
    return Array.from(this.listeners.keys())
  }
}

/**
 * Global event bus instance
 */
export const eventBus = new TypedEventBus()

/**
 * React hook for subscribing to events
 * 
 * @param event Event key
 * @param handler Event handler function
 * @param deps Dependency array (like useEffect)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useEvent('text:selected', ({ text }) => {
 *     setPromptText(text)
 *   }, [])
 *   
 *   return <div>...</div>
 * }
 * ```
 */
export function useEvent<K extends EventKey>(
  event: K,
  handler: EventHandler<K>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    return eventBus.on(event, handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps])
}

