/**
 * OpenRouter AI Provider Implementation
 * Provides access to multiple AI models through OpenRouter
 */

import OpenAI from "openai";
import {
  BaseAIProvider,
  type AIModel,
  type MediaAttachment,
  type AIRequestOptions,
  type ProviderCapabilities,
} from '../types';

export class OpenRouterProvider extends BaseAIProvider {
  readonly name = 'openrouter';
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    images: true,
    audio: false,
    video: false,
    functionCalling: true,
    systemPrompts: true,
    chatHistory: true,
    maxTokens: 8192,
    contextWindow: 200000,
  };

  private client: OpenAI | null = null;
  private apiKey: string = '';
  private openrouterChatHistory: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

  constructor() {
    super();
    this.currentModel = 'deepseek/deepseek-chat';
    this.initialize();
  }

  isConfigured(): boolean {
    const key = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    return !!(key && key !== 'your_api_key_here' && key.length > 0);
  }

  async initialize(): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('⚠️ OpenRouter API key not configured');
      return;
    }

    try {
      this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
      
      this.client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: this.apiKey,
        defaultHeaders: {
          "HTTP-Referer": "https://sonicplane.app",
          "X-Title": "SonicPlane",
        },
        dangerouslyAllowBrowser: true, // Note: For production, use a backend proxy
      });

      console.log('✅ OpenRouter provider initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenRouter provider:', error);
      throw error;
    }
  }

  async sendMessage(
    message: string,
    options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>> {
    return this.sendMessageWithMedia(message, [], options);
  }

  async sendMessageWithMedia(
    message: string,
    attachments: MediaAttachment[] = [],
    options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>> {
    if (!this.client) {
      throw new Error('OpenRouter client not initialized');
    }

    try {
      // Build message content
      const content: Array<OpenAI.Chat.ChatCompletionContentPart> = [];

      // Add text content if present
      if (message && message.trim()) {
        content.push({
          type: 'text',
          text: message,
        });
      }

      // Add media attachments if present (images only)
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const mediaPart = await this.convertMediaToOpenRouterFormat(attachment);
          if (mediaPart) {
            content.push(mediaPart);
          }
        }
      }

      if (content.length === 0) {
        throw new Error('No content to send');
      }

      // Add user message to history
      const userMessage: OpenAI.Chat.ChatCompletionMessageParam = {
        role: 'user',
        content: content,
      };
      this.openrouterChatHistory.push(userMessage);

      // Also add to base history
      this.addToHistory('user', message, attachments);

      // Build messages array
      const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

      // Add system context if set
      if (this.systemContext) {
        messages.push({
          role: 'system',
          content: this.systemContext,
        });
      }

      // Add chat history
      messages.push(...this.openrouterChatHistory);

      // Create streaming completion
      const stream = await this.client.chat.completions.create({
        model: options?.model || this.currentModel,
        messages: messages,
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
        top_p: options?.topP,
        stream: true,
      });

      let fullResponse = '';

      const self = this;
      async function* streamGenerator() {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            fullResponse += delta;
            yield delta;
          }
        }

        // Add the complete assistant response to history
        self.openrouterChatHistory.push({
          role: 'assistant',
          content: fullResponse,
        });
        self.addToHistory('assistant', fullResponse);
      }

      return streamGenerator();
    } catch (error) {
      console.error('Error sending message to OpenRouter:', error);
      throw new Error(`Failed to send message to OpenRouter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async convertMediaToOpenRouterFormat(
    attachment: MediaAttachment
  ): Promise<OpenAI.Chat.ChatCompletionContentPart | null> {
    try {
      if (attachment.mediaType === 'image') {
        // OpenRouter supports images via URL or base64
        let imageUrl: string;
        
        if (attachment.data.startsWith('data:')) {
          // Already a data URL
          imageUrl = attachment.data;
        } else if (attachment.data.startsWith('blob:') || attachment.data.startsWith('http')) {
          // Convert to base64
          const response = await fetch(attachment.data);
          const blob = await response.blob();
          imageUrl = await this.blobToBase64(blob);
        } else {
          imageUrl = attachment.data;
        }

        return {
          type: 'image_url',
          image_url: {
            url: imageUrl,
          },
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error converting media to OpenRouter format:', error);
      return null;
    }
  }

  clearHistory(): void {
    super.clearHistory();
    this.openrouterChatHistory = [];
  }

  setSystemContext(context: string): void {
    super.setSystemContext(context);
    // System context is added at message send time
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'deepseek/deepseek-chat',
        name: 'deepseek/deepseek-chat',
        displayName: 'DeepSeek Chat',
        provider: 'openrouter',
        description: 'DeepSeek\'s most capable model for chat',
        category: 'reasoning',
        maxTokens: 8192,
        inputCost: 0.27,
        outputCost: 1.10,
        supportsImages: true,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'images', 'advanced-reasoning', 'code-generation'],
        contextWindow: 64000,
        isAvailable: true,
      },
      {
        id: 'deepseek/deepseek-reasoner',
        name: 'deepseek/deepseek-reasoner',
        displayName: 'DeepSeek Reasoner',
        provider: 'openrouter',
        description: 'DeepSeek\'s advanced reasoning model',
        category: 'reasoning',
        maxTokens: 8192,
        inputCost: 0.55,
        outputCost: 2.19,
        supportsImages: false,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'advanced-reasoning', 'code-generation'],
        contextWindow: 64000,
        isAvailable: true,
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'anthropic/claude-3.5-sonnet',
        displayName: 'Claude 3.5 Sonnet (OpenRouter)',
        provider: 'openrouter',
        description: 'Claude 3.5 Sonnet via OpenRouter',
        category: 'reasoning',
        maxTokens: 8192,
        inputCost: 3.00,
        outputCost: 15.00,
        supportsImages: true,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'images', 'advanced-reasoning', 'code-generation'],
        contextWindow: 200000,
        isAvailable: true,
      },
      {
        id: 'openai/gpt-4o',
        name: 'openai/gpt-4o',
        displayName: 'GPT-4o (OpenRouter)',
        provider: 'openrouter',
        description: 'GPT-4o via OpenRouter',
        category: 'multimodal',
        maxTokens: 4096,
        inputCost: 2.50,
        outputCost: 10.00,
        supportsImages: true,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'images', 'advanced-reasoning'],
        contextWindow: 128000,
        isAvailable: true,
      },
    ];
  }
}

// Export singleton instance
export const openrouterProvider = new OpenRouterProvider();