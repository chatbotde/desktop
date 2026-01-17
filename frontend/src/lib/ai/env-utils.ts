const GLOBAL_PLACEHOLDERS = new Set(
  [
    'your_api_key_here',
    'your_actual_api_key',
    'your_actual_api_key_here',
    'your_actual_anthropic_key',
    'your_anthropic_api_key_here',
    'your_anthropic_key_here',
    'your_key_here',
    'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  ].map(value => value.toLowerCase())
);

const fallbackWarningsShown = new Set<string>();

export interface EnvResolution {
  value: string;
  sourceKey: string | null;
  usedFallback: boolean;
  isPlaceholder: boolean;
}

export interface ResolveOptions {
  fallbacks?: string[];
  provider?: string;
  placeholderValues?: string[];
  trim?: boolean;
  warnOnFallback?: boolean;
  logger?: Pick<typeof console, 'warn'>;
}

function isPlaceholderValue(value: string, extraPlaceholders: string[] = []): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  if (
    normalized.startsWith('your_') ||
    normalized.startsWith('your ') ||
    normalized.includes('<your') ||
    normalized.includes('insert_')
  ) {
    return true;
  }

  const placeholderSet = new Set(
    [...GLOBAL_PLACEHOLDERS, ...extraPlaceholders.map(entry => entry.toLowerCase())]
  );

  return placeholderSet.has(normalized);
}

export function resolveEnvValue(primaryKey: string, options: ResolveOptions = {}): EnvResolution {
  const {
    fallbacks = [],
    provider,
    placeholderValues = [],
    trim = true,
    warnOnFallback = true,
    logger = console,
  } = options;

  const allKeys = [primaryKey, ...fallbacks];
  const envSources: Record<string, string | undefined>[] = [];

  // Vite exposes variables on import.meta.env
  envSources.push(import.meta.env as Record<string, string | undefined>);

  // Electron / Node contexts may expose process.env (guarded for browser)
  if (typeof process !== 'undefined' && process && typeof process.env !== 'undefined') {
    envSources.push(process.env as Record<string, string | undefined>);
  }

  // Allow custom global injection (e.g., window.__env) if present
  if (typeof window !== 'undefined') {
    const electronEnv = (window as any).__ELECTRON_RENDERER_ENV__;
    if (electronEnv && typeof electronEnv === 'object') {
      envSources.push(electronEnv as Record<string, string | undefined>);
      const rendererKey = `${primaryKey}`;
      if (!fallbackWarningsShown.has(rendererKey)) {
        fallbackWarningsShown.add(rendererKey);
      }
    }

    const customEnv = (window as any).__env;
    if (customEnv && typeof customEnv === 'object') {
      envSources.push(customEnv as Record<string, string | undefined>);
    }
  }

  for (const key of allKeys) {
    let rawValue: string | undefined;

    for (const source of envSources) {
      const candidate = source?.[key];
      if (typeof candidate === 'string') {
        rawValue = candidate;
        break;
      }
    }

    if (typeof rawValue !== 'string') continue;

    const value = trim ? rawValue.trim() : rawValue;
    if (!value) continue;

    const usedFallback = key !== primaryKey;
    const isPlaceholder = isPlaceholderValue(value, placeholderValues);

    if (usedFallback && warnOnFallback && !isPlaceholder) {
      const warningKey = `${primaryKey}:${key}`;
      if (!fallbackWarningsShown.has(warningKey)) {
        logger.warn(
          `[AI Config] ${provider ?? 'API'} key resolved from "${key}". Rename it to "${primaryKey}" to avoid configuration issues.`
        );
        fallbackWarningsShown.add(warningKey);
      }
    }

    return {
      value,
      sourceKey: key,
      usedFallback,
      isPlaceholder,
    };
  }

  return {
    value: '',
    sourceKey: null,
    usedFallback: false,
    isPlaceholder: false,
  };
}

export function hasValidEnvValue(resolution: EnvResolution): boolean {
  return Boolean(resolution.value) && !resolution.isPlaceholder;
}

/**
 * Common API key environment variable mappings
 */
export const PROVIDER_ENV_KEYS: Record<string, { primary: string; fallbacks?: string[] }> = {
  openai: { primary: 'VITE_OPENAI_API_KEY', fallbacks: ['OPENAI_API_KEY'] },
  anthropic: { primary: 'VITE_ANTHROPIC_API_KEY', fallbacks: ['ANTHROPIC_API_KEY'] },
  google: { primary: 'VITE_GOOGLE_API_KEY', fallbacks: ['GOOGLE_API_KEY', 'GEMINI_API_KEY'] },
  groq: { primary: 'VITE_GROQ_API_KEY', fallbacks: ['GROQ_API_KEY'] },
  xai: { primary: 'VITE_XAI_API_KEY', fallbacks: ['XAI_API_KEY'] },
  openrouter: { primary: 'VITE_OPENROUTER_API_KEY', fallbacks: ['OPENROUTER_API_KEY'] },
  deepseek: { primary: 'VITE_DEEPSEEK_API_KEY', fallbacks: ['DEEPSEEK_API_KEY'] },
  together: { primary: 'VITE_TOGETHER_API_KEY', fallbacks: ['TOGETHER_API_KEY'] },
  perplexity: { primary: 'VITE_PERPLEXITY_API_KEY', fallbacks: ['PERPLEXITY_API_KEY'] },
  fireworks: { primary: 'VITE_FIREWORKS_API_KEY', fallbacks: ['FIREWORKS_API_KEY'] },
  mistral: { primary: 'VITE_MISTRAL_API_KEY', fallbacks: ['MISTRAL_API_KEY'] },
  cerebras: { primary: 'VITE_CEREBRAS_API_KEY', fallbacks: ['CEREBRAS_API_KEY'] },
  kimi: { primary: 'VITE_KIMI_API_KEY', fallbacks: ['KIMI_API_KEY', 'MOONSHOT_API_KEY'] },
};

/**
 * Get API keys for multiple providers at once
 */
export function getProviderApiKeys(
  providers: string[]
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const provider of providers) {
    const envConfig = PROVIDER_ENV_KEYS[provider];
    if (envConfig) {
      const resolution = resolveEnvValue(envConfig.primary, {
        fallbacks: envConfig.fallbacks,
        provider,
      });
      result[provider] = hasValidEnvValue(resolution) ? resolution.value : undefined;
    }
  }

  return result;
}

/**
 * Check which providers are configured
 */
export function getConfiguredProviderIds(): string[] {
  return Object.keys(PROVIDER_ENV_KEYS).filter(provider => {
    const envConfig = PROVIDER_ENV_KEYS[provider];
    const resolution = resolveEnvValue(envConfig.primary, {
      fallbacks: envConfig.fallbacks,
      provider,
    });
    return hasValidEnvValue(resolution);
  });
}

