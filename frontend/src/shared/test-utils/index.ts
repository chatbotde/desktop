/**
 * Testing Utilities
 * 
 * Shared utilities for consistent test setup across the codebase.
 * 
 * @example
 * ```ts
 * import { renderWithProviders, createMockServiceContainer } from '@/shared/test-utils'
 * 
 * test('my component', () => {
 *   const container = createMockServiceContainer()
 *   const { getByText } = renderWithProviders(<MyComponent />, { services: container })
 *   expect(getByText('Hello')).toBeInTheDocument()
 * })
 * ```
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { serviceContainer, ServiceContainer } from '../services/service-container'
import type { IAIService, IStorageService } from '../contracts'

/**
 * Create a mock service container for testing
 */
export function createMockServiceContainer(): ServiceContainer {
  const container = new ServiceContainer()
  
  // Register mock services
  container.register('ai', () => createMockAIService())
  container.register('storage', () => createMockStorageService())
  
  return container
}

/**
 * Create a mock AI service
 */
export function createMockAIService(): IAIService {
  return {
    streamMessage: async function* (params) {
      yield { content: 'Mock response', done: false }
      yield { content: '', done: true }
    },
    sendMessageComplete: async () => 'Mock complete response',
    getModels: async () => [],
    getModelConfig: () => null,
    getSelectedModel: () => null,
    setSelectedModel: () => {},
    validateBeforeSend: () => ({ isValid: true, errors: [], warnings: [] }),
    getModelCapabilities: () => ({
      supportsImages: false,
      supportsAudio: false,
      supportsVideo: false,
      maxTokens: 4096,
    }),
    isModelConfigured: () => true,
    setSystemPrompt: () => {},
    getSystemPrompt: () => null,
  }
}

/**
 * Create a mock storage service
 */
export function createMockStorageService(): IStorageService {
  const storage = new Map<string, string>()
  
  return {
    get: async <T>(key: string): Promise<T | null> => {
      const value = storage.get(key)
      return value ? JSON.parse(value) : null
    },
    set: async <T>(key: string, value: T): Promise<void> => {
      storage.set(key, JSON.stringify(value))
    },
    delete: async (key: string): Promise<void> => {
      storage.delete(key)
    },
    has: async (key: string): Promise<boolean> => {
      return storage.has(key)
    },
    keys: async (): Promise<string[]> => {
      return Array.from(storage.keys())
    },
    clear: async (): Promise<void> => {
      storage.clear()
    },
    size: async (): Promise<number> => {
      return Array.from(storage.values())
        .reduce((sum, val) => sum + val.length, 0)
    },
  }
}

/**
 * Render options for testing
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  services?: ServiceContainer
  providers?: React.ComponentType<{ children: React.ReactNode }>[]
}

/**
 * Render component with providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { services, providers = [], ...renderOptions } = options
  
  // Create wrapper component
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let content = children
    
    // Wrap with service provider if provided
    if (services) {
      // Note: You'd need to create a ServiceProvider component
      // For now, we'll just use the service container directly
      // content = <ServiceProvider container={services}>{content}</ServiceProvider>
    }
    
    // Wrap with additional providers
    providers.forEach(Provider => {
      content = <Provider>{content}</Provider>
    })
    
    return <>{content}</>
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Create mock event bus
 */
export function createMockEventBus() {
  const listeners = new Map()
  const emitFn = jest.fn()
  const onFn = jest.fn((event: string, handler: Function) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event).add(handler)
    return () => listeners.get(event)?.delete(handler)
  })
  
  return {
    emit: emitFn,
    on: onFn,
    once: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn(),
  }
}

