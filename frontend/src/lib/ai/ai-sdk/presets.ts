/**
 * Model Presets
 * 
 * Pre-configured model shortcuts for quick usage.
 * Use these for consistent model selection across your app.
 * 
 * @example
 * ```typescript
 * import { presets, useModel } from '@/lib/ai/ai-sdk';
 * 
 * // Use a preset
 * const claude = useModel(presets.claude35Sonnet);
 * const response = await claude.generate('Hello!');
 * 
 * // Or use the streamWithPreset helper
 * const stream = await streamWithPreset('gpt-4o', 'Hello!');
 * ```
 */

import { type ProviderId } from './providers';
import { ai, type StreamOptions, type GenerateOptions } from './service';

// ============================================================================
// Model Preset Types
// ============================================================================

export interface ModelPreset {
    provider: ProviderId;
    modelId: string;
    name: string;
    description?: string;
    category?: 'fast' | 'balanced' | 'powerful' | 'reasoning' | 'vision' | 'code';
    contextWindow?: number;
    /** Cost per 1M input tokens in USD */
    inputCost?: number;
    /** Cost per 1M output tokens in USD */
    outputCost?: number;
}

// ============================================================================
// Model Presets Registry
// ============================================================================

export const presets = {
    // OpenAI Models
    'gpt-4o': {
        provider: 'openai',
        modelId: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable multimodal model',
        category: 'powerful',
        contextWindow: 128000,
        inputCost: 2.5,
        outputCost: 10,
    },
    'gpt-4o-mini': {
        provider: 'openai',
        modelId: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and affordable',
        category: 'fast',
        contextWindow: 128000,
        inputCost: 0.15,
        outputCost: 0.6,
    },
    'gpt-4-turbo': {
        provider: 'openai',
        modelId: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Previous flagship model',
        category: 'powerful',
        contextWindow: 128000,
        inputCost: 10,
        outputCost: 30,
    },
    'o1': {
        provider: 'openai',
        modelId: 'o1',
        name: 'o1',
        description: 'Advanced reasoning model',
        category: 'reasoning',
        contextWindow: 200000,
        inputCost: 15,
        outputCost: 60,
    },
    'o1-mini': {
        provider: 'openai',
        modelId: 'o1-mini',
        name: 'o1 Mini',
        description: 'Fast reasoning model',
        category: 'reasoning',
        contextWindow: 128000,
        inputCost: 3,
        outputCost: 12,
    },
    'o3-mini': {
        provider: 'openai',
        modelId: 'o3-mini',
        name: 'o3 Mini',
        description: 'Latest reasoning model',
        category: 'reasoning',
        contextWindow: 200000,
        inputCost: 1.1,
        outputCost: 4.4,
    },

    // Anthropic Models
    'claude-4-sonnet': {
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-20250514',
        name: 'Claude 4 Sonnet',
        description: 'Latest Claude model, balanced performance',
        category: 'balanced',
        contextWindow: 200000,
        inputCost: 3,
        outputCost: 15,
    },
    'claude-3.5-sonnet': {
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Previous Sonnet, excellent for code',
        category: 'code',
        contextWindow: 200000,
        inputCost: 3,
        outputCost: 15,
    },
    'claude-3.5-haiku': {
        provider: 'anthropic',
        modelId: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Fastest Claude model',
        category: 'fast',
        contextWindow: 200000,
        inputCost: 0.25,
        outputCost: 1.25,
    },
    'claude-3-opus': {
        provider: 'anthropic',
        modelId: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most powerful Claude 3',
        category: 'powerful',
        contextWindow: 200000,
        inputCost: 15,
        outputCost: 75,
    },

    // Google Models
    'gemini-2.0-flash': {
        provider: 'google',
        modelId: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash',
        description: 'Latest fast Gemini model',
        category: 'fast',
        contextWindow: 1000000,
        inputCost: 0.1,
        outputCost: 0.4,
    },
    'gemini-1.5-pro': {
        provider: 'google',
        modelId: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable Gemini',
        category: 'powerful',
        contextWindow: 2000000,
        inputCost: 1.25,
        outputCost: 5,
    },
    'gemini-1.5-flash': {
        provider: 'google',
        modelId: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient',
        category: 'fast',
        contextWindow: 1000000,
        inputCost: 0.075,
        outputCost: 0.3,
    },

    // Groq Models (Fast inference)
    'llama-3.3-70b': {
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        description: 'Powerful open-source model via Groq',
        category: 'powerful',
        contextWindow: 128000,
        inputCost: 0.59,
        outputCost: 0.79,
    },
    'llama-3.1-8b': {
        provider: 'groq',
        modelId: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        description: 'Ultra-fast small model',
        category: 'fast',
        contextWindow: 128000,
        inputCost: 0.05,
        outputCost: 0.08,
    },
    'gpt-oss-120b': {
        provider: 'groq',
        modelId: 'openai/gpt-oss-120b',
        name: 'GPT OSS 120B',
        description: 'Open-weight reasoning model via Groq',
        category: 'powerful',
        contextWindow: 131072,
        inputCost: 0.15,
        outputCost: 0.60,
    },
    'qwen3-32b': {
        provider: 'groq',
        modelId: 'qwen/qwen3-32b',
        name: 'Qwen3 32B',
        description: 'Fast reasoning model via Groq',
        category: 'balanced',
        contextWindow: 131072,
        inputCost: 0.29,
        outputCost: 0.59,
    },

    // xAI Models
    'grok-2': {
        provider: 'xai',
        modelId: 'grok-2-latest',
        name: 'Grok 2',
        description: 'xAI flagship model',
        category: 'powerful',
        contextWindow: 128000,
        inputCost: 2,
        outputCost: 10,
    },
    'grok-beta': {
        provider: 'xai',
        modelId: 'grok-beta',
        name: 'Grok Beta',
        description: 'xAI beta model',
        category: 'balanced',
        contextWindow: 128000,
        inputCost: 5,
        outputCost: 15,
    },

    // DeepSeek Models
    'deepseek-chat': {
        provider: 'deepseek',
        modelId: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'General purpose chat model',
        category: 'balanced',
        contextWindow: 64000,
        inputCost: 0.14,
        outputCost: 0.28,
    },
    'deepseek-coder': {
        provider: 'deepseek',
        modelId: 'deepseek-coder',
        name: 'DeepSeek Coder',
        description: 'Specialized for coding',
        category: 'code',
        contextWindow: 64000,
        inputCost: 0.14,
        outputCost: 0.28,
    },
    'deepseek-reasoner': {
        provider: 'deepseek',
        modelId: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        description: 'R1-based reasoning model',
        category: 'reasoning',
        contextWindow: 64000,
        inputCost: 0.55,
        outputCost: 2.19,
    },

    // Perplexity Models (Search)
    'sonar': {
        provider: 'perplexity',
        modelId: 'sonar',
        name: 'Sonar',
        description: 'Search-augmented AI',
        category: 'balanced',
        contextWindow: 127072,
        inputCost: 1,
        outputCost: 1,
    },
    'sonar-pro': {
        provider: 'perplexity',
        modelId: 'sonar-pro',
        name: 'Sonar Pro',
        description: 'Advanced search AI',
        category: 'powerful',
        contextWindow: 200000,
        inputCost: 3,
        outputCost: 15,
    },

    // Mistral Models
    'mistral-large': {
        provider: 'mistral',
        modelId: 'mistral-large-latest',
        name: 'Mistral Large',
        description: 'Flagship Mistral model',
        category: 'powerful',
        contextWindow: 128000,
        inputCost: 2,
        outputCost: 6,
    },
    'mistral-small': {
        provider: 'mistral',
        modelId: 'mistral-small-latest',
        name: 'Mistral Small',
        description: 'Fast and efficient',
        category: 'fast',
        contextWindow: 128000,
        inputCost: 0.2,
        outputCost: 0.6,
    },
    'codestral': {
        provider: 'mistral',
        modelId: 'codestral-latest',
        name: 'Codestral',
        description: 'Code-specialized model',
        category: 'code',
        contextWindow: 32000,
        inputCost: 0.2,
        outputCost: 0.6,
    },

    // Local Models (Ollama)
    'llama3': {
        provider: 'ollama',
        modelId: 'llama3',
        name: 'Llama 3 (Local)',
        description: 'Run locally with Ollama',
        category: 'balanced',
        contextWindow: 8192,
        inputCost: 0,
        outputCost: 0,
    },
    'codellama': {
        provider: 'ollama',
        modelId: 'codellama',
        name: 'Code Llama (Local)',
        description: 'Code model for local use',
        category: 'code',
        contextWindow: 16384,
        inputCost: 0,
        outputCost: 0,
    },
    'qwen2.5': {
        provider: 'ollama',
        modelId: 'qwen2.5',
        name: 'Qwen 2.5 (Local)',
        description: 'Alibaba model for local use',
        category: 'balanced',
        contextWindow: 32768,
        inputCost: 0,
        outputCost: 0,
    },
} as const satisfies Record<string, ModelPreset>;

