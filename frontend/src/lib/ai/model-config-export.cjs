/**
 * CommonJS export for model configuration
 * This file provides a Node.js compatible export of the model configuration
 * for use in the Electron main process.
 */

// Define available models (synced with model-config.ts)
const AVAILABLE_MODELS = [
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
    isAvailable: true,
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
    isAvailable: true,
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
    isAvailable: true,
  },
];

/**
 * Get all available models
 */
function getAllModels() {
  return AVAILABLE_MODELS.filter(model => model.isAvailable);
}

/**
 * Get models by provider
 */
function getModelsByProvider(provider) {
  return AVAILABLE_MODELS.filter(model => 
    model.isAvailable && model.provider === provider
  );
}

/**
 * Get model by ID
 */
function getModelById(modelId) {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
}

// CommonJS exports
module.exports = {
  AVAILABLE_MODELS,
  getAllModels,
  getModelsByProvider,
  getModelById,
};
