/**
 * Service Container
 * 
 * Centralized dependency injection container.
 * Manages service instances and provides lazy initialization.
 * 
 * Inspired by: React Context, Service Locator pattern, Dependency Injection
 * 
 * @example
 * ```ts
 * // Register services
 * serviceContainer.register('ai', () => new UnifiedAIService())
 * 
 * // Use services
 * const ai = serviceContainer.get('ai')
 * 
 * // Replace for testing
 * serviceContainer.replace('ai', mockAIService)
 * ```
 */

import type {
  IAIService,
  IStorageService,
  ITranscriptionService,
} from '../contracts'

/**
 * Service map defining all available services
 */
export interface ServiceMap {
  ai: IAIService
  storage: IStorageService
  transcription: ITranscriptionService
}

/**
 * Service key type
 */
export type ServiceKey = keyof ServiceMap

/**
 * Service factory function type
 */
export type ServiceFactory<T extends ServiceKey> = () => ServiceMap[T]

/**
 * Service Container Class
 * 
 * Manages service lifecycle and provides dependency injection.
 */
class ServiceContainer {
  private services = new Map<ServiceKey, any>()
  private factories = new Map<ServiceKey, ServiceFactory<any>>()

  /**
   * Register a service factory
   * Services are lazily initialized when first accessed
   * 
   * @param key Service key
   * @param factory Factory function that creates the service
   */
  register<K extends ServiceKey>(
    key: K,
    factory: ServiceFactory<K>
  ): void {
    this.factories.set(key, factory)
    // Clear existing instance if re-registering
    this.services.delete(key)
  }

  /**
   * Get a service instance
   * Services are created lazily on first access
   * 
   * @param key Service key
   * @returns Service instance
   * @throws Error if service is not registered
   */
  get<K extends ServiceKey>(key: K): ServiceMap[K] {
    // Return existing instance if available
    if (this.services.has(key)) {
      return this.services.get(key)!
    }

    // Create new instance using factory
    const factory = this.factories.get(key)
    if (!factory) {
      throw new Error(
        `Service "${key}" is not registered. ` +
        `Register it using: serviceContainer.register('${key}', () => new YourService())`
      )
    }

    const service = factory()
    this.services.set(key, service)
    return service
  }

  /**
   * Replace a service instance
   * Useful for testing or hot-swapping implementations
   * 
   * @param key Service key
   * @param service Service instance to use
   */
  replace<K extends ServiceKey>(key: K, service: ServiceMap[K]): void {
    this.services.set(key, service)
  }

  /**
   * Check if a service is registered
   * 
   * @param key Service key
   */
  isRegistered(key: ServiceKey): boolean {
    return this.factories.has(key)
  }

  /**
   * Check if a service instance exists
   * 
   * @param key Service key
   */
  hasInstance(key: ServiceKey): boolean {
    return this.services.has(key)
  }

  /**
   * Unregister a service
   * Clears both factory and instance
   * 
   * @param key Service key
   */
  unregister(key: ServiceKey): void {
    this.factories.delete(key)
    this.services.delete(key)
  }

  /**
   * Clear all services
   * Useful for testing or resetting state
   */
  clear(): void {
    this.services.clear()
    this.factories.clear()
  }

  /**
   * Reset service instances but keep factories
   * Useful for reinitializing services
   */
  reset(): void {
    this.services.clear()
  }

  /**
   * Get all registered service keys
   */
  getRegisteredKeys(): ServiceKey[] {
    return Array.from(this.factories.keys())
  }
}

/**
 * Global service container instance
 */
export const serviceContainer = new ServiceContainer()

/**
 * Initialize default services
 * These can be overridden by calling register() again
 */
export function initializeDefaultServices(): void {
  // Services will be registered when their modules are imported
  // This function can be called to ensure defaults are set
}

