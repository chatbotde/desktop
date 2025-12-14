import type { MediaAttachment } from '../gemini';

// Ollama API configuration
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_API_URL = `${OLLAMA_BASE_URL}/api`;

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // Base64 encoded images
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaChatService {
  private chatHistory: OllamaMessage[] = [];
  private currentModel: string = 'llama3.2';

  constructor() {
    // Initialize with empty history
  }

  /**
   * Set the current model to use
   */
  setModel(modelName: string) {
    this.currentModel = modelName;
  }

  /**
   * Get the current model name
   */
  getCurrentModel(): string {
    return this.currentModel;
  }

  /**
   * Check if Ollama is running and accessible
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama connection check failed:', error);
      return false;
    }
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<any> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelName }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  }

  private async convertMediaToOllamaFormat(attachment: MediaAttachment): Promise<string | null> {
    try {
      let data = attachment.data;
      
      // Convert blob URLs to base64
      if (data.startsWith('blob:') || data.startsWith('http')) {
        const response = await fetch(data);
        const blob = await response.blob();
        data = await this.blobToBase64(blob);
      }

      // Extract base64 data (remove data URL prefix if present)
      if (data.startsWith('data:')) {
        const base64Match = data.match(/^data:[^;]+;base64,(.+)$/);
        if (base64Match) {
          return base64Match[1];
        }
      }

      // If already base64, return as is
      return data;
    } catch (error) {
      console.error('Error converting media for Ollama:', error);
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

  async sendMessageWithMedia(
    message: string, 
    attachments?: MediaAttachment[],
    modelName?: string
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const model = modelName || this.currentModel;

    // Check if model supports images (for now, we'll try to send images if provided)
    // User should use vision models like llava, bakllava, etc.
    const images: string[] = [];
    if (attachments?.length) {
      for (const attachment of attachments) {
        if (attachment.mediaType === 'image') {
          const base64Image = await this.convertMediaToOllamaFormat(attachment);
          if (base64Image) {
            images.push(base64Image);
          }
        }
      }
    }

    // Add user message to history
    const userMessage: OllamaMessage = {
      role: 'user',
      content: message || '',
      ...(images.length > 0 && { images }),
    };
    
    this.chatHistory.push(userMessage);

    const self = this;
    async function* streamGenerator() {
      try {
        const requestBody: OllamaChatRequest = {
          model: model,
          messages: self.chatHistory,
          stream: true,
          options: {
            temperature: 0.7,
          },
        };

        const response = await fetch(`${OLLAMA_API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        if (!response.body) {
          throw new Error('No response body from Ollama API');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue;

            try {
              const data: OllamaChatResponse = JSON.parse(line);
              
              if (data.message?.content) {
                const content = data.message.content;
                fullResponse += content;
                yield content;
              }

              if (data.done) {
                // Add assistant response to history
                self.chatHistory.push({
                  role: 'assistant',
                  content: fullResponse,
                });
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse Ollama response line:', line, parseError);
            }
          }
        }
      } catch (error) {
        console.error('Ollama streaming error:', error);
        throw error;
      }
    }

    return streamGenerator();
  }

  async sendMessage(message: string, modelName?: string): Promise<AsyncGenerator<string, void, unknown>> {
    return this.sendMessageWithMedia(message, undefined, modelName);
  }

  async sendMessageComplete(message: string, modelName?: string): Promise<string> {
    const stream = await this.sendMessage(message, modelName);
    let response = '';
    for await (const chunk of stream) response += chunk;
    return response;
  }

  async sendMessageWithMediaComplete(
    message: string, 
    attachments?: MediaAttachment[],
    modelName?: string
  ): Promise<string> {
    const stream = await this.sendMessageWithMedia(message, attachments, modelName);
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
    // Remove existing system messages
    this.chatHistory = this.chatHistory.filter(msg => msg.role !== 'system');
    
    // Add new system message at the beginning
    this.chatHistory.unshift({
      role: 'system',
      content: context,
    });
  }

  reinitializeWithCurrentModel() {
    // Ollama doesn't need reinitialization
  }
}

// Singleton instance
export const ollamaService = new OllamaChatService();

// Convenience functions
export const sendToOllama = (message: string, modelName?: string) => 
  ollamaService.sendMessage(message, modelName);

export const sendMediaToOllama = (
  message: string, 
  attachments?: MediaAttachment[],
  modelName?: string
) => ollamaService.sendMessageWithMedia(message, attachments, modelName);

// Utility functions
export async function isOllamaConfigured(): Promise<boolean> {
  try {
    return await ollamaService.checkConnection();
  } catch (error) {
    return false;
  }
}

export async function getOllamaConfigStatus() {
  const isConfigured = await isOllamaConfigured();
  const models = await ollamaService.listModels();
  
  return {
    isConfigured,
    message: isConfigured 
      ? `Ollama is running and ready! Found ${models.length} model(s).`
      : 'Ollama is not running. Please start Ollama and ensure it is accessible at http://127.0.0.1:11434',
    instructions: isConfigured ? null : [
      '1. Install Ollama from https://ollama.com',
      '2. Start Ollama service',
      '3. Pull a model: ollama pull llama3.2',
      '4. Verify Ollama is running: curl http://127.0.0.1:11434',
      '5. Optionally set VITE_OLLAMA_BASE_URL in .env if using a different URL',
    ],
    availableModels: models,
  };
}

// Test connection function
export async function testOllamaConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const isRunning = await ollamaService.checkConnection();
    if (!isRunning) {
      return {
        success: false,
        message: 'Ollama is not running. Please start Ollama service.',
      };
    }

    const models = await ollamaService.listModels();
    if (models.length === 0) {
      return {
        success: false,
        message: 'Ollama is running but no models are available. Pull a model with: ollama pull llama3.2',
      };
    }

    return {
      success: true,
      message: `Ollama is running! Found ${models.length} model(s): ${models.join(', ')}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

