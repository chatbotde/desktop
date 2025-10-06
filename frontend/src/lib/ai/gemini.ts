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
  private chat: any = null;
  private chatHistory: GeminiChatHistory[] = [];

  constructor() {
    this.initializeChat();
  }

  private initializeChat() {
    const selectedModel = getSelectedModel();
    const modelName = selectedModel?.name || 'gemini-2.5-flash';
    
    this.chat = ai.chats.create({
      model: modelName,
      history: this.chatHistory,
    });
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
    if (!this.chat) throw new Error('Chat not initialized');

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

    this.chatHistory.push({ role: 'user', parts });

    const stream = await this.chat.sendMessageStream({ message: parts });
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
    this.initializeChat();
  }

  getHistory() {
    return this.chatHistory;
  }

  addSystemContext(context: string) {
    this.chatHistory.unshift({
      role: 'model',
      parts: [{ text: `System Context: ${context}` }]
    });
    this.initializeChat();
  }

  reinitializeWithCurrentModel() {
    this.initializeChat();
  }

  getCurrentModelName(): string {
    return getSelectedModel()?.name || 'gemini-2.5-flash';
  }
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