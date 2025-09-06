import { GoogleGenAI } from "@google/genai";
import { getSelectedModel } from './model-config';

// Debug environment variables
console.log('🔍 Gemini Service Debug:');
console.log('VITE_GOOGLE_API_KEY available:', !!import.meta.env.VITE_GOOGLE_API_KEY);
console.log('VITE_GEMINI_API_KEY available:', !!import.meta.env.VITE_GEMINI_API_KEY);
if (!import.meta.env.VITE_GOOGLE_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY) {
  console.error('❌ No Gemini API key found in environment variables!');
  console.error('Available env vars:', Object.keys(import.meta.env));
}

// Initialize the Gemini AI client
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
console.log('Using API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NONE');

const ai = new GoogleGenAI({
  apiKey: apiKey,
});

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
    try {
      const selectedModel = getSelectedModel();
      const modelName = selectedModel?.name || 'gemini-2.5-flash';
      
      console.log(`Initializing Gemini chat with model: ${modelName}`);
      
      this.chat = ai.chats.create({
        model: modelName,
        history: this.chatHistory,
      });
    } catch (error) {
      console.error('Failed to initialize Gemini chat:', error);
      throw new Error('Failed to initialize Gemini chat. Please check your API key.');
    }
  }

  // Convert media attachment to Gemini format
  private async convertMediaToGeminiFormat(attachment: MediaAttachment) {
    try {
      if (attachment.mediaType === 'image') {
        // For images, we can use the data URL directly
        return {
          inlineData: {
            data: attachment.data.split(',')[1], // Remove data:image/...;base64, prefix
            mimeType: attachment.type
          }
        };
      } else if (attachment.mediaType === 'video' || attachment.mediaType === 'audio') {
        // For video/audio, we need to convert to base64 if it's an object URL
        if (attachment.data.startsWith('blob:') || attachment.data.startsWith('http')) {
          // Convert object URL to base64
          const response = await fetch(attachment.data);
          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          return {
            inlineData: {
              data: base64.split(',')[1], // Remove data:...;base64, prefix
              mimeType: attachment.type
            }
          };
        } else {
          // Already base64
          return {
            inlineData: {
              data: attachment.data.split(',')[1],
              mimeType: attachment.type
            }
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error converting media to Gemini format:', error);
      return null;
    }
  }

  // Convert blob to base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Send a message with media attachments and get a streaming response
  async sendMessageWithMedia(message: string, attachments?: MediaAttachment[]): Promise<AsyncGenerator<string, void, unknown>> {
    if (!this.chat) {
      throw new Error('Chat not initialized');
    }

    try {
      // Prepare message parts
      const parts: any[] = [];
      
      // Add text content if present
      if (message && message.trim()) {
        parts.push({ text: message });
      }

      // Add media attachments if present
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const mediaPart = await this.convertMediaToGeminiFormat(attachment);
          if (mediaPart) {
            parts.push(mediaPart);
          }
        }
      }

      if (parts.length === 0) {
        throw new Error('No content to send');
      }

      // Add user message to history
      this.chatHistory.push({
        role: 'user',
        parts: parts
      });

      const stream = await this.chat.sendMessageStream({
        message: parts,
      });

      let fullResponse = '';

      async function* streamGenerator() {
        for await (const chunk of stream) {
          const text = chunk.text || '';
          fullResponse += text;
          yield text;
        }
      }

      const generator = streamGenerator();
      
      // After streaming is complete, add the full response to history
      const result = generator;
      const originalNext = result.next.bind(result);
      let isComplete = false;
      
      result.next = async () => {
        const { value, done } = await originalNext();
        
        if (done && !isComplete) {
          // Add the complete assistant response to history
          this.chatHistory.push({
            role: 'model',
            parts: [{ text: fullResponse }]
          });
          isComplete = true;
        }
        
        return { value, done };
      };

      return result;
    } catch (error) {
      console.error('Error sending message with media to Gemini:', error);
      throw new Error('Failed to send message with media to Gemini');
    }
  }

  // Send a message and get a streaming response (text only - for backward compatibility)
  async sendMessage(message: string): Promise<AsyncGenerator<string, void, unknown>> {
    return this.sendMessageWithMedia(message);
  }

  // Send a message and get the complete response (non-streaming)
  async sendMessageComplete(message: string): Promise<string> {
    const stream = await this.sendMessage(message);
    let fullResponse = '';

    for await (const chunk of stream) {
      fullResponse += chunk;
    }

    return fullResponse;
  }

  // Send a message with media and get the complete response (non-streaming)
  async sendMessageWithMediaComplete(message: string, attachments?: MediaAttachment[]): Promise<string> {
    const stream = await this.sendMessageWithMedia(message, attachments);
    let fullResponse = '';

    for await (const chunk of stream) {
      fullResponse += chunk;
    }

    return fullResponse;
  }

  // Clear chat history
  clearHistory() {
    this.chatHistory = [];
    this.initializeChat();
  }

  // Get chat history
  getHistory() {
    return this.chatHistory;
  }

  // Add system context to the chat
  addSystemContext(context: string) {
    // Add system context as a model message to establish the context
    this.chatHistory.unshift({
      role: 'model',
      parts: [{ text: `System Context: ${context}` }]
    });
    
    // Reinitialize chat with updated history
    this.initializeChat();
  }

  // Reinitialize chat with current selected model
  reinitializeWithCurrentModel() {
    console.log('Reinitializing Gemini chat with current selected model...');
    this.initializeChat();
  }

  // Get current model name being used
  getCurrentModelName(): string {
    const selectedModel = getSelectedModel();
    return selectedModel?.name || 'gemini-2.5-flash';
  }
}

// Create and export a singleton instance
export const geminiService = new GeminiChatService();

// Export convenience functions
export const sendToGemini = (message: string) => geminiService.sendMessage(message);
export const sendMediaToGemini = (message: string, attachments?: MediaAttachment[]) => 
  geminiService.sendMessageWithMedia(message, attachments);

// Export the chat instance for backward compatibility
export const geminiChat = geminiService;

// Export the complete message function for backward compatibility
export const sendToGeminiComplete = (message: string) => geminiService.sendMessageComplete(message);