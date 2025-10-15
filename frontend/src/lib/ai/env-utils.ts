const GLOBAL_PLACEHOLDERS = new Set(
  [
    'your_api_key_here',
    'your_actual_api_key',
    'your_actual_api_key_here',
    'your_actual_anthropic_key',
    'your_actual_openrouter_key',
    'your_anthropic_api_key_here',
    'your_anthropic_key_here',
    'your_openrouter_api_key_here',
    'your_openrouter_key_here',
    'your_key_here',
    'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
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
  const env = import.meta.env as Record<string, string | undefined>;

  for (const key of allKeys) {
    const rawValue = env[key];
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

