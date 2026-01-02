/**
 * Model Configuration
 * Main entry point for model configuration management
 * Models are organized by provider in the model-config/ folder
 */

// Import for internal use with different name to avoid circular reference
import { AVAILABLE_MODELS as models } from './model-config/index';
import type { AIModel } from './model-config/types';

// Re-export types and models from the organized structure
export type { AIModel, ModelProvider } from './model-config/types';
export { AVAILABLE_MODELS } from './model-config/index';

// Model configuration management
export class ModelConfigManager {
  private static instance: ModelConfigManager;
  private selectedModelId: string = 'gemini-2.5-flash'; // Default model
  private modelConfigs: Map<string, AIModel> = new Map();

  private constructor() {
    // Initialize with available models
    models.forEach((model: AIModel) => {
      this.modelConfigs.set(model.id, model);
    });
  }

  static getInstance(): ModelConfigManager {
    if (!ModelConfigManager.instance) {
      ModelConfigManager.instance = new ModelConfigManager();
    }
    return ModelConfigManager.instance;
  }

  /**
   * Get all available models
   */
  getAvailableModels(): AIModel[] {
    return Array.from(this.modelConfigs.values()).filter(model => model.isAvailable);
  }

  /**
   * Get models by category
   */
  getModelsByCategory(category: string): AIModel[] {
    return this.getAvailableModels().filter(model => model.category === category);
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: string): AIModel[] {
    return this.getAvailableModels().filter(model => model.provider === provider);
  }

  /**
   * Get currently selected model
   */
  getSelectedModel(): AIModel | null {
    return this.modelConfigs.get(this.selectedModelId) || null;
  }

  /**
   * Set selected model
   */
  setSelectedModel(modelId: string): boolean {
    const model = this.modelConfigs.get(modelId);
    if (model && model.isAvailable) {
      this.selectedModelId = modelId;
      // Save to localStorage
      localStorage.setItem('selected-ai-model', modelId);
      console.log(`Selected AI model changed to: ${model.displayName}`);
      // Dispatch event for model change
      window.dispatchEvent(new CustomEvent('model-selected', { detail: { modelId, model } }));
      return true;
    }
    return false;
  }

  /**
   * Get model by ID
   */
  getModelById(modelId: string): AIModel | null {
    return this.modelConfigs.get(modelId) || null;
  }

  /**
   * Add or update model configuration
   */
  updateModelConfig(modelId: string, config: Partial<AIModel>): void {
    const existingModel = this.modelConfigs.get(modelId);
    if (existingModel) {
      this.modelConfigs.set(modelId, { ...existingModel, ...config });
    }
  }

  /**
   * Check if model supports capability
   */
  modelSupports(modelId: string, capability: string): boolean {
    const model = this.modelConfigs.get(modelId);
    return model ? model.capabilities.includes(capability) : false;
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(modelId: string): string[] {
    const model = this.modelConfigs.get(modelId);
    return model ? model.capabilities : [];
  }

  /**
   * Initialize from localStorage
   */
  initializeFromStorage(): void {
    const savedModelId = localStorage.getItem('selected-ai-model');
    if (savedModelId && this.modelConfigs.has(savedModelId)) {
      this.selectedModelId = savedModelId;
    }
  }

  /**
   * Get provider-specific models for UI grouping
   */
  getModelsByProviderGrouped(): Record<string, AIModel[]> {
    const grouped: Record<string, AIModel[]> = {};
    this.getAvailableModels().forEach(model => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider].push(model);
    });
    return grouped;
  }

  /**
   * Get category-specific models for UI grouping
   */
  getModelsByCategoryGrouped(): Record<string, AIModel[]> {
    const grouped: Record<string, AIModel[]> = {};
    this.getAvailableModels().forEach(model => {
      if (!grouped[model.category]) {
        grouped[model.category] = [];
      }
      grouped[model.category].push(model);
    });
    return grouped;
  }
}

// Export singleton instance
export const modelConfigManager = ModelConfigManager.getInstance();

// Initialize from storage on import
modelConfigManager.initializeFromStorage();

// Export utility functions
export const getSelectedModel = () => modelConfigManager.getSelectedModel();
export const setSelectedModel = (modelId: string) => modelConfigManager.setSelectedModel(modelId);
export const getAvailableModels = () => modelConfigManager.getAvailableModels();
export const getModelsByProvider = (provider: string) => modelConfigManager.getModelsByProvider(provider);
