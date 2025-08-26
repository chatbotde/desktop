import { geminiService } from './gemini';
import type { MediaAttachment } from './gemini';
import { assemblyAIService } from '../audio/assemblyai';

export type AIProvider = 'gemini' | 'assemblyai';

export interface AIResponse {
  success: boolean;
  content: string;
  provider: AIProvider;
  error?: string;
  metadata?: {
    confidence?: number;
    language?: string;
    duration?: number;
    model?: string;
  };
}

export interface AudioProcessingOptions {
  provider: AIProvider;
  message?: string;
  language?: string;
}

export class UnifiedAIService {
  private currentProvider: AIProvider = 'gemini';

  /**
   * Set the current AI provider
   */
  setProvider(provider: AIProvider) {
    this.currentProvider = provider;
    console.log(`AI provider switched to: ${provider}`);
  }

  /**
   * Get the current AI provider
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Process audio with the selected AI provider
   */
  async processAudio(
    audioAttachment: MediaAttachment, 
    options: AudioProcessingOptions
  ): Promise<AIResponse> {
    const provider = options.provider || this.currentProvider;
    
    try {
      if (provider === 'assemblyai') {
        return await this.processWithAssemblyAI(audioAttachment, options);
      } else {
        return await this.processWithGemini(audioAttachment, options);
      }
    } catch (error) {
      return {
        success: false,
        content: '',
        provider,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Process audio with AssemblyAI (transcription only)
   */
  private async processWithAssemblyAI(
    audioAttachment: MediaAttachment,
    _options: AudioProcessingOptions
  ): Promise<AIResponse> {
    if (!assemblyAIService.isConfigured()) {
      return {
        success: false,
        content: '',
        provider: 'assemblyai',
        error: 'AssemblyAI is not configured. Please check your API key.'
      };
    }

    try {
      console.log('Processing audio with AssemblyAI...');
      
      const transcription = await assemblyAIService.transcribeAudio(audioAttachment.data);
      
      if (transcription.success && transcription.text) {
        return {
          success: true,
          content: transcription.text,
          provider: 'assemblyai',
          metadata: {
            confidence: transcription.confidence,
            language: transcription.language,
            duration: transcription.duration,
            model: 'AssemblyAI Transcription'
          }
        };
      } else {
        return {
          success: false,
          content: '',
          provider: 'assemblyai',
          error: transcription.error || 'Transcription failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        content: '',
        provider: 'assemblyai',
        error: error instanceof Error ? error.message : 'AssemblyAI processing failed'
      };
    }
  }

  /**
   * Process audio with Gemini (full AI conversation)
   */
  private async processWithGemini(
    audioAttachment: MediaAttachment,
    options: AudioProcessingOptions
  ): Promise<AIResponse> {
    try {
      console.log('Processing audio with Gemini...');
      
      const message = options.message || 'Please transcribe and respond to this audio';
      
      // Get streaming response from Gemini
      const stream = await geminiService.sendMessageWithMedia(message, [audioAttachment]);
      
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
      }
      
      return {
        success: true,
        content: fullResponse,
        provider: 'gemini',
        metadata: {
          model: 'Gemini 2.5 Flash'
        }
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        provider: 'gemini',
        error: error instanceof Error ? error.message : 'Gemini processing failed'
      };
    }
  }

  /**
   * Send text message with media to Gemini
   */
  async sendMessageWithMedia(
    message: string, 
    attachments?: MediaAttachment[]
  ): Promise<AIResponse> {
    try {
      const stream = await geminiService.sendMessageWithMedia(message, attachments);
      
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
      }
      
      return {
        success: true,
        content: fullResponse,
        provider: 'gemini',
        metadata: {
          model: 'Gemini 2.5 Flash'
        }
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        provider: 'gemini',
        error: error instanceof Error ? error.message : 'Failed to send message to Gemini'
      };
    }
  }

  /**
   * Check service status
   */
  getServiceStatus(): {
    gemini: { configured: boolean };
    assemblyai: { configured: boolean; apiKeyPresent: boolean };
  } {
    return {
      gemini: { configured: true }, // Gemini is always configured if imported
      assemblyai: assemblyAIService.getStatus()
    };
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = ['gemini'];
    
    if (assemblyAIService.isConfigured()) {
      providers.push('assemblyai');
    }
    
    return providers;
  }
}

// Create and export a singleton instance
export const unifiedAIService = new UnifiedAIService();

// Export convenience functions
export const processAudioWithAI = (
  audioAttachment: MediaAttachment, 
  options: AudioProcessingOptions
) => unifiedAIService.processAudio(audioAttachment, options);

export const setAIProvider = (provider: AIProvider) => 
  unifiedAIService.setProvider(provider);

export const getCurrentAIProvider = () => 
  unifiedAIService.getCurrentProvider();
