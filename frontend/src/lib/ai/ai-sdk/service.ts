/**
 * AI SDK Service
 * 
 * A unified, multi-provider AI service built on the Vercel AI SDK.
 * Easily switch between providers or add new ones.
 * 
 * @example
 * ```typescript
 * import { ai } from '@/lib/ai/ai-sdk';
 * 
 * // Simple streaming
 * const stream = await ai.stream('openai', 'gpt-4o', 'Hello!');
 * for await (const chunk of stream.textStream) {
 *   console.log(chunk);
 * }
 * 
 * // Generate complete response
 * const response = await ai.generate('anthropic', 'claude-sonnet-4-20250514', 'Hello!');
 * console.log(response.text);
 * 
 * // Use any OpenAI-compatible provider
 * const deepseekResponse = await ai.generate('deepseek', 'deepseek-chat', 'Hello!');
 * ```
 */

import {
    streamText as aiStreamText,
    generateText as aiGenerateText,
    generateObject as aiGenerateObject,
    stepCountIs,
    type ModelMessage,
    type LanguageModel,
    type Tool,
    type StopCondition,
} from 'ai';
import { z } from 'zod';
import {
    type ProviderId,
    type ProviderOptions,
    getModel,
    isProviderConfigured,
    getConfiguredProviders,
    setProviderApiKey,
    registerProvider,
    getProvider,
    type ProviderConfig,
} from './providers';

// ============================================================================
// Types
// ============================================================================

export interface MessageContent {
    type: 'text' | 'image' | 'file';
    text?: string;
    image?: string | Uint8Array | Buffer | ArrayBuffer | URL;
    mimeType?: string;
    data?: string | Uint8Array;
}

export interface StreamOptions {
    /** System prompt for the conversation */
    system?: string;
    /** Chat history / previous messages */
    messages?: ModelMessage[];
    /** Maximum tokens to generate */
    maxOutputTokens?: number;
    /** Temperature for randomness (0-2) */
    temperature?: number;
    /** Top-p sampling */
    topP?: number;
    /** Frequency penalty */
    frequencyPenalty?: number;
    /** Presence penalty */
    presencePenalty?: number;
    /** Stop sequences */
    stop?: string[];
    /** Tools/functions the model can call */
    tools?: Record<string, Tool>;
    /** Tool choice mode */
    toolChoice?: 'auto' | 'none' | 'required' | { type: 'tool'; toolName: string };
    /** Maximum number of tool call steps (maps to stopWhen: stepCountIs(n)) */
    maxSteps?: number;
    /** Custom stop conditions for multi-step tool loops */
    stopWhen?: StopCondition<Record<string, Tool>> | Array<StopCondition<Record<string, Tool>>>;
    /** Abort signal for cancellation */
    abortSignal?: AbortSignal;
    /** Callback for each chunk */
    onChunk?: (chunk: string) => void;
    /** Callback when generation finishes */
    onFinish?: (result: FinishResult) => void;
    /** Provider-specific options */
    providerOptions?: ProviderOptions;
    /** Headers to include in request */
    headers?: Record<string, string>;
}

export interface GenerateOptions extends Omit<StreamOptions, 'onChunk'> { }

export interface FinishResult {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason?: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other';
}

// ============================================================================
// AI SDK Service Class
// ============================================================================

class AISDKService {
    /**
     * Stream text from any provider
     */
    async stream(
        provider: ProviderId,
        modelId: string,
        prompt: string,
        options: StreamOptions = {}
    ) {
        const model = await this.getLanguageModel(provider, modelId, options.providerOptions);

        const messages: ModelMessage[] = options.messages || [
            { role: 'user', content: prompt }
        ];

        const stopWhen = options.stopWhen
            ?? (options.maxSteps != null ? stepCountIs(options.maxSteps) : undefined);

        return aiStreamText({
            model,
            system: options.system,
            messages,
            maxOutputTokens: options.maxOutputTokens,
            temperature: options.temperature,
            topP: options.topP,
            frequencyPenalty: options.frequencyPenalty,
            presencePenalty: options.presencePenalty,
            stopSequences: options.stop,
            tools: options.tools,
            toolChoice: options.toolChoice,
            stopWhen,
            abortSignal: options.abortSignal,
            headers: options.headers,
        });
    }

