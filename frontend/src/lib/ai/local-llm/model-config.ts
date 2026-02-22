/**
 * Local LLM Model Configuration
 * 
 * This file contains model definitions specifically for local LLM providers (Ollama).
 * Models are dynamically discovered from Ollama and enhanced with metadata.
 */

export interface LocalLLMModel {
  id: string;
  name: string; // Ollama model name (e.g., 'llama3.2', 'llava', 'mistral')
  displayName: string;
  description: string;
  category: 'text' | 'multimodal' | 'coding' | 'reasoning';
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  capabilities: string[];
  contextWindow: number;
  recommended: boolean; // Whether this is a recommended model
  size?: string; // Model size (e.g., '7B', '13B', '70B')
  quantization?: string; // Quantization level if applicable
}

/**
 * Metadata hints for common local LLM models.
 * These are used to enhance dynamically discovered models.
 */
const MODEL_METADATA_HINTS: Record<string, Partial<LocalLLMModel>> = {
  'llama3.2': {
    displayName: 'Llama 3.2',
    description: 'Meta Llama 3.2 - Fast and efficient text generation',
    category: 'text',
    capabilities: ['text', 'code-generation'],
    contextWindow: 128000,
    recommended: true,
    size: '3B',
  },
  'llama3.1': {
    displayName: 'Llama 3.1',
    description: 'Meta Llama 3.1 - High quality text generation',
    category: 'text',
    capabilities: ['text', 'code-generation'],
    contextWindow: 128000,
    recommended: true,
    size: '8B',
  },
  'mistral': {
    displayName: 'Mistral 7B',
    description: 'Mistral 7B - Efficient and capable language model',
    category: 'text',
    capabilities: ['text', 'code-generation'],
    contextWindow: 32000,
    recommended: true,
    size: '7B',
  },
  'codellama': {
    displayName: 'Code Llama',
    description: 'Code Llama - Specialized for code generation and understanding',
    category: 'coding',
    capabilities: ['text', 'code-generation', 'code-completion'],
    contextWindow: 100000,
    recommended: true,
    size: '7B',
  },
  'phi3': {
    displayName: 'Phi-3',
    description: 'Microsoft Phi-3 - Small but capable model',
    category: 'text',
    capabilities: ['text', 'code-generation'],
    contextWindow: 128000,
    recommended: false,
    size: '3.8B',
  },
  'gemma2': {
    displayName: 'Gemma 2',
    description: 'Google Gemma 2 - Open source language model',
    category: 'text',
    capabilities: ['text', 'code-generation'],
    contextWindow: 8192,
    recommended: true,
    size: '9B',
  },
  'gemma3:270m': {
    displayName: 'Gemma 3 270M',
    description: 'Google Gemma 3 270M - Ultra-lightweight and fast model',
    category: 'text',
    capabilities: ['text', 'code-generation'],
    contextWindow: 8192,
    recommended: true,
    size: '270M',
  },
  'llava': {
    displayName: 'LLaVA',
    description: 'LLaVA - Large Language and Vision Assistant with image understanding',
    category: 'multimodal',
    supportsImages: true,
    capabilities: ['text', 'images', 'visual-understanding'],
    contextWindow: 4096,
    recommended: true,
    size: '7B',
  },
  'llava-llama3': {
    displayName: 'LLaVA Llama 3',
    description: 'LLaVA based on Llama 3 - Enhanced vision capabilities',
    category: 'multimodal',
    supportsImages: true,
    capabilities: ['text', 'images', 'visual-understanding'],
    contextWindow: 8192,
    recommended: true,
    size: '8B',
  },
  'gemma3:latest': {
    displayName: 'Gemma 3 Latest',
    description: 'Google Gemma 3 Latest - Latest version of Gemma 3',
    category: 'text',
    capabilities: ['text', 'code-generation'],
    contextWindow: 8192,
    recommended: true,
    size: '3B',
  }
};

