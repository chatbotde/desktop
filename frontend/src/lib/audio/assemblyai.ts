import { AssemblyAI } from "assemblyai";

export interface AssemblyAITranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

export interface AssemblyAIConfig {
  apiKey: string;
  language?: string;
}

export class AssemblyAIService {
  private client: AssemblyAI | null = null;
  private config: AssemblyAIConfig;

  constructor(config: AssemblyAIConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient() {
    try {
      this.client = new AssemblyAI({
        apiKey: this.config.apiKey,
      });
      console.log('AssemblyAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AssemblyAI client:', error);
      this.client = null;
    }
  }

  /**
   * Transcribe audio file from base64 data URL
   */
  async transcribeAudio(audioDataUrl: string): Promise<AssemblyAITranscriptionResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'AssemblyAI client not initialized. Please check your API key.'
      };
    }

    try {
      console.log('Starting audio transcription with AssemblyAI...');
      
      // Convert data URL to base64 string
      const base64Data = audioDataUrl.split(',')[1];
      if (!base64Data) {
        return {
          success: false,
          error: 'Invalid audio data format'
        };
      }

      // Create buffer from base64
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      // Upload audio file
      const uploadResponse = await this.client.files.upload(audioBuffer);

      console.log('Audio file uploaded, starting transcription...');

      // Start transcription using the uploaded file URL
      const transcript = await this.client.transcripts.create({
        audio_url: uploadResponse,
        language_code: this.config.language || 'en',
        punctuate: true,
        format_text: true
      });

      // Wait for transcription to complete
      let finalTranscript = transcript;
      while (finalTranscript.status === 'queued' || finalTranscript.status === 'processing') {
        console.log(`Transcription status: ${finalTranscript.status}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalTranscript = await this.client.transcripts.get(transcript.id);
      }

      if (finalTranscript.status === 'completed') {
        console.log('Transcription completed successfully');
        return {
          success: true,
          text: finalTranscript.text || '',
          confidence: finalTranscript.confidence || 0,
          language: finalTranscript.language_code || 'en',
          duration: finalTranscript.audio_duration || 0
        };
      } else {
        return {
          success: false,
          error: `Transcription failed with status: ${finalTranscript.status}`
        };
      }

    } catch (error) {
      console.error('AssemblyAI transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transcription error'
      };
    }
  }

  /**
   * Transcribe audio from File/Blob object
   */
  async transcribeAudioFile(audioFile: File | Blob): Promise<AssemblyAITranscriptionResult> {
    try {
      // Convert file to base64
      const base64DataUrl = await this.fileToBase64(audioFile);
      return this.transcribeAudio(base64DataUrl);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process audio file'
      };
    }
  }

  /**
   * Convert File/Blob to base64 data URL
   */
  private fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.client !== null && this.config.apiKey.length > 0;
  }

  /**
   * Get service status
   */
  getStatus(): { configured: boolean; apiKeyPresent: boolean } {
    return {
      configured: this.client !== null,
      apiKeyPresent: this.config.apiKey.length > 0
    };
  }
}

// Create and export a singleton instance
export const assemblyAIService = new AssemblyAIService({
  apiKey: import.meta.env.VITE_ASSEMBLYAI_API_KEY || '',
  language: 'en'
});

// Export convenience functions
export const transcribeWithAssemblyAI = (audioDataUrl: string) => 
  assemblyAIService.transcribeAudio(audioDataUrl);

export const transcribeFileWithAssemblyAI = (audioFile: File | Blob) => 
  assemblyAIService.transcribeAudioFile(audioFile);
