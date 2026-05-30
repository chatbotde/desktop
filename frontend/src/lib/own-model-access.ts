/**
 * Checks whether the user is using their own API keys or a local model.
 * Bundled env keys do not count — guest trial only allows BYOK or local LLM.
 */

import { unifiedLocalLLMService } from '@/lib/ai/local-llm';
import { getSelectedModel } from '@/lib/ai/model-config';
import {
  CUSTOM_PROVIDER_TYPES,
  getCustomProviders,
  type CustomProviderType,
} from '@/lib/settings/custom-providers';

export function hasUserProvidedApiKey(): boolean {
  const providers = getCustomProviders();
  return CUSTOM_PROVIDER_TYPES.some(
    (type) => providers[type].enabled && providers[type].apiKey.trim().length > 0,
  );
}

export function isCustomModelSelected(): boolean {
  const selectedModel = getSelectedModel();
  if (!selectedModel) return false;
  return Boolean(selectedModel.isCustom || selectedModel.id.startsWith('custom-'));
}

function isSelectedModelUsingUserKey(): boolean {
  const selectedModel = getSelectedModel();
  if (!selectedModel) return false;

  if (selectedModel.isCustom || selectedModel.id.startsWith('custom-')) {
    const providers = getCustomProviders();
    const provider = selectedModel.provider as CustomProviderType;
    const config = providers[provider];
    return Boolean(config?.enabled && config.apiKey.trim().length > 0);
  }

  return false;
}

export async function canUseOwnModelForRequest(): Promise<{ allowed: boolean; reason?: string }> {
  const localModel = unifiedLocalLLMService.getCurrentModel();
  if (localModel) {
    const configured = await unifiedLocalLLMService.isConfigured();
    if (configured) return { allowed: true };
    return {
      allowed: false,
      reason:
        'Ollama is not running. Start Ollama or switch to a model that uses your own API key in Settings → Custom Models.',
    };
  }

  if (isSelectedModelUsingUserKey()) {
    return { allowed: true };
  }

  if (hasUserProvidedApiKey()) {
    return {
      allowed: false,
      reason:
        'Select one of your custom models (Settings → Custom Models) or a local model (Settings → Local LLM) to chat during the guest trial.',
    };
  }

  return {
    allowed: false,
    reason:
      'Guest trial requires your own API key or a local model. Add keys in Settings → Custom Models, or select a local model in Settings → Local LLM.',
  };
}
