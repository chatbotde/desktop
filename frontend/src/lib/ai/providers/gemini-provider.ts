/**
 * Google Gemini AI Provider Implementation
 */

import { GoogleGenAI } from "@google/genai";
import {
  BaseAIProvider,
  type AIModel,
  type MediaAttachment,
  type AIRequestOptions,
  type ProviderCapabilities,
} from '../types';

export class GeminiProvider extends BaseAIProvider {
  readonly name = 'gemini';
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    images: true,
    audio: true,
    video: true,
    functionCalling: true,
    systemPrompts: true,
    chatHistory: true,
    maxTokens: 8192,
    contextWindow: 1000000,
  };

  private client: any = null;
  private chat: any = null;
  private apiKey: string = '';
  private geminiChatHistory: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

  constructor() {
    super();
    this.currentModel = 'gemini-2.5-flash';
    this.initialize();
  }

  isConfigured(): boolean {
    const key = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
    return !!(key && key !== 'your_api_key_here' && key.length > 0);
  }

  async initialize(): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Gemini API key not configured');
      return;
    }

    try {
      this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
      
      this.client = new GoogleGenAI({
        apiKey: this.apiKey,
      });

      this.initializeChat();
      console.log('✅ Gemini provider initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini provider:', error);
      throw error;
    }
  }

  private initializeChat(): void {
    if (!this.client) {
      throw new Error('Gemini client not initialized');
    }

    try {
      this.chat = this.client.chats.create({
        model: this.currentModel,
        history: this.geminiChatHistory,
      });
    } catch (error) {
      console.error('Failed to initialize Gemini chat:', error);
      throw error;
    }
  }

  async sendMessage(
    message: string,
    _options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>> {
    return this.sendMessageWithMedia(message, []);
  }

  async sendMessageWithMedia(
    message: string,
    attachments: MediaAttachment[] = [],
    _options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>> {
    if (!this.chat) {
      throw new Error('Chat not initialized');
    }

    try {
      // Prepare message parts
      const parts: any[] = [];

      // Add text content if present
      if (message && message.trim()) {
        parts.push({ text: message });
      }

      // Add media attachments if present
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const mediaPart = await this.convertMediaToGeminiFormat(attachment);
          if (mediaPart) {
            parts.push(mediaPart);
          }
        }
      }

      if (parts.length === 0) {
        throw new Error('No content to send');
      }

      // Add user message to history
      this.geminiChatHistory.push({
        role: 'user',
        parts: parts,
      });

      // Also add to base history
      this.addToHistory('user', message, attachments);

      const stream = await this.chat.sendMessageStream({
        message: parts,
      });

      let fullResponse = '';

      const self = this;
      async function* streamGenerator() {
        for await (const chunk of stream) {
          const text = chunk.text || '';
          fullResponse += text;
          yield text;
        }

        // Add the complete assistant response to history
        self.geminiChatHistory.push({
          role: 'model',
          parts: [{ text: fullResponse }],
        });
        self.addToHistory('assistant', fullResponse);
      }

      return streamGenerator();
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw new Error('Failed to send message to Gemini');
    }
  }

  private async convertMediaToGeminiFormat(attachment: MediaAttachment) {
    try {
      if (attachment.mediaType === 'image') {
        return {
          inlineData: {
            data: attachment.data.split(',')[1], // Remove data:image/...;base64, prefix
            mimeType: attachment.type,
          },
        };
      } else if (attachment.mediaType === 'video' || attachment.mediaType === 'audio') {
        // For video/audio, we need to convert to base64 if it's an object URL
        if (attachment.data.startsWith('blob:') || attachment.data.startsWith('http')) {
          const response = await fetch(attachment.data);
          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          return {
            inlineData: {
              data: base64.split(',')[1],
              mimeType: attachment.type,
            },
          };
        } else {
          return {
            inlineData: {
              data: attachment.data.split(',')[1],
              mimeType: attachment.type,
            },
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error converting media to Gemini format:', error);
      return null;
    }
  }

  clearHistory(): void {
    super.clearHistory();
    this.geminiChatHistory = [];
    this.initializeChat();
  }

  setSystemContext(context: string): void {
    super.setSystemContext(context);
    // Add system context as a model message to establish the context
    this.geminiChatHistory.unshift({
      role: 'model',
      parts: [{ text: `System Context: ${context}` }],
    });
    this.initializeChat();
  }

  setModel(modelId: string): void {
    super.setModel(modelId);
    this.initializeChat();
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash (Experimental)',
        provider: 'google',
        description: 'Latest experimental Gemini model with improved performance',
        category: 'multimodal',
        maxTokens: 8192,
        inputCost: 0.075,
        outputCost: 0.30,
        supportsImages: true,
        supportsAudio: true,
        supportsVideo: true,
        capabilities: ['text', 'images', 'audio', 'video', 'function-calling', 'code-generation'],
        contextWindow: 1000000,
        isAvailable: true,
      },
      {
        id: 'gemini-1.5-flash',
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        provider: 'google',
        description: 'Fast and efficient multimodal model',
        category: 'multimodal',
        maxTokens: 8192,
        inputCost: 0.075,
        outputCost: 0.30,
        supportsImages: true,
        supportsAudio: true,
        supportsVideo: true,
        capabilities: ['text', 'images', 'audio', 'video', 'function-calling'],
        contextWindow: 1000000,
        isAvailable: true,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        provider: 'google',
        description: 'Most capable multimodal model for complex reasoning',
        category: 'reasoning',
        maxTokens: 8192,
        inputCost: 3.50,
        outputCost: 10.50,
        supportsImages: true,
        supportsAudio: true,
        supportsVideo: true,
        capabilities: ['text', 'images', 'audio', 'video', 'function-calling', 'advanced-reasoning'],
        contextWindow: 2000000,
        isAvailable: true,
      },
      {
        id: 'gemini-2.5-flash',
        name: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        provider: 'google',
        description: 'Advanced flash model with enhanced capabilities',
        category: 'multimodal',
        maxTokens: 8192,
        inputCost: 0.075,
        outputCost: 0.30,
        supportsImages: true,
        supportsAudio: true,
        supportsVideo: true,
        capabilities: ['text', 'images', 'audio', 'video', 'function-calling', 'code-generation'],
        contextWindow: 1000000,
        isAvailable: true,
      },
    ];
  }
}

// Export singleton instance
export const geminiProvider = new GeminiProvider();
