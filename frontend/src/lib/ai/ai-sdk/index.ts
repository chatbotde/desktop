/**
 * AI SDK Module
 * 
 * A unified, multi-provider AI service built on the Vercel AI SDK.
 * Supports 15+ providers out of the box with easy extensibility.
 * 
 * @example Quick Start
 * ```typescript
 * import { ai, presets, useModel, streamWithPreset } from '@/lib/ai/ai-sdk';
 * 
 * // Method 1: Direct provider/model
 * const stream = await ai.stream('openai', 'gpt-4o', 'Hello!');
 * for await (const chunk of stream.textStream) {
 *   console.log(chunk);
 * }
 * 
 * // Method 2: Use presets
 * const response = await streamWithPreset('gpt-4o', 'Hello!');
 * 
 * // Method 3: Create a model helper
 * const claude = useModel('claude-4-sonnet');
 * const result = await claude.generate('Hello!');
 * 
 * // Method 4: Structured output with Zod
 * import { z } from 'zod';
 * const { object } = await ai.generateObject(
 *   'openai', 
 *   'gpt-4o',
 *   'List 3 colors',
 *   z.object({ colors: z.array(z.string()) })
 * );
 * ```
 * 
 * @example Adding a Custom Provider
 * ```typescript
 * import { registerProvider } from '@/lib/ai/ai-sdk';
 * import { createOpenAI } from '@ai-sdk/openai';
 * 
 * registerProvider({
 *   id: 'my-provider',
 *   name: 'My Custom Provider',
 *   category: 'openai-compatible',
 *   envKey: 'VITE_MY_PROVIDER_API_KEY',
 *   baseURL: 'https://api.my-provider.com/v1',
 *   supportsImages: true,
 *   supportsTools: true,
 *   supportsStreaming: true,
 *   createProvider: (apiKey, options) => createOpenAI({
 *     apiKey,
 *     baseURL: options?.baseURL || 'https://api.my-provider.com/v1',
 *   }),
 * });
 * 
 * // Now use it!
 * const stream = await ai.stream('my-provider', 'model-id', 'Hello!');
 * ```
 */

// Export main service
export {
    ai,
    stream,
    generate,
    generateObject,
    streamAsGenerator,
    type StreamOptions,
    type GenerateOptions,
    type FinishResult,
    type MessageContent,
} from './service';

// Export provider registry
export {
    registerProvider,
    getRegisteredProviders,
    getProvider,
    isProviderRegistered,
    setProviderApiKey,
    getProviderApiKey,
    isProviderConfigured,
    getConfiguredProviders,
    getProviderInstance,
    getModel,
    clearProviderCache,
    type ProviderConfig,
    type ProviderOptions,
    type ProviderInstance,
    type ProviderCategory,
    type ProviderId,
} from './providers';

// Export presets
export {
    presets,
    getPreset,
    getPresetsByCategory,
    getPresetsByProvider,
    streamWithPreset,
    generateWithPreset,
    useModel,
    type ModelPreset,
    type PresetName,
} from './presets';

// Export unified service (drop-in replacement for legacy unified-ai-service)
export {
    AISDKUnifiedService,
    aiSDKUnifiedService,
    sendMessageAISDK,
    sendMessageCompleteAISDK,
} from './unified-service';