    /**
     * Generate complete text response (non-streaming)
     */
    async generate(
        provider: ProviderId,
        modelId: string,
        prompt: string,
        options: GenerateOptions = {}
    ) {
        const model = await this.getLanguageModel(provider, modelId, options.providerOptions);

        const messages: ModelMessage[] = options.messages || [
            { role: 'user', content: prompt }
        ];

        const stopWhen = options.stopWhen
            ?? (options.maxSteps != null ? stepCountIs(options.maxSteps) : undefined);

        return aiGenerateText({
            model,
            system: options.system,
            messages,
            maxOutputTokens: options.maxOutputTokens,
            temperature: options.temperature,
            topP: options.topP,
            frequencyPenalty: options.frequencyPenalty,
            presencePenalty: options.presencePenalty,
            stopSequences: options.stop,
            tools: options.tools,
            toolChoice: options.toolChoice,
            stopWhen,
            abortSignal: options.abortSignal,
            headers: options.headers,
        });
    }

    /**
     * Generate structured object using a Zod schema
     */
    async generateObject<T>(
        provider: ProviderId,
        modelId: string,
        prompt: string,
        schema: z.ZodSchema<T>,
        options: GenerateOptions = {}
    ): Promise<{ object: T; usage?: FinishResult['usage'] }> {
        const model = await this.getLanguageModel(provider, modelId, options.providerOptions);

        const messages: ModelMessage[] = options.messages || [
            { role: 'user', content: prompt }
        ];

        const result = await aiGenerateObject({
            model,
            system: options.system,
            messages,
            schema,
            maxOutputTokens: options.maxOutputTokens,
            temperature: options.temperature,
            topP: options.topP,
            abortSignal: options.abortSignal,
            headers: options.headers,
        });

        return {
            object: result.object,
            usage: result.usage ? {
                promptTokens: result.usage.inputTokens ?? 0,
                completionTokens: result.usage.outputTokens ?? 0,
                totalTokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
            } : undefined,
        };
    }

    /**
     * Stream as an async generator (simpler consumption pattern)
     */
    async *streamAsGenerator(
        provider: ProviderId,
        modelId: string,
        prompt: string,
        options: StreamOptions = {}
    ): AsyncGenerator<string, FinishResult, unknown> {
        const result = await this.stream(provider, modelId, prompt, options);
        let fullText = '';

        for await (const chunk of result.textStream) {
            fullText += chunk;
            yield chunk;
            options.onChunk?.(chunk);
        }

        const usage = await result.usage;
        const finishReason = await result.finishReason;

        const finishResult: FinishResult = {
            text: fullText,
            usage: usage ? {
                promptTokens: usage.inputTokens ?? 0,
                completionTokens: usage.outputTokens ?? 0,
                totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
            } : undefined,
            finishReason,
        };

        options.onFinish?.(finishResult);
        return finishResult;
    }

    /**
     * Get a language model instance
     */
    async getLanguageModel(
        provider: ProviderId,
        modelId: string,
        options?: ProviderOptions
    ): Promise<LanguageModel> {
        return getModel(provider, modelId, options);
    }

    /**
     * Check if a provider is configured
     */
    isConfigured(provider: ProviderId): boolean {
        return isProviderConfigured(provider);
    }

    /**
     * Get all configured providers
     */
    getConfiguredProviders() {
        return getConfiguredProviders();
    }

    /**
     * Configure an API key for a provider
     */
    configure(provider: ProviderId, apiKey: string): void {
        setProviderApiKey(provider, apiKey);
    }

    /**
     * Register a new custom provider
     */
    registerProvider(config: ProviderConfig): void {
        registerProvider(config);
    }

    /**
     * Get provider configuration
     */
    getProvider(provider: ProviderId) {
        return getProvider(provider);
    }
}

// ============================================================================
// Singleton Instance & Exports
// ============================================================================

export const ai = new AISDKService();

// Convenience function exports
export const stream = ai.stream.bind(ai);
export const generate = ai.generate.bind(ai);
export const generateObject = ai.generateObject.bind(ai);
export const streamAsGenerator = ai.streamAsGenerator.bind(ai);
