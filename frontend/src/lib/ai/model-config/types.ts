export interface ModelProvider {
  id: string;
  name: string;
  description: string;
  category: 'text' | 'multimodal' | 'coding' | 'reasoning' | 'image-generation' | 'video-generation' | 'audio-generation';
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  capabilities: string[];
}

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  description: string;
  category: 'text' | 'multimodal' | 'coding' | 'reasoning' | 'image-generation' | 'video-generation' | 'audio-generation';
  maxTokens: number;
  inputCost?: number; // per 1K tokens
  outputCost?: number; // per 1K tokens
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  capabilities: string[];
  contextWindow: number;
  isAvailable: boolean;
  temperature?: number; // Default temperature for the model (0.0 to 2.0)
  isReasoning?: boolean; // Whether this is a reasoning model
  isCustom?: boolean; // Whether this is a custom model provided by the user
}