/**
 * Predefined local LLM models (for backward compatibility and initial display)
 */
export const LOCAL_LLM_MODELS: LocalLLMModel[] = Object.entries(MODEL_METADATA_HINTS).map(([name, hint]) => ({
  id: `ollama/${name.replace(/:/g, '-')}`,
  name,
  displayName: hint.displayName || name,
  description: hint.description || `Ollama model: ${name}`,
  category: hint.category || 'text',
  supportsImages: hint.supportsImages || false,
  supportsAudio: hint.supportsAudio || false,
  supportsVideo: hint.supportsVideo || false,
  capabilities: hint.capabilities || ['text'],
  contextWindow: hint.contextWindow || 8192,
  recommended: hint.recommended || false,
  size: hint.size,
}));

/**
 * Local LLM Model Configuration Manager
 */
export class LocalLLMModelConfigManager {
  private static instance: LocalLLMModelConfigManager;
  private selectedModelId: string | null = null;
  private discoveredModels: Map<string, LocalLLMModel> = new Map();
  private availableNames: string[] = [];

  private hasBeenChecked: boolean = false;
  private capabilityOverrides: Record<string, Partial<LocalLLMModel>> = {};

  private constructor() {
    this.loadOverrides();
  }

  static getInstance(): LocalLLMModelConfigManager {
    if (!LocalLLMModelConfigManager.instance) {
      LocalLLMModelConfigManager.instance = new LocalLLMModelConfigManager();
    }
    return LocalLLMModelConfigManager.instance;
  }

