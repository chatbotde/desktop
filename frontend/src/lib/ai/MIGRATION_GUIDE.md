# Migration Guide: Legacy to New AI Architecture

This guide helps you migrate from the old AI implementation to the new scalable architecture.

## Overview

The new architecture provides:
- **Better organization**: Clear separation between providers, types, and services
- **Easy extension**: Add new providers with minimal code
- **Type safety**: Full TypeScript support
- **Unified API**: Consistent interface across all providers
- **Provider registry**: Central management of all providers

## Key Changes

### 1. Imports

**Before:**
```typescript
import { geminiService } from '@/lib/ai/gemini';
import { sendToGemini } from '@/lib/ai/gemini';
import { getSelectedModel } from '@/lib/ai/model-config';
```

**After:**
```typescript
import { sendMessage, getCurrentProvider, getAllAvailableModels } from '@/lib/ai';
// Or for specific providers:
import { geminiProvider, openaiProvider } from '@/lib/ai';
```

### 2. Sending Messages

**Before:**
```typescript
// Gemini
const stream = await geminiService.sendMessage('Hello');
for await (const chunk of stream) {
  console.log(chunk);
}

// Complete response
const response = await geminiService.sendMessageComplete('Hello');
```

**After:**
```typescript
// Using unified service (works with current provider)
const stream = await sendMessage('Hello');
for await (const chunk of stream) {
  console.log(chunk);
}

// Complete response
const response = await sendMessageComplete('Hello');
console.log(response.content); // Note: returns object now
```

### 3. Sending Messages with Media

**Before:**
```typescript
const stream = await geminiService.sendMessageWithMedia(
  'Describe this image',
  [imageAttachment]
);
```

**After:**
```typescript
const stream = await sendMessageWithMedia(
  'Describe this image',
  [imageAttachment]
);
```

### 4. Provider Switching

**Before:**
```typescript
// No easy way to switch providers
// Had to import and use different services manually
```

**After:**
```typescript
import { switchProvider } from '@/lib/ai';

// Switch to OpenAI
switchProvider('openai');

// Now all sendMessage calls use OpenAI
const stream = await sendMessage('Hello');
```

### 5. Getting Models

**Before:**
```typescript
import { getAvailableModels, getSelectedModel } from '@/lib/ai/model-config';

const models = getAvailableModels(); // Only configured models
const current = getSelectedModel();
```

**After:**
```typescript
import { getAllAvailableModels, getCurrentProvider } from '@/lib/ai';

// Get all models from all providers
const allModels = getAllAvailableModels();

// Get current provider and its model
const provider = getCurrentProvider();
const currentModel = provider.getCurrentModel();
```

### 6. Model Selection

**Before:**
```typescript
import { setSelectedModel } from '@/lib/ai/model-config';
import { geminiService } from '@/lib/ai/gemini';

setSelectedModel('gemini-2.5-flash');
geminiService.reinitializeWithCurrentModel();
```

**After:**
```typescript
import { handleModelChange } from '@/lib/ai';

// Automatically switches provider and model
handleModelChange('gpt-4o'); // Switches to OpenAI
handleModelChange('gemini-2.5-flash'); // Switches to Gemini
```

### 7. Chat History

**Before:**
```typescript
const history = geminiService.getHistory();
geminiService.clearHistory();
```

**After:**
```typescript
const provider = getCurrentProvider();
const history = provider.getChatHistory();
provider.clearHistory();
```

### 8. System Context

**Before:**
```typescript
geminiService.addSystemContext('You are a helpful assistant');
```

**After:**
```typescript
const provider = getCurrentProvider();
provider.setSystemContext('You are a helpful assistant');
```

## Component Updates

### Before: Using Gemini Directly

```typescript
import { useState } from 'react';
import { geminiService } from '@/lib/ai/gemini';

function ChatComponent() {
  const [response, setResponse] = useState('');

  const handleSend = async (message: string) => {
    setResponse('');
    const stream = await geminiService.sendMessage(message);
    
    for await (const chunk of stream) {
      setResponse(prev => prev + chunk);
    }
  };

  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

### After: Using Unified Service

```typescript
import { useState } from 'react';
import { sendMessage, switchProvider, getCurrentProvider } from '@/lib/ai';

