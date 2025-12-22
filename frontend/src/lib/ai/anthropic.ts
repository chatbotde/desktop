import Anthropic from "@anthropic-ai/sdk";
import { getSelectedModel } from './model-config';
import type { MediaAttachment } from './gemini';
import { resolveEnvValue, hasValidEnvValue } from './env-utils';

const ANTHROPIC_PRIMARY_KEY = 'VITE_ANTHROPIC_API_KEY';
const ANTHROPIC_FALLBACK_KEYS = ['VITE_ANTROPIC_API_KEY', 'ANTHROPIC_API_KEY'];

// Initialize the Anthropic client
const resolvedKey = resolveEnvValue(ANTHROPIC_PRIMARY_KEY, {
  fallbacks: ANTHROPIC_FALLBACK_KEYS,
  provider: 'Anthropic',
});

if (!hasValidEnvValue(resolvedKey)) {
  console.warn(
    '[AI Config] Anthropic API key missing or appears to be a placeholder. Update your .env with a valid value.'
  );
}

const anthropic = new Anthropic({ apiKey: resolvedKey.value, dangerouslyAllowBrowser: true });

export class AnthropicChatService {
  private chatHistory: Anthropic.MessageParam[] = [];
  private systemContext: string = '';

  constructor() {
    if (!hasValidEnvValue(resolvedKey)) {
      console.warn(
        '[AI Config] Anthropic service is initialized without a valid API key. Attempts to use it will fail until configured.'
      );
    }
  }

  private async convertMediaToAnthropicFormat(attachment: MediaAttachment): Promise<Anthropic.ImageBlockParam | null> {
    try {
      let data = attachment.data;

      // Convert blob URLs to base64
      if (data.startsWith('blob:') || data.startsWith('http')) {
        const response = await fetch(data);
        const blob = await response.blob();
        data = await this.blobToBase64(blob);
      }

      // Remove data URL prefix to get just the base64 data
      const base64Data = data.includes(',') ? data.split(',')[1] : data;

      // Anthropic expects specific media types
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
      if (attachment.type.includes('png')) mediaType = 'image/png';
      else if (attachment.type.includes('gif')) mediaType = 'image/gif';
      else if (attachment.type.includes('webp')) mediaType = 'image/webp';

      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data
        }
      };
    } catch (error) {
      console.error('Error converting media for Anthropic:', error);
      return null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async sendMessageWithMedia(message: string, attachments?: MediaAttachment[]): Promise<AsyncGenerator<string, void, unknown>> {
    const selectedModel = getSelectedModel();
    const modelName = selectedModel?.name || 'claude-3-5-sonnet-20241022';

    const content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [];

    // Add image attachments first if the model supports them
    if (attachments?.length && selectedModel?.supportsImages) {
      for (const attachment of attachments) {
        if (attachment.mediaType === 'image') {
          const imagePart = await this.convertMediaToAnthropicFormat(attachment);
          if (imagePart) content.push(imagePart);
        }
      }
    }

    // Add text message
    if (message?.trim()) {
      content.push({ type: 'text', text: message });
    }

    if (content.length === 0) throw new Error('No content to send');

    // Add user message to history
    this.chatHistory.push({
      role: 'user',
      content: content
    });

    const self = this;
    async function* streamGenerator() {
      try {
        const stream = await anthropic.messages.create({
          model: modelName,
          max_tokens: selectedModel?.maxTokens || 8192,
          messages: self.chatHistory,
          system: self.systemContext || undefined,
          stream: true,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            fullResponse += text;
            yield text;
          }
        }

        // Add complete response to history after streaming
        self.chatHistory.push({
          role: 'assistant',
          content: fullResponse
        });
      } catch (error) {
        console.error('Anthropic streaming error:', error);
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
    this.systemContext = context;
  }

  reinitializeWithCurrentModel() {
    // Anthropic doesn't need reinitialization
  }

  getCurrentModelName(): string {
    return getSelectedModel()?.name || 'claude-3-5-sonnet-20241022';
  }
}

// Singleton instance
export const anthropicService = new AnthropicChatService();

// Convenience functions
export const sendToAnthropic = (message: string) => anthropicService.sendMessage(message);
export const sendMediaToAnthropic = (message: string, attachments?: MediaAttachment[]) =>
  anthropicService.sendMessageWithMedia(message, attachments);

// Utility functions
export function isAnthropicConfigured(): boolean {
  return hasValidEnvValue(
    resolveEnvValue(ANTHROPIC_PRIMARY_KEY, {
      fallbacks: ANTHROPIC_FALLBACK_KEYS,
      provider: 'Anthropic',
      warnOnFallback: false,
    })
  );
}

export function getAnthropicConfigStatus() {
  const isConfigured = isAnthropicConfigured();

  return {
    isConfigured,
    message: isConfigured
      ? 'Anthropic API is configured and ready to use!'
      : 'Anthropic API key not configured. Please add your API key to the .env file.',
    instructions: isConfigured ? null : [
      '1. Get your API key from https://console.anthropic.com/settings/keys',
      '2. Open the .env file in the frontend folder',
      '3. Add: VITE_ANTHROPIC_API_KEY=your_actual_api_key',
      '4. Restart the development server'
    ]
  };
}
