/**
 * OpenAI AI Provider Implementation
 */

import OpenAI from "openai";
import {
  BaseAIProvider,
  type AIModel,
  type MediaAttachment,
  type AIRequestOptions,
  type ProviderCapabilities,
} from '../types';

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai';
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    images: true,
    audio: true,
    video: false,
    functionCalling: true,
    systemPrompts: true,
    chatHistory: true,
    maxTokens: 4096,
    contextWindow: 128000,
  };

  private client: OpenAI | null = null;
  private apiKey: string = '';
  private openaiChatHistory: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

  constructor() {
    super();
    this.currentModel = 'gpt-4o';
    this.initialize();
  }

  isConfigured(): boolean {
    const key = import.meta.env.VITE_OPENAI_API_KEY || '';
    return !!(key && key !== 'your_api_key_here' && key.length > 0);
  }

  async initialize(): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('⚠️ OpenAI API key not configured');
      return;
    }

    try {
      this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      
      this.client = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true, // Note: For production, use a backend proxy
      });

      console.log('✅ OpenAI provider initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI provider:', error);
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
      throw new Error('OpenAI client not initialized');
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

      // Add media attachments if present
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const mediaPart = await this.convertMediaToOpenAIFormat(attachment);
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
      this.openaiChatHistory.push(userMessage);

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
      messages.push(...this.openaiChatHistory);

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
        self.openaiChatHistory.push({
          role: 'assistant',
          content: fullResponse,
        });
        self.addToHistory('assistant', fullResponse);
      }

      return streamGenerator();
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      throw new Error(`Failed to send message to OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async convertMediaToOpenAIFormat(
    attachment: MediaAttachment
  ): Promise<OpenAI.Chat.ChatCompletionContentPart | null> {
    try {
      if (attachment.mediaType === 'image') {
        // OpenAI supports images via URL or base64
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
      } else if (attachment.mediaType === 'audio') {
        // OpenAI doesn't support audio in chat completions directly
        // You would need to use Whisper API first for transcription
        console.warn('Audio attachments require transcription with Whisper API first');
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error converting media to OpenAI format:', error);
      return null;
    }
  }

  clearHistory(): void {
    super.clearHistory();
    this.openaiChatHistory = [];
  }

  setSystemContext(context: string): void {
    super.setSystemContext(context);
    // System context is added at message send time in OpenAI
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'gpt-4o',
        name: 'gpt-4o',
        displayName: 'GPT-4o',
        provider: 'openai',
        description: 'OpenAI\'s most advanced multimodal model',
        category: 'multimodal',
        maxTokens: 4096,
        inputCost: 5.00,
        outputCost: 15.00,
        supportsImages: true,
        supportsAudio: true,
        supportsVideo: false,
        capabilities: ['text', 'images', 'audio', 'function-calling', 'advanced-reasoning'],
        contextWindow: 128000,
        isAvailable: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        provider: 'openai',
        description: 'Affordable and efficient model for most tasks',
        category: 'text',
        maxTokens: 4096,
        inputCost: 0.15,
        outputCost: 0.60,
        supportsImages: true,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'images', 'function-calling'],
        contextWindow: 128000,
        isAvailable: true,
      },
      {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        provider: 'openai',
        description: 'High-performance text and vision model',
        category: 'reasoning',
        maxTokens: 4096,
        inputCost: 10.00,
        outputCost: 30.00,
        supportsImages: true,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'images', 'function-calling', 'advanced-reasoning'],
        contextWindow: 128000,
        isAvailable: true,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        provider: 'openai',
        description: 'Fast and cost-effective model for simple tasks',
        category: 'text',
        maxTokens: 4096,
        inputCost: 0.50,
        outputCost: 1.50,
        supportsImages: false,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'function-calling'],
        contextWindow: 16385,
        isAvailable: true,
      },
    ];
  }
}

// Export singleton instance
export const openaiProvider = new OpenAIProvider();
