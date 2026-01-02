/**
 * Initialize Default Services
 * 
 * Registers default service implementations with the service container.
 * Call this during app initialization.
 * 
 * @example
 * ```ts
 * import { initializeServices } from '@/shared/services'
 * 
 * // In your app initialization
 * initializeServices()
 * ```
 */

import { serviceContainer } from './service-container'
import { AIServiceAdapter } from './ai/ai-service-adapter'
import { LocalStorageService } from './storage/local-storage.service'
import { UnifiedAIService } from '@/lib/ai'

/**
 * Initialize default services
 */
export function initializeServices(): void {
  // Register AI service
  serviceContainer.register('ai', () => {
    return new AIServiceAdapter(new UnifiedAIService())
  })

  // Register storage service
  serviceContainer.register('storage', () => {
    return new LocalStorageService()
  })

  // Transcription service will be registered when audio service is imported
  // For now, we'll leave it unregistered (will throw error if accessed)
  // You can register it later:
  // serviceContainer.register('transcription', () => {
  //   return new TranscriptionServiceAdapter(...)
  // })
}

