# OpenRouter Integration Guide

## Overview

OpenRouter has been successfully integrated into the SonicPlane Buddy AI system, providing access to a wide variety of AI models through a single API.

## Features

- **Multiple Model Support**: Access to Claude, GPT, Gemini, Llama, Mistral, and many other models
- **Unified Interface**: Same API as other providers (Gemini, OpenAI, Anthropic)
- **Automatic Routing**: Automatically routes to OpenRouter when OpenRouter models are selected
- **Media Support**: Supports image attachments for vision-capable models
- **Streaming**: Real-time response streaming
- **Cost Optimization**: Access to cheaper alternatives to premium models

## Available Models

### Claude Models (via OpenRouter)
- `anthropic/claude-3.5-sonnet` - Most capable Claude model
- `anthropic/claude-3-haiku` - Fast and efficient
- `anthropic/claude-3-opus` - Most powerful reasoning

### OpenAI Models (via OpenRouter)
- `openai/gpt-4o` - Latest GPT-4 with vision
- `openai/gpt-4-turbo` - High-performance model
- `openai/gpt-3.5-turbo` - Cost-effective option

### Google Models (via OpenRouter)
- `google/gemini-pro-1.5` - Multimodal capabilities
- `google/gemini-flash-1.5` - Fast and efficient

### Open Source Models
- `meta-llama/llama-3.1-405b-instruct` - Large Llama model
- `meta-llama/llama-3.1-70b-instruct` - Balanced Llama model
- `mistralai/mistral-7b-instruct` - Fast and efficient
- `teknium/openhermes-2.5-mistral-7b` - Fine-tuned for helpfulness

## Setup

1. **Get OpenRouter API Key**:
   - Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Create an account and get your API key

2. **Configure Environment**:
   ```bash
   # Add to your .env file
   VITE_OPENROUTER_API_KEY=your_actual_api_key_here
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

## Usage

### Using the Unified AI Service (Recommended)

```typescript
import { unifiedAIService, sendMessage } from '@/lib/ai';

// The service automatically routes to OpenRouter when OpenRouter models are selected
const stream = await sendMessage('Hello, how are you?');
for await (const chunk of stream) {
  console.log(chunk);
}
```

### Direct OpenRouter Usage

```typescript
import { openRouterService, sendToOpenRouter } from '@/lib/ai';

// Direct usage
const stream = await sendToOpenRouter('Explain quantum computing');
for await (const chunk of stream) {
  console.log(chunk);
}
```

### With Media Attachments

```typescript
import { sendMessage } from '@/lib/ai';

const attachments = [
  {
    mediaType: 'image',
    data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
    type: 'image/jpeg'
  }
];

const stream = await sendMessage('What do you see in this image?', attachments);
```

## Model Selection

The system automatically detects OpenRouter models by their provider field. When you select an OpenRouter model from the model selector, the unified service will automatically route requests to OpenRouter.

## Configuration Status

Check if OpenRouter is properly configured:

```typescript
import { isOpenRouterConfigured, getOpenRouterConfigStatus } from '@/lib/ai';

// Check configuration status
const status = getOpenRouterConfigStatus();
console.log(status.message);

if (status.instructions) {
  console.log('Setup instructions:', status.instructions);
}
```

## Cost Benefits

OpenRouter provides access to many models at competitive prices:

- **Llama 3.1 70B**: $0.90/1M tokens (much cheaper than GPT-4)
- **Mistral 7B**: $0.20/1M tokens (very cost-effective)
- **Claude 3.5 Sonnet**: Same price as direct API
- **GPT-4o**: Same price as direct API

## Error Handling

The system provides clear error messages for common issues:

- Missing API key: "OpenRouter API key not configured"
- Invalid model: "Unsupported AI provider: openrouter"
- Network issues: Automatic retry and error reporting

## Best Practices

1. **Model Selection**: Choose models based on your needs:
   - **Reasoning**: Claude 3.5 Sonnet, Llama 3.1 405B
   - **Speed**: Mistral 7B, Gemini Flash
   - **Cost**: Llama 3.1 70B, Mistral 7B
   - **Vision**: GPT-4o, Claude 3.5 Sonnet

2. **API Key Security**: Never commit API keys to version control

3. **Error Handling**: Always check configuration status before making requests

4. **Streaming**: Use streaming for better user experience with long responses

## Troubleshooting

### Common Issues

1. **"OpenRouter API key not configured"**
   - Check your .env file has `VITE_OPENROUTER_API_KEY`
   - Restart the development server
   - Verify the API key is valid

2. **"Unsupported AI provider"**
   - Make sure you've selected an OpenRouter model
   - Check the model configuration

3. **Network errors**
   - Check your internet connection
   - Verify OpenRouter service status
   - Check API key permissions

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Check configuration
console.log('OpenRouter configured:', isOpenRouterConfigured());

// Check selected model
import { getSelectedModel } from '@/lib/ai';
console.log('Selected model:', getSelectedModel());
```

## Integration Complete

OpenRouter is now fully integrated and ready to use! The system supports all OpenRouter models with the same interface as other AI providers.
