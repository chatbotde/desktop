/**
 * Model Capability Validation System
 * 
 * Provides robust validation for model capabilities before sending messages.
 * Helps users understand what each model supports (images, audio, video, etc.)
 */

import { getSelectedModel, type AIModel } from '../model-config';
import type { MediaAttachment } from '../gemini';

// ============================================================================
// TYPES
// ============================================================================

export interface ModelCapabilities {
  supportsText: boolean;
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  supportsCodeGeneration: boolean;
  supportsFunctionCalling: boolean;
  supportsAdvancedReasoning: boolean;
  supportsJsonOutput: boolean;
  maxTokens: number;
  contextWindow: number;
  category: string;
}

export interface CapabilityValidationResult {
  isValid: boolean;
  errors: CapabilityError[];
  warnings: CapabilityWarning[];
  unsupportedAttachments: MediaAttachment[];
  supportedAttachments: MediaAttachment[];
}

export interface CapabilityError {
  code: CapabilityErrorCode;
  message: string;
  attachment?: MediaAttachment;
  suggestion?: string;
}

export interface CapabilityWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export type CapabilityErrorCode = 
  | 'IMAGE_NOT_SUPPORTED'
  | 'AUDIO_NOT_SUPPORTED'
  | 'VIDEO_NOT_SUPPORTED'
  | 'NO_MODEL_SELECTED'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'MESSAGE_TOO_LONG'
  | 'NO_CONTENT';

export interface CapabilitySummary {
  modelName: string;
  provider: string;
  category: string;
  supports: {
    text: boolean;
    images: boolean;
    audio: boolean;
    video: boolean;
    codeGeneration: boolean;
    functionCalling: boolean;
    advancedReasoning: boolean;
  };
  limits: {
    maxTokens: number;
    contextWindow: number;
  };
  capabilities: string[];
}

// ============================================================================
// CAPABILITY HELPERS
// ============================================================================

/**
 * Get capabilities for a specific model
 */
export function getModelCapabilities(model: AIModel | null): ModelCapabilities {
  if (!model) {
    return {
      supportsText: false,
      supportsImages: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsCodeGeneration: false,
      supportsFunctionCalling: false,
      supportsAdvancedReasoning: false,
      supportsJsonOutput: false,
      maxTokens: 0,
      contextWindow: 0,
      category: 'none',
    };
  }

  return {
    supportsText: model.capabilities.includes('text'),
    supportsImages: model.supportsImages,
    supportsAudio: model.supportsAudio,
    supportsVideo: model.supportsVideo,
    supportsCodeGeneration: model.capabilities.includes('code-generation'),
    supportsFunctionCalling: model.capabilities.includes('function-calling'),
    supportsAdvancedReasoning: model.capabilities.includes('advanced-reasoning'),
    supportsJsonOutput: model.capabilities.includes('json-output'),
    maxTokens: model.maxTokens,
    contextWindow: model.contextWindow,
    category: model.category,
  };
}

/**
 * Get a human-readable capability summary for the current model
 */
