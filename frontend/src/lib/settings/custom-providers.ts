/**
 * Custom AI Provider Settings
 * Manages custom API keys, base URLs, and models for Google, OpenAI, and Anthropic
 */

export type CustomProviderType = 'google' | 'openai' | 'anthropic';

export interface CustomModelCapabilities {
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
}

export interface CustomModel {
  id: string;
  name: string;
  displayName: string;
  provider: CustomProviderType;
  isCustom: true;
  capabilities: CustomModelCapabilities;
}

export interface CustomProviderConfig {
  provider: CustomProviderType;
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
  models: CustomModel[];
}

export interface CustomProvidersStore {
  google: CustomProviderConfig;
  openai: CustomProviderConfig;
  anthropic: CustomProviderConfig;
}

const CUSTOM_PROVIDERS_KEY = 'custom-ai-providers';
export const CUSTOM_PROVIDERS_CHANGED_EVENT = 'buddy:custom-providers-changed';

const DEFAULT_BASE_URLS: Record<CustomProviderType, string> = {
  google: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
};

const PROVIDER_DISPLAY_NAMES: Record<CustomProviderType, string> = {
  google: 'Google AI (Gemini)',
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
};

function getDefaultStore(): CustomProvidersStore {
  return {
    google: {
      provider: 'google',
      apiKey: '',
      baseUrl: '',
      enabled: false,
      models: [],
    },
    openai: {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      enabled: false,
      models: [],
    },
    anthropic: {
      provider: 'anthropic',
      apiKey: '',
      baseUrl: '',
      enabled: false,
      models: [],
    },
  };
}

function emitCustomProvidersChanged(): void {
  window.dispatchEvent(new Event(CUSTOM_PROVIDERS_CHANGED_EVENT));
}

/**
 * Get all custom provider configurations
 */
export function getCustomProviders(): CustomProvidersStore {
  const stored = localStorage.getItem(CUSTOM_PROVIDERS_KEY);
  if (!stored) {
    return getDefaultStore();
  }
  try {
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all fields exist
    return {
      google: { ...getDefaultStore().google, ...parsed.google },
      openai: { ...getDefaultStore().openai, ...parsed.openai },
      anthropic: { ...getDefaultStore().anthropic, ...parsed.anthropic },
    };
  } catch {
    return getDefaultStore();
  }
}

/**
 * Save custom provider configurations
 */
export function saveCustomProviders(providers: CustomProvidersStore): void {
  localStorage.setItem(CUSTOM_PROVIDERS_KEY, JSON.stringify(providers));
  emitCustomProvidersChanged();
}

/**
 * Get configuration for a specific provider
 */
export function getProviderConfig(provider: CustomProviderType): CustomProviderConfig {
  return getCustomProviders()[provider];
}

/**
 * Update configuration for a specific provider
 */
export function updateProviderConfig(
  provider: CustomProviderType,
  updates: Partial<CustomProviderConfig>
): void {
  const current = getCustomProviders();
  current[provider] = { ...current[provider], ...updates };
  saveCustomProviders(current);
}

/**
 * Set API key for a provider
 */
export function setProviderApiKey(provider: CustomProviderType, apiKey: string): void {
  updateProviderConfig(provider, { apiKey, enabled: apiKey.length > 0 });
}

/**
 * Set base URL for a provider (optional override)
 */
export function setProviderBaseUrl(provider: CustomProviderType, baseUrl: string): void {
  updateProviderConfig(provider, { baseUrl });
}

/**
 * Get the effective base URL for a provider
 */
export function getEffectiveBaseUrl(provider: CustomProviderType): string {
  const config = getProviderConfig(provider);
  return config.baseUrl?.trim() || DEFAULT_BASE_URLS[provider];
}

/**
 * Add a custom model to a provider
 */
export function addCustomModel(
  provider: CustomProviderType,
  modelId: string,
  displayName: string,
  capabilities?: Partial<CustomModelCapabilities>
): CustomModel {
  const config = getProviderConfig(provider);

  // Default capabilities based on provider
  // Google Gemini models typically support all media types
  // OpenAI vision models support images
  // Anthropic Claude 3 supports images
  const defaultCapabilities: CustomModelCapabilities = {
    supportsImages: true, // Most modern models support images
    supportsAudio: provider === 'google', // Only Google Gemini natively supports audio
    supportsVideo: provider === 'google', // Only Google Gemini natively supports video
  };

  const newModel: CustomModel = {
    id: `custom-${provider}-${modelId}`,
    name: modelId,
    displayName: displayName || modelId,
    provider,
    isCustom: true,
    capabilities: {
      ...defaultCapabilities,
      ...capabilities,
    },
  };

  // Check if model already exists
  const exists = config.models.some(m => m.name === modelId);
  if (!exists) {
    updateProviderConfig(provider, {
      models: [...config.models, newModel],
    });
  }

  return newModel;
}

/**
 * Remove a custom model from a provider
 */
export function removeCustomModel(provider: CustomProviderType, modelId: string): void {
  const config = getProviderConfig(provider);
  updateProviderConfig(provider, {
    models: config.models.filter(m => m.id !== modelId),
  });
}

/**
 * Get all custom models across all providers
 */
export function getAllCustomModels(): CustomModel[] {
  const providers = getCustomProviders();
  return [
    ...providers.google.models,
    ...providers.openai.models,
    ...providers.anthropic.models,
  ].filter(m => {
    // Only return models from enabled providers with API keys
    const config = providers[m.provider];
    return config.enabled && config.apiKey.length > 0;
  });
}

/**
 * Check if a provider is configured and enabled
 */
export function isProviderEnabled(provider: CustomProviderType): boolean {
  const config = getProviderConfig(provider);
  return config.enabled && config.apiKey.length > 0;
}

/**
 * Get display name for a provider
 */
export function getProviderDisplayName(provider: CustomProviderType): string {
  return PROVIDER_DISPLAY_NAMES[provider];
}

/**
 * Get default base URL for a provider
 */
export function getDefaultBaseUrl(provider: CustomProviderType): string {
  return DEFAULT_BASE_URLS[provider];
}

/**
 * Export all provider types for iteration
 */
export const CUSTOM_PROVIDER_TYPES: CustomProviderType[] = ['google', 'openai', 'anthropic'];
