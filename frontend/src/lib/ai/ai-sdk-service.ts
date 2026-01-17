/**
 * AI SDK Service
 * 
 * Unified AI provider interface using Vercel AI SDK
 * Supports: OpenAI, Anthropic, Google, Groq, xAI and more
 * 
 * @example
 * ```typescript
 * import { aiSDKService, streamText, generateText } from '@/lib/ai/ai-sdk-service';
 * 
 * // Stream a response
 * const result = await streamText('anthropic', 'claude-sonnet-4-20250514', 'Hello!');
 * for await (const chunk of result.textStream) {
 *   console.log(chunk);
 * }
 * 
 * // Or generate complete response
 * const response = await generateText('openai', 'gpt-4o', 'Hello!');
 * console.log(response.text);
 * ```
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createXai } from '@ai-sdk/xai';
import {
  streamText as aiStreamText,
  generateText as aiGenerateText,
  generateObject as aiGenerateObject,
  type UIMessage,
  type LanguageModel,
} from 'ai';
import { z } from 'zod';
import { resolveEnvValue } from './env-utils';

// ============================================================================
// Types
// ============================================================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'xai' | 'openrouter';

export interface AISDKConfig {
  openai?: { apiKey: string; baseURL?: string };
  anthropic?: { apiKey: string };
  google?: { apiKey: string };
  groq?: { apiKey: string };
  xai?: { apiKey: string };
  openrouter?: { apiKey: string };
}

export interface StreamOptions {
  systemPrompt?: string;
  messages?: UIMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  onChunk?: (chunk: string) => void;
  onFinish?: (result: { text: string; usage?: { promptTokens: number; completionTokens: number } }) => void;
  abortSignal?: AbortSignal;
}

export interface GenerateOptions extends Omit<StreamOptions, 'onChunk'> { }

// ============================================================================
// Provider Configuration
// ============================================================================

function getApiKey(provider: AIProvider): string | undefined {
  const envKeys: Record<AIProvider, string> = {
    openai: 'VITE_OPENAI_API_KEY',
    anthropic: 'VITE_ANTHROPIC_API_KEY',
    google: 'VITE_GOOGLE_API_KEY',
    groq: 'VITE_GROQ_API_KEY',
    xai: 'VITE_XAI_API_KEY',
    openrouter: 'VITE_OPENROUTER_API_KEY',
  };

  const key = envKeys[provider];
  const resolved = resolveEnvValue(key);
  return resolved.resolved ? resolved.value : undefined;
}

function createProviderInstance(provider: AIProvider, config?: AISDKConfig) {
  const apiKey = config?.[provider]?.apiKey || getApiKey(provider);

  if (!apiKey) {
    throw new Error(`API key not configured for ${provider}. Set VITE_${provider.toUpperCase()}_API_KEY in your environment.`);
  }

  switch (provider) {
    case 'openai':
      return createOpenAI({
        apiKey,
        baseURL: config?.openai?.baseURL,
      });
    case 'anthropic':
      return createAnthropic({ apiKey });
    case 'google':
      return createGoogleGenerativeAI({ apiKey });
    case 'groq':
      return createGroq({ apiKey });
    case 'xai':
      return createXai({ apiKey });
    case 'openrouter':
      return createOpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function getModel(provider: AIProvider, modelId: string, config?: AISDKConfig): LanguageModel {
  const providerInstance = createProviderInstance(provider, config);
  return providerInstance(modelId) as LanguageModel;
}

// ============================================================================
// AI SDK Service Class
// ============================================================================

export class AISDKService {
  private config: AISDKConfig = {};

  /**
   * Configure API keys programmatically
   */
  configure(config: Partial<AISDKConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a provider is configured
   */
  isConfigured(provider: AIProvider): boolean {
    return !!(this.config[provider]?.apiKey || getApiKey(provider));
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): AIProvider[] {
    const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'groq', 'xai', 'openrouter'];
    return providers.filter(p => this.isConfigured(p));
  }

  /**
   * Stream text response from AI
   */
  async streamText(
    provider: AIProvider,
    modelId: string,
    prompt: string,
    options: StreamOptions = {}
  ) {
    const model = getModel(provider, modelId, this.config);

    const messages: UIMessage[] = options.messages || [
      { role: 'user', content: prompt }
    ];

    const result = await aiStreamText({
      model,
      system: options.systemPrompt,
      messages,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
      abortSignal: options.abortSignal,
    });

    // Return the result which has textStream, text promise, etc.
    return result;
  }

  /**
   * Generate complete text response (non-streaming)
   */
  async generateText(
    provider: AIProvider,
    modelId: string,
    prompt: string,
    options: GenerateOptions = {}
  ) {
    const model = getModel(provider, modelId, this.config);

    const messages: UIMessage[] = options.messages || [
      { role: 'user', content: prompt }
    ];

    const result = await aiGenerateText({
      model,
      system: options.systemPrompt,
      messages,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
      abortSignal: options.abortSignal,
    });

    return result;
  }

  /**
   * Generate structured data using AI
   */
  async generateObject<T>(
    provider: AIProvider,
    modelId: string,
    prompt: string,
    schema: z.ZodSchema<T>,
    options: GenerateOptions = {}
  ): Promise<{ object: T; usage?: { promptTokens: number; completionTokens: number } }> {
    const model = getModel(provider, modelId, this.config);

    const messages: UIMessage[] = options.messages || [
      { role: 'user', content: prompt }
    ];

    const result = await aiGenerateObject({
      model,
      system: options.systemPrompt,
      messages,
      schema,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
      abortSignal: options.abortSignal,
    });

    return {
      object: result.object,
      usage: result.usage,
    };
  }

  /**
   * Create an async generator for streaming (compatible with existing code)
   */
  async *streamAsGenerator(
    provider: AIProvider,
    modelId: string,
    prompt: string,
    options: StreamOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const result = await this.streamText(provider, modelId, prompt, options);

    for await (const chunk of result.textStream) {
      yield chunk;
      options.onChunk?.(chunk);
    }

    // Get final result for onFinish callback
    const text = await result.text;
    const usage = await result.usage;
    options.onFinish?.({
      text,
      usage: usage ? {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens
      } : undefined
    });
  }
}

