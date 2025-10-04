# AI Providers Setup Guide

## Overview

SonicPlane now supports **multiple AI providers**:
- ✅ **Google Gemini** - Multimodal AI with images, audio, video support
- ✅ **OpenAI** - GPT-4o, GPT-4 Turbo, and more
- ✅ **Anthropic** - Claude 3.5 Sonnet, Opus, Haiku
- ✅ **OpenRouter** - Access to DeepSeek, and many other models

All models are dynamically available in the frontend. You can switch between any configured provider seamlessly!

## Quick Setup

### 1. Create `.env` file

Create a file named `.env` in the `buddy/frontend/` directory:

```env
# Add only the keys for providers you want to use

# Google Gemini
VITE_GOOGLE_API_KEY=your_gemini_key_here

# OpenAI
VITE_OPENAI_API_KEY=your_openai_key_here

# Anthropic (Claude)
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here

# OpenRouter (DeepSeek, etc.)
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
```

### 2. Get API Keys

| Provider | Get Key From | Cost |
|----------|--------------|------|
| **Google Gemini** | https://ai.google.dev/ | Free tier available |
| **OpenAI** | https://platform.openai.com/ | Pay as you go |
| **Anthropic** | https://console.anthropic.com/ | Pay as you go |
| **OpenRouter** | https://openrouter.ai/ | Pay as you go |

### 3. Restart the App

After adding your API keys, restart the development server or rebuild the app.

## Using OpenRouter

OpenRouter gives you access to many models through a single API key:

**Available Models:**
- `deepseek/deepseek-chat` - DeepSeek's chat model
- `deepseek/deepseek-reasoner` - DeepSeek's reasoning model
- `anthropic/claude-3.5-sonnet` - Claude via OpenRouter
- `openai/gpt-4o` - GPT-4o via OpenRouter
- And many more!

**Benefits:**
- ✅ One API key for multiple models
- ✅ Often cheaper than direct provider access
- ✅ Easy model comparison

## Frontend Usage

### Model Selection

All configured models automatically appear in the model selector dropdown in the chat input. Models are grouped by provider:

```
📋 Model Selector
├── Google
│   ├── Gemini 2.5 Flash
│   ├── Gemini 1.5 Flash
│   └── Gemini 1.5 Pro
├── OpenAI
│   ├── GPT-4o
│   ├── GPT-4o Mini
│   └── GPT-4 Turbo
├── Anthropic
│   ├── Claude 3.5 Sonnet
│   └── Claude 3.5 Haiku
└── OpenRouter
    ├── DeepSeek Chat
    ├── DeepSeek Reasoner
    └── More models...
```

### Switching Models

Simply click on the model selector button in the chat input and choose any model. The system will automatically:
1. Switch to the correct provider
2. Load the selected model
3. Maintain your chat history
4. Show model capabilities (images, audio, video support)

## Code Integration

### Backend (main.js)

The IPC handler automatically fetches all available models:

```javascript
// In main.js - Already implemented!
ipcMain.handle('get-all-ai-models', async () => {
  const { getAllAvailableModels } = await import('./frontend/src/lib/ai/index.ts');
  return getAllAvailableModels();
});
```

### Frontend (React/TypeScript)

Use the AI module directly:

```typescript
import { 
  sendMessage, 
  getAllAvailableModels, 
  switchProvider,
  handleModelChange 
} from '@/lib/ai';

// Get all models from all providers
const models = getAllAvailableModels();

// Switch to a specific model (auto-switches provider)
handleModelChange('deepseek/deepseek-chat');

// Send a message (uses current provider/model)
const stream = await sendMessage('Hello!');
for await (const chunk of stream) {
  console.log(chunk);
}
```

## Model Features

Each model shows its capabilities:

- 📷 **Images** - Supports image input
- 🎵 **Audio** - Supports audio input
- 🎬 **Video** - Supports video input
- 💰 **Cost** - Input/output token costs

## Architecture

```
AI Module
├── Types (interfaces and base classes)
├── Providers
│   ├── GeminiProvider
│   ├── OpenAIProvider
│   ├── AnthropicProvider
│   └── OpenRouterProvider ✨ NEW!
├── Registry (manages all providers)
└── Services (unified API)
```

## Adding More Models

To add more models to OpenRouter:

1. Open `buddy/frontend/src/lib/ai/providers/openrouter-provider.ts`
2. Add your model to the `getAvailableModels()` array:

```typescript
{
  id: 'provider/model-name',
  name: 'provider/model-name',
  displayName: 'Model Display Name',
  provider: 'openrouter',
  description: 'Model description',
  category: 'reasoning',
  maxTokens: 8192,
  inputCost: 0.27,
  outputCost: 1.10,
  supportsImages: true,
  supportsAudio: false,
  supportsVideo: false,
  capabilities: ['text', 'images', 'reasoning'],
  contextWindow: 64000,
  isAvailable: true,
}
```

3. Restart the app - the model will appear automatically!

## Troubleshooting

### Models Not Appearing

1. **Check API Key**: Make sure the `VITE_OPENROUTER_API_KEY` is in your `.env` file
2. **Restart Server**: Changes to `.env` require a restart
3. **Check Console**: Look for initialization messages like:
   ```
   ✅ OpenRouter provider initialized successfully
   Main: Retrieved 15 AI models
   ```

### Provider Not Working

1. **Verify API Key**: Test your key at the provider's website
2. **Check Network**: Make sure you're connected to the internet
3. **Look at Errors**: Check browser console and terminal for error messages

### Model Costs

Model costs are displayed in the UI as `$X.XX/1K in, $X.XX/1K out`:
- **Input cost** = cost per 1000 input tokens
- **Output cost** = cost per 1000 output tokens

Example: `$0.27/1K in, $1.10/1K out` means:
- Sending 1000 tokens costs $0.27
- Receiving 1000 tokens costs $1.10

## Documentation

For more details:
- **Architecture**: `buddy/frontend/src/lib/ai/ARCHITECTURE.md`
- **Quick Start**: `buddy/frontend/src/lib/ai/QUICK_START.md`
- **Migration Guide**: `buddy/frontend/src/lib/ai/MIGRATION_GUIDE.md`
- **Usage Examples**: `buddy/frontend/src/lib/ai/examples/usage-examples.ts`

## Support

If you have issues:
1. Check the browser console for errors
2. Verify your API keys are correct
3. Make sure you've restarted the development server
4. Check that your internet connection is working

---

**Note**: For production deployment, it's recommended to proxy AI API calls through your backend to keep API keys secure, rather than exposing them in the frontend environment variables.


