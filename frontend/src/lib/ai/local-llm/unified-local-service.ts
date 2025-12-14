/**
 * Unified Local LLM Service
 * 
 * This service provides a unified interface for local LLM operations,
 * separate from cloud-based AI services. It can be used independently
 * or integrated with the main unified AI service.
 */

import { ollamaService, isOllamaConfigured } from './ollama';
import { localLLMModelConfig, type LocalLLMModel } from './model-config';
import type { MediaAttachment } from '../gemini';

// Simple token estimation (approximately 4 characters per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class UnifiedLocalLLMService {
  private currentSystemPrompt: string | null = null;
  private usageTrackingEnabled: boolean = false; // Local LLM doesn't need usage tracking
  private currentModelName: string | null = null; // Track current model name directly

  constructor() {
    // Initialize service
  }

  /**
   * Initialize the service by checking Ollama connection and updating available models
   */
  async initialize(): Promise<{ success: boolean; message: string; models: string[] }> {
    try {
      const isRunning = await isOllamaConfigured();
      if (!isRunning) {
        return {
          success: false,
          message: 'Ollama is not running. Please start Ollama service.',
          models: [],
        };
      }

      const models = await ollamaService.listModels();
      await localLLMModelConfig.updateAvailableModels(models);

      return {
        success: true,
        message: `Ollama is running! Found ${models.length} model(s).`,
        models,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`,
        models: [],
      };
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): LocalLLMModel[] {
    return localLLMModelConfig.getAvailableModels();
  }

  /**
   * Get recommended models
   */
  getRecommendedModels(): LocalLLMModel[] {
    return localLLMModelConfig.getRecommendedModels();
  }

  /**
   * Set the current model
   * @param modelIdOrName - Model ID (e.g., 'ollama/gemma3-270m') or Ollama model name (e.g., 'gemma3:270m')
   */
  setModel(modelIdOrName: string) {
    console.log('[UnifiedLocalLLMService] setModel called with:', modelIdOrName);
    
    // Try to find by model ID first
    if (modelIdOrName.startsWith('ollama/')) {
      localLLMModelConfig.setSelectedModel(modelIdOrName);
      const model = localLLMModelConfig.getSelectedModel();
      if (model) {
        console.log('[UnifiedLocalLLMService] Found model by ID:', model.name);
        ollamaService.setModel(model.name);
      } else {
        console.warn('[UnifiedLocalLLMService] Model ID not found in config:', modelIdOrName);
        // Try to extract the model name from the ID
        const modelName = modelIdOrName.replace('ollama/', '').replace(/-/g, ':');
        ollamaService.setModel(modelName);
      }
    } else {
      // Try to find by Ollama name
      const model = localLLMModelConfig.getModelByOllamaName(modelIdOrName);
      if (model) {
        console.log('[UnifiedLocalLLMService] Found model by name:', model.name);
        localLLMModelConfig.setSelectedModel(model.id);
        ollamaService.setModel(model.name);
      } else {
        // Use the name directly (for dynamic models not in config)
        // Check if this model already exists in available models
        const availableModels = localLLMModelConfig.getAvailableModels();
        const existingModel = availableModels.find(m => m.name === modelIdOrName);
        
        if (existingModel) {
          console.log('[UnifiedLocalLLMService] Found model in available models:', existingModel.name);
          localLLMModelConfig.setSelectedModel(existingModel.id);
          ollamaService.setModel(existingModel.name);
        } else {
          // For dynamic models, set it in ollamaService
          // Also try to set a temporary ID in the config
          console.log('[UnifiedLocalLLMService] Using dynamic model:', modelIdOrName);
          const dynamicModelId = `ollama/${modelIdOrName.replace(/:/g, '-')}`;
          // Try to set it in config even if it doesn't exist (might work for dynamic models)
          try {
            localLLMModelConfig.setSelectedModel(dynamicModelId);
          } catch (e) {
            // Ignore if it fails
          }
          ollamaService.setModel(modelIdOrName);
        }
      }
    }
    
    // Store the model name directly for reliable tracking
    const finalModelName = ollamaService.getCurrentModel();
    this.currentModelName = finalModelName;
    console.log('[UnifiedLocalLLMService] Model name stored:', this.currentModelName);
    
    // Verify the model was set
    const verifyModel = this.getCurrentModel();
    console.log('[UnifiedLocalLLMService] Model set verification:', verifyModel?.name || 'null');
  }

  /**
   * Get the current model
   */
  getCurrentModel(): LocalLLMModel | null {
    // First check if we have a stored model name
    if (this.currentModelName) {
      // Check if it exists in available models
      const availableModels = localLLMModelConfig.getAvailableModels();
      const existingModel = availableModels.find(m => m.name === this.currentModelName);
      if (existingModel) {
        return existingModel;
      }
      
      // Create a temporary model entry for dynamic models
      return {
        id: `ollama/${this.currentModelName.replace(/:/g, '-')}`,
        name: this.currentModelName,
        displayName: this.formatModelName(this.currentModelName),
        description: `Ollama model: ${this.currentModelName}`,
        category: 'text' as const,
        supportsImages: this.currentModelName.toLowerCase().includes('llava') || this.currentModelName.toLowerCase().includes('vision'),
        supportsAudio: false,
        supportsVideo: false,
        capabilities: this.currentModelName.toLowerCase().includes('llava') || this.currentModelName.toLowerCase().includes('vision')
          ? ['text', 'images']
          : ['text'],
        contextWindow: 8192,
        recommended: false,
      };
    }
    
    // Fallback: check config
    const model = localLLMModelConfig.getSelectedModel();
    if (model) {
      this.currentModelName = model.name; // Sync stored name
      return model;
    }
    
    // Last resort: check ollamaService
    const ollamaModelName = ollamaService.getCurrentModel();
    if (ollamaModelName && ollamaModelName !== 'llama3.2') {
      this.currentModelName = ollamaModelName; // Sync stored name
      // Check if it exists in available models
      const availableModels = localLLMModelConfig.getAvailableModels();
      const existingModel = availableModels.find(m => m.name === ollamaModelName);
      if (existingModel) {
        return existingModel;
      }
      
      // Create a temporary model entry for dynamic models
      return {
        id: `ollama/${ollamaModelName.replace(/:/g, '-')}`,
        name: ollamaModelName,
        displayName: this.formatModelName(ollamaModelName),
        description: `Ollama model: ${ollamaModelName}`,
        category: 'text' as const,
        supportsImages: ollamaModelName.toLowerCase().includes('llava') || ollamaModelName.toLowerCase().includes('vision'),
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ollamaModelName.toLowerCase().includes('llava') || ollamaModelName.toLowerCase().includes('vision')
          ? ['text', 'images']
          : ['text'],
        contextWindow: 8192,
        recommended: false,
      };
    }
    
    return null;
  }

  /**
   * Format model name for display
   */
  private formatModelName(name: string): string {
    // Convert "gemma3:270m" to "Gemma 3 270M"
    return name
      .split(':')
      .map((part, index) => {
        if (index === 0) {
          // Capitalize first letter
          return part.charAt(0).toUpperCase() + part.slice(1);
        } else {
          // Handle size indicators like "270m" -> "270M"
          return part.replace(/(\d+)([a-z])/gi, '$1 $2').toUpperCase();
        }
      })
      .join(' ');
  }

  /**
   * Send a message with optional media attachments
   * Returns a streaming async generator for real-time response
   * 
   * @param message - The message to send
   * @param attachments - Optional media attachments
   * @param modelIdOrName - Optional model ID (e.g., 'ollama/gemma3-270m') or Ollama model name (e.g., 'gemma3:270m')
   */
  async sendMessage(
    message: string, 
    attachments?: MediaAttachment[],
    modelIdOrName?: string
  ): Promise<AsyncGenerator<string, void, unknown>> {
    let selectedModel: LocalLLMModel | null = null;
    let modelName: string;

    if (modelIdOrName) {
      // Try to find by model ID first
      if (modelIdOrName.startsWith('ollama/')) {
        localLLMModelConfig.setSelectedModel(modelIdOrName);
        selectedModel = localLLMModelConfig.getSelectedModel();
      } else {
        // Try to find by Ollama name
        selectedModel = localLLMModelConfig.getModelByOllamaName(modelIdOrName);
      }
      
      // If not found in config, use the name directly (for dynamic models)
      if (!selectedModel) {
        modelName = modelIdOrName;
      } else {
        modelName = selectedModel.name;
      }
    } else {
      selectedModel = this.getCurrentModel(); // Use getCurrentModel which checks both config and ollamaService
      if (!selectedModel) {
        // Last resort: check if ollamaService has a model set
        const ollamaModelName = ollamaService.getCurrentModel();
        if (ollamaModelName && ollamaModelName !== 'llama3.2') {
          modelName = ollamaModelName;
          console.warn('Using model from ollamaService directly:', ollamaModelName);
        } else {
          throw new Error('No local LLM model selected. Please select a model first or provide a model name.');
        }
      } else {
        modelName = selectedModel.name;
      }
    }

    // Check if Ollama is running
    const isRunning = await isOllamaConfigured();
    if (!isRunning) {
      throw new Error('Ollama is not running. Please start Ollama and ensure it is accessible at http://127.0.0.1:11434');
    }

    // Validate attachments against model capabilities (if we have model info)
    if (attachments?.length && selectedModel) {
      const hasImages = attachments.some(a => a.mediaType === 'image');
      if (hasImages && !selectedModel.supportsImages) {
        throw new Error(`Model ${selectedModel.displayName} does not support images. Please use a vision model like LLaVA.`);
      }
    }

    // Use the model name directly
    return ollamaService.sendMessageWithMedia(message, attachments, modelName);
  }

  /**
   * Send a message and get the complete response (non-streaming)
   */
  async sendMessageComplete(
    message: string, 
    attachments?: MediaAttachment[],
    modelId?: string
  ): Promise<string> {
    const stream = await this.sendMessage(message, attachments, modelId);
    let response = '';
    for await (const chunk of stream) {
      response += chunk;
    }
    return response;
  }

  /**
   * Clear chat history
   */
  clearHistory() {
    ollamaService.clearHistory();
    // Don't clear currentModelName - keep the model selected
  }

  /**
   * Get chat history
   */
  getHistory() {
    return ollamaService.getHistory();
  }

  /**
   * Set system prompt
   */
  setSystemPrompt(prompt: string) {
    this.currentSystemPrompt = prompt;
    ollamaService.addSystemContext(prompt);
  }

  /**
   * Get current system prompt
   */
  getSystemPrompt(): string | null {
    return this.currentSystemPrompt;
  }

  /**
   * Check if Ollama is configured and running
   */
  async isConfigured(): Promise<boolean> {
    return await isOllamaConfigured();
  }

  /**
   * Get configuration status
   */
  async getConfigStatus() {
    const isConfigured = await isOllamaConfigured();
    const models = await ollamaService.listModels();
    const selectedModel = localLLMModelConfig.getSelectedModel();

    return {
      isConfigured,
      availableModels: models,
      selectedModel: selectedModel?.displayName || null,
      message: isConfigured
        ? `Ollama is running! Found ${models.length} model(s).`
        : 'Ollama is not running. Please start Ollama service.',
    };
  }
}

// Export singleton instance
export const unifiedLocalLLMService = new UnifiedLocalLLMService();

// Convenience functions
export const sendLocalLLMMessage = (
  message: string, 
  attachments?: MediaAttachment[],
  modelId?: string
) => unifiedLocalLLMService.sendMessage(message, attachments, modelId);

export const sendLocalLLMMessageComplete = (
  message: string, 
  attachments?: MediaAttachment[],
  modelId?: string
) => unifiedLocalLLMService.sendMessageComplete(message, attachments, modelId);

