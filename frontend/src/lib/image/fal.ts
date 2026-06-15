import { fal } from '@fal-ai/client';
import { resolveEnvValue, hasValidEnvValue } from '../ai/env-utils';

const FAL_PRIMARY_KEY = 'VITE_FALAI_API_KEY';
const FAL_FALLBACK_KEYS = ['FAL_KEY', 'VITE_FAL_KEY', 'FALAI_API_KEY'];

const resolvedKey = resolveEnvValue(FAL_PRIMARY_KEY, {
  fallbacks: FAL_FALLBACK_KEYS,
  provider: 'fal.ai',
});

if (!hasValidEnvValue(resolvedKey)) {
  console.warn(
    '[AI Config] fal.ai API key missing or appears to be a placeholder. Set VITE_FALAI_API_KEY in buddy/.env.'
  );
}

let falConfigured = false;

function ensureFalConfigured(): void {
  if (falConfigured) return;

  if (!hasValidEnvValue(resolvedKey)) {
    throw new Error(
      'VITE_FALAI_API_KEY is not set. Please configure your fal.ai API key in buddy/.env.'
    );
  }

  fal.config({ credentials: resolvedKey.value });
  falConfigured = true;
}

export interface FalImageGenerationOptions {
  prompt: string;
  model?: string;
  num_images?: number;
  image_size?: string;
  output_format?: 'jpeg' | 'png';
}

export interface FalImageGenerationResult {
  images: string[];
  model: string;
}

export interface FalVideoGenerationOptions {
  prompt: string;
  model?: string;
  duration?: string;
  aspect_ratio?: string;
}

export interface FalVideoGenerationResult {
  videos: string[];
  model: string;
}

function extractImageUrls(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];

  const record = data as Record<string, unknown>;

  if (Array.isArray(record.images)) {
    return record.images
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'url' in item) {
          const url = (item as { url?: unknown }).url;
          return typeof url === 'string' ? url : null;
        }
        return null;
      })
      .filter((url): url is string => Boolean(url));
  }

  if (record.image && typeof record.image === 'object' && 'url' in record.image) {
    const url = (record.image as { url?: unknown }).url;
    return typeof url === 'string' ? [url] : [];
  }

  return [];
}

function extractVideoUrls(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];

  const record = data as Record<string, unknown>;
  const urls: string[] = [];

  const video = record.video;
  if (video && typeof video === 'object' && 'url' in video) {
    const url = (video as { url?: unknown }).url;
    if (typeof url === 'string') urls.push(url);
  }

  if (typeof record.video_url === 'string') {
    urls.push(record.video_url);
  }

  if (Array.isArray(record.videos)) {
    for (const item of record.videos) {
      if (typeof item === 'string') urls.push(item);
      else if (item && typeof item === 'object' && 'url' in item) {
        const url = (item as { url?: unknown }).url;
        if (typeof url === 'string') urls.push(url);
      }
    }
  }

  return urls;
}

/**
 * Generate images using fal.ai Model APIs
 */
export async function generateImages(
  options: FalImageGenerationOptions
): Promise<FalImageGenerationResult> {
  ensureFalConfigured();

  const model = options.model || 'fal-ai/flux/schnell';
  const input: Record<string, unknown> = {
    prompt: options.prompt,
  };

  if (options.num_images) input.num_images = options.num_images;
  if (options.image_size) input.image_size = options.image_size;
  if (options.output_format) input.output_format = options.output_format;

  try {
    const result = await fal.subscribe(model, { input });
    const imageUrls = extractImageUrls(result.data);

    if (imageUrls.length === 0) {
      throw new Error('fal.ai returned no image URLs');
    }

    return { images: imageUrls, model };
  } catch (error) {
    console.error('fal.ai image generation error:', error);
    throw new Error(
      `Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate videos using fal.ai Model APIs
 */
export async function generateVideos(
  options: FalVideoGenerationOptions
): Promise<FalVideoGenerationResult> {
  ensureFalConfigured();

  const model = options.model || 'fal-ai/kling-video/v2/master/text-to-video';
  const input: Record<string, unknown> = {
    prompt: options.prompt,
  };

  if (options.duration) input.duration = options.duration;
  if (options.aspect_ratio) input.aspect_ratio = options.aspect_ratio;

  try {
    const result = await fal.subscribe(model, { input });
    const videoUrls = extractVideoUrls(result.data);

    if (videoUrls.length === 0) {
      throw new Error('fal.ai returned no video URLs');
    }

    return { videos: videoUrls, model };
  } catch (error) {
    console.error('fal.ai video generation error:', error);
    throw new Error(
      `Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function isFalImageModel(modelId: string): boolean {
  const imageModels = [
    'fal-ai/flux/schnell',
    'fal-ai/flux/dev',
    'fal-ai/flux-pro',
    'fal-ai/nano-banana',
    'flux-schnell',
    'flux-dev',
    'flux-pro',
    'nano-banana',
  ];
  return imageModels.some((id) => modelId.includes(id));
}

export interface FalVirtualTryOnOptions {
  personImage: string;
  garmentImage: string;
  category?: 'tops' | 'bottoms' | 'one-pieces' | 'auto';
  garmentPhotoType?: 'auto' | 'model' | 'flat-lay';
  model?: string;
}

/**
 * Virtual try-on: composite a garment onto a person image using FASHN on fal.ai.
 */
export async function virtualTryOn(
  options: FalVirtualTryOnOptions
): Promise<FalImageGenerationResult> {
  ensureFalConfigured();

  const model = options.model || 'fal-ai/fashn/tryon/v1.6';
  const input: Record<string, unknown> = {
    model_image: options.personImage,
    garment_image: options.garmentImage,
    category: options.category ?? 'auto',
    garment_photo_type: options.garmentPhotoType ?? 'auto',
    mode: 'balanced',
  };

  try {
    const result = await fal.subscribe(model, { input });
    const imageUrls = extractImageUrls(result.data);

    if (imageUrls.length === 0) {
      throw new Error('fal.ai returned no try-on image URLs');
    }

    return { images: imageUrls, model };
  } catch (error) {
    console.error('fal.ai virtual try-on error:', error);
    throw new Error(
      `Failed to run virtual try-on: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function isFalVideoModel(modelId: string): boolean {
  const videoModels = [
    'fal-ai/kling-video',
    'fal-ai/minimax/video',
    'kling-video',
    'minimax/video',
  ];
  return videoModels.some((id) => modelId.includes(id));
}
