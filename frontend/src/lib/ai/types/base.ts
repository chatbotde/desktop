/**
 * Base types and interfaces for AI providers
 * This file defines the core contracts that all AI providers must implement
 */

/**
 * Media attachment types supported by AI providers
 */
export interface MediaAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 data URL or object URL
  source: string;
  mediaType: 'image' | 'video' | 'audio';
  dimensions?: { width: number; height: number };
  duration?: number;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: MediaAttachment[];
}

/**
 * AI provider capabilities
 */
export interface ProviderCapabilities {
  streaming: boolean;
  images: boolean;
  audio: boolean;
  video: boolean;
  functionCalling: boolean;
  systemPrompts: boolean;
  chatHistory: boolean;
  maxTokens?: number;
  contextWindow?: number;
}

/**
 * AI model configuration
 */
export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  description: string;
  category: 'text' | 'multimodal' | 'coding' | 'reasoning';
  maxTokens: number;
  inputCost?: number; // per 1K tokens
  outputCost?: number; // per 1K tokens
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  capabilities: string[];
  contextWindow: number;
  isAvailable: boolean;
}

/**
 * Request options for AI providers
 */
export interface AIRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  systemPrompt?: string;
}

/**
 * Response from AI provider
 */
export interface AIResponse {
  success: boolean;
  content: string;
  provider: string;
  model?: string;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    confidence?: number;
    language?: string;
    duration?: number;
    finishReason?: string;
  };
}

/**
 * Base interface that all AI providers must implement
 */
export interface IAIProvider {
  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Provider capabilities
   */
  readonly capabilities: ProviderCapabilities;

  /**
   * Check if provider is configured and ready to use
   */
  isConfigured(): boolean;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Send a text message and get streaming response
   */
  sendMessage(
    message: string,
    options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>>;

  /**
   * Send a message with media attachments
   */
  sendMessageWithMedia(
    message: string,
    attachments: MediaAttachment[],
    options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>>;

  /**
   * Send a message and get complete response (non-streaming)
   */
  sendMessageComplete(
    message: string,
    options?: AIRequestOptions
  ): Promise<string>;

  /**
   * Send a message with media and get complete response
   */
  sendMessageWithMediaComplete(
    message: string,
    attachments: MediaAttachment[],
    options?: AIRequestOptions
  ): Promise<string>;

  /**
   * Get chat history
   */
  getChatHistory(): ChatMessage[];

  /**
   * Clear chat history
   */
  clearHistory(): void;

  /**
   * Set system context/prompt
   */
  setSystemContext(context: string): void;

  /**
   * Get available models for this provider
   */
  getAvailableModels(): AIModel[];

  /**
   * Get current model being used
   */
  getCurrentModel(): string;

  /**
   * Set the model to use
   */
  setModel(modelId: string): void;
}

/**
 * Abstract base class for AI providers
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseAIProvider implements IAIProvider {
  abstract readonly name: string;
  abstract readonly capabilities: ProviderCapabilities;

  protected currentModel: string = '';
  protected systemContext: string = '';
  protected chatHistory: ChatMessage[] = [];

  abstract isConfigured(): boolean;
  abstract initialize(): Promise<void>;
  abstract sendMessage(
    message: string,
    options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>>;
  abstract sendMessageWithMedia(
    message: string,
    attachments: MediaAttachment[],
    options?: AIRequestOptions
  ): Promise<AsyncGenerator<string, void, unknown>>;
  abstract getAvailableModels(): AIModel[];

  async sendMessageComplete(
    message: string,
    options?: AIRequestOptions
  ): Promise<string> {
    const stream = await this.sendMessage(message, options);
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
    }
    return fullResponse;
  }

  async sendMessageWithMediaComplete(
    message: string,
    attachments: MediaAttachment[],
    options?: AIRequestOptions
  ): Promise<string> {
    const stream = await this.sendMessageWithMedia(message, attachments, options);
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
    }
    return fullResponse;
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  clearHistory(): void {
    this.chatHistory = [];
  }

  setSystemContext(context: string): void {
    this.systemContext = context;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  setModel(modelId: string): void {
    this.currentModel = modelId;
  }

  /**
   * Helper to convert blob to base64
   */
  protected blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Helper to add message to history
   */
  protected addToHistory(role: ChatMessage['role'], content: string, attachments?: MediaAttachment[]): void {
    this.chatHistory.push({
      role,
      content,
      timestamp: new Date(),
      attachments,
    });
  }
}
