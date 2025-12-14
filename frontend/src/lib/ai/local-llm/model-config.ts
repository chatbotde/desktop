/**
 * Local LLM Model Configuration
 * 
 * This file contains model definitions specifically for local LLM providers (Ollama).
 * These models are separate from cloud-based models and can be scaled independently.
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
 * Predefined local LLM models
 * These are common models available in Ollama
 */
export const LOCAL_LLM_MODELS: LocalLLMModel[] = [
  // Text Models
  {
    id: 'ollama/llama3.2',
    name: 'llama3.2',
    displayName: 'Llama 3.2',
    description: 'Meta Llama 3.2 - Fast and efficient text generation',
    category: 'text',
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 128000,
    recommended: true,
    size: '3B',
  },
  {
    id: 'ollama/llama3.1',
    name: 'llama3.1',
    displayName: 'Llama 3.1',
    description: 'Meta Llama 3.1 - High quality text generation',
    category: 'text',
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 128000,
    recommended: true,
    size: '8B',
  },
  {
    id: 'ollama/mistral',
    name: 'mistral',
    displayName: 'Mistral 7B',
    description: 'Mistral 7B - Efficient and capable language model',
    category: 'text',
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 32000,
    recommended: true,
    size: '7B',
  },
  {
    id: 'ollama/codellama',
    name: 'codellama',
    displayName: 'Code Llama',
    description: 'Code Llama - Specialized for code generation and understanding',
    category: 'coding',
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation', 'code-completion'],
    contextWindow: 100000,
    recommended: true,
    size: '7B',
  },
  {
    id: 'ollama/phi3',
    name: 'phi3',
    displayName: 'Phi-3',
    description: 'Microsoft Phi-3 - Small but capable model',
    category: 'text',
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 128000,
    recommended: false,
    size: '3.8B',
  },
  {
    id: 'ollama/gemma2',
    name: 'gemma2',
    displayName: 'Gemma 2',
    description: 'Google Gemma 2 - Open source language model',
    category: 'text',
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 8192,
    recommended: true,
    size: '9B',
  },
  {
    id: 'ollama/gemma3-270m',
    name: 'gemma3:270m',
    displayName: 'Gemma 3 270M',
    description: 'Google Gemma 3 270M - Ultra-lightweight and fast model',
    category: 'text',
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 8192,
    recommended: true,
    size: '270M',
  },
  
  // Multimodal Models (Vision)
  {
    id: 'ollama/llava',
    name: 'llava',
    displayName: 'LLaVA',
    description: 'LLaVA - Large Language and Vision Assistant with image understanding',
    category: 'multimodal',
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'visual-understanding'],
    contextWindow: 4096,
    recommended: true,
    size: '7B',
  },
  {
    id: 'ollama/bakllava',
    name: 'bakllava',
    displayName: 'BakLLaVA',
    description: 'BakLLaVA - Alternative vision-language model',
    category: 'multimodal',
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'visual-understanding'],
    contextWindow: 4096,
    recommended: false,
    size: '7B',
  },
  {
    id: 'ollama/llava-llama3',
    name: 'llava-llama3',
    displayName: 'LLaVA Llama 3',
    description: 'LLaVA based on Llama 3 - Enhanced vision capabilities',
    category: 'multimodal',
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'visual-understanding'],
    contextWindow: 8192,
    recommended: true,
    size: '8B',
  },
];

/**
 * Local LLM Model Configuration Manager
 */
export class LocalLLMModelConfigManager {
  private static instance: LocalLLMModelConfigManager;
  private selectedModelId: string | null = null;
  private modelConfigs: Map<string, LocalLLMModel> = new Map();
  private availableModels: string[] = []; // Models available in Ollama

  private constructor() {
    // Initialize with predefined models
    LOCAL_LLM_MODELS.forEach(model => {
      this.modelConfigs.set(model.id, model);
    });
  }

