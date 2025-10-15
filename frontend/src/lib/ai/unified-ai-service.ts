import { getSelectedModel } from './model-config';
import { geminiService, isGeminiConfigured } from './gemini';
import { openaiService, isOpenAIConfigured } from './openai';
import { anthropicService, isAnthropicConfigured } from './anthropic';
import type { MediaAttachment } from './gemini';

export class UnifiedAIService {
  /**
   * Send a message with optional media attachments to the currently selected AI provider
   * Returns a streaming async generator for real-time response
   */
  async sendMessage(message: string, attachments?: MediaAttachment[]): Promise<AsyncGenerator<string, void, unknown>> {
    const selectedModel = getSelectedModel();
    
    if (!selectedModel) {
      throw new Error('No AI model selected. Please select a model from the model selector.');
    }

    const provider = selectedModel.provider.toLowerCase();

    // Route to appropriate provider based on selected model
    switch (provider) {
      case 'google':
        if (!isGeminiConfigured()) {
          throw new Error('Gemini API key not configured. Please add VITE_GOOGLE_API_KEY to your .env file.');
        }
        return geminiService.sendMessageWithMedia(message, attachments);

      case 'openai':
        if (!isOpenAIConfigured()) {
          throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
        }
        return openaiService.sendMessageWithMedia(message, attachments);

      case 'anthropic':
        if (!isAnthropicConfigured()) {
          throw new Error('Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
        }
        return anthropicService.sendMessageWithMedia(message, attachments);

      default:
        throw new Error(`Unsupported AI provider: ${provider}. Please select a different model.`);
    }
  }

  /**
   * Send a message and get the complete response (non-streaming)
   */
  async sendMessageComplete(message: string, attachments?: MediaAttachment[]): Promise<string> {
    const stream = await this.sendMessage(message, attachments);
    let response = '';
    for await (const chunk of stream) {
      response += chunk;
    }
    return response;
  }

  /**
   * Clear chat history for the currently selected provider
   */
  clearHistory() {
    const selectedModel = getSelectedModel();
    if (!selectedModel) return;

    const provider = selectedModel.provider.toLowerCase();
    
    switch (provider) {
      case 'google':
        geminiService.clearHistory();
        break;
      case 'openai':
        openaiService.clearHistory();
        break;
      case 'anthropic':
        anthropicService.clearHistory();
        break;
    }
  }

  /**
   * Add system context to the currently selected provider
   */
  addSystemContext(context: string) {
    const selectedModel = getSelectedModel();
    if (!selectedModel) return;

    const provider = selectedModel.provider.toLowerCase();
    
    switch (provider) {
      case 'google':
        geminiService.addSystemContext(context);
        break;
      case 'openai':
        openaiService.addSystemContext(context);
        break;
      case 'anthropic':
        anthropicService.addSystemContext(context);
        break;
    }
  }

  /**
   * Get the current model name
   */
  getCurrentModelName(): string {
    const selectedModel = getSelectedModel();
    return selectedModel?.displayName || 'Unknown Model';
  }

  /**
   * Get the current provider name
   */
  getCurrentProviderName(): string {
    const selectedModel = getSelectedModel();
    return selectedModel?.provider || 'Unknown Provider';
  }

  /**
   * Check if the current provider is configured
   */
  isCurrentProviderConfigured(): boolean {
    const selectedModel = getSelectedModel();
    if (!selectedModel) return false;

    const provider = selectedModel.provider.toLowerCase();
    
    switch (provider) {
      case 'google':
        return isGeminiConfigured();
      case 'openai':
        return isOpenAIConfigured();
      case 'anthropic':
        return isAnthropicConfigured();
      default:
        return false;
    }
  }

  /**
   * Get configuration status for the current provider
   */
  getCurrentProviderStatus() {
    const selectedModel = getSelectedModel();
    if (!selectedModel) {
      return {
        isConfigured: false,
        provider: 'None',
        message: 'No model selected'
      };
    }

    const isConfigured = this.isCurrentProviderConfigured();

    return {
      isConfigured,
      provider: selectedModel.provider,
      model: selectedModel.displayName,
      message: isConfigured
        ? `${selectedModel.provider} API is configured and ready!`
        : `${selectedModel.provider} API key not configured. Please add the appropriate API key to your .env file.`
    };
  }
}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();

// Convenience function for easy import
export const sendMessage = (message: string, attachments?: MediaAttachment[]) =>
  unifiedAIService.sendMessage(message, attachments);

export const sendMessageComplete = (message: string, attachments?: MediaAttachment[]) =>
  unifiedAIService.sendMessageComplete(message, attachments);

