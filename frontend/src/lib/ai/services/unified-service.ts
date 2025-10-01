/**
 * Unified AI Service - High-level service for AI operations
 * This service provides a simplified API for working with multiple AI providers
 */

import { providerRegistry, type ProviderName } from '../registry';
import type { IAIProvider, MediaAttachment, AIRequestOptions, AIModel } from '../types';

export interface UnifiedAIResponse {
  success: boolean;
  content: string;
  provider: string;
  model?: string;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    confidence?: number;
    language?: string;
    duration?: number;
  };
}

/**
 * Unified AI Service
 * Provides a high-level API for working with multiple AI providers
 */
export class UnifiedAIService {
  private static instance: UnifiedAIService;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService();
    }
    return UnifiedAIService.instance;
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): IAIProvider {
    return providerRegistry.getCurrentProvider();
  }

  /**
   * Get current provider name
   */
  getCurrentProviderName(): ProviderName {
    return providerRegistry.getCurrentProviderName();
  }

  /**
   * Switch to a different provider
   */
  switchProvider(providerName: ProviderName): boolean {
    return providerRegistry.setCurrentProvider(providerName);
  }

  /**
   * Send a text message using the current provider
   */
  async sendMessage(
    message: string,
    options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const provider = this.getCurrentProvider();
    if (!provider.isConfigured()) {
      throw new Error(`Provider ${provider.name} is not configured`);
    }
    return provider.sendMessage(message, options);
  }

  /**
   * Send a message with media attachments
   */
  async sendMessageWithMedia(
    message: string,
    attachments: MediaAttachment[],
    options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const provider = this.getCurrentProvider();
    if (!provider.isConfigured()) {
      throw new Error(`Provider ${provider.name} is not configured`);
    }
    return provider.sendMessageWithMedia(message, attachments, options);
  }

  /**
   * Send a message and get complete response
   */
  async sendMessageComplete(
    message: string,
    options?: AIRequestOptions
  ): Promise<UnifiedAIResponse> {
    try {
      const provider = this.getCurrentProvider();
      const response = await provider.sendMessageComplete(message, options);
      
      return {
        success: true,
        content: response,
        provider: provider.name,
        model: provider.getCurrentModel(),
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        provider: this.getCurrentProviderName(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a message with media and get complete response
   */
  async sendMessageWithMediaComplete(
    message: string,
    attachments: MediaAttachment[],
    options?: AIRequestOptions
  ): Promise<UnifiedAIResponse> {
    try {
      const provider = this.getCurrentProvider();
      const response = await provider.sendMessageWithMediaComplete(message, attachments, options);
      
      return {
        success: true,
        content: response,
        provider: provider.name,
        model: provider.getCurrentModel(),
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        provider: this.getCurrentProviderName(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all available models from all providers
   */
  getAllAvailableModels(): AIModel[] {
    return providerRegistry.getAllAvailableModels();
  }

  /**
   * Get models from current provider
   */
  getCurrentProviderModels(): AIModel[] {
    const provider = this.getCurrentProvider();
    return provider.getAvailableModels();
  }

  /**
   * Set model for current provider
   */
  setModel(modelId: string): void {
    const provider = this.getCurrentProvider();
    provider.setModel(modelId);
  }

  /**
   * Clear chat history for current provider
   */
  clearHistory(): void {
    const provider = this.getCurrentProvider();
    provider.clearHistory();
  }

  /**
   * Set system context for current provider
   */
  setSystemContext(context: string): void {
    const provider = this.getCurrentProvider();
    provider.setSystemContext(context);
  }

  /**
   * Get provider status for all providers
   */
  getProviderStatus() {
    return providerRegistry.getProviderStatus();
  }

  /**
   * Get available (configured) providers
   */
  getAvailableProviders(): string[] {
    return providerRegistry.getAvailableProviderNames();
  }

  /**
   * Handle model change - switch provider if needed
   */
  handleModelChange(modelId: string): boolean {
    const provider = providerRegistry.findProviderByModel(modelId);
    if (provider) {
      providerRegistry.setCurrentProvider(provider.name as ProviderName);
      provider.setModel(modelId);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const unifiedAIService = UnifiedAIService.getInstance();

// Export convenience functions
export const sendMessage = (message: string, options?: AIRequestOptions) =>
  unifiedAIService.sendMessage(message, options);

export const sendMessageWithMedia = (
  message: string,
  attachments: MediaAttachment[],
  options?: AIRequestOptions
) => unifiedAIService.sendMessageWithMedia(message, attachments, options);

export const sendMessageComplete = (message: string, options?: AIRequestOptions) =>
  unifiedAIService.sendMessageComplete(message, options);

export const sendMessageWithMediaComplete = (
  message: string,
  attachments: MediaAttachment[],
  options?: AIRequestOptions
) => unifiedAIService.sendMessageWithMediaComplete(message, attachments, options);

export const switchProvider = (providerName: ProviderName) =>
  unifiedAIService.switchProvider(providerName);

export const getCurrentProvider = () => unifiedAIService.getCurrentProvider();

export const getAllAvailableModels = () => unifiedAIService.getAllAvailableModels();

export const handleModelChange = (modelId: string) =>
  unifiedAIService.handleModelChange(modelId);
