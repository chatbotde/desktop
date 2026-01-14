/**
 * Custom Provider Service
 * Handles API calls for custom models using user-provided API keys
 */

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

import {
  getProviderConfig,
  getEffectiveBaseUrl,
  isProviderEnabled,
  type CustomProviderType,
} from '@/lib/settings/custom-providers';
import type { MediaAttachment } from './gemini';

/**
 * Check if a custom model ID belongs to a specific provider
 */
export function parseCustomModelId(modelId: string): { provider: CustomProviderType; modelName: string } | null {
  const match = modelId.match(/^custom-(google|openai|anthropic)-(.+)$/);
  if (!match) return null;
  return {
    provider: match[1] as CustomProviderType,
    modelName: match[2],
  };
}

/**
 * Check if a model ID is a custom model
 */
export function isCustomModel(modelId: string): boolean {
  return modelId.startsWith('custom-');
}

/**
 * Check if the custom provider for a model is configured
 */
export function isCustomProviderConfigured(modelId: string): boolean {
  const parsed = parseCustomModelId(modelId);
  if (!parsed) return false;
  return isProviderEnabled(parsed.provider);
}

/**
 * Helper to convert blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Custom Provider Service
 * Sends messages using user-provided API keys
 */
class CustomProviderService {
  /**
   * Send a message using Google Gemini API
   */
  private async *sendToGoogle(
    modelName: string,
    message: string,
    attachments?: MediaAttachment[]
  ): AsyncGenerator<string, void, unknown> {
    const config = getProviderConfig('google');

    const ai = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    // Build parts array with text and media
    const parts: any[] = [];

    if (message?.trim()) {
      parts.push({ text: message });
    }

    // Add media attachments
    if (attachments?.length) {
      for (const attachment of attachments) {
        let data = attachment.data;

        // Convert blob URLs to base64
        if (data.startsWith('blob:') || data.startsWith('http')) {
          const response = await fetch(data);
          const blob = await response.blob();
          data = await blobToBase64(blob);
        }

        parts.push({
          inlineData: {
            data: data.includes(',') ? data.split(',')[1] : data,
            mimeType: attachment.type
          }
        });
      }
    }

    if (parts.length === 0) {
      throw new Error('No content to send');
    }

    const response = await ai.models.generateContentStream({
      model: modelName,
      contents: [{ role: 'user', parts }],
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) yield text;
    }
  }

  /**
   * Send a message using OpenAI API
   */
  private async *sendToOpenAI(
    modelName: string,
    message: string,
    attachments?: MediaAttachment[]
  ): AsyncGenerator<string, void, unknown> {
    const config = getProviderConfig('openai');
    const baseUrl = getEffectiveBaseUrl('openai');

    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: baseUrl,
      dangerouslyAllowBrowser: true
    });

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [];

    if (message?.trim()) {
      content.push({ type: 'text', text: message });
    }

    // Add image attachments
    if (attachments?.length) {
      for (const attachment of attachments) {
        if (attachment.mediaType === 'image') {
          let data = attachment.data;
          if (data.startsWith('blob:') || data.startsWith('http')) {
            const response = await fetch(data);
            const blob = await response.blob();
            data = await blobToBase64(blob);
          }
          content.push({
            type: 'image_url',
            image_url: { url: data, detail: 'auto' }
          });
        }
      }
    }

    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content }],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }

  /**
   * Send a message using Anthropic API
   */
  private async *sendToAnthropic(
    modelName: string,
    message: string,
    attachments?: MediaAttachment[]
  ): AsyncGenerator<string, void, unknown> {
    const config = getProviderConfig('anthropic');
    const baseUrl = getEffectiveBaseUrl('anthropic');

    const anthropic = new Anthropic({
      apiKey: config.apiKey,
      baseURL: baseUrl,
      dangerouslyAllowBrowser: true
    });

    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    // Add image attachments first (Anthropic prefers images before text)
    if (attachments?.length) {
      for (const attachment of attachments) {
        if (attachment.mediaType === 'image') {
          let data = attachment.data;
          if (data.startsWith('blob:') || data.startsWith('http')) {
            const response = await fetch(data);
            const blob = await response.blob();
            data = await blobToBase64(blob);
          }
          const base64Data = data.includes(',') ? data.split(',')[1] : data;
          let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
          if (attachment.type.includes('png')) mediaType = 'image/png';
          else if (attachment.type.includes('gif')) mediaType = 'image/gif';
          else if (attachment.type.includes('webp')) mediaType = 'image/webp';

          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data,
            },
          });
        }
      }
    }

    if (message?.trim()) {
      content.push({ type: 'text', text: message });
    }

    const stream = await anthropic.messages.create({
      model: modelName,
      max_tokens: 8192,
      messages: [{ role: 'user', content }],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }

  /**
   * Send a message to a custom model
   */
  async *sendMessageWithMedia(
    modelId: string,
    message: string,
    attachments?: MediaAttachment[]
  ): AsyncGenerator<string, void, unknown> {
    const parsed = parseCustomModelId(modelId);
    if (!parsed) {
      throw new Error(`Invalid custom model ID: ${modelId}`);
    }

    const { provider, modelName } = parsed;

    if (!isProviderEnabled(provider)) {
      throw new Error(
        `Custom ${provider} provider is not configured. Please add your API key in Settings > Custom Models.`
      );
    }

    switch (provider) {
      case 'google':
        yield* this.sendToGoogle(modelName, message, attachments);
        break;
      case 'openai':
        yield* this.sendToOpenAI(modelName, message, attachments);
        break;
      case 'anthropic':
        yield* this.sendToAnthropic(modelName, message, attachments);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Send a simple text message
   */
  async sendMessage(modelId: string, message: string): Promise<AsyncGenerator<string, void, unknown>> {
    return this.sendMessageWithMedia(modelId, message);
  }
}

export const customProviderService = new CustomProviderService();
