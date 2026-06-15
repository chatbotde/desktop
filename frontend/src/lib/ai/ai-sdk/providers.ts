/**
 * AI SDK Provider Registry
 * 
 * A flexible, extensible provider system for the Vercel AI SDK.
 * Uses official AI SDK provider packages for best compatibility.
 * 
 * Official Providers: OpenAI, Anthropic, Google, Groq, xAI, DeepSeek, Mistral, 
 *                     Fireworks, Cerebras, Perplexity, Together
 */

import type { LanguageModel } from 'ai';
import { resolveEnvValue } from '../env-utils';

// ============================================================================
// Types
// ============================================================================

export type ProviderCategory =
    | 'openai-compatible'  // Uses OpenAI SDK with custom baseURL
    | 'native'             // Has dedicated SDK
    | 'custom';            // Custom implementation

export interface ProviderConfig {
    /** Unique identifier for the provider */
    id: string;
    /** Display name */
    name: string;
    /** Category of provider */
    category: ProviderCategory;
    /** Environment variable key for API key */
    envKey: string;
    /** Optional fallback environment variable keys */
    envFallbacks?: string[];
    /** Base URL for OpenAI-compatible providers */
    baseURL?: string;
    /** Default headers to include */
    defaultHeaders?: Record<string, string>;
    /** Whether provider supports images */
    supportsImages?: boolean;
    /** Whether provider supports audio */
    supportsAudio?: boolean;
    /** Whether provider supports video */
    supportsVideo?: boolean;
    /** Whether provider supports tool calling */
    supportsTools?: boolean;
    /** Whether provider supports streaming */
    supportsStreaming?: boolean;
    /** Factory function to create the provider instance (lazy-loads SDK on first use) */
    createProvider?: (apiKey: string, options?: ProviderOptions) => Promise<unknown>;
}

export interface ProviderOptions {
    apiKey?: string;
    baseURL?: string;
    headers?: Record<string, string>;
}

export interface ProviderInstance {
    config: ProviderConfig;
    instance: unknown;
    getModel: (modelId: string) => LanguageModel;
}

// ============================================================================
// Provider Registry
// ============================================================================

const providerRegistry = new Map<string, ProviderConfig>();

/**
 * Register a new AI provider
 */
export function registerProvider(config: ProviderConfig): void {
    providerRegistry.set(config.id, config);
}

/**
 * Get all registered providers
 */
export function getRegisteredProviders(): ProviderConfig[] {
    return Array.from(providerRegistry.values());
}

/**
 * Get provider by ID
 */
export function getProvider(providerId: string): ProviderConfig | undefined {
    return providerRegistry.get(providerId);
}

/**
 * Check if provider is registered
 */
export function isProviderRegistered(providerId: string): boolean {
    return providerRegistry.has(providerId);
}

// ============================================================================
// Built-in Provider Definitions
// ============================================================================

// OpenAI
registerProvider({
    id: 'openai',
    name: 'OpenAI',
    category: 'native',
    envKey: 'VITE_OPENAI_API_KEY',
    envFallbacks: ['OPENAI_API_KEY'],
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey, options) => {
        const { createOpenAI } = await import('@ai-sdk/openai');
        return createOpenAI({
            apiKey,
            baseURL: options?.baseURL,
            headers: options?.headers,
        });
    },
});

// Anthropic
registerProvider({
    id: 'anthropic',
    name: 'Anthropic',
    category: 'native',
    envKey: 'VITE_ANTHROPIC_API_KEY',
    envFallbacks: ['ANTHROPIC_API_KEY'],
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createAnthropic } = await import('@ai-sdk/anthropic');
        return createAnthropic({ apiKey });
    },
});

// Google (Gemini)
registerProvider({
    id: 'google',
    name: 'Google AI',
    category: 'native',
    envKey: 'VITE_GOOGLE_API_KEY',
    envFallbacks: ['GOOGLE_API_KEY', 'GEMINI_API_KEY'],
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        return createGoogleGenerativeAI({ apiKey });
    },
});

// Groq
registerProvider({
    id: 'groq',
    name: 'Groq',
    category: 'native',
    envKey: 'VITE_GROQ_API_KEY',
    envFallbacks: ['GROQ_API_KEY'],
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createGroq } = await import('@ai-sdk/groq');
        return createGroq({ apiKey });
    },
});

// xAI (Grok)
registerProvider({
    id: 'xai',
    name: 'xAI',
    category: 'native',
    envKey: 'VITE_XAI_API_KEY',
    envFallbacks: ['XAI_API_KEY'],
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createXai } = await import('@ai-sdk/xai');
        return createXai({ apiKey });
    },
});

