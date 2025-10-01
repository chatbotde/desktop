/**
 * Anthropic Claude AI Provider Implementation
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  BaseAIProvider,
  type AIModel,
  type MediaAttachment,
  type AIRequestOptions,
  type ProviderCapabilities,
} from '../types';

export class AnthropicProvider extends BaseAIProvider {
  readonly name = 'anthropic';
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

  private client: Anthropic | null = null;
  private apiKey: string = '';
  private anthropicChatHistory: Array<Anthropic.MessageParam> = [];

  constructor() {
    super();
    this.currentModel = 'claude-3-5-sonnet-20241022';
    this.initialize();
  }

  isConfigured(): boolean {
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
    return !!(key && key !== 'your_api_key_here' && key.length > 0);
  }

  async initialize(): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Anthropic API key not configured');
      return;
    }

    try {
      this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
      
      this.client = new Anthropic({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true, // Note: For production, use a backend proxy
      });

      console.log('✅ Anthropic provider initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Anthropic provider:', error);
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
      throw new Error('Anthropic client not initialized');
    }

    try {
      // Build message content
      const content: any[] = [];

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
          const mediaPart = await this.convertMediaToAnthropicFormat(attachment);
          if (mediaPart) {
            content.push(mediaPart);
          }
        }
      }

      if (content.length === 0) {
        throw new Error('No content to send');
      }

      // Add user message to history
      const userMessage: Anthropic.MessageParam = {
        role: 'user',
        content: content,
      };
      this.anthropicChatHistory.push(userMessage);

      // Also add to base history
      this.addToHistory('user', message, attachments);

      // Create streaming message
      const stream = await this.client.messages.create({
        model: options?.model || this.currentModel,
        max_tokens: options?.maxTokens || 8192,
        temperature: options?.temperature,
        top_p: options?.topP,
        system: this.systemContext || undefined,
        messages: this.anthropicChatHistory,
        stream: true,
      });

      let fullResponse = '';

      const self = this;
      async function* streamGenerator() {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const delta = chunk.delta.text;
            if (delta) {
              fullResponse += delta;
              yield delta;
            }
          }
        }

        // Add the complete assistant response to history
        self.anthropicChatHistory.push({
          role: 'assistant',
          content: fullResponse,
        });
        self.addToHistory('assistant', fullResponse);
      }

      return streamGenerator();
    } catch (error) {
      console.error('Error sending message to Anthropic:', error);
      throw new Error(`Failed to send message to Anthropic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async convertMediaToAnthropicFormat(
    attachment: MediaAttachment
  ): Promise<any> {
    try {
      if (attachment.mediaType === 'image') {
        // Anthropic supports images as base64
        let imageData: string;
        let mediaType: string;
        
        if (attachment.data.startsWith('data:')) {
          // Extract base64 data and media type
          const matches = attachment.data.match(/^data:(image\/[a-z]+);base64,(.+)$/);
          if (matches) {
            mediaType = matches[1];
            imageData = matches[2];
          } else {
            return null;
          }
        } else if (attachment.data.startsWith('blob:') || attachment.data.startsWith('http')) {
          // Convert to base64
          const response = await fetch(attachment.data);
          const blob = await response.blob();
          const base64String = await this.blobToBase64(blob);
          const matches = base64String.match(/^data:(image\/[a-z]+);base64,(.+)$/);
          if (matches) {
            mediaType = matches[1];
            imageData = matches[2];
          } else {
            return null;
          }
        } else {
          return null;
        }

        return {
          type: 'image' as any, // Anthropic SDK type issue workaround
          source: {
            type: 'base64' as any,
            media_type: mediaType,
            data: imageData,
          },
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error converting media to Anthropic format:', error);
      return null;
    }
  }

  clearHistory(): void {
    super.clearHistory();
    this.anthropicChatHistory = [];
  }

  setSystemContext(context: string): void {
    super.setSystemContext(context);
    // System context is added at message send time in Anthropic
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        description: 'Anthropic\'s most capable model for complex tasks',
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
        id: 'claude-3-5-haiku-20241022',
        name: 'claude-3-5-haiku-20241022',
        displayName: 'Claude 3.5 Haiku',
        provider: 'anthropic',
        description: 'Fast and efficient model for everyday tasks',
        category: 'text',
        maxTokens: 8192,
        inputCost: 0.80,
        outputCost: 4.00,
        supportsImages: false,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'code-generation'],
        contextWindow: 200000,
        isAvailable: true,
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        provider: 'anthropic',
        description: 'Most powerful model for highly complex tasks',
        category: 'reasoning',
        maxTokens: 4096,
        inputCost: 15.00,
        outputCost: 75.00,
        supportsImages: true,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'images', 'advanced-reasoning', 'code-generation'],
        contextWindow: 200000,
        isAvailable: true,
      },
    ];
  }
}

// Export singleton instance
export const anthropicProvider = new AnthropicProvider();
