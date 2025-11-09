/**
 * Main entry point for the AI module
 * 
 * Multi-provider AI integration with automatic routing.
 * Supports: Google Gemini, OpenAI, Anthropic Claude, OpenRouter, and Cerebras.
 * 
 * Quick Start:
 * ```typescript
 * import { unifiedAIService, sendMessage } from '@/lib/ai';
 * 
 * // Send a message with media (automatically routes to selected provider)
 * const stream = await sendMessage('Describe this image', attachments);
 * for await (const chunk of stream) {
 *   console.log(chunk);
 * }
 * ```
 */

// Export Unified AI Service (recommended - automatically routes to correct provider)
export {
  UnifiedAIService,
  unifiedAIService,
  sendMessage,
  sendMessageComplete,
} from './unified-ai-service';

export {
  resolveEnvValue,
  hasValidEnvValue,
  type EnvResolution,
  type ResolveOptions,
} from './env-utils';

// Export Gemini service and utilities
export {
  GeminiChatService,
  geminiService,
  geminiChat,
  sendToGemini,
  sendMediaToGemini,
  sendToGeminiComplete,
  type MediaAttachment,
  type ChatMessage,
  type GeminiChatHistory,
  isGeminiConfigured,
  getGeminiConfigStatus,
  initializeGeminiWithContext,
  testGeminiConnection,
} from './gemini';

// Export OpenAI service and utilities
export {
  OpenAIChatService,
  openaiService,
  sendToOpenAI,
  sendMediaToOpenAI,
  isOpenAIConfigured,
  getOpenAIConfigStatus,
} from './openai';

// Export Anthropic service and utilities
export {
  AnthropicChatService,
  anthropicService,
  sendToAnthropic,
  sendMediaToAnthropic,
  isAnthropicConfigured,
  getAnthropicConfigStatus,
} from './anthropic';

// Export OpenRouter service and utilities
export {
  OpenRouterChatService,
  openRouterService,
  sendToOpenRouter,
  sendMediaToOpenRouter,
  isOpenRouterConfigured,
  getOpenRouterConfigStatus,
} from './openrouter';

// Export Cerebras service and utilities
export {
  CerebrasChatService,
  cerebrasService,
  sendToCerebras,
  sendMediaToCerebras,
  isCerebrasConfigured,
  getCerebrasConfigStatus,
} from './cerebras';

// Export model configuration
export {
  type AIModel,
  type ModelProvider,
  AVAILABLE_MODELS,
  ModelConfigManager,
  modelConfigManager,
  getSelectedModel,
  setSelectedModel,
  getAvailableModels,
  getModelsByProvider,
} from './model-config';

// Export system prompts
export {
  type SystemPrompt,
  SYSTEM_PROMPTS,
  LEARNING_ASSISTANT_PROMPT,
  GENERAL_ASSISTANT_PROMPT,
  CODE_ASSISTANT_PROMPT,
  CREATIVE_ASSISTANT_PROMPT,
  getSystemPromptById,
  getDefaultSystemPrompt,
  applySystemPrompt,
} from './system-prompts';
