import { GoogleGenAI } from "@google/genai";
import { getSelectedModel } from './model-config';

// Initialize the Gemini AI client
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface MediaAttachment {
  id: string
  name: string
  type: string
  size: number
  data: string // base64 data URL or object URL
  source: string
  mediaType: 'image' | 'video' | 'audio'
  dimensions?: { width: number; height: number }
  duration?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: MediaAttachment[];
}

export interface GeminiChatHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class GeminiChatService {
  private chatHistory: GeminiChatHistory[] = [];

  constructor() {
    // History-based context is managed internally
  }

  private async convertMediaToGeminiFormat(attachment: MediaAttachment) {
    try {
      let data = attachment.data;

      // Convert blob URLs to base64
      if (data.startsWith('blob:') || data.startsWith('http')) {
        const response = await fetch(data);
        const blob = await response.blob();
        data = await this.blobToBase64(blob);
      }

      return {
        inlineData: {
          data: data.split(',')[1], // Remove data URL prefix
          mimeType: attachment.type
        }
      };
    } catch (error) {
      console.error('Error converting media:', error);
      return null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async sendMessageWithMedia(message: string, attachments?: MediaAttachment[]): Promise<AsyncGenerator<string, void, unknown>> {
    const selectedModel = getSelectedModel();
    let modelName = 'gemini-3.0-flash';
    if (selectedModel && selectedModel.provider === 'google') {
      modelName = selectedModel.name;
    }

    const parts: any[] = [];

    if (message?.trim()) {
      parts.push({ text: message });
    }

    if (attachments?.length) {
      for (const attachment of attachments) {
        const mediaPart = await this.convertMediaToGeminiFormat(attachment);
        if (mediaPart) parts.push(mediaPart);
      }
    }

    if (parts.length === 0) throw new Error('No content to send');

    // Build contents array with history for context
    const contents = [
      ...this.chatHistory.map(h => ({
        role: h.role,
        parts: h.parts
      })),
      { role: 'user' as const, parts }
    ];

    // Add user message to history
    this.chatHistory.push({ role: 'user', parts });

    // Google Search grounding tool for real-time web information
    const groundingTool = { googleSearch: {} };

    // Use generateContentStream with grounding for real-time web info
    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        tools: [groundingTool],
      },
    });

    let fullResponse = '';
    const self = this;

    async function* streamGenerator() {
      for await (const chunk of stream) {
        const text = chunk.text || '';
        fullResponse += text;
        yield text;
      }
      // Add complete response to history after streaming
      self.chatHistory.push({ role: 'model', parts: [{ text: fullResponse }] });
    }

    return streamGenerator();
  }

  async sendMessage(message: string): Promise<AsyncGenerator<string, void, unknown>> {
    return this.sendMessageWithMedia(message);
  }

  async sendMessageComplete(message: string): Promise<string> {
    const stream = await this.sendMessage(message);
    let response = '';
    for await (const chunk of stream) response += chunk;
    return response;
  }

  async sendMessageWithMediaComplete(message: string, attachments?: MediaAttachment[]): Promise<string> {
    const stream = await this.sendMessageWithMedia(message, attachments);
    let response = '';
    for await (const chunk of stream) response += chunk;
    return response;
  }

  clearHistory() {
    this.chatHistory = [];
  }

  getHistory() {
    return this.chatHistory;
  }

  addSystemContext(context: string) {
    this.chatHistory.unshift({
      role: 'model',
      parts: [{ text: `System Context: ${context}` }]
    });
  }

  reinitializeWithCurrentModel() {
    // No-op, grounding is reconfigured on each request
  }

  getCurrentModelName(): string {
    return getSelectedModel()?.name || 'gemini-3.0-flash';
  }

  /**
   * Alias for sendMessageWithMedia - grounding is now enabled by default
   * @deprecated Use sendMessageWithMedia instead
   */
  sendMessageWithGrounding = this.sendMessageWithMedia.bind(this);

  /**
   * Alias for sendMessageWithMediaComplete - grounding is now enabled by default
   * @deprecated Use sendMessageWithMediaComplete instead
   */
  sendMessageWithGroundingComplete = this.sendMessageWithMediaComplete.bind(this);
}

// Singleton instance
export const geminiService = new GeminiChatService();
export const geminiChat = geminiService;

// Convenience functions
export const sendToGemini = (message: string) => geminiService.sendMessage(message);
export const sendMediaToGemini = (message: string, attachments?: MediaAttachment[]) =>
  geminiService.sendMessageWithMedia(message, attachments);
export const sendToGeminiComplete = (message: string) => geminiService.sendMessageComplete(message);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isGeminiConfigured(): boolean {
  const key = import.meta.env.VITE_GOOGLE_API_KEY;
  return !!(key && key !== 'your_api_key_here' && key.length > 0);
}

export function getGeminiConfigStatus() {
  const isConfigured = isGeminiConfigured();

  return {
    isConfigured,
    message: isConfigured
      ? 'Gemini API is configured and ready to use!'
      : 'Gemini API key not configured. Please add your API key to the .env file.',
    instructions: isConfigured ? null : [
      '1. Get your API key from https://ai.google.dev/',
      '2. Open the .env file in the frontend folder',
      '3. Replace "your_api_key_here" with your actual API key',
      '4. Restart the development server'
    ]
  };
}

export function initializeGeminiWithContext(context: string) {
  geminiChat.addSystemContext(context);
}

export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  if (!isGeminiConfigured()) {
    return { success: false, message: 'API key not configured' };
  }

  try {
    const response = await geminiChat.sendMessageComplete(
      'Hello! Please respond with "Connection successful" to confirm you are working.'
    );
    return {
      success: true,
      message: `Connection successful! Response: ${response.substring(0, 100)}...`
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}