import OpenAI from "openai";
import { getSelectedModel } from './model-config';
import type { MediaAttachment } from './gemini';

// Initialize the OpenAI client lazily to avoid errors with missing API key
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }
    openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  return openai;
}

export class OpenAIChatService {
  private chatHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  constructor() {
    // Initialize with empty history
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

      // OpenAI expects data URLs in format: data:image/jpeg;base64,xxx
      return {
        type: 'image_url',
        image_url: {
          url: data,
          detail: 'auto'
        }
      };
    } catch (error) {
      console.error('Error converting media for OpenAI:', error);
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
    const modelName = selectedModel?.name || 'gpt-4o';

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
        const client = getOpenAIClient();
        const stream = await client.chat.completions.create({
          model: modelName,
          messages: self.chatHistory,
          stream: true,
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
        console.error('OpenAI streaming error:', error);
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
    this.chatHistory.unshift({
      role: 'system',
      content: context
    });
  }

  reinitializeWithCurrentModel() {
    // OpenAI doesn't need reinitialization like Gemini
  }

  getCurrentModelName(): string {
    return getSelectedModel()?.name || 'gpt-4o';
  }
}

// Singleton instance
export const openaiService = new OpenAIChatService();

// Convenience functions
export const sendToOpenAI = (message: string) => openaiService.sendMessage(message);
export const sendMediaToOpenAI = (message: string, attachments?: MediaAttachment[]) =>
  openaiService.sendMessageWithMedia(message, attachments);

// Utility functions
export function isOpenAIConfigured(): boolean {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  return !!(key && key !== 'your_api_key_here' && key.length > 0);
}

export function getOpenAIConfigStatus() {
  const isConfigured = isOpenAIConfigured();

  return {
    isConfigured,
    message: isConfigured
      ? 'OpenAI API is configured and ready to use!'
      : 'OpenAI API key not configured. Please add your API key to the .env file.',
    instructions: isConfigured ? null : [
      '1. Get your API key from https://platform.openai.com/api-keys',
      '2. Open the .env file in the frontend folder',
      '3. Add: VITE_OPENAI_API_KEY=your_actual_api_key',
      '4. Restart the development server'
    ]
  };
}