export function getCapabilitySummary(model?: AIModel | null): CapabilitySummary {
  const selectedModel = model ?? getSelectedModel();
  
  if (!selectedModel) {
    return {
      modelName: 'No model selected',
      provider: 'N/A',
      category: 'N/A',
      supports: {
        text: false,
        images: false,
        audio: false,
        video: false,
        codeGeneration: false,
        functionCalling: false,
        advancedReasoning: false,
      },
      limits: {
        maxTokens: 0,
        contextWindow: 0,
      },
      capabilities: [],
    };
  }

  const caps = getModelCapabilities(selectedModel);

  return {
    modelName: selectedModel.displayName,
    provider: selectedModel.provider,
    category: selectedModel.category,
    supports: {
      text: caps.supportsText,
      images: caps.supportsImages,
      audio: caps.supportsAudio,
      video: caps.supportsVideo,
      codeGeneration: caps.supportsCodeGeneration,
      functionCalling: caps.supportsFunctionCalling,
      advancedReasoning: caps.supportsAdvancedReasoning,
    },
    limits: {
      maxTokens: caps.maxTokens,
      contextWindow: caps.contextWindow,
    },
    capabilities: selectedModel.capabilities,
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate attachments against the current model's capabilities
 * Returns detailed validation results with errors and suggestions
 */
export function validateAttachments(
  attachments: MediaAttachment[] | undefined,
  model?: AIModel | null
): CapabilityValidationResult {
  const selectedModel = model ?? getSelectedModel();
  const errors: CapabilityError[] = [];
  const warnings: CapabilityWarning[] = [];
  const unsupportedAttachments: MediaAttachment[] = [];
  const supportedAttachments: MediaAttachment[] = [];

  // Check if model is selected
  if (!selectedModel) {
    return {
      isValid: false,
      errors: [{
        code: 'NO_MODEL_SELECTED',
        message: 'No AI model selected',
        suggestion: 'Please select an AI model before sending a message.',
      }],
      warnings: [],
      unsupportedAttachments: attachments || [],
      supportedAttachments: [],
    };
  }

  // If no attachments, validation passes
  if (!attachments || attachments.length === 0) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      unsupportedAttachments: [],
      supportedAttachments: [],
    };
  }

  const caps = getModelCapabilities(selectedModel);

  // Validate each attachment
  for (const attachment of attachments) {
    const mediaType = attachment.mediaType;

    switch (mediaType) {
      case 'image':
        if (!caps.supportsImages) {
          errors.push({
            code: 'IMAGE_NOT_SUPPORTED',
            message: `${selectedModel.displayName} does not support image inputs`,
            attachment,
            suggestion: getImageSupportSuggestion(selectedModel),
          });
          unsupportedAttachments.push(attachment);
        } else {
          supportedAttachments.push(attachment);
        }
        break;

      case 'audio':
        if (!caps.supportsAudio) {
          errors.push({
            code: 'AUDIO_NOT_SUPPORTED',
            message: `${selectedModel.displayName} does not support audio inputs`,
            attachment,
            suggestion: getAudioSupportSuggestion(selectedModel),
          });
          unsupportedAttachments.push(attachment);
        } else {
          supportedAttachments.push(attachment);
        }
        break;

      case 'video':
        if (!caps.supportsVideo) {
          errors.push({
            code: 'VIDEO_NOT_SUPPORTED',
            message: `${selectedModel.displayName} does not support video inputs`,
            attachment,
            suggestion: getVideoSupportSuggestion(selectedModel),
          });
          unsupportedAttachments.push(attachment);
        } else {
          supportedAttachments.push(attachment);
        }
        break;

      default:
        // Unknown media type - treat as unsupported
        warnings.push({
          code: 'UNKNOWN_MEDIA_TYPE',
          message: `Unknown media type: ${mediaType}`,
          suggestion: 'This attachment type may not be processed correctly.',
        });
        unsupportedAttachments.push(attachment);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    unsupportedAttachments,
    supportedAttachments,
  };
}

/**
 * Validate a message (text + attachments) before sending
 */
export function validateMessage(
  message: string,
  attachments?: MediaAttachment[],
  model?: AIModel | null
): CapabilityValidationResult {
  const selectedModel = model ?? getSelectedModel();
  const result = validateAttachments(attachments, selectedModel);
  
  // Check if there's any content to send
  const hasText = message && message.trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;
  
  if (!hasText && !hasAttachments) {
    result.isValid = false;
    result.errors.push({
      code: 'NO_CONTENT',
      message: 'Please provide a message or attach media',
      suggestion: 'Type a message or add an image, audio, or video file.',
    });
  }

  // Check message length (rough estimate)
  if (selectedModel && hasText) {
    const estimatedTokens = Math.ceil(message.length / 4);
    if (estimatedTokens > selectedModel.contextWindow * 0.9) {
      result.warnings.push({
        code: 'MESSAGE_TOO_LONG',
        message: 'Your message may be too long for this model',
        suggestion: `Consider shortening your message. ${selectedModel.displayName} has a context window of ${formatNumber(selectedModel.contextWindow)} tokens.`,
      });
    }
  }

  return result;
}

// ============================================================================
// SUGGESTION HELPERS
// ============================================================================

/**
 * Get suggestion for models that support images
 */
function getImageSupportSuggestion(currentModel: AIModel): string {
  const imageModels = [
    'Gemini 2.5 Pro', 'Gemini 2.0 Flash', 'Gemini 1.5 Flash', 'Gemini 1.5 Pro',
    'GPT-4o', 'GPT-4 Turbo',
    'Claude 3.5 Sonnet',
    'Grok 2 Vision'
  ];
  
  const suggestions = imageModels.filter(m => m !== currentModel.displayName);
  return `Try switching to a model that supports images: ${suggestions.slice(0, 3).join(', ')}, etc.`;
}

/**
 * Get suggestion for models that support audio
 */
function getAudioSupportSuggestion(currentModel: AIModel): string {
  const audioModels = [
    'Gemini 2.5 Pro', 'Gemini 2.0 Flash', 'Gemini 1.5 Flash', 'Gemini 1.5 Pro',
    'GPT-4o'
  ];
  
  const suggestions = audioModels.filter(m => m !== currentModel.displayName);
  return `Try switching to a model that supports audio: ${suggestions.slice(0, 3).join(', ')}.`;
}

/**
 * Get suggestion for models that support video
 */
function getVideoSupportSuggestion(currentModel: AIModel): string {
  const videoModels = [
    'Gemini 2.5 Pro', 'Gemini 2.0 Flash', 'Gemini 1.5 Flash', 'Gemini 1.5 Pro', 'Gemini 2.5 Flash'
  ];
  
  const suggestions = videoModels.filter(m => m !== currentModel.displayName);
  return `Try switching to a Gemini model that supports video: ${suggestions.slice(0, 3).join(', ')}.`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

/**
 * Get a user-friendly capability badge string for UI display
 */
export function getCapabilityBadges(model?: AIModel | null): string[] {
  const selectedModel = model ?? getSelectedModel();
  if (!selectedModel) return [];

  const badges: string[] = [];
  const caps = getModelCapabilities(selectedModel);

  if (caps.supportsText) badges.push('📝 Text');
  if (caps.supportsImages) badges.push('🖼️ Images');
  if (caps.supportsAudio) badges.push('🎵 Audio');
  if (caps.supportsVideo) badges.push('🎬 Video');
  if (caps.supportsCodeGeneration) badges.push('💻 Code');
  if (caps.supportsFunctionCalling) badges.push('🔧 Functions');
  if (caps.supportsAdvancedReasoning) badges.push('🧠 Reasoning');

  return badges;
}

/**
 * Get capability icons for compact UI display
 */
export function getCapabilityIcons(model?: AIModel | null): { icon: string; label: string; supported: boolean }[] {
  const selectedModel = model ?? getSelectedModel();
  if (!selectedModel) {
    return [
      { icon: '📝', label: 'Text', supported: false },
      { icon: '🖼️', label: 'Images', supported: false },
      { icon: '🎵', label: 'Audio', supported: false },
      { icon: '🎬', label: 'Video', supported: false },
    ];
  }

  const caps = getModelCapabilities(selectedModel);

  return [
    { icon: '📝', label: 'Text', supported: caps.supportsText },
    { icon: '🖼️', label: 'Images', supported: caps.supportsImages },
    { icon: '🎵', label: 'Audio', supported: caps.supportsAudio },
    { icon: '🎬', label: 'Video', supported: caps.supportsVideo },
  ];
}

/**
 * Format validation errors for user display
 */
export function formatValidationErrors(result: CapabilityValidationResult): string {
  if (result.isValid) return '';

  const messages: string[] = [];

  for (const error of result.errors) {
    let msg = error.message;
    if (error.attachment) {
      msg = `${error.attachment.name}: ${msg}`;
    }
    messages.push(msg);
  }

  return messages.join('\n');
}

/**
 * Format validation result as a user-friendly message
 */
export function formatValidationMessage(result: CapabilityValidationResult): {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  suggestions: string[];
} {
  if (result.isValid && result.warnings.length === 0) {
    return {
      type: 'success',
      title: 'Ready to send',
      message: 'All attachments are supported by the current model.',
      suggestions: [],
    };
  }

  if (!result.isValid) {
    const unsupportedTypes = new Set(result.errors.map(e => e.code));
    const typeLabels: Record<string, string> = {
      'IMAGE_NOT_SUPPORTED': 'images',
      'AUDIO_NOT_SUPPORTED': 'audio files',
      'VIDEO_NOT_SUPPORTED': 'videos',
    };

    const unsupportedLabels = Array.from(unsupportedTypes)
      .map(t => typeLabels[t] || t)
      .filter(Boolean);

    return {
      type: 'error',
      title: 'Unsupported attachments',
      message: `This model doesn't support ${unsupportedLabels.join(' or ')}.`,
      suggestions: result.errors
        .map(e => e.suggestion)
        .filter((s): s is string => Boolean(s))
        .filter((s, i, arr) => arr.indexOf(s) === i), // unique
    };
  }

  return {
    type: 'warning',
    title: 'Warnings',
    message: result.warnings.map(w => w.message).join(' '),
    suggestions: result.warnings
      .map(w => w.suggestion)
      .filter((s): s is string => Boolean(s)),
  };
}

/**
 * Check if any attachment would be unsupported before adding
 * Useful for showing warnings in UI before user adds attachment
 */
export function willAttachmentBeSupported(
  mediaType: 'image' | 'audio' | 'video',
  model?: AIModel | null
): { supported: boolean; message: string } {
  const selectedModel = model ?? getSelectedModel();
  
  if (!selectedModel) {
    return {
      supported: false,
      message: 'Please select a model first.',
    };
  }

  const caps = getModelCapabilities(selectedModel);

  switch (mediaType) {
    case 'image':
      return {
        supported: caps.supportsImages,
        message: caps.supportsImages 
          ? `${selectedModel.displayName} supports images`
          : `${selectedModel.displayName} doesn't support images. ${getImageSupportSuggestion(selectedModel)}`,
      };
    case 'audio':
      return {
        supported: caps.supportsAudio,
        message: caps.supportsAudio
          ? `${selectedModel.displayName} supports audio`
          : `${selectedModel.displayName} doesn't support audio. ${getAudioSupportSuggestion(selectedModel)}`,
      };
    case 'video':
      return {
        supported: caps.supportsVideo,
        message: caps.supportsVideo
          ? `${selectedModel.displayName} supports video`
          : `${selectedModel.displayName} doesn't support video. ${getVideoSupportSuggestion(selectedModel)}`,
      };
    default:
      return {
        supported: false,
        message: 'Unknown media type.',
      };
  }
}
