import OpenAI from "openai";
import { getSelectedModel } from './model-config';
import type { MediaAttachment } from './gemini';

// Initialize the OpenRouter client lazily to avoid errors with missing API key
let openrouter: OpenAI | null = null;

function getOpenRouterClient(): OpenAI {
  if (!openrouter) {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
    }
    openrouter = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Buddy Chat'
      }
    });
  }
  return openrouter;
}

export class OpenRouterChatService {
  private chatHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  constructor() {
    // Initialize with empty history
  }

  private async convertMediaToOpenRouterFormat(attachment: MediaAttachment): Promise<OpenAI.Chat.ChatCompletionContentPartImage | null> {
    try {
      let data = attachment.data;
      
      // Convert blob URLs to base64
      if (data.startsWith('blob:') || data.startsWith('http')) {
        const response = await fetch(data);
        const blob = await response.blob();
        data = await this.blobToBase64(blob);
      }

      // OpenRouter follows OpenAI format
      return {
        type: 'image_url',
        image_url: {
          url: data,
          detail: 'auto'
        }
      };
    } catch (error) {
      console.error('Error converting media for OpenRouter:', error);
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
    const modelName = selectedModel?.id || 'deepseek/deepseek-chat-v3.1:free';

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [];
    
    if (message?.trim()) {
      content.push({ type: 'text', text: message });
    }

    // Add image attachments if the model supports them
    if (attachments?.length && selectedModel?.supportsImages) {
      for (const attachment of attachments) {
        if (attachment.mediaType === 'image') {
          const imagePart = await this.convertMediaToOpenRouterFormat(attachment);
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
        const client = getOpenRouterClient();
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
        console.error('OpenRouter streaming error:', error);
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
    // OpenRouter doesn't need reinitialization
  }

  getCurrentModelName(): string {
    return getSelectedModel()?.id || 'deepseek/deepseek-chat-v3.1:free';
  }
}

// Singleton instance
export const openrouterService = new OpenRouterChatService();

// Convenience functions
export const sendToOpenRouter = (message: string) => openrouterService.sendMessage(message);
export const sendMediaToOpenRouter = (message: string, attachments?: MediaAttachment[]) => 
  openrouterService.sendMessageWithMedia(message, attachments);

// Utility functions
export function isOpenRouterConfigured(): boolean {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  return !!(key && key !== 'your_api_key_here' && key.length > 0);
}

export function getOpenRouterConfigStatus() {
  const isConfigured = isOpenRouterConfigured();
  
  return {
    isConfigured,
    message: isConfigured 
      ? 'OpenRouter API is configured and ready to use!'
      : 'OpenRouter API key not configured. Please add your API key to the .env file.',
    instructions: isConfigured ? null : [
      '1. Get your API key from https://openrouter.ai/keys',
      '2. Open the .env file in the frontend folder',
      '3. Add: VITE_OPENROUTER_API_KEY=your_actual_api_key',
      '4. Restart the development server'
    ]
  };
}

