# Scalable AI Provider Architecture

A flexible, extensible, and type-safe architecture for integrating multiple AI providers into your application.

## 🎯 Features

- **Multiple AI Providers**: Gemini, OpenAI, Anthropic (easily extensible)
- **Unified API**: Consistent interface across all providers
- **Type-Safe**: Full TypeScript support with interfaces
- **Provider Registry**: Central registry for managing providers
- **Easy Extension**: Add new providers with minimal code
- **Provider Switching**: Switch between providers at runtime
- **Capability Detection**: Automatic detection of provider capabilities
- **Persistent State**: Saves provider and model selection

## 📁 Architecture

```
ai/
├── types/                  # Type definitions
│   ├── base.ts            # Base interfaces and abstract classes
│   └── index.ts           # Type exports
├── providers/             # Provider implementations
│   ├── gemini-provider.ts
│   ├── openai-provider.ts
│   ├── anthropic-provider.ts
│   └── index.ts
├── registry/              # Provider registry
│   ├── provider-registry.ts
│   └── index.ts
├── services/              # High-level services
│   ├── unified-service.ts
│   └── index.ts
├── model-config.ts        # Legacy model configuration
└── index.ts               # Main entry point
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { sendMessage, switchProvider } from '@/lib/ai';

// Send a message with the current provider
const stream = await sendMessage('Hello!');
for await (const chunk of stream) {
  console.log(chunk);
}

// Get complete response (non-streaming)
const response = await sendMessageComplete('What is React?');
console.log(response.content);
```

### Provider Switching

```typescript
import { switchProvider, getCurrentProvider } from '@/lib/ai';

// Switch to OpenAI
switchProvider('openai');

// Get current provider info
const provider = getCurrentProvider();
console.log(provider.name, provider.capabilities);
```

### Media Attachments

```typescript
import { sendMessageWithMedia } from '@/lib/ai';
import type { MediaAttachment } from '@/lib/ai';

const imageAttachment: MediaAttachment = {
  id: '1',
  name: 'image.jpg',
  type: 'image/jpeg',
  size: 1024,
  data: 'data:image/jpeg;base64,...',
  source: 'upload',
  mediaType: 'image',
};

const stream = await sendMessageWithMedia(
  'What do you see in this image?',
  [imageAttachment]
);

for await (const chunk of stream) {
  console.log(chunk);
}
```

### Working with Models

```typescript
import { getAllAvailableModels, handleModelChange } from '@/lib/ai';

// Get all available models from all providers
const models = getAllAvailableModels();
console.log(models);

// Switch to a specific model (auto-switches provider)
handleModelChange('gpt-4o');
```

## 🔧 Adding a New Provider

Adding a new AI provider is straightforward:

### Step 1: Create Provider Class

Create a new file in `providers/` directory:

```typescript
// providers/my-provider.ts
import { BaseAIProvider, type AIModel, type MediaAttachment } from '../types';

export class MyProvider extends BaseAIProvider {
  readonly name = 'myprovider';
  readonly capabilities = {
    streaming: true,
    images: true,
    audio: false,
    video: false,
    functionCalling: false,
    systemPrompts: true,
    chatHistory: true,
  };

  constructor() {
    super();
    this.currentModel = 'my-model-1';
    this.initialize();
  }

  isConfigured(): boolean {
    const key = import.meta.env.VITE_MYPROVIDER_API_KEY || '';
    return !!(key && key !== 'your_api_key_here');
  }

  async initialize(): Promise<void> {
    // Initialize your AI client here
    console.log('✅ MyProvider initialized');
  }

  async sendMessage(message: string): Promise<AsyncGenerator<string, void, unknown>> {
    // Implement message sending logic
    async function* generator() {
      yield 'Response chunk 1';
      yield 'Response chunk 2';
    }
    return generator();
  }

  async sendMessageWithMedia(
    message: string,
    attachments: MediaAttachment[]
  ): Promise<AsyncGenerator<string, void, unknown>> {
    // Implement media message sending logic
    return this.sendMessage(message);
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'my-model-1',
        name: 'my-model-1',
        displayName: 'My Model 1',
        provider: 'myprovider',
        description: 'My first model',
        category: 'text',
        maxTokens: 4096,
        supportsImages: true,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text', 'images'],
        contextWindow: 100000,
        isAvailable: true,
      },
    ];
  }
}

export const myProvider = new MyProvider();
```

### Step 2: Register the Provider

Update `registry/provider-registry.ts`:

```typescript
// Add import
import { myProvider } from '../providers/my-provider';

// Update ProviderName type
export type ProviderName = 'gemini' | 'openai' | 'anthropic' | 'myprovider';

// In registerDefaultProviders():
private registerDefaultProviders(): void {
  this.registerProvider('gemini', geminiProvider);
  this.registerProvider('openai', openaiProvider);
  this.registerProvider('anthropic', anthropicProvider);
  this.registerProvider('myprovider', myProvider); // Add this
}
```

### Step 3: Export from Providers

Update `providers/index.ts`:

```typescript
export { MyProvider, myProvider } from './my-provider';
```

That's it! Your new provider is now available throughout the application.

## 📚 API Reference

### Core Interfaces

#### `IAIProvider`

Base interface that all providers must implement:

```typescript
interface IAIProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  
  isConfigured(): boolean;
  initialize(): Promise<void>;
  sendMessage(message: string, options?: AIRequestOptions): Promise<AsyncGenerator<string>>;
  sendMessageWithMedia(message: string, attachments: MediaAttachment[], options?: AIRequestOptions): Promise<AsyncGenerator<string>>;
  sendMessageComplete(message: string, options?: AIRequestOptions): Promise<string>;
  sendMessageWithMediaComplete(message: string, attachments: MediaAttachment[], options?: AIRequestOptions): Promise<string>;
  getChatHistory(): ChatMessage[];
  clearHistory(): void;
  setSystemContext(context: string): void;
  getAvailableModels(): AIModel[];
  getCurrentModel(): string;
  setModel(modelId: string): void;
}
```

#### `BaseAIProvider`

Abstract base class with common functionality:

```typescript
abstract class BaseAIProvider implements IAIProvider {
  // Implements common methods
  // Child classes only need to implement:
  // - sendMessage()
  // - sendMessageWithMedia()
  // - getAvailableModels()
  // - initialize()
  // - isConfigured()
}
```

### Types

#### `MediaAttachment`

```typescript
interface MediaAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 data URL
  source: string;
  mediaType: 'image' | 'video' | 'audio';
  dimensions?: { width: number; height: number };
  duration?: number;
}
```

#### `AIModel`

```typescript
interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  description: string;
  category: 'text' | 'multimodal' | 'coding' | 'reasoning';
  maxTokens: number;
  inputCost?: number;
  outputCost?: number;
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  capabilities: string[];
  contextWindow: number;
  isAvailable: boolean;
}
```

#### `AIRequestOptions`

```typescript
interface AIRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  systemPrompt?: string;
}
```

## 🔐 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# Google Gemini
VITE_GOOGLE_API_KEY=your_gemini_api_key_here

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Anthropic
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Get API Keys

- **Gemini**: https://ai.google.dev/
- **OpenAI**: https://platform.openai.com/
- **Anthropic**: https://console.anthropic.com/

## 🎨 UI Integration

### Using with Components

```typescript
import { useState } from 'react';
import { sendMessage, getAllAvailableModels, switchProvider } from '@/lib/ai';

function ChatComponent() {
  const [response, setResponse] = useState('');
  const models = getAllAvailableModels();

  const handleSend = async (message: string) => {
    setResponse('');
    const stream = await sendMessage(message);
    
    for await (const chunk of stream) {
      setResponse(prev => prev + chunk);
    }
  };

  return (
    <div>
      <select onChange={(e) => switchProvider(e.target.value as any)}>
        <option value="gemini">Gemini</option>
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
      </select>
      
      {/* Your UI here */}
    </div>
  );
}
```

## 🧪 Testing

```typescript
import { getProviderStatus, getCurrentProvider } from '@/lib/ai';

// Check provider status
const status = getProviderStatus();
console.log('Provider Status:', status);

// Test current provider
const provider = getCurrentProvider();
console.log('Current:', provider.name);
console.log('Configured:', provider.isConfigured());
console.log('Capabilities:', provider.capabilities);
```

## 📊 Provider Comparison

| Feature | Gemini | OpenAI | Anthropic |
|---------|--------|--------|-----------|
| Text | ✅ | ✅ | ✅ |
| Images | ✅ | ✅ | ✅ |
| Audio | ✅ | ✅ | ❌ |
| Video | ✅ | ❌ | ❌ |
| Streaming | ✅ | ✅ | ✅ |
| Function Calling | ✅ | ✅ | ✅ |
| Max Context | 1M | 128K | 200K |

## 🤝 Contributing

When adding new features:
1. Follow the existing patterns
2. Add TypeScript types
3. Update this README
4. Test with all providers
5. Handle errors gracefully

## 📄 License

MIT
