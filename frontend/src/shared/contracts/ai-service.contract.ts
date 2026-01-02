/**
 * AI Service Contract
 * 
 * Defines the interface that all AI services must implement.
 * This makes it easy to swap providers, add new ones, or mock for testing.
 * 
 * @example
 * ```ts
 * const ai: IAIService = serviceContainer.get('ai')
 * for await (const chunk of ai.streamMessage({ message: 'Hello', model: 'gpt-4' })) {
 *   console.log(chunk)
 * }
 * ```
 * 
 * @see {@link https://en.wikipedia.org/wiki/Dependency_inversion_principle} Dependency Inversion Principle
 */

import type { MediaAttachment } from '@/lib/ai/gemini'
import type { AIModel, CapabilitySummary, CapabilityValidationResult } from '@/lib/ai'

/**
 * Parameters for streaming a message
 */
export interface StreamMessageParams {
  message: string
  attachments?: MediaAttachment[]
  modelId?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

/**
 * A chunk of streaming response
 */
export interface StreamChunk {
  content: string
  done: boolean
  error?: Error
  metadata?: {
    model?: string
    provider?: string
    tokensUsed?: number
  }
}

/**
 * AI Service Interface
 * 
 * All AI providers must implement this interface.
 * This allows easy swapping of implementations without changing consuming code.
 */
export interface IAIService {
  /**
   * Stream a message to the AI service
   * Returns an async generator that yields response chunks
   */
  streamMessage(params: StreamMessageParams): AsyncGenerator<StreamChunk, void, unknown>

  /**
   * Send a message and wait for complete response
   * Convenience method that collects all chunks
   */
  sendMessageComplete(params: StreamMessageParams): Promise<string>

  /**
   * Get all available models
   */
  getModels(): Promise<AIModel[]>

  /**
   * Get model configuration by ID
   */
  getModelConfig(modelId: string): AIModel | null

  /**
   * Get currently selected model
   */
  getSelectedModel(): AIModel | null

  /**
   * Set the selected model
   */
  setSelectedModel(modelId: string): void

  /**
   * Validate message and attachments before sending
   */
  validateBeforeSend(message: string, attachments?: MediaAttachment[]): CapabilityValidationResult

  /**
   * Get capability summary for current model
   */
  getModelCapabilities(): CapabilitySummary

  /**
   * Check if a model is configured/available
   */
  isModelConfigured(provider: string): boolean

  /**
   * Set system prompt
   */
  setSystemPrompt(promptId: string): void

  /**
   * Get current system prompt
   */
  getSystemPrompt(): string | null
}

