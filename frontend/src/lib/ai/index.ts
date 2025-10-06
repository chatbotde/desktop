/**
 * Main entry point for the AI module
 * 
 * Simple, focused AI integration with Gemini.
 * 
 * Quick Start:
 * ```typescript
 * import { geminiService, sendMediaToGemini } from '@/lib/ai';
 * 
 * // Send a message with media
 * const stream = await sendMediaToGemini('Describe this image', attachments);
 * for await (const chunk of stream) {
 *   console.log(chunk);
 * }
 * ```
 */

// Export Gemini service and utilities (all from gemini.ts)
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
  // Utility functions
  isGeminiConfigured,
  getGeminiConfigStatus,
  initializeGeminiWithContext,
  testGeminiConnection,
} from './gemini';

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
