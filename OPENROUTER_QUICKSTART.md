# OpenRouter Integration - Quick Start

## ✅ What Was Added

1. **OpenRouter Provider** - Complete implementation with streaming support
2. **DeepSeek Models** - DeepSeek Chat and DeepSeek Reasoner now available
3. **Dynamic Model Loading** - All models from all providers show in frontend
4. **Automatic Provider Switching** - Select any model, system switches provider automatically

## 🚀 Quick Setup (3 Steps)

### Step 1: Add API Key

Create `buddy/frontend/.env` file:

```env
VITE_OPENROUTER_API_KEY=your_key_here
```

Get your key: https://openrouter.ai/

### Step 2: Restart App

```bash
# In buddy/frontend
npm run dev
```

### Step 3: Select Model

Open the app → Click model selector → Choose any model!

## 📋 Available Models Now

### Google (Gemini)
- Gemini 2.5 Flash ⚡
- Gemini 1.5 Flash
- Gemini 1.5 Pro
- Gemini 2.0 Flash (Experimental)

### OpenAI
- GPT-4o
- GPT-4o Mini
- GPT-4 Turbo
- GPT-3.5 Turbo

### Anthropic
- Claude 3.5 Sonnet
- Claude 3.5 Haiku
- Claude 3 Opus

### OpenRouter ✨ NEW!
- **DeepSeek Chat** - $0.27/1K in, $1.10/1K out
- **DeepSeek Reasoner** - $0.55/1K in, $2.19/1K out
- Claude 3.5 Sonnet (via OpenRouter)
- GPT-4o (via OpenRouter)

## 💡 How It Works

```typescript
// Frontend automatically fetches all models
const models = await window.chatInputAPI.getAllAIModels();

// Models grouped by provider in dropdown
// User clicks model → System switches provider → Model ready!
```

## 🎯 Key Features

✅ **Input → Output**: Just like Google models, send message, get response
✅ **Streaming**: Real-time response streaming
✅ **Images**: Support for image inputs (DeepSeek Chat)
✅ **Context**: 64K token context window
✅ **History**: Chat history maintained across models
✅ **Cost Display**: Shows input/output costs in UI

## 📝 Usage Example

### JavaScript
```javascript
// All models automatically available in dropdown
// User selects model → system handles provider switching

// Send message (works with any model)
await window.chatInputAPI.sendMessage({
  message: "Hello!",
  // model is automatically determined by user selection
});
```

### TypeScript (in React/frontend)
```typescript
import { sendMessage, handleModelChange } from '@/lib/ai';

// Switch to DeepSeek
handleModelChange('deepseek/deepseek-chat');

// Send message
const stream = await sendMessage('Explain quantum computing');
for await (const chunk of stream) {
  console.log(chunk);
}
```

## 🔧 Architecture

```
User selects "DeepSeek Chat" in UI
    ↓
Frontend calls handleModelChange()
    ↓
Registry finds OpenRouter provider
    ↓
Switches to OpenRouter provider
    ↓
Sets model to 'deepseek/deepseek-chat'
    ↓
User sends message
    ↓
OpenRouter provider sends to DeepSeek
    ↓
Response streams back to UI
```

## 📊 Cost Comparison

| Model | Provider | Input | Output |
|-------|----------|-------|--------|
| DeepSeek Chat | OpenRouter | $0.27/1K | $1.10/1K |
| DeepSeek Reasoner | OpenRouter | $0.55/1K | $2.19/1K |
| Gemini 2.5 Flash | Google | $0.075/1K | $0.30/1K |
| GPT-4o | OpenAI | $5.00/1K | $15.00/1K |
| Claude 3.5 Sonnet | Anthropic | $3.00/1K | $15.00/1K |

## 🛠️ Files Modified

1. **New Provider**: `buddy/frontend/src/lib/ai/providers/openrouter-provider.ts`
2. **Registry Updated**: `buddy/frontend/src/lib/ai/registry/provider-registry.ts`
3. **Models Config**: `buddy/frontend/src/lib/ai/model-config.ts`
4. **Frontend Selection**: `buddy/chat-input/modules/model-selection.js`
5. **IPC Preload**: `buddy/chat-input/chat-input-preload.js`
6. **Main Process**: `buddy/main.js`

## 🎨 UI Updates

**Model Dropdown Now Shows:**
```
┌─────────────────────────────────┐
│ 📋 Select Model                 │
├─────────────────────────────────┤
│ Google                          │
│  • Gemini 2.5 Flash            │
│  • Gemini 1.5 Flash            │
│                                 │
│ OpenAI                          │
│  • GPT-4o                       │
│  • GPT-4o Mini                  │
│                                 │
│ Anthropic                       │
│  • Claude 3.5 Sonnet           │
│                                 │
│ OpenRouter ✨                   │
│  • DeepSeek Chat               │
│    📷 Images  $0.27/1K in      │
│  • DeepSeek Reasoner           │
│    🧠 Reasoning  $0.55/1K in   │
└─────────────────────────────────┘
```

## 🔍 Testing

1. **Start App**: `npm run dev` in `buddy/frontend`
2. **Open Chat Input**: Click the chat input window
3. **Open Model Selector**: Click model button (default shows current model)
4. **See All Models**: Should see grouped models from all providers
5. **Select DeepSeek**: Click "DeepSeek Chat"
6. **Send Message**: Type message and send
7. **See Response**: Should stream back from DeepSeek

## 🐛 Troubleshooting

### "OpenRouter not appearing"
- Check: `VITE_OPENROUTER_API_KEY` in `.env`
- Restart: Development server
- Look: Console for "✅ OpenRouter provider initialized"

### "Models not loading"
- Open Console: Press F12
- Check: Network tab for failed requests
- Verify: API key is valid on openrouter.ai

### "Can't switch models"
- Check: Model dropdown is populated
- Look: Console for errors
- Try: Refresh the page

## 📚 More Information

- **Full Setup Guide**: `buddy/frontend/AI_SETUP_GUIDE.md`
- **Architecture Docs**: `buddy/frontend/src/lib/ai/ARCHITECTURE.md`
- **Provider Code**: `buddy/frontend/src/lib/ai/providers/`

## 🎉 Summary

You now have:
- ✅ OpenRouter provider fully integrated
- ✅ DeepSeek models available
- ✅ All models dynamically loaded in UI
- ✅ Automatic provider switching
- ✅ Input → Output working like Google models
- ✅ Cost information displayed
- ✅ Streaming responses
- ✅ Image support (where available)

**Just add your API key and start using any model!** 🚀