// ============================================================================
// Default Instance & Helper Functions
// ============================================================================

export const aiSDKService = new AISDKService();

/**
 * Stream text from AI provider
 */
export async function streamText(
  provider: AIProvider,
  modelId: string,
  prompt: string,
  options?: StreamOptions
) {
  return aiSDKService.streamText(provider, modelId, prompt, options);
}

/**
 * Generate text from AI provider (non-streaming)
 */
export async function generateText(
  provider: AIProvider,
  modelId: string,
  prompt: string,
  options?: GenerateOptions
) {
  return aiSDKService.generateText(provider, modelId, prompt, options);
}

/**
 * Generate structured object from AI provider
 */
export async function generateObject<T>(
  provider: AIProvider,
  modelId: string,
  prompt: string,
  schema: z.ZodSchema<T>,
  options?: GenerateOptions
) {
  return aiSDKService.generateObject(provider, modelId, prompt, schema, options);
}

/**
 * Stream as async generator (compatible with existing codebase)
 */
export function streamAsGenerator(
  provider: AIProvider,
  modelId: string,
  prompt: string,
  options?: StreamOptions
) {
  return aiSDKService.streamAsGenerator(provider, modelId, prompt, options);
}

// ============================================================================
// Model Presets
// ============================================================================

export const ModelPresets = {
  // OpenAI Models
  'gpt-4o': { provider: 'openai' as const, modelId: 'gpt-4o' },
  'gpt-4o-mini': { provider: 'openai' as const, modelId: 'gpt-4o-mini' },
  'gpt-4-turbo': { provider: 'openai' as const, modelId: 'gpt-4-turbo' },
  'o1': { provider: 'openai' as const, modelId: 'o1' },
  'o1-mini': { provider: 'openai' as const, modelId: 'o1-mini' },
  'o3-mini': { provider: 'openai' as const, modelId: 'o3-mini' },

  // Anthropic Models
  'claude-sonnet-4-20250514': { provider: 'anthropic' as const, modelId: 'claude-sonnet-4-20250514' },
  'claude-3-5-sonnet': { provider: 'anthropic' as const, modelId: 'claude-3-5-sonnet-20241022' },
  'claude-3-5-haiku': { provider: 'anthropic' as const, modelId: 'claude-3-5-haiku-20241022' },
  'claude-3-opus': { provider: 'anthropic' as const, modelId: 'claude-3-opus-20240229' },

  // Google Models
  'gemini-2.0-flash': { provider: 'google' as const, modelId: 'gemini-2.0-flash-exp' },
  'gemini-1.5-pro': { provider: 'google' as const, modelId: 'gemini-1.5-pro' },
  'gemini-1.5-flash': { provider: 'google' as const, modelId: 'gemini-1.5-flash' },

  // Groq Models (fast inference)
  'llama-3.3-70b': { provider: 'groq' as const, modelId: 'llama-3.3-70b-versatile' },
  'llama-3.1-8b': { provider: 'groq' as const, modelId: 'llama-3.1-8b-instant' },
  'mixtral-8x7b': { provider: 'groq' as const, modelId: 'mixtral-8x7b-32768' },

  // xAI Models
  'grok-2': { provider: 'xai' as const, modelId: 'grok-2-latest' },
  'grok-beta': { provider: 'xai' as const, modelId: 'grok-beta' },
} as const;

/**
 * Quick helper to use model presets
 */
export async function streamWithPreset(
  preset: keyof typeof ModelPresets,
  prompt: string,
  options?: StreamOptions
) {
  const { provider, modelId } = ModelPresets[preset];
  return streamText(provider, modelId, prompt, options);
}

export async function generateWithPreset(
  preset: keyof typeof ModelPresets,
  prompt: string,
  options?: GenerateOptions
) {
  const { provider, modelId } = ModelPresets[preset];
  return generateText(provider, modelId, prompt, options);
}
