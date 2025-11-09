import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { getSelectedModel } from './model-config';
import type { MediaAttachment } from './gemini';
import { resolveEnvValue, hasValidEnvValue } from './env-utils';

const CEREBRAS_PRIMARY_KEY = 'VITE_CEREBRAS_API_KEY';
const CEREBRAS_FALLBACK_KEYS = ['CEREBRAS_API_KEY'];

// Initialize the Cerebras client
const resolvedKey = resolveEnvValue(CEREBRAS_PRIMARY_KEY, {
  fallbacks: CEREBRAS_FALLBACK_KEYS,
  provider: 'Cerebras',
});

if (!hasValidEnvValue(resolvedKey)) {
  console.warn(
    '[AI Config] Cerebras API key missing or appears to be a placeholder. Update your .env with a valid value.'
  );
}

const cerebras = new Cerebras({
  apiKey: resolvedKey.value,
});

export class CerebrasChatService {
  private chatHistory: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [];

  constructor() {
    if (!hasValidEnvValue(resolvedKey)) {
      console.warn(
        '[AI Config] Cerebras service is initialized without a valid API key. Attempts to use it will fail until configured.'
      );
    }
  }


  async sendMessageWithMedia(message: string, attachments?: MediaAttachment[]): Promise<AsyncGenerator<string, void, unknown>> {
    const selectedModel = getSelectedModel();
    const modelName = selectedModel?.name || 'zai-glm-4.6';

    // Note: Cerebras may have limited image support depending on the model
    // For now, we'll focus on text messages
    if (attachments?.length && selectedModel?.supportsImages) {
      console.warn('[Cerebras] Image attachments may not be fully supported. Text-only mode recommended.');
    }

    // Add user message to history
    this.chatHistory.push({
      role: 'user',
      content: message
    });

    const self = this;
    async function* streamGenerator() {
      try {
        const stream = await cerebras.chat.completions.create({
          messages: self.chatHistory,
          model: modelName,
          stream: true,
          max_completion_tokens: selectedModel?.maxTokens || 40960,
          temperature: selectedModel?.temperature ?? 0.6,
          top_p: 0.95
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          const text = (chunk as any)?.choices?.[0]?.delta?.content || '';
          fullResponse += text;
          yield text;
        }

        // Add complete response to history after streaming
        self.chatHistory.push({
          role: 'assistant',
          content: fullResponse
        });
      } catch (error) {
        console.error('Cerebras streaming error:', error);
        throw error;
      }
    }

    return streamGenerator();
  }

  async sendMessage(message: string): Promise<AsyncGenerator<string, void, unknown>> {
    return this.sendMessageWithMedia(message);
  }

  async sendMessageComplete(message: string): Promise<string> {
    const stream = await this.sendMessage(message);
    let response = '';
    for await (const chunk of stream) response += chunk;
    return response;
  }

  async sendMessageWithMediaComplete(message: string, attachments?: MediaAttachment[]): Promise<string> {
    const stream = await this.sendMessageWithMedia(message, attachments);
    let response = '';
    for await (const chunk of stream) response += chunk;
    return response;
  }

  clearHistory() {
    this.chatHistory = [];
  }

  getHistory() {
    return this.chatHistory;
  }

  addSystemContext(context: string) {
    // Remove existing system messages
    this.chatHistory = this.chatHistory.filter(msg => msg.role !== 'system');
    // Add new system context at the beginning
    this.chatHistory.unshift({
      role: 'system',
      content: context
    });
  }

  reinitializeWithCurrentModel() {
    // Cerebras doesn't need reinitialization
  }

  getCurrentModelName(): string {
    return getSelectedModel()?.name || 'zai-glm-4.6';
  }
}

// Singleton instance
export const cerebrasService = new CerebrasChatService();

// Convenience functions
export const sendToCerebras = (message: string) => cerebrasService.sendMessage(message);
export const sendMediaToCerebras = (message: string, attachments?: MediaAttachment[]) => 
  cerebrasService.sendMessageWithMedia(message, attachments);

// Utility functions
export function isCerebrasConfigured(): boolean {
  return hasValidEnvValue(
    resolveEnvValue(CEREBRAS_PRIMARY_KEY, {
      fallbacks: CEREBRAS_FALLBACK_KEYS,
      provider: 'Cerebras',
      warnOnFallback: false,
    })
  );
}

export function getCerebrasConfigStatus() {
  const isConfigured = isCerebrasConfigured();
  
  return {
    isConfigured,
    message: isConfigured 
      ? 'Cerebras API is configured and ready to use!'
      : 'Cerebras API key not configured. Please add your API key to the .env file.',
    instructions: isConfigured ? null : [
      '1. Get your API key from https://www.cerebras.ai/',
      '2. Open the .env file in the frontend folder',
      '3. Add: VITE_CEREBRAS_API_KEY=your_actual_api_key',
      '4. Restart the development server'
    ]
  };
}