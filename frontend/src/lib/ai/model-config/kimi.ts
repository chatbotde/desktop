import type { AIModel } from './types';

export const kimiModels: AIModel[] = [
  {
    id: 'kimi/kimi-k2-turbo-preview',
    name: 'kimi-k2-turbo-preview',
    displayName: 'Kimi K2 Turbo Preview',
    provider: 'kimi',
    description: 'Kimi K2 Turbo Preview - Advanced MoE model with 128K context window',
    category: 'text',
    maxTokens: 4096,
    inputCost: 0.12,
    outputCost: 0.12,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    capabilities: ['text', 'code-generation'],
    contextWindow: 131072,
    isAvailable: true,
    temperature: 0.6,
    isReasoning: false,
  },
];