function ChatComponent() {
  const [response, setResponse] = useState('');
  const [provider, setProvider] = useState(getCurrentProvider().name);

  const handleSend = async (message: string) => {
    setResponse('');
    const stream = await sendMessage(message);
    
    for await (const chunk of stream) {
      setResponse(prev => prev + chunk);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    switchProvider(newProvider as any);
    setProvider(newProvider);
  };

  return (
    <div>
      <select value={provider} onChange={(e) => handleProviderChange(e.target.value)}>
        <option value="gemini">Gemini</option>
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
      </select>
      {/* UI */}
    </div>
  );
}
```

## Breaking Changes

### 1. Response Format

The complete response methods now return a structured object:

**Before:**
```typescript
const response = await geminiService.sendMessageComplete('Hello');
// response is a string
```

**After:**
```typescript
const response = await sendMessageComplete('Hello');
// response is an object: { success: boolean, content: string, provider: string, ... }
console.log(response.content); // Access the text
```

### 2. Media Types

The `MediaAttachment` interface is now centralized in types:

```typescript
import type { MediaAttachment } from '@/lib/ai';
```

### 3. Model Configuration

The old `model-config.ts` is kept for backward compatibility, but new code should use:

```typescript
import { getAllAvailableModels } from '@/lib/ai';
```

## Backward Compatibility

The old imports still work but are deprecated:

```typescript
// Still works, but deprecated
import { geminiService } from '@/lib/ai/gemini';
import { getSelectedModel } from '@/lib/ai/model-config';
```

**Recommendation:** Update to the new API as it provides better functionality and is future-proof.

## Step-by-Step Migration

### Step 1: Update Imports

Replace old imports with new ones:

```bash
# Search for old imports
grep -r "from '@/lib/ai/gemini'" src/
grep -r "from '@/lib/ai/openai'" src/

# Replace with
from '@/lib/ai'
```

### Step 2: Update Function Calls

Update function calls to use the new API:
- `geminiService.sendMessage()` → `sendMessage()`
- `geminiService.sendMessageWithMedia()` → `sendMessageWithMedia()`
- etc.

### Step 3: Handle Response Format

Update response handling for complete responses:

```typescript
// Old
const text = await geminiService.sendMessageComplete('Hello');

// New
const response = await sendMessageComplete('Hello');
const text = response.content;
```

### Step 4: Test

Test all AI-related functionality to ensure everything works correctly.

## Common Patterns

### Pattern 1: Provider-Agnostic Chat

```typescript
function UniversalChat() {
  const [messages, setMessages] = useState([]);
  
  const sendToAI = async (text: string) => {
    // Works with any provider
    const stream = await sendMessage(text);
    let response = '';
    
    for await (const chunk of stream) {
      response += chunk;
    }
    
    return response;
  };
  
  return <ChatUI onSend={sendToAI} />;
}
```

### Pattern 2: Multi-Provider Support

```typescript
function MultiProviderChat() {
  const [provider, setProvider] = useState('gemini');
  
  const handleProviderSwitch = (newProvider: ProviderName) => {
    switchProvider(newProvider);
    setProvider(newProvider);
  };
  
  const sendMessage = async (text: string) => {
    // Automatically uses the selected provider
    const stream = await sendMessage(text);
    // ...
  };
  
  return (
    <div>
      <ProviderSelector value={provider} onChange={handleProviderSwitch} />
      <ChatUI onSend={sendMessage} />
    </div>
  );
}
```

### Pattern 3: Model Selection

```typescript
function ModelSelector() {
  const models = getAllAvailableModels();
  
  const handleModelChange = (modelId: string) => {
    // Automatically switches provider if needed
    handleModelChange(modelId);
  };
  
  return (
    <select onChange={(e) => handleModelChange(e.target.value)}>
      {models.map(model => (
        <option key={model.id} value={model.id}>
          {model.displayName} ({model.provider})
        </option>
      ))}
    </select>
  );
}
```

## Need Help?

- Check the new [README.new.md](./README.new.md) for detailed documentation
- Look at example implementations in the providers directory
- The old code is still available for reference

## Timeline

- **Phase 1 (Now)**: New architecture available, old code deprecated
- **Phase 2 (Next release)**: Encourage migration
- **Phase 3 (Future)**: Remove deprecated code

Start migrating now to benefit from the improved architecture!
