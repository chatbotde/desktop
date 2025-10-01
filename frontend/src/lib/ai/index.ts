/**
 * Main entry point for the AI module
 * 
 * This module provides a scalable and extensible architecture for working with multiple AI providers.
 * 
 * Features:
 * - Multiple AI providers (Gemini, OpenAI, Anthropic)
 * - Easy provider switching
 * - Unified API across all providers
 * - Type-safe interfaces
 * - Provider registry for easy extension
 * 
 * Quick Start:
 * ```typescript
 * import { sendMessage, switchProvider } from '@/lib/ai';
 * 
 * // Send a message with current provider
 * const stream = await sendMessage('Hello!');
 * for await (const chunk of stream) {
 *   console.log(chunk);
 * }
 * 
 * // Switch provider
 * switchProvider('openai');
 * ```
 * 
 * Adding a new provider:
 * 1. Create a new provider class extending BaseAIProvider
 * 2. Implement all required methods
 * 3. Register it in provider-registry.ts
 * 4. Add the provider name to ProviderName type
 */

// Export types
export type {
  IAIProvider,
  MediaAttachment,
  ChatMessage,
  ProviderCapabilities,
  AIModel,
  AIRequestOptions,
  AIResponse,
} from './types';

export { BaseAIProvider } from './types';

// Export providers
export {
  GeminiProvider,
  geminiProvider,
  OpenAIProvider,
  openaiProvider,
  AnthropicProvider,
  anthropicProvider,
} from './providers';

// Export registry
export {
  ProviderRegistry,
  providerRegistry,
  getProvider,
  setCurrentProvider,
  getProviderStatus,
  type ProviderName,
} from './registry';

// Export services
export {
  UnifiedAIService,
  unifiedAIService,
  sendMessage,
  sendMessageWithMedia,
  sendMessageComplete,
  sendMessageWithMediaComplete,
  switchProvider,
  getCurrentProvider,
  getAllAvailableModels,
  handleModelChange,
  type UnifiedAIResponse,
} from './services';

// Export legacy compatibility
export { getSelectedModel, setSelectedModel, getAvailableModels } from './model-config';
