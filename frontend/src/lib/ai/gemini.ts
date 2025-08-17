import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI client
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
      this.chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: this.chatHistory,
      });
    } catch (error) {
      console.error('Failed to initialize Gemini chat:', error);
      throw new Error('Failed to initialize Gemini chat. Please check your API key.');
    }
  }

  // Send a message and get a streaming response
  async sendMessage(message: string): Promise<AsyncGenerator<string, void, unknown>> {
    if (!this.chat) {
      throw new Error('Chat not initialized');
    }

    try {
      // Add user message to history
      this.chatHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const stream = await this.chat.sendMessageStream({
        message: message,
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
      console.error('Error sending message to Gemini:', error);
      throw new Error('Failed to send message to Gemini');
    }
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

  // Get chat history
  getChatHistory(): GeminiChatHistory[] {
    return [...this.chatHistory];
  }

  // Clear chat history and reinitialize
  clearHistory() {
    this.chatHistory = [];
    this.initializeChat();
  }

  // Add a system message or initial context
  addSystemContext(context: string) {
    this.chatHistory.unshift({
      role: 'model',
      parts: [{ text: context }]
    });
    this.initializeChat();
  }
}

// Create a singleton instance
export const geminiChat = new GeminiChatService();

// Export a simple function for direct use
export async function sendToGemini(message: string): Promise<AsyncGenerator<string, void, unknown>> {
  return await geminiChat.sendMessage(message);
}

export async function sendToGeminiComplete(message: string): Promise<string> {
  return await geminiChat.sendMessageComplete(message);
}