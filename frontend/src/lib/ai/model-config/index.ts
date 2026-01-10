/**
 * Model Configuration Index
 * Aggregates all model configurations from provider-specific files
 */

import { googleModels } from './google';
import { openaiModels } from './openai';
import { anthropicModels } from './anthropic';
import { openrouterModels } from './openrouter';
import { cerebrasModels } from './cerebras';
import { deepseekModels } from './deepseek';
import { kimiModels } from './kimi';
import { xaiModels } from './xai';
import { replicateModels } from './replicate';
import { groqModels } from './groq';

// Aggregate all models
export const AVAILABLE_MODELS = [
  ...googleModels,
  ...openaiModels,
  ...anthropicModels,
  ...openrouterModels,
  ...cerebrasModels,
  ...deepseekModels,
  ...kimiModels,
  ...xaiModels,
  ...replicateModels,
  ...groqModels,
];

// Re-export types
export type { AIModel, ModelProvider } from './types';
