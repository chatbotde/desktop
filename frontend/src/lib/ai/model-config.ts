export interface ModelProvider {
  id: string;
  name: string;
  description: string;
  category: 'text' | 'multimodal' | 'coding' | 'reasoning'|'image-generation'|'video-generation'|'audio-generation';
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  capabilities: string[];
}

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  description: string;
  category: 'text' | 'multimodal' | 'coding' | 'reasoning'|'image-generation'|'video-generation'|'audio-generation';
  maxTokens: number;
  inputCost?: number; // per 1K tokens
  outputCost?: number; // per 1K tokens
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  capabilities: string[];
  contextWindow: number;
  isAvailable: boolean;
}

// Define available models
export const AVAILABLE_MODELS: AIModel[] = [

  // Google Gemini Models
  {
    id: 'models/gemini-2.5-pro',
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Gemini 2.5 Pro',
    category: 'multimodal',
    maxTokens: 8192,
    inputCost: 0.075,
    outputCost: 0.30,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    capabilities: ['text', 'images', 'audio', 'video', 'function-calling', 'code-generation'],
    contextWindow: 1000000,
    isAvailable: true,
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash (Experimental)',
    provider: 'google',
    description: 'Latest experimental Gemini model with improved performance',
    category: 'multimodal',
    maxTokens: 8192,
    inputCost: 0.075,
    outputCost: 0.30,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    capabilities: ['text', 'images', 'audio', 'video', 'function-calling', 'code-generation'],
    contextWindow: 1000000,
    isAvailable: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Fast and efficient multimodal model',
    category: 'multimodal',
    maxTokens: 8192,
    inputCost: 0.075,
    outputCost: 0.30,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    capabilities: ['text', 'images', 'audio', 'video', 'function-calling'],
    contextWindow: 1000000,
    isAvailable: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Most capable multimodal model for complex reasoning',
    category: 'reasoning',
    maxTokens: 8192,
    inputCost: 3.50,
    outputCost: 10.50,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    capabilities: ['text', 'images', 'audio', 'video', 'function-calling', 'advanced-reasoning'],
    contextWindow: 2000000,
    isAvailable: true,
  },
  {
    id: 'models/gemini-2.5-flash-image',
    name: 'nano banana',
    displayName: 'Nano Banana',
    provider: 'google',
    description: 'Advanced flash model with enhanced capabilities',
    category: 'image-generation',
    maxTokens: 8192,
    inputCost: 3.50,
    outputCost: 10.50,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images'],
    contextWindow: 32000,
    isAvailable: true,
  },
  {
    id: 'models/gemini-flash-latest',
    name: 'gemini-flash-latest',
    displayName: 'Gemini Flash Latest',
    provider: 'google',
    description: 'Latest Gemini flash model',
    category: 'multimodal',
    maxTokens: 8192,
    inputCost: 3.50,
    outputCost: 10.50,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images'],
    contextWindow: 32000,
    isAvailable: true,
  },
  {
    id : 'models/gemini-flash-lite-latest',
    name : 'gemini-flash-lite-latest',
    displayName : 'Gemini Flash Lite Latest',
    provider : 'google',
    description : 'Latest Gemini flash lite model',
    category : 'multimodal',
    maxTokens : 8192,
    inputCost : 3.50,
    outputCost : 10.50,
    supportsImages : true,
    supportsAudio : false,
    supportsVideo : false,
    capabilities : ['text', 'images'],
    contextWindow : 32000,
    isAvailable : true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Advanced flash model with enhanced capabilities',
    category: 'multimodal',
    maxTokens: 8192,
    inputCost: 0.075,
    outputCost: 0.30,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    capabilities: ['text', 'images', 'audio', 'video', 'function-calling', 'code-generation'],
    contextWindow: 1000000,
    isAvailable: true,
  },
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI\'s most advanced multimodal model',
    category: 'multimodal',
    maxTokens: 4096,
    inputCost: 5.00,
    outputCost: 15.00,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: false,
    capabilities: ['text', 'images', 'audio', 'function-calling', 'advanced-reasoning'],
    contextWindow: 128000,
    isAvailable: true, // Now implemented!
  },
  {
    id: 'gpt-5-2025-08-07',
    name: 'gpt-5-2025-08-07',
    displayName: 'GPT-5 2025-08-07',
    provider: 'openai',
    description: 'OpenAI\'s latest model',
    category: 'image-generation',
    maxTokens: 4096,
    inputCost: 5.00,
    outputCost: 15.00,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'function-calling', 'advanced-reasoning'],
    contextWindow: 128000,
    isAvailable: true, // Now implemented!
  },
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'gpt-5-mini-2025-08-07',
    displayName: 'GPT-5 Mini 2025-08-07',
    provider: 'openai',
    description: 'OpenAI\'s latest model',
    category: 'image-generation',
    maxTokens: 4096,
    inputCost: 5.00,
    outputCost: 15.00,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'function-calling', 'advanced-reasoning'],
    contextWindow: 128000,
    isAvailable: true, // Now implemented!
  },
  {
    id: 'gpt-5-nano-2025-08-07',
    name: 'gpt-5-nano-2025-08-07',
    displayName: 'GPT-5 Nano 2025-08-07',
    provider: 'openai',
    description: 'OpenAI\'s latest model',
    category: 'image-generation',
    maxTokens: 4096,
    inputCost: 5.00,
    outputCost: 15.00,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'function-calling', 'advanced-reasoning'],
    contextWindow: 128000,
    isAvailable: true, // Now implemented!
  },
  {
    id: 'gpt-4-turbo',
    name: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'High-performance text and vision model',
    category: 'reasoning',
    maxTokens: 4096,
    inputCost: 10.00,
    outputCost: 30.00,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'function-calling', 'advanced-reasoning'],
    contextWindow: 128000,
    isAvailable: true, // Now implemented!
  },
  // Anthropic Models
  {
    id: 'claude-3-5-sonnet',
    name: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Anthropic\'s most capable model for complex tasks',
    category: 'reasoning',
    maxTokens: 8192,
    inputCost: 3.00,
    outputCost: 15.00,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'advanced-reasoning', 'code-generation'],
    contextWindow: 200000,
    isAvailable: true, // Now implemented!
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'claude-sonnet-4-5-20250929',
    displayName: 'Claude Sonnet 4.5 2025-09-29',
    provider: 'anthropic',
    description: 'Anthropic\'s latest model',
    category: 'image-generation',
    maxTokens: 4096,
    inputCost: 5.00,
    outputCost: 15.00,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'function-calling', 'advanced-reasoning'],
    contextWindow: 128000,
    isAvailable: true, // Now implemented!
  },
  {

    id : 'claude-haiku-4-5',
    name : 'claude-haiku-4-5',
    displayName : 'Claude Haiku 4.5',
    provider : 'anthropic',
    description : 'Anthropic\'s latest model',
    category : 'image-generation',
    maxTokens : 4096,
    inputCost : 5.00,
    outputCost : 15.00,
    supportsImages : true,
    supportsAudio : false,
    supportsVideo : false,
    capabilities : ['text', 'images', 'function-calling', 'advanced-reasoning'],
    contextWindow : 128000,
    isAvailable : true, // Now implemented!
  },
  {
    id : 'claude-sonnet-4-20250514',
    name : 'claude-sonnet-4-20250514',
    displayName : 'Claude Sonnet 4 2025-05-14',
    provider : 'anthropic',
    description : 'Anthropic\'s latest model',
    category : 'image-generation',
    maxTokens : 4096,
    inputCost : 5.00,
    outputCost : 15.00,
    supportsImages : true,
    supportsAudio : false,
    supportsVideo : false,
    capabilities : ['text', 'images', 'function-calling', 'advanced-reasoning'],
    contextWindow : 128000,
    isAvailable : true, // Now implemented!
  },
  // OpenRouter Models
  {
    id: 'openrouter/anthropic/claude-3.5-sonnet',
    name: 'anthropic/claude-3.5-sonnet',
    displayName: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    description: 'Claude 3.5 Sonnet via OpenRouter',
    category: 'reasoning',
    maxTokens: 8192,
    inputCost: 3.00,
    outputCost: 15.00,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'advanced-reasoning', 'code-generation'],
    contextWindow: 200000,
    isAvailable: true,
  },
  {
    id: 'openrouter/openai/gpt-4o',
    name: 'openai/gpt-4o',
    displayName: 'GPT-4o (OpenRouter)',
    provider: 'openrouter',
    description: 'GPT-4o via OpenRouter',
    category: 'multimodal',
    maxTokens: 4096,
    inputCost: 5.00,
    outputCost: 15.00,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: false,
    capabilities: ['text', 'images', 'audio', 'function-calling', 'advanced-reasoning'],
    contextWindow: 128000,
    isAvailable: true,
  },
  {
    id: 'openrouter/google/gemini-pro-1.5',
    name: 'google/gemini-pro-1.5',
    displayName: 'Gemini Pro 1.5 (OpenRouter)',
    provider: 'openrouter',
    description: 'Gemini Pro 1.5 via OpenRouter',
    category: 'multimodal',
    maxTokens: 8192,
    inputCost: 3.50,
    outputCost: 10.50,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    capabilities: ['text', 'images', 'audio', 'video', 'function-calling', 'advanced-reasoning'],
    contextWindow: 2000000,
    isAvailable: true,
  },
  {
    id: 'openrouter/meta-llama/llama-3.1-405b-instruct',
    name: 'meta-llama/llama-3.1-405b-instruct',
    displayName: 'Llama 3.1 405B Instruct (OpenRouter)',
    provider: 'openrouter',
    description: 'Meta Llama 3.1 405B via OpenRouter',
    category: 'reasoning',
    maxTokens: 4096,
    inputCost: 2.65,
    outputCost: 3.18,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'advanced-reasoning', 'code-generation'],
    contextWindow: 131072,
    isAvailable: true,
  },
  {
    id: 'openrouter/meta-llama/llama-3.1-70b-instruct',
    name: 'meta-llama/llama-3.1-70b-instruct',
    displayName: 'Llama 3.1 70B Instruct (OpenRouter)',
    provider: 'openrouter',
    description: 'Meta Llama 3.1 70B via OpenRouter',
    category: 'reasoning',
    maxTokens: 4096,
    inputCost: 0.90,
    outputCost: 0.90,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'advanced-reasoning', 'code-generation'],
    contextWindow: 131072,
    isAvailable: true,
  },
  {
    id: 'openrouter/mistralai/mistral-7b-instruct',
    name: 'mistralai/mistral-7b-instruct',
    displayName: 'Mistral 7B Instruct (OpenRouter)',
    provider: 'openrouter',
    description: 'Mistral 7B Instruct via OpenRouter',
    category: 'text',
    maxTokens: 4096,
    inputCost: 0.20,
    outputCost: 0.20,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 32768,
    isAvailable: true,
  },
  {
    id: 'openrouter/teknium/openhermes-2.5-mistral-7b',
    name: 'teknium/openhermes-2.5-mistral-7b',
    displayName: 'OpenHermes 2.5 Mistral 7B (OpenRouter)',
    provider: 'openrouter',
    description: 'OpenHermes 2.5 Mistral 7B via OpenRouter',
    category: 'text',
    maxTokens: 4096,
    inputCost: 0.20,
    outputCost: 0.20,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 32768,
    isAvailable: true,
  },
];

// Model configuration management
export class ModelConfigManager {
  private static instance: ModelConfigManager;
  private selectedModelId: string = 'gemini-2.5-flash'; // Default model
  private modelConfigs: Map<string, AIModel> = new Map();

  private constructor() {
    // Initialize with available models
    AVAILABLE_MODELS.forEach(model => {
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
