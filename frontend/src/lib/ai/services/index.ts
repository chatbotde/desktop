/**
 * Central export point for services
 */

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
} from './unified-service';
