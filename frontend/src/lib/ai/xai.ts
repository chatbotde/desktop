import OpenAI from "openai";
import { getSelectedModel } from './model-config';
import type { MediaAttachment } from './gemini';
import { resolveEnvValue, hasValidEnvValue } from './env-utils';

const XAI_PRIMARY_KEY = 'VITE_XAI_API_KEY';
const XAI_FALLBACK_KEYS = ['XAI_API_KEY'];

// Initialize the xAI (Grok) client
const resolvedKey = resolveEnvValue(XAI_PRIMARY_KEY, {
  fallbacks: XAI_FALLBACK_KEYS,
  provider: 'xAI',
});

if (!hasValidEnvValue(resolvedKey)) {
  console.warn(
    '[AI Config] xAI (Grok) API key missing or appears to be a placeholder. Update your .env with a valid value.'
  );
}

let xai: OpenAI | null = null;

function getXAIClient(): OpenAI {
  if (!xai) {
    xai = new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: resolvedKey.value,
      dangerouslyAllowBrowser: true,
      timeout: 360000, // Longer timeout for reasoning models
    });
  }
  return xai;
}

export class XAIChatService {
  private chatHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  constructor() {
    if (!hasValidEnvValue(resolvedKey)) {
      console.warn(
        '[AI Config] xAI service is initialized without a valid API key. Attempts to use it will fail until configured.'
      );
    }
  }

  private async convertMediaToOpenAIFormat(attachment: MediaAttachment): Promise<OpenAI.Chat.ChatCompletionContentPartImage | null> {
    try {
      let data = attachment.data;
      
      // Convert blob URLs to base64
      if (data.startsWith('blob:') || data.startsWith('http')) {
        const response = await fetch(data);
        const blob = await response.blob();
        data = await this.blobToBase64(blob);
      }

      // OpenAI format expects data URLs
      return {
        type: 'image_url',
        image_url: {
          url: data,
          detail: 'auto'
        }
      };
    } catch (error) {
      console.error('Error converting media for xAI:', error);
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
    const modelName = selectedModel?.name || 'grok-4';

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [];
    
    if (message?.trim()) {
      content.push({ type: 'text', text: message });
    }

    // Add image attachments if the model supports them
    if (attachments?.length && selectedModel?.supportsImages) {
      for (const attachment of attachments) {
        if (attachment.mediaType === 'image') {
          const imagePart = await this.convertMediaToOpenAIFormat(attachment);
          if (imagePart) content.push(imagePart);
        }
      }
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
        const client = getXAIClient();
        const stream = await client.chat.completions.create({
          model: modelName,
          messages: self.chatHistory,
          stream: true,
          temperature: selectedModel?.temperature ?? 0.7,
          max_tokens: selectedModel?.maxTokens || 4096,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          fullResponse += text;
          yield text;
        }

        // Add complete response to history after streaming
        self.chatHistory.push({
          role: 'assistant',
          content: fullResponse
        });
      } catch (error) {
        console.error('xAI streaming error:', error);
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
    // xAI doesn't need reinitialization
  }

  getCurrentModelName(): string {
    return getSelectedModel()?.name || 'grok-4';
  }
}

// Singleton instance
export const xaiService = new XAIChatService();

// Convenience functions
export const sendToXAI = (message: string) => xaiService.sendMessage(message);
export const sendMediaToXAI = (message: string, attachments?: MediaAttachment[]) => 
  xaiService.sendMessageWithMedia(message, attachments);

// Utility functions
export function isXAIConfigured(): boolean {
  return hasValidEnvValue(
    resolveEnvValue(XAI_PRIMARY_KEY, {
      fallbacks: XAI_FALLBACK_KEYS,
      provider: 'xAI',
      warnOnFallback: false,
    })
  );
}

export function getXAIConfigStatus() {
  const isConfigured = isXAIConfigured();
  
  return {
    isConfigured,
    message: isConfigured 
      ? 'xAI (Grok) API is configured and ready to use!'
      : 'xAI (Grok) API key not configured. Please add your API key to the .env file.',
    instructions: isConfigured ? null : [
      '1. Get your API key from https://console.x.ai/',
      '2. Open the .env file in the frontend folder',
      '3. Add: VITE_XAI_API_KEY=your_actual_api_key',
      '4. Restart the development server'
    ]
  };
}