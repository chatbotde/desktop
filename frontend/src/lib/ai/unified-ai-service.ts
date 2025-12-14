import { getSelectedModel } from './model-config';
import { geminiService, isGeminiConfigured } from './gemini';
import { openaiService, isOpenAIConfigured } from './openai';
import { anthropicService, isAnthropicConfigured } from './anthropic';
import { openRouterService, isOpenRouterConfigured } from './openrouter';
import { cerebrasService, isCerebrasConfigured } from './cerebras';
import { deepseekService, isDeepSeekConfigured } from './deepseek';
import { kimiService, isKimiConfigured } from './kimi';
import { xaiService, isXAIConfigured } from './xai';
import type { MediaAttachment } from './gemini';
import { getDefaultSystemPrompt, getSystemPromptById, type SystemPrompt } from './system-prompts';
import { checkRateLimit, logUsage } from './usage-tracker';
import { 
  validateMessage, 
  validateAttachments,
  getCapabilitySummary,
  getCapabilityBadges,
  getCapabilityIcons,
  formatValidationMessage,
  willAttachmentBeSupported,
  type CapabilityValidationResult,
  type CapabilitySummary,
} from './capabilities';

// Simple token estimation (approximately 4 characters per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class UnifiedAIService {
  private currentSystemPrompt: SystemPrompt | null = null;
  private usageTrackingEnabled: boolean = true;

  constructor() {
    // Initialize with default learning assistant prompt
    this.setSystemPrompt('learning');
  }

  /**
   * Enable or disable usage tracking
   */
  setUsageTracking(enabled: boolean) {
    this.usageTrackingEnabled = enabled;
  }
  /**
   * Validate message and attachments before sending
   * Use this to check capabilities and show user-friendly errors
   */
  validateBeforeSend(message: string, attachments?: MediaAttachment[]): CapabilityValidationResult {
    return validateMessage(message, attachments);
  }

  /**
   * Get capability summary for the current model
   */
  getModelCapabilities(): CapabilitySummary {
    return getCapabilitySummary();
  }

  /**
   * Get capability badges for UI display
   */
  getCapabilityBadges(): string[] {
    return getCapabilityBadges();
  }

  /**
   * Get capability icons for compact UI display
   */
  getCapabilityIcons(): { icon: string; label: string; supported: boolean }[] {
    return getCapabilityIcons();
  }

  /**
   * Check if an attachment type will be supported before adding it
   */
  willAttachmentBeSupported(mediaType: 'image' | 'audio' | 'video'): { supported: boolean; message: string } {
    return willAttachmentBeSupported(mediaType);
  }

  /**
   * Format validation result for user display
   */
  formatValidationMessage(result: CapabilityValidationResult): {
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    suggestions: string[];
  } {
    return formatValidationMessage(result);
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

    // Validate attachments against model capabilities
    const validation = validateAttachments(attachments, selectedModel);
    if (!validation.isValid) {
      const formatted = formatValidationMessage(validation);
      const errorDetails = validation.errors
        .map(e => `• ${e.message}`)
        .join('\n');
      const suggestion = formatted.suggestions.length > 0 
        ? `\n\nSuggestion: ${formatted.suggestions[0]}`
        : '';
      throw new Error(`${formatted.title}\n\n${errorDetails}${suggestion}`);
    }

    const provider = selectedModel.provider.toLowerCase();
    const modelName = selectedModel.name || selectedModel.displayName;
    
    // Estimate input tokens for rate limit check
    const estimatedInputTokens = estimateTokens(message);
    
    // Check rate limit before making request (if tracking enabled)
    if (this.usageTrackingEnabled) {
      const rateLimitStatus = await checkRateLimit(estimatedInputTokens);
      if (!rateLimitStatus.allowed) {
        throw new Error(
          rateLimitStatus.error || 
          `Rate limit exceeded. Please wait ${rateLimitStatus.resetIn} seconds before trying again.`
        );
      }
    }

    // Create a wrapper generator that tracks usage
    const self = this;
    async function* trackedGenerator(
      originalGenerator: AsyncGenerator<string, void, unknown>
    ): AsyncGenerator<string, void, unknown> {
      let outputText = '';
      
      try {
        for await (const chunk of originalGenerator) {
          outputText += chunk;
          yield chunk;
        }
      } finally {
        // Log usage after stream completes
        if (self.usageTrackingEnabled) {
          const inputTokens = estimateTokens(message);
          const outputTokens = estimateTokens(outputText);
          
          logUsage({
            model: modelName,
            inputTokens,
            outputTokens,
            metadata: {
              provider,
              feature: 'chat',
            },
          }).catch((err) => {
            console.warn('[UnifiedAIService] Failed to log usage:', err);
          });
        }
      }
    }

    // Route to appropriate provider based on selected model
    switch (provider) {
      case 'google':
        if (!isGeminiConfigured()) {
          throw new Error('Gemini API key not configured. Please add VITE_GOOGLE_API_KEY to your .env file.');
        }
        return trackedGenerator(await geminiService.sendMessageWithMedia(message, attachments));

      case 'openai':
        if (!isOpenAIConfigured()) {
          throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
        }
        return trackedGenerator(await openaiService.sendMessageWithMedia(message, attachments));

      case 'anthropic':
        if (!isAnthropicConfigured()) {
          throw new Error('Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
        }
        return trackedGenerator(await anthropicService.sendMessageWithMedia(message, attachments));

      case 'openrouter':
        if (!isOpenRouterConfigured()) {
          throw new Error('OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
        }
        return trackedGenerator(await openRouterService.sendMessageWithMedia(message, attachments));

      case 'cerebras':
        if (!isCerebrasConfigured()) {
          throw new Error('Cerebras API key not configured. Please add VITE_CEREBRAS_API_KEY to your .env file.');
        }
        return trackedGenerator(await cerebrasService.sendMessageWithMedia(message, attachments));

      case 'deepseek':
        if (!isDeepSeekConfigured()) {
          throw new Error('DeepSeek API key not configured. Please add VITE_DEEPSEEK_API_KEY to your .env file.');
        }
        return trackedGenerator(await deepseekService.sendMessageWithMedia(message, attachments));

      case 'kimi':
        if (!isKimiConfigured()) {
          throw new Error('Kimi (Moonshot AI) API key not configured. Please add VITE_MOONSHOT_API_KEY to your .env file.');
        }
        return trackedGenerator(await kimiService.sendMessageWithMedia(message, attachments));

      case 'xai':
        if (!isXAIConfigured()) {
          throw new Error('xAI (Grok) API key not configured. Please add VITE_XAI_API_KEY to your .env file.');
        }
        return trackedGenerator(await xaiService.sendMessageWithMedia(message, attachments));

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
      case 'deepseek':
        deepseekService.clearHistory();
        break;
      case 'kimi':
        kimiService.clearHistory();
        break;
      case 'xai':
        xaiService.clearHistory();
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
      case 'deepseek':
        deepseekService.addSystemContext(context);
        break;
      case 'kimi':
        kimiService.addSystemContext(context);
        break;
      case 'xai':
        xaiService.addSystemContext(context);
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
  async isCurrentProviderConfigured(): Promise<boolean> {
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
      case 'deepseek':
        return isDeepSeekConfigured();
      case 'kimi':
        return isKimiConfigured();
      case 'xai':
        return isXAIConfigured();
      default:
        return false;
    }
  }

  /**
   * Get configuration status for the current provider
   */
  async getCurrentProviderStatus() {
    const selectedModel = getSelectedModel();
    if (!selectedModel) {
      return {
        isConfigured: false,
        provider: 'None',
        message: 'No model selected'
      };
    }

    const isConfigured = await this.isCurrentProviderConfigured();

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
    deepseekService.addSystemContext(promptText);
    kimiService.addSystemContext(promptText);
    xaiService.addSystemContext(promptText);

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
    deepseekService.addSystemContext(prompt);
    kimiService.addSystemContext(prompt);
    xaiService.addSystemContext(prompt);

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

// Re-export capability types and functions for convenience
export type { CapabilityValidationResult, CapabilitySummary } from './capabilities';
export { validateMessage, validateAttachments, getCapabilitySummary as getModelCapabilitySummary } from './capabilities';
