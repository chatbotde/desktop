import { getSelectedModel } from './model-config';
import { geminiService, isGeminiConfigured } from './gemini';
import { openaiService, isOpenAIConfigured } from './openai';
import { anthropicService, isAnthropicConfigured } from './anthropic';
import { openRouterService, isOpenRouterConfigured } from './openrouter';
import { cerebrasService, isCerebrasConfigured } from './cerebras';
import type { MediaAttachment } from './gemini';
import { getDefaultSystemPrompt, getSystemPromptById, type SystemPrompt } from './system-prompts';

export class UnifiedAIService {
  private currentSystemPrompt: SystemPrompt | null = null;

  constructor() {
    // Initialize with default learning assistant prompt
    this.setSystemPrompt('learning');
  }
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

      case 'openrouter':
        if (!isOpenRouterConfigured()) {
          throw new Error('OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
        }
        return openRouterService.sendMessageWithMedia(message, attachments);

      case 'cerebras':
        if (!isCerebrasConfigured()) {
          throw new Error('Cerebras API key not configured. Please add VITE_CEREBRAS_API_KEY to your .env file.');
        }
        return cerebrasService.sendMessageWithMedia(message, attachments);

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
      case 'openrouter':
        openRouterService.clearHistory();
        break;
      case 'cerebras':
        cerebrasService.clearHistory();
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
      case 'openrouter':
        openRouterService.addSystemContext(context);
        break;
      case 'cerebras':
        cerebrasService.addSystemContext(context);
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
      case 'openrouter':
        return isOpenRouterConfigured();
      case 'cerebras':
        return isCerebrasConfigured();
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

  /**
   * Set the system prompt for all AI services
   * @param promptId - ID of the system prompt to use ('learning', 'general', 'code', 'creative')
   */
  setSystemPrompt(promptId: string) {
    const prompt = getSystemPromptById(promptId);
    if (!prompt) {
      console.warn(`System prompt '${promptId}' not found, using default`);
      this.currentSystemPrompt = getDefaultSystemPrompt();
    } else {
      this.currentSystemPrompt = prompt;
    }

    // Apply to all services
    const promptText = this.currentSystemPrompt.prompt;
    geminiService.addSystemContext(promptText);
    openaiService.addSystemContext(promptText);
    anthropicService.addSystemContext(promptText);
    openRouterService.addSystemContext(promptText);
    cerebrasService.addSystemContext(promptText);

    console.log(`✅ System prompt set to: ${this.currentSystemPrompt.name}`);
  }

  /**
   * Get the current system prompt
   */
  getCurrentSystemPrompt(): SystemPrompt | null {
    return this.currentSystemPrompt;
  }

  /**
   * Apply a custom system prompt
   */
  setCustomSystemPrompt(prompt: string, name: string = 'Custom') {
    this.currentSystemPrompt = {
      id: 'custom',
      name,
      description: 'Custom system prompt',
      prompt
    };

    // Apply to all services
    geminiService.addSystemContext(prompt);
    openaiService.addSystemContext(prompt);
    anthropicService.addSystemContext(prompt);
    openRouterService.addSystemContext(prompt);
    cerebrasService.addSystemContext(prompt);

    console.log(`✅ Custom system prompt applied: ${name}`);
  }
}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();

// Convenience function for easy import
export const sendMessage = (message: string, attachments?: MediaAttachment[]) =>
  unifiedAIService.sendMessage(message, attachments);

export const sendMessageComplete = (message: string, attachments?: MediaAttachment[]) =>
  unifiedAIService.sendMessageComplete(message, attachments);

