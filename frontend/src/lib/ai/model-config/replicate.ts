import type { AIModel } from './types';

export const replicateModels: AIModel[] = [
  {
    id: 'flux-kontext-pro',
    name: 'black-forest-labs/flux-kontext-pro',
    displayName: 'Flux Kontext Pro',
    provider: 'replicate',
    description: 'High-quality image generation and transformation model',
    category: 'image-generation',
    maxTokens: 0,
    inputCost: 0.01,
    outputCost: 0.01,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['image-generation', 'image-transformation'],
    contextWindow: 0,
    isAvailable: true,
    temperature: undefined,
    isReasoning: false,
  },
  {
    id: 'flux-dev',
    name: 'black-forest-labs/flux-dev',
    displayName: 'Flux Dev',
    provider: 'replicate',
    description: 'Fast image generation model',
    category: 'image-generation',
    maxTokens: 0,
    inputCost: 0.005,
    outputCost: 0.005,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['image-generation'],
    contextWindow: 0,
    isAvailable: true,
    temperature: undefined,
    isReasoning: false,
  },
  {
    id: 'flux-schnell',
    name: 'black-forest-labs/flux-schnell',
    displayName: 'Flux Schnell',
    provider: 'replicate',
    description: 'Ultra-fast image generation model',
    category: 'image-generation',
    maxTokens: 0,
    inputCost: 0.003,
    outputCost: 0.003,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['image-generation'],
    contextWindow: 0,
    isAvailable: true,
    temperature: undefined,
    isReasoning: false,
  },
];






