# Local LLM Module

This module provides a complete, independent interface for local LLM operations using Ollama. It is designed to be completely separate from cloud-based AI services and can be scaled independently.

## 📁 Structure

```
local-llm/
├── index.ts                    # Main entry point - exports all local LLM modules
├── ollama.ts                    # Ollama API service implementation
├── model-config.ts              # Local LLM model configuration
├── unified-local-service.ts     # Unified service for local LLM operations
└── README.md                    # This file
```

## 🚀 Quick Start

### 1. Install and Start Ollama

1. Download and install Ollama from [https://ollama.com](https://ollama.com)
2. Start the Ollama service
3. Pull a model:
   ```bash
   ollama pull llama3.2
   ```
4. Verify Ollama is running:
   ```bash
   curl http://127.0.0.1:11434
   ```

### 2. Configure Environment (Optional)

If Ollama is running on a different URL, add to your `.env` file:

```env
VITE_OLLAMA_BASE_URL=http://127.0.0.1:11434
```

### 3. Use in Your Code

```typescript
import { unifiedLocalLLMService, sendLocalLLMMessage } from '@/lib/ai/local-llm';

// Initialize the service
const initResult = await unifiedLocalLLMService.initialize();
if (!initResult.success) {
  console.error(initResult.message);
  return;
}

// Set a model
unifiedLocalLLMService.setModel('ollama/llama3.2');

// Send a message (streaming)
const stream = await sendLocalLLMMessage('Hello! How are you?');
for await (const chunk of stream) {
  console.log(chunk); // Print each chunk as it arrives
}

// Or get complete response
const response = await unifiedLocalLLMService.sendMessageComplete('What is TypeScript?');
console.log(response);
```

## 📚 API Reference

### UnifiedLocalLLMService

The main service class for local LLM operations.

#### Methods

- `initialize()`: Initialize the service and check Ollama connection
- `setModel(modelId: string)`: Set the current model to use
- `getCurrentModel()`: Get the currently selected model
- `sendMessage(message, attachments?, modelId?)`: Send a message with streaming response
- `sendMessageComplete(message, attachments?, modelId?)`: Send a message and get complete response
- `clearHistory()`: Clear chat history
- `setSystemPrompt(prompt: string)`: Set system prompt
- `isConfigured()`: Check if Ollama is running
- `getConfigStatus()`: Get configuration status

### OllamaChatService

Low-level service for direct Ollama API interaction.

#### Methods

- `checkConnection()`: Check if Ollama is accessible
- `listModels()`: List available models from Ollama
- `getModelInfo(modelName)`: Get information about a specific model
- `sendMessage(message, modelName?)`: Send a message
- `sendMessageWithMedia(message, attachments?, modelName?)`: Send a message with media

### Model Configuration

- `getLocalLLMModels()`: Get all available local LLM models
- `getRecommendedLocalLLMModels()`: Get recommended models
- `setLocalLLMModel(id)`: Set the selected model

## 🎯 Available Models

### Text Models

- **llama3.2** - Fast and efficient text generation (Recommended)
- **llama3.1** - High quality text generation (Recommended)
- **mistral** - Efficient and capable language model (Recommended)
- **phi3** - Small but capable model
- **gemma2** - Open source language model (Recommended)

### Coding Models

- **codellama** - Specialized for code generation (Recommended)

### Multimodal Models (Vision)

- **llava** - Large Language and Vision Assistant (Recommended)
- **llava-llama3** - LLaVA based on Llama 3 (Recommended)
- **bakllava** - Alternative vision-language model

## 💡 Usage Examples

### Basic Chat

```typescript
import { unifiedLocalLLMService } from '@/lib/ai/local-llm';

await unifiedLocalLLMService.initialize();
unifiedLocalLLMService.setModel('ollama/llama3.2');

const stream = await unifiedLocalLLMService.sendMessage('Explain quantum computing');
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### With Images (Vision Models)

```typescript
import { unifiedLocalLLMService } from '@/lib/ai/local-llm';
import type { MediaAttachment } from '@/lib/ai/gemini';

await unifiedLocalLLMService.initialize();
unifiedLocalLLMService.setModel('ollama/llava');

const attachments: MediaAttachment[] = [
  {
    id: 'img1',
    name: 'photo.jpg',
    type: 'image/jpeg',
    size: 1024,
    data: 'data:image/jpeg;base64,...',
    source: 'upload',
    mediaType: 'image',
  },
];

const stream = await unifiedLocalLLMService.sendMessage(
  'What is in this image?',
  attachments
);
```

### System Prompts

```typescript
unifiedLocalLLMService.setSystemPrompt(
  'You are a helpful coding assistant. Always provide code examples.'
);
```

### Check Configuration

```typescript
const status = await unifiedLocalLLMService.getConfigStatus();
console.log(status);
// {
//   isConfigured: true,
//   availableModels: ['llama3.2', 'llava', 'mistral'],
//   selectedModel: 'Llama 3.2',
//   message: 'Ollama is running! Found 3 model(s).'
// }
```

## 🔧 Advanced Usage

### Direct Ollama Service Access

```typescript
import { ollamaService, testOllamaConnection } from '@/lib/ai/local-llm';

// Test connection
const test = await testOllamaConnection();
console.log(test.message);

// List available models
const models = await ollamaService.listModels();
console.log('Available models:', models);

// Get model info
const info = await ollamaService.getModelInfo('llama3.2');
console.log(info);
```

### Model Selection

```typescript
import { localLLMModelConfig, getRecommendedLocalLLMModels } from '@/lib/ai/local-llm';

// Get recommended models
const recommended = getRecommendedLocalLLMModels();
console.log(recommended);

// Get models by category
const visionModels = localLLMModelConfig.getModelsByCategory('multimodal');
console.log(visionModels);

// Set model
localLLMModelConfig.setSelectedModel('ollama/llava');
```

## 🏗️ Architecture

This module is designed to be:

1. **Independent**: Completely separate from cloud-based AI services
2. **Scalable**: Can be extended with additional local LLM providers
3. **Modular**: Each component can be used independently
4. **Type-safe**: Full TypeScript support with proper types

## 🔄 Integration with Main AI Service

While this module is independent, you can optionally integrate it with the main unified AI service if needed. However, it's recommended to use this module directly for local LLM operations to maintain separation.

## 📝 Notes

- Local LLM models don't require API keys
- Models are downloaded and run locally
- No usage tracking is applied to local LLM (since it's free)
- Vision models require specific model names (e.g., `llava`, `bakllava`)
- Model availability depends on what you've pulled with Ollama

## 🐛 Troubleshooting

### Ollama not running

```typescript
const isRunning = await ollamaService.checkConnection();
if (!isRunning) {
  console.error('Start Ollama: ollama serve');
}
```

### Model not found

```typescript
const models = await ollamaService.listModels();
if (!models.includes('llama3.2')) {
  console.log('Pull model: ollama pull llama3.2');
}
```

### Connection errors

Check that:
1. Ollama is running (`curl http://127.0.0.1:11434`)
2. The URL in `VITE_OLLAMA_BASE_URL` is correct
3. No firewall is blocking the connection

## 📖 Additional Resources

- [Ollama Documentation](https://docs.ollama.com)
- [Ollama Models](https://ollama.com/library)
- [Ollama API Reference](https://docs.ollama.com/api)

