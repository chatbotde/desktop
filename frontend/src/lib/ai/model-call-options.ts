import type { ProviderOptions } from '@ai-sdk/provider-utils';
import type { AIModel } from './model-config/types';
import type { ProviderId } from './ai-sdk/providers';

/**
 * Provider-specific options that disable extended thinking / reasoning
 * so chat replies start streaming sooner.
 *
 * Reasoning models (`isReasoning: true`) keep provider defaults.
 */
export function buildFastReplyProviderOptions(
  providerId: ProviderId,
  model?: Pick<AIModel, 'id' | 'name' | 'isReasoning'> | null,
): ProviderOptions | undefined {
  if (model?.isReasoning) {
    return undefined;
  }

  switch (providerId) {
    case 'google': {
      const modelKey = `${model?.id ?? ''} ${model?.name ?? ''}`.toLowerCase();
      const isGemini3 = modelKey.includes('gemini-3');

      return {
        google: {
          thinkingConfig: isGemini3
            ? { thinkingLevel: 'minimal' }
            : { thinkingBudget: 0 },
        },
      };
    }
    case 'openai':
      return {
        openai: {
          reasoningEffort: 'none',
        },
      };
    case 'groq':
      return {
        groq: {
          reasoningEffort: 'none',
        },
      };
    case 'deepseek':
      return {
        deepseek: {
          thinking: { type: 'disabled' },
        },
      };
    case 'anthropic':
      return {
        anthropic: {
          thinking: { type: 'disabled' },
        },
      };
    default:
      return undefined;
  }
}