// OpenRouter (OpenAI-compatible)
registerProvider({
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'openai-compatible',
    envKey: 'VITE_OPENROUTER_API_KEY',
    envFallbacks: ['OPENROUTER_API_KEY'],
    baseURL: 'https://openrouter.ai/api/v1',
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey, options) => {
        const { createOpenAI } = await import('@ai-sdk/openai');
        return createOpenAI({
            apiKey,
            baseURL: options?.baseURL || 'https://openrouter.ai/api/v1',
            headers: {
                'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
                'X-Title': 'SonicThinking AI',
                ...options?.headers,
            },
        });
    },
});

// DeepSeek (Native SDK)
registerProvider({
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'native',
    envKey: 'VITE_DEEPSEEK_API_KEY',
    envFallbacks: ['DEEPSEEK_API_KEY'],
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createDeepSeek } = await import('@ai-sdk/deepseek');
        return createDeepSeek({ apiKey });
    },
});

// Together AI (Native SDK)
registerProvider({
    id: 'together',
    name: 'Together AI',
    category: 'native',
    envKey: 'VITE_TOGETHER_API_KEY',
    envFallbacks: ['TOGETHER_API_KEY'],
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createTogetherAI } = await import('@ai-sdk/togetherai');
        return createTogetherAI({ apiKey });
    },
});

// Perplexity (Native SDK)
registerProvider({
    id: 'perplexity',
    name: 'Perplexity',
    category: 'native',
    envKey: 'VITE_PERPLEXITY_API_KEY',
    envFallbacks: ['PERPLEXITY_API_KEY'],
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: false,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createPerplexity } = await import('@ai-sdk/perplexity');
        return createPerplexity({ apiKey });
    },
});

// Fireworks AI (Native SDK)
registerProvider({
    id: 'fireworks',
    name: 'Fireworks AI',
    category: 'native',
    envKey: 'VITE_FIREWORKS_API_KEY',
    envFallbacks: ['FIREWORKS_API_KEY'],
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createFireworks } = await import('@ai-sdk/fireworks');
        return createFireworks({ apiKey });
    },
});

// Mistral AI (Native SDK)
registerProvider({
    id: 'mistral',
    name: 'Mistral AI',
    category: 'native',
    envKey: 'VITE_MISTRAL_API_KEY',
    envFallbacks: ['MISTRAL_API_KEY'],
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createMistral } = await import('@ai-sdk/mistral');
        return createMistral({ apiKey });
    },
});

// Cerebras (Native SDK)
registerProvider({
    id: 'cerebras',
    name: 'Cerebras',
    category: 'native',
    envKey: 'VITE_CEREBRAS_API_KEY',
    envFallbacks: ['CEREBRAS_API_KEY'],
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey) => {
        const { createCerebras } = await import('@ai-sdk/cerebras');
        return createCerebras({ apiKey });
    },
});

// Kimi / Moonshot (OpenAI-compatible)
registerProvider({
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    category: 'openai-compatible',
    envKey: 'VITE_KIMI_API_KEY',
    envFallbacks: ['KIMI_API_KEY', 'MOONSHOT_API_KEY'],
    baseURL: 'https://api.moonshot.cn/v1',
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (apiKey, options) => {
        const { createOpenAI } = await import('@ai-sdk/openai');
        return createOpenAI({
            apiKey,
            baseURL: options?.baseURL || 'https://api.moonshot.cn/v1',
        });
    },
});

// Ollama (Local, OpenAI-compatible)
registerProvider({
    id: 'ollama',
    name: 'Ollama (Local)',
    category: 'openai-compatible',
    envKey: 'VITE_OLLAMA_BASE_URL',
    baseURL: 'http://localhost:11434/v1',
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (_apiKey, options) => {
        const { createOpenAI } = await import('@ai-sdk/openai');
        return createOpenAI({
            apiKey: 'ollama',
            baseURL: options?.baseURL || 'http://localhost:11434/v1',
        });
    },
});

// LM Studio (Local, OpenAI-compatible)
registerProvider({
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    category: 'openai-compatible',
    envKey: 'VITE_LMSTUDIO_BASE_URL',
    baseURL: 'http://localhost:1234/v1',
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsTools: true,
    supportsStreaming: true,
    createProvider: async (_apiKey, options) => {
        const { createOpenAI } = await import('@ai-sdk/openai');
        return createOpenAI({
            apiKey: 'lmstudio',
            baseURL: options?.baseURL || 'http://localhost:1234/v1',
        });
    },
});

// Replicate (image & video generation)
registerProvider({
    id: 'replicate',
    name: 'Replicate',
    category: 'custom',
    envKey: 'VITE_REPLICATE_API_TOKEN',
    envFallbacks: ['REPLICATE_API_TOKEN'],
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: true,
    supportsTools: false,
    supportsStreaming: false,
});

