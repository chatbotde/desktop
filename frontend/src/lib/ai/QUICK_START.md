# Quick Start Guide - AI Module

## ⚡ 5-Minute Setup

### 1. Install Dependencies (if not already installed)

```bash
cd buddy/frontend
npm install @google/genai openai @anthropic-ai/sdk
```

### 2. Configure API Keys

Create or update `.env` in `buddy/frontend/`:

```env
VITE_GOOGLE_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get API keys:
- Gemini: https://ai.google.dev/
- OpenAI: https://platform.openai.com/
- Anthropic: https://console.anthropic.com/

### 3. Start Using

```typescript
import { sendMessage } from '@/lib/ai';

const stream = await sendMessage('Hello!');
for await (const chunk of stream) {
  console.log(chunk);
}
```

Done! 🎉

---

## 📝 Common Use Cases

### Send a Simple Message

```typescript
import { sendMessage } from '@/lib/ai';

const stream = await sendMessage('What is React?');
for await (const chunk of stream) {
  console.log(chunk);
}
```

### Get Complete Response (Non-Streaming)

```typescript
import { sendMessageComplete } from '@/lib/ai';

const response = await sendMessageComplete('Explain TypeScript');
console.log(response.content);
```

### Send Image with Message

```typescript
import { sendMessageWithMedia, type MediaAttachment } from '@/lib/ai';

const image: MediaAttachment = {
  id: '1',
  name: 'photo.jpg',
  type: 'image/jpeg',
  size: 1024,
  data: 'data:image/jpeg;base64,...',
  source: 'upload',
  mediaType: 'image',
};

const stream = await sendMessageWithMedia('What is in this image?', [image]);
```

### Switch AI Provider

```typescript
import { switchProvider } from '@/lib/ai';

switchProvider('openai');  // Use OpenAI
switchProvider('gemini');  // Use Gemini
switchProvider('anthropic'); // Use Anthropic
```

### Get All Available Models

```typescript
import { getAllAvailableModels } from '@/lib/ai';

const models = getAllAvailableModels();
models.forEach(model => {
  console.log(`${model.displayName} (${model.provider})`);
});
```

### Change Model (Auto-switches provider)

```typescript
import { handleModelChange } from '@/lib/ai';

handleModelChange('gpt-4o'); // Switches to OpenAI + GPT-4o
handleModelChange('gemini-2.5-flash'); // Switches to Gemini
```

---

## 🎨 React Component Example

```typescript
import { useState } from 'react';
import { sendMessage, switchProvider } from '@/lib/ai';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      const stream = await sendMessage(message);
      for await (const chunk of stream) {
        setResponse(prev => prev + chunk);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      <div>{response}</div>
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### "API key not configured"

1. Check your `.env` file exists in `buddy/frontend/`
2. Verify API key format (no quotes, no spaces)
3. Restart dev server after changing `.env`

### "Provider not initialized"

```typescript
import { getCurrentProvider } from '@/lib/ai';

const provider = getCurrentProvider();
console.log('Configured:', provider.isConfigured());
```

### "Failed to send message"

1. Check internet connection
2. Verify API key is valid
3. Check API quota/credits
4. Look at console for detailed error

### Check Provider Status

```typescript
import { getProviderStatus } from '@/lib/ai';

const status = getProviderStatus();
console.log(status);
// {
//   gemini: { configured: true, name: 'gemini', ... },
//   openai: { configured: false, name: 'openai', ... },
//   ...
// }
```

---

## 📚 Next Steps

1. **Learn more**: Read [README.new.md](./README.new.md)
2. **See examples**: Check [examples/usage-examples.ts](./examples/usage-examples.ts)
3. **Understand architecture**: Read [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Add provider**: Follow [README.new.md](./README.new.md) "Adding a New Provider" section
5. **Migrate code**: Follow [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## 💡 Pro Tips

### Tip 1: Use Complete Response for Simple Queries

```typescript
// Streaming (for long responses)
const stream = await sendMessage('Long explanation...');

// Complete (for short responses)
const response = await sendMessageComplete('Quick answer');
```

### Tip 2: Set System Context Once

```typescript
import { getCurrentProvider } from '@/lib/ai';

const provider = getCurrentProvider();
provider.setSystemContext('You are a helpful coding assistant');

// Now all messages will use this context
```

### Tip 3: Check Capabilities Before Using Features

```typescript
import { getCurrentProvider } from '@/lib/ai';

const provider = getCurrentProvider();
if (provider.capabilities.images) {
  // Send image
} else {
  // Fallback
}
```

### Tip 4: Clear History for New Conversations

```typescript
import { getCurrentProvider } from '@/lib/ai';

const provider = getCurrentProvider();
provider.clearHistory(); // Start fresh conversation
```

---

## 🎯 Import Cheatsheet

```typescript
// Everything you need
import {
  // Main functions
  sendMessage,
  sendMessageWithMedia,
  sendMessageComplete,
  sendMessageWithMediaComplete,
  
  // Provider management
  switchProvider,
  getCurrentProvider,
  
  // Model management
  getAllAvailableModels,
  handleModelChange,
  
  // Types
  type MediaAttachment,
  type AIModel,
  type AIResponse,
} from '@/lib/ai';
```

---

## ⚡ Performance Tips

1. **Use streaming for long responses** - Better UX
2. **Clear history periodically** - Reduce token usage
3. **Choose right model** - Balance cost vs capability
4. **Implement rate limiting** - Protect your API quota

---

## 🆘 Need Help?

- **Usage questions**: See [README.new.md](./README.new.md)
- **Architecture questions**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Migration help**: See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Code examples**: See [examples/usage-examples.ts](./examples/usage-examples.ts)

---

**Happy coding! 🚀**