export type PresetName = keyof typeof presets;

// ============================================================================
// Preset Helpers
// ============================================================================

/**
 * Get a preset by name
 */
export function getPreset(name: PresetName): ModelPreset {
    return presets[name];
}

/**
 * Get all presets for a category
 */
export function getPresetsByCategory(category: ModelPreset['category']): ModelPreset[] {
    return Object.values(presets).filter(p => p.category === category);
}

/**
 * Get all presets for a provider
 */
export function getPresetsByProvider(provider: ProviderId): ModelPreset[] {
    return Object.values(presets).filter(p => p.provider === provider);
}

/**
 * Stream using a preset
 */
export async function streamWithPreset(
    preset: PresetName,
    prompt: string,
    options?: StreamOptions
) {
    const { provider, modelId } = presets[preset];
    return ai.stream(provider, modelId, prompt, options);
}

/**
 * Generate using a preset
 */
export async function generateWithPreset(
    preset: PresetName,
    prompt: string,
    options?: GenerateOptions
) {
    const { provider, modelId } = presets[preset];
    return ai.generate(provider, modelId, prompt, options);
}

/**
 * Create a bound model helper for a specific preset
 */
export function useModel(preset: ModelPreset | PresetName) {
    const model = typeof preset === 'string' ? presets[preset] : preset;

    return {
        preset: model,
        stream: (prompt: string, options?: StreamOptions) =>
            ai.stream(model.provider, model.modelId, prompt, options),
        generate: (prompt: string, options?: GenerateOptions) =>
            ai.generate(model.provider, model.modelId, prompt, options),
        streamAsGenerator: (prompt: string, options?: StreamOptions) =>
            ai.streamAsGenerator(model.provider, model.modelId, prompt, options),
    };
}
