/**
 * Local LLM Module
 * 
 * This module provides a complete, independent interface for local LLM operations
 * using Ollama. It is designed to be separate from cloud-based AI services and
 * can be scaled independently.
 * 
 * Usage:
 * ```typescript
 * import { unifiedLocalLLMService, sendLocalLLMMessage } from '@/lib/ai/local-llm';
 * 
 * // Initialize
 * await unifiedLocalLLMService.initialize();
 * 
 * // Set a model
 * unifiedLocalLLMService.setModel('ollama/llama3.2');
 * 
 * // Send a message
 * const stream = await sendLocalLLMMessage('Hello!');
 * for await (const chunk of stream) {
 *   console.log(chunk);
 * }
 * ```
 */

// Export unified service
export {
  UnifiedLocalLLMService,
  unifiedLocalLLMService,
  sendLocalLLMMessage,
  sendLocalLLMMessageComplete,
} from './unified-local-service';

// Export Ollama service
export {
  OllamaChatService,
  ollamaService,
  sendToOllama,
  sendMediaToOllama,
  isOllamaConfigured,
  getOllamaConfigStatus,
  testOllamaConnection,
  type OllamaMessage,
} from './ollama';

import { localLLMModelConfig, type LocalLLMModel } from './model-config';

// Add convenience export for toggling capabilities
export const toggleLocalLLMCapability = (
  modelName: string,
  capability: keyof Pick<LocalLLMModel, 'supportsImages' | 'supportsAudio' | 'supportsVideo'>
) => localLLMModelConfig.toggleCapability(modelName, capability);

// Re-export model configuration
export {
  LocalLLMModelConfigManager,
  localLLMModelConfig,
  LOCAL_LLM_MODELS,
  getLocalLLMModels,
  getRecommendedLocalLLMModels,
  getLocalLLMModelById,
  setLocalLLMModel,
  clearLocalLLMModel,
  type LocalLLMModel,
} from './model-config';

