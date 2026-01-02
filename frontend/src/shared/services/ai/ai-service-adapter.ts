/**
 * AI Service Adapter
 * 
 * Adapts UnifiedAIService to implement IAIService interface.
 * This allows the existing UnifiedAIService to work with the service container.
 */

import { UnifiedAIService } from '@/lib/ai'
import type { IAIService, StreamMessageParams, StreamChunk } from '../../contracts'
import type { MediaAttachment } from '@/lib/ai/gemini'
import { getSelectedModel, setSelectedModel as setModel, getAvailableModels } from '@/lib/ai/model-config'
import type { AIModel, CapabilitySummary, CapabilityValidationResult } from '@/lib/ai'

/**
 * AI Service Adapter
 * Wraps UnifiedAIService to implement IAIService interface
 */
export class AIServiceAdapter implements IAIService {
  private service: UnifiedAIService

  constructor(service?: UnifiedAIService) {
    this.service = service ?? new UnifiedAIService()
  }

  async *streamMessage(params: StreamMessageParams): AsyncGenerator<StreamChunk, void, unknown> {
    const attachments = params.attachments as MediaAttachment[] | undefined
    
    const generator = this.service.sendMessage(
      params.message,
      attachments
    )

    for await (const chunk of generator) {
      yield {
        content: chunk,
        done: false,
        metadata: {
          model: getSelectedModel()?.id,
          provider: getSelectedModel()?.provider,
        },
      }
    }

    yield {
      content: '',
      done: true,
    }
  }

  async sendMessageComplete(params: StreamMessageParams): Promise<string> {
    const attachments = params.attachments as MediaAttachment[] | undefined
    return await this.service.sendMessageComplete(
      params.message,
      attachments
    )
  }

  async getModels(): Promise<AIModel[]> {
    return getAvailableModels()
  }

  getModelConfig(modelId: string): AIModel | null {
    const models = getAvailableModels()
    return models.find(m => m.id === modelId) ?? null
  }

  getSelectedModel(): AIModel | null {
    return getSelectedModel()
  }

  setSelectedModel(modelId: string): void {
    setModel(modelId)
  }

  validateBeforeSend(message: string, attachments?: MediaAttachment[]): CapabilityValidationResult {
    return this.service.validateBeforeSend(message, attachments)
  }

  getModelCapabilities(): CapabilitySummary {
    return this.service.getModelCapabilities()
  }

  isModelConfigured(provider: string): boolean {
    // Check if any model from this provider is configured
    const models = getAvailableModels()
    return models.some(m => m.provider.toLowerCase() === provider.toLowerCase())
  }

  setSystemPrompt(promptId: string): void {
    this.service.setSystemPrompt(promptId)
  }

  getSystemPrompt(): string | null {
    // UnifiedAIService doesn't expose getSystemPrompt, so we return null
    // This can be enhanced if needed
    return null
  }
}

