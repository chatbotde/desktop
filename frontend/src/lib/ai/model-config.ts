export interface ModelProvider {
  id: string;
  name: string;
  description: string;
  category: 'text' | 'multimodal' | 'coding' | 'reasoning';
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
  category: 'text' | 'multimodal' | 'coding' | 'reasoning';
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
    id: 'gemini-2.5-flash-image-preview',
    name: 'gemini-2.5-flash-image-preview',
    displayName: 'Gemini 2.5 Flash Image Preview',
    provider: 'google',
    description: 'Advanced flash model with enhanced capabilities',
    category: 'reasoning',
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
    id: 'deepseek/deepseek-chat-v3.1:free',
    name: 'deepseek/deepseek-chat',
    displayName: 'DeepSeek Chat',
    provider: 'openrouter',
    description: 'DeepSeek\'s most capable model for chat',
    category: 'reasoning',
    maxTokens: 8192,
    inputCost: 0.27,
    outputCost: 1.10,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'images', 'advanced-reasoning', 'code-generation'],
    contextWindow: 64000,
    isAvailable: true, // Now implemented!
  },
  {
    id: 'deepseek/deepseek-reasoner',
    name: 'deepseek/deepseek-reasoner',
    displayName: 'DeepSeek Reasoner',
    provider: 'openrouter',
    description: 'DeepSeek\'s advanced reasoning model',
    category: 'reasoning',
    maxTokens: 8192,
    inputCost: 0.55,
    outputCost: 2.19,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'advanced-reasoning', 'code-generation'],
    contextWindow: 64000,
    isAvailable: true, // Now implemented!
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