  static getInstance(): LocalLLMModelConfigManager {
    if (!LocalLLMModelConfigManager.instance) {
      LocalLLMModelConfigManager.instance = new LocalLLMModelConfigManager();
    }
    return LocalLLMModelConfigManager.instance;
  }

  /**
   * Update available models from Ollama
   */
  async updateAvailableModels(ollamaModels: string[]) {
    this.availableModels = ollamaModels;
  }

  /**
   * Get all predefined models
   */
  getPredefinedModels(): LocalLLMModel[] {
    return Array.from(this.modelConfigs.values());
  }

  /**
   * Get models that are available in Ollama
   * Includes both predefined models and dynamically discovered models
   */
  getAvailableModels(): LocalLLMModel[] {
    const predefined = this.getPredefinedModels();
    
    if (this.availableModels.length === 0) {
      // If we haven't checked yet, return all predefined models
      return predefined;
    }
    
    // Get predefined models that are available
    const availablePredefined = predefined.filter(model => 
      this.availableModels.includes(model.name)
    );
    
    // Create dynamic models for any Ollama models not in our predefined list
    const predefinedNames = new Set(predefined.map(m => m.name));
    const dynamicModels: LocalLLMModel[] = this.availableModels
      .filter(name => !predefinedNames.has(name))
      .map(name => ({
        id: `ollama/${name.replace(/:/g, '-')}`,
        name: name,
        displayName: this.formatModelName(name),
        description: `Ollama model: ${name}`,
        category: 'text' as const,
        supportsImages: name.toLowerCase().includes('llava') || name.toLowerCase().includes('vision'),
        supportsAudio: false,
        supportsVideo: false,
        capabilities: name.toLowerCase().includes('llava') || name.toLowerCase().includes('vision')
          ? ['text', 'images']
          : ['text'],
        contextWindow: 8192,
        recommended: false,
      }));
    
    return [...availablePredefined, ...dynamicModels];
  }

  /**
   * Format model name for display
   */
  private formatModelName(name: string): string {
    // Convert "gemma3:270m" to "Gemma 3 270M"
    return name
      .split(':')
      .map(part => {
        // Capitalize first letter and handle numbers
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
    return this.modelConfigs.get(this.selectedModelId) || null;
  }

  /**
   * Set the selected model
   */
  setSelectedModel(modelId: string) {
    if (this.modelConfigs.has(modelId)) {
      this.selectedModelId = modelId;
      console.log('[LocalLLMModelConfig] Model set to:', modelId);
    } else {
      // Check if it's a dynamic model in available models
      const availableModels = this.getAvailableModels();
      const foundModel = availableModels.find(m => m.id === modelId);
      if (foundModel) {
        this.selectedModelId = modelId;
        console.log('[LocalLLMModelConfig] Dynamic model set to:', modelId);
      } else {
        console.warn(`[LocalLLMModelConfig] Model ${modelId} not found in local LLM config`);
      }
    }
  }

  /**
   * Get model by Ollama name
   */
  getModelByOllamaName(ollamaName: string): LocalLLMModel | null {
    const model = Array.from(this.modelConfigs.values()).find(m => m.name === ollamaName);
    return model || null;
  }

  /**
   * Check if a model is available
   */
  isModelAvailable(modelId: string): boolean {
    const model = this.modelConfigs.get(modelId);
    if (!model) return false;
    
    if (this.availableModels.length === 0) return true; // Haven't checked yet
    return this.availableModels.includes(model.name);
  }
}

// Export singleton instance
export const localLLMModelConfig = LocalLLMModelConfigManager.getInstance();

// Convenience functions
export const getLocalLLMModels = () => localLLMModelConfig.getAvailableModels();
export const getRecommendedLocalLLMModels = () => localLLMModelConfig.getRecommendedModels();
export const getLocalLLMModelById = (id: string) => localLLMModelConfig.getSelectedModel();
export const setLocalLLMModel = (id: string) => localLLMModelConfig.setSelectedModel(id);