// fal.ai (image & video generation)
registerProvider({
    id: 'fal',
    name: 'fal.ai',
    category: 'custom',
    envKey: 'VITE_FALAI_API_KEY',
    envFallbacks: ['FAL_KEY', 'VITE_FAL_KEY', 'FALAI_API_KEY'],
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: true,
    supportsTools: false,
    supportsStreaming: false,
});

// ============================================================================
// Provider Instance Management
// ============================================================================

const providerInstances = new Map<string, ProviderInstance>();
const configuredApiKeys = new Map<string, string>();

/**
 * Configure an API key for a provider
 */
export function setProviderApiKey(providerId: string, apiKey: string): void {
    configuredApiKeys.set(providerId, apiKey);
    // Clear cached instance to force recreation with new key
    providerInstances.delete(providerId);
}

/**
 * Get API key for a provider (from config, custom providers, env, or stored)
 */
export function getProviderApiKey(providerId: string): string | undefined {
    // Check manually configured keys first
    const configuredKey = configuredApiKeys.get(providerId);
    if (configuredKey) return configuredKey;

    // Then check custom providers from localStorage (user-configured keys)
    try {
        const customProvidersJson = localStorage.getItem('custom-ai-providers');
        if (customProvidersJson) {
            const customProviders = JSON.parse(customProvidersJson);
            // Map provider IDs to custom provider types
            const providerMap: Record<string, string> = {
                'google': 'google',
                'openai': 'openai',
                'anthropic': 'anthropic',
            };
            const customType = providerMap[providerId];
            if (customType && customProviders[customType]?.enabled && customProviders[customType]?.apiKey) {
                return customProviders[customType].apiKey;
            }
        }
    } catch {
        // Ignore localStorage errors
    }

    // Then check environment variables
    const providerConfig = getProvider(providerId);
    if (!providerConfig) return undefined;

    const resolved = resolveEnvValue(providerConfig.envKey, {
        fallbacks: providerConfig.envFallbacks,
        provider: providerConfig.name,
    });

    return resolved.value || undefined;
}

/**
 * Check if a provider is configured (has API key or is local)
 */
export function isProviderConfigured(providerId: string): boolean {
    const config = getProvider(providerId);
    if (!config) return false;

    // Local providers (Ollama, LM Studio) don't need API keys
    if (providerId === 'ollama' || providerId === 'lmstudio') {
        return true;
    }

    return !!getProviderApiKey(providerId);
}

/**
 * Get list of all configured providers
 */
export function getConfiguredProviders(): ProviderConfig[] {
    return getRegisteredProviders().filter(p => isProviderConfigured(p.id));
}

/**
 * Create or get cached provider instance
 */
export async function getProviderInstance(
    providerId: string,
    options?: ProviderOptions
): Promise<ProviderInstance> {
    // Return cached instance if no custom options
    if (!options && providerInstances.has(providerId)) {
        return providerInstances.get(providerId)!;
    }

    const config = getProvider(providerId);
    if (!config) {
        throw new Error(`Provider "${providerId}" is not registered. Use registerProvider() first.`);
    }

    const apiKey = options?.apiKey || getProviderApiKey(providerId);

    // For non-local providers, require API key
    if (!apiKey && providerId !== 'ollama' && providerId !== 'lmstudio') {
        throw new Error(
            `API key not configured for ${config.name}. ` +
            `Set ${config.envKey} in your environment or use setProviderApiKey().`
        );
    }

    if (!config.createProvider) {
        throw new Error(`Provider "${providerId}" does not have a createProvider function.`);
    }

    const instance = await config.createProvider(apiKey || '', {
        baseURL: options?.baseURL || config.baseURL,
        headers: options?.headers || config.defaultHeaders,
    });

    const providerInstance: ProviderInstance = {
        config,
        instance,
        getModel: (modelId: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (instance as any)(modelId) as LanguageModel;
        },
    };

    // Cache if no custom options
    if (!options) {
        providerInstances.set(providerId, providerInstance);
    }

    return providerInstance;
}

/**
 * Get a language model from a provider
 */
export async function getModel(providerId: string, modelId: string, options?: ProviderOptions): Promise<LanguageModel> {
    const instance = await getProviderInstance(providerId, options);
    return instance.getModel(modelId);
}

/**
 * Clear all cached provider instances (useful for testing or reconfiguration)
 */
export function clearProviderCache(): void {
    providerInstances.clear();
    configuredApiKeys.clear();
}

// ============================================================================
// Convenience Types
// ============================================================================

export type ProviderId =
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'groq'
    | 'xai'
    | 'openrouter'
    | 'deepseek'
    | 'together'
    | 'perplexity'
    | 'fireworks'
    | 'mistral'
    | 'cerebras'
    | 'kimi'
    | 'ollama'
    | 'lmstudio'
    | 'replicate'
    | 'fal'
    | (string & {}); // Allow custom provider IDs
