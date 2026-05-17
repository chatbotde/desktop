import { resolveEnvValue, hasValidEnvValue } from '../ai/env-utils';

const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GOOGLE_API_KEY = 'VITE_GOOGLE_API_KEY';
const GOOGLE_API_KEY_FALLBACKS = ['GOOGLE_API_KEY', 'GEMINI_API_KEY'];
const DEFAULT_GOOGLE_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface GoogleImageGenerationOptions {
  prompt: string;
  model?: string;
}

export interface GoogleImageGenerationResult {
  images: string[];
  model: string;
}

function normalizeGeminiModelName(model?: string): string {
  const trimmed = model?.trim();
  if (!trimmed) return DEFAULT_GEMINI_IMAGE_MODEL;

  if (trimmed === 'nano banana') return DEFAULT_GEMINI_IMAGE_MODEL;
  return trimmed.replace(/^models\//, '');
}

function isUsableApiKey(apiKey?: string): apiKey is string {
  const trimmed = apiKey?.trim();
  return Boolean(trimmed) && !trimmed!.startsWith('#') && !trimmed!.toLowerCase().startsWith('your_');
}

interface CustomGoogleConfig {
  apiKey?: string;
  baseUrl?: string;
}

function getCustomGoogleConfig(): CustomGoogleConfig {
  try {
    const customProvidersJson = localStorage.getItem('custom-ai-providers');
    if (!customProvidersJson) return {};

    const customProviders = JSON.parse(customProvidersJson);
    const googleConfig = customProviders?.google;
    const apiKey = googleConfig?.enabled ? googleConfig?.apiKey : undefined;
    return {
      apiKey: isUsableApiKey(apiKey) ? apiKey.trim() : undefined,
      baseUrl: typeof googleConfig?.baseUrl === 'string' ? googleConfig.baseUrl.trim() : undefined,
    };
  } catch {
    return {};
  }
}

function getGoogleApiKey(): string | undefined {
  const customKey = getCustomGoogleConfig().apiKey;
  if (customKey) return customKey;

  const resolved = resolveEnvValue(GOOGLE_API_KEY, {
    fallbacks: GOOGLE_API_KEY_FALLBACKS,
    provider: 'Google AI',
  });

  return hasValidEnvValue(resolved) && isUsableApiKey(resolved.value)
    ? resolved.value
    : undefined;
}

function getGoogleApiBaseUrl(): string {
  const customBaseUrl = getCustomGoogleConfig().baseUrl;
  return customBaseUrl || DEFAULT_GOOGLE_API_BASE_URL;
}

function getGenerateContentUrl(model: string, apiKey: string): string {
  const baseUrl = getGoogleApiBaseUrl().replace(/\/$/, '');
  const normalizedModel = model.replace(/^models\//, '');
  const query = new URLSearchParams({ key: apiKey });
  return `${baseUrl}/models/${encodeURIComponent(normalizedModel)}:generateContent?${query}`;
}

function collectInlineImages(response: any): string[] {
  const images: string[] = [];

  for (const candidate of response?.candidates ?? []) {
    for (const part of candidate?.content?.parts ?? []) {
      const inlineData = part?.inlineData ?? part?.inline_data;
      const data = inlineData?.data;
      if (!data) continue;

      const mimeType = inlineData?.mimeType ?? inlineData?.mime_type ?? 'image/png';
      images.push(`data:${mimeType};base64,${data}`);
    }
  }

  return images;
}

/**
 * Generate images using Gemini multimodal image output.
 */
export async function generateGoogleImages(
  options: GoogleImageGenerationOptions
): Promise<GoogleImageGenerationResult> {
  const model = normalizeGeminiModelName(options.model);
  const apiKey = getGoogleApiKey();

  if (!apiKey) {
    throw new Error(
      'Google API key is not configured. Add it in Settings > Integrations or set VITE_GOOGLE_API_KEY/GEMINI_API_KEY.'
    );
  }

  try {
    const response = await fetch(getGenerateContentUrl(model, apiKey), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: options.prompt }],
        }],
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.error?.message || `${response.status} ${response.statusText}`;
      console.warn(`[Gemini Image] Request failed with ${response.status}: ${message}`);
      throw new Error(message);
    }

    const images = collectInlineImages(payload);

    if (images.length === 0) {
      const text = payload?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text)
        ?.filter(Boolean)
        ?.join('\n')
        ?.trim();
      console.warn('[Gemini Image] Response contained no inline image data:', payload);
      throw new Error(text || 'Gemini returned no image data.');
    }

    return { images, model };
  } catch (error) {
    console.error('Gemini image generation error:', error);
    throw new Error(
      `Failed to generate images with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function isGeminiImageModel(model?: string): boolean {
  const normalized = normalizeGeminiModelName(model).toLowerCase();
  return normalized.includes('gemini') && normalized.includes('image');
}
