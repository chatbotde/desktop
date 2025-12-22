import Replicate from "replicate";
import { resolveEnvValue, hasValidEnvValue } from '../ai/env-utils';

const REPLICATE_PRIMARY_KEY = 'VITE_REPLICATE_API_TOKEN';
const REPLICATE_FALLBACK_KEYS = ['REPLICATE_API_TOKEN'];

// Initialize the Replicate client
const resolvedKey = resolveEnvValue(REPLICATE_PRIMARY_KEY, {
  fallbacks: REPLICATE_FALLBACK_KEYS,
  provider: 'Replicate',
});

if (!hasValidEnvValue(resolvedKey)) {
  console.warn(
    '[AI Config] Replicate API key missing or appears to be a placeholder. Update your .env with a valid value.'
  );
}

// Initialize Replicate client lazily
let replicate: Replicate | null = null;

const getReplicateClient = (): Replicate => {
  if (!replicate) {
    if (!hasValidEnvValue(resolvedKey)) {
      throw new Error("REPLICATE_API_TOKEN is not set. Please configure your Replicate API key in your .env file.");
    }
    replicate = new Replicate({ auth: resolvedKey.value });
  }
  return replicate;
};

export interface ImageGenerationOptions {
  prompt: string;
  model?: `${string}/${string}` | `${string}/${string}:${string}`;
  input_image?: string;
  output_format?: "jpg" | "png" | "webp";
  num_outputs?: number;
  aspect_ratio?: string;
  output_quality?: number;
}

export interface ImageGenerationResult {
  images: string[];
  model: string;
}

/**
 * Generate images using Replicate API
 */
export async function generateImages(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const replicate = getReplicateClient();
  const model = options.model || "black-forest-labs/flux-kontext-pro";

  const input: Record<string, any> = {
    prompt: options.prompt,
    output_format: options.output_format || "jpg",
  };

  // Add optional parameters
  if (options.input_image) {
    input.input_image = options.input_image;
  }
  if (options.num_outputs) {
    input.num_outputs = options.num_outputs;
  }
  if (options.aspect_ratio) {
    input.aspect_ratio = options.aspect_ratio;
  }
  if (options.output_quality) {
    input.output_quality = options.output_quality;
  }

  try {
    const output = await replicate.run(model, { input });

    // Handle different output formats from Replicate
    let imageUrls: string[] = [];

    if (Array.isArray(output)) {
      // Multiple images returned
      imageUrls = output.map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const itemObj = item as Record<string, unknown>;
          if ("url" in itemObj && typeof itemObj.url === "string") {
            return itemObj.url;
          }
        }
        return String(item);
      });
    } else if (typeof output === "string") {
      // Single image URL
      imageUrls = [output];
    } else if (output && typeof output === "object") {
      const outputObj = output as Record<string, unknown>;
      if ("url" in outputObj && typeof outputObj.url === "string") {
        // Single image object with URL
        imageUrls = [outputObj.url];
      } else {
        throw new Error("Unexpected output format from Replicate");
      }
    } else {
      throw new Error("Unexpected output format from Replicate");
    }

    return {
      images: imageUrls,
      model,
    };
  } catch (error) {
    console.error("Replicate image generation error:", error);
    throw new Error(
      `Failed to generate images: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Check if a model ID is an image generation model
 */
export function isImageGenerationModel(modelId: string): boolean {
  const imageModels = [
    "flux-kontext-pro",
    "flux-dev",
    "flux-schnell",
    "black-forest-labs/flux-kontext-pro",
    "black-forest-labs/flux-dev",
    "black-forest-labs/flux-schnell",
  ];
  return imageModels.some((id) => modelId.includes(id));
}
