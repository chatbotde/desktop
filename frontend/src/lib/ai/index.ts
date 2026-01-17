/**
 * Main entry point for the AI module
 * 
 * Multi-provider AI integration using Vercel AI SDK.
 * Supports: OpenAI, Anthropic, Google, Groq, xAI, DeepSeek, Mistral, 
 *           Fireworks, Cerebras, Perplexity, Together, OpenRouter, and more.
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

// Export Unified AI Service (AI SDK based - recommended)
// Uses Vercel AI SDK for consistent behavior across all providers
export {
  AISDKUnifiedService as UnifiedAIService,
  aiSDKUnifiedService as unifiedAIService,
  sendMessageAISDK as sendMessage,
  sendMessageCompleteAISDK as sendMessageComplete,
} from './ai-sdk/unified-service';

// Also export the legacy service for gradual migration if needed
export {
  UnifiedAIService as LegacyUnifiedAIService,
  unifiedAIService as legacyUnifiedAIService,
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

// Export DeepSeek service and utilities
export {
  DeepSeekChatService,
  deepseekService,
  sendToDeepSeek,
  sendMediaToDeepSeek,
  isDeepSeekConfigured,
  getDeepSeekConfigStatus,
} from './deepseek';

// Export Kimi (Moonshot AI) service and utilities
export {
  KimiChatService,
  kimiService,
  sendToKimi,
  sendMediaToKimi,
  isKimiConfigured,
  getKimiConfigStatus,
} from './kimi';

// Export xAI (Grok) service and utilities
export {
  XAIChatService,
  xaiService,
  sendToXAI,
  sendMediaToXAI,
  isXAIConfigured,
  getXAIConfigStatus,
} from './xai';

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
  GENERAL_ASSISTANT_PROMPT,
  CODE_ASSISTANT_PROMPT,
  CREATIVE_ASSISTANT_PROMPT,
  getSystemPromptById,
  getDefaultSystemPrompt,
  applySystemPrompt,
} from './system-prompts';

// Export usage tracking
export {
  usageTracker,
  logUsage,
  checkRateLimit,
  getRateLimitStatus,
  getDashboard,
  getProfile,
  type UsageLogRequest,
  type UsageLogResponse,
  type RateLimitStatus,
  type UserQuotas,
  type DashboardData,
} from './usage-tracker';

// Export capability validation utilities
export {
  validateMessage,
  validateAttachments,
  getCapabilitySummary,
  getModelCapabilities,
  getCapabilityBadges,
  getCapabilityIcons,
  formatValidationErrors,
  formatValidationMessage,
  willAttachmentBeSupported,
  type ModelCapabilities,
  type CapabilityValidationResult,
  type CapabilityError,
  type CapabilityWarning,
  type CapabilityErrorCode,
  type CapabilitySummary,
} from './capabilities';

// Export Local LLM module (separate, independent module)
// Use this for local LLM operations with Ollama
export * from './local-llm';

// Export AI SDK module (unified Vercel AI SDK interface)
// Use this for easy multi-provider AI integration
export * from './ai-sdk';