  /**
   * Load overrides from localStorage
   */
  private loadOverrides() {
    try {
      const saved = localStorage.getItem('local-llm-overrides');
      if (saved) {
        this.capabilityOverrides = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load local LLM overrides:', e);
    }
  }

  /**
   * Save overrides to localStorage
   */
  private saveOverrides() {
    localStorage.setItem('local-llm-overrides', JSON.stringify(this.capabilityOverrides));
    // Rebuild discovered models to apply changes
    this.updateAvailableModels(this.availableNames);
  }

  /**
   * Toggle a capability for a model
   */
  toggleCapability(modelName: string, capability: keyof Pick<LocalLLMModel, 'supportsImages' | 'supportsAudio' | 'supportsVideo'>) {
    if (!this.capabilityOverrides[modelName]) {
      this.capabilityOverrides[modelName] = {};
    }

    // Get current value (including hints/guessing)
    const model = this.getModelByOllamaName(modelName);
    const currentValue = model ? model[capability] : false;

    this.capabilityOverrides[modelName][capability] = !currentValue;
    this.saveOverrides();

    // Dispatch event to notify UI
    window.dispatchEvent(new CustomEvent('local-model-config-changed'));
  }

  /**
   * Update available models from Ollama
   */
  async updateAvailableModels(ollamaModels: string[]) {
    this.availableNames = ollamaModels;
    this.hasBeenChecked = true;

    // Clear and rebuild discovered models
    this.discoveredModels.clear();
    ollamaModels.forEach(name => {
      const model = this.createModelEntry(name);
      this.discoveredModels.set(model.id, model);
    });

    console.log(`[LocalLLMModelConfig] Discovered ${this.discoveredModels.size} models from Ollama`);
  }

  /**
   * Create a model entry based on name and metadata hints
   */
  private createModelEntry(name: string): LocalLLMModel {
    // Try to find a hint for this model (check exact name or base name without tag)
    const baseName = name.split(':')[0];
    const hint = MODEL_METADATA_HINTS[name] || MODEL_METADATA_HINTS[baseName] || {};
    const override = this.capabilityOverrides[name] || {};

    const isVision = name.toLowerCase().includes('llava') ||
      name.toLowerCase().includes('vision') ||
      hint.supportsImages;

    const isCoding = name.toLowerCase().includes('coder') ||
      name.toLowerCase().includes('code') ||
      hint.category === 'coding';

    return {
      id: `ollama/${name.replace(/:/g, '-')}`,
      name: name,
      displayName: hint.displayName || this.formatModelName(name),
      description: hint.description || `Ollama model: ${name}`,
      category: hint.category || (isVision ? 'multimodal' : isCoding ? 'coding' : 'text'),
      supportsImages: override.supportsImages !== undefined ? override.supportsImages : !!isVision,
      supportsAudio: override.supportsAudio !== undefined ? override.supportsAudio : (hint.supportsAudio || false),
      supportsVideo: override.supportsVideo !== undefined ? override.supportsVideo : (hint.supportsVideo || false),
      capabilities: hint.capabilities || (isVision ? ['text', 'images'] : ['text']),
      contextWindow: hint.contextWindow || 8192,
      recommended: hint.recommended || false,
      size: hint.size,
    };
  }

  /**
   * Get all currently available models
   */
  getAvailableModels(): LocalLLMModel[] {
    if (this.discoveredModels.size > 0) {
      return Array.from(this.discoveredModels.values());
    }

    // If we have checked and found nothing, return empty
    if (this.hasBeenChecked) {
      return [];
    }

    // If no models discovered yet (initial state), return predefined models as placeholders
    return LOCAL_LLM_MODELS;
  }

  /**
   * Format model name for display
   */
  private formatModelName(name: string): string {
    return name
      .split(':')
      .map(part => {
        return part.charAt(0).toUpperCase() + part.slice(1).replace(/(\d+)([a-z])/gi, '$1 $2');
      })
      .join(' ');
  }

  /**
   * Get recommended models
   */
  getRecommendedModels(): LocalLLMModel[] {
    return this.getAvailableModels().filter(model => model.recommended);
  }

  /**
   * Get models by category
   */
  getModelsByCategory(category: string): LocalLLMModel[] {
    return this.getAvailableModels().filter(model => model.category === category);
  }

  /**
   * Get currently selected model
   */
  getSelectedModel(): LocalLLMModel | null {
    if (!this.selectedModelId) return null;
    return this.discoveredModels.get(this.selectedModelId) ||
      LOCAL_LLM_MODELS.find(m => m.id === this.selectedModelId) ||
      null;
  }

  /**
   * Set the selected model
   */
  setSelectedModel(modelId: string) {
    this.selectedModelId = modelId;
    console.log('[LocalLLMModelConfig] Selected model set to:', modelId);
  }

  /**
   * Clear selected model (switch back to cloud mode)
   */
  clearSelectedModel() {
    this.selectedModelId = null;
  }

  /**
   * Get model by Ollama name
   */
  getModelByOllamaName(ollamaName: string): LocalLLMModel | null {
    return this.getAvailableModels().find(m => m.name === ollamaName) || null;
  }

  /**
   * Check if a model is available
   */
  isModelAvailable(modelId: string): boolean {
    if (this.availableNames.length === 0) return true; // Assume available if not checked yet
    const model = this.getModelById(modelId);
    return model ? this.availableNames.includes(model.name) : false;
  }

  /**
   * Get model by ID
   */
  getModelById(modelId: string): LocalLLMModel | null {
    return this.discoveredModels.get(modelId) ||
      LOCAL_LLM_MODELS.find(m => m.id === modelId) ||
      null;
  }
}

// Export singleton instance
export const localLLMModelConfig = LocalLLMModelConfigManager.getInstance();

// Convenience functions
export const getLocalLLMModels = () => localLLMModelConfig.getAvailableModels();
export const getRecommendedLocalLLMModels = () => localLLMModelConfig.getRecommendedModels();
export const getLocalLLMModelById = (id: string) => localLLMModelConfig.getModelById(id);
export const setLocalLLMModel = (id: string) => localLLMModelConfig.setSelectedModel(id);
export const clearLocalLLMModel = () => localLLMModelConfig.clearSelectedModel();

