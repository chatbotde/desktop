# Local LLM Usage Examples

## Quick Start with Gemma 3 270M

Since you've already pulled `gemma3:270m`, here's how to use it in your application:

### Basic Usage

```typescript
import { unifiedLocalLLMService, sendLocalLLMMessage } from '@/lib/ai/local-llm';

// Initialize the service
const initResult = await unifiedLocalLLMService.initialize();
console.log(initResult.message); // "Ollama is running! Found X model(s)."

// Use gemma3:270m directly by name
const stream = await sendLocalLLMMessage(
  'What is life?',
  undefined,
  'gemma3:270m' // Use the Ollama model name directly
);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Set Model First, Then Chat

```typescript
import { unifiedLocalLLMService } from '@/lib/ai/local-llm';

// Initialize
await unifiedLocalLLMService.initialize();

// Set the model (you can use either the Ollama name or model ID)
unifiedLocalLLMService.setModel('gemma3:270m'); // Direct Ollama name
// OR
unifiedLocalLLMService.setModel('ollama/gemma3-270m'); // Model ID

// Now send messages
const response = await unifiedLocalLLMService.sendMessageComplete('Tell me about life');
console.log(response);
```

### Get Available Models

```typescript
import { unifiedLocalLLMService } from '@/lib/ai/local-llm';

// Initialize to refresh model list
await unifiedLocalLLMService.initialize();

// Get all available models (includes gemma3:270m)
const models = unifiedLocalLLMService.getAvailableModels();
console.log(models.map(m => ({ name: m.name, displayName: m.displayName })));
// [
//   { name: 'gemma3:270m', displayName: 'Gemma 3 270M' },
//   { name: 'llama3.2', displayName: 'Llama 3.2' },
//   ...
// ]
```

### Streaming Response

```typescript
import { unifiedLocalLLMService } from '@/lib/ai/local-llm';

await unifiedLocalLLMService.initialize();
unifiedLocalLLMService.setModel('gemma3:270m');

const stream = await unifiedLocalLLMService.sendMessage('What are your thoughts on life?');

let fullResponse = '';
for await (const chunk of stream) {
  fullResponse += chunk;
  // Update UI in real-time
  console.log(chunk);
}
```

### With System Prompt

```typescript
import { unifiedLocalLLMService } from '@/lib/ai/local-llm';

await unifiedLocalLLMService.initialize();
unifiedLocalLLMService.setModel('gemma3:270m');
unifiedLocalLLMService.setSystemPrompt('You are a helpful and thoughtful assistant.');

const response = await unifiedLocalLLMService.sendMessageComplete('What is the meaning of life?');
```

### Check Model Status

```typescript
import { unifiedLocalLLMService } from '@/lib/ai/local-llm';

const status = await unifiedLocalLLMService.getConfigStatus();
console.log(status);
// {
//   isConfigured: true,
//   availableModels: ['gemma3:270m', 'llama3.2', ...],
//   selectedModel: 'Gemma 3 270M',
//   message: 'Ollama is running! Found X model(s).'
// }
```

## Integration in React Component

```tsx
import { useEffect, useState } from 'react';
import { unifiedLocalLLMService } from '@/lib/ai/local-llm';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([]);

  useEffect(() => {
    // Initialize on mount
    unifiedLocalLLMService.initialize().then(result => {
      if (result.success) {
        setModels(unifiedLocalLLMService.getAvailableModels());
        // Auto-select gemma3:270m if available
        const gemmaModel = models.find(m => m.name === 'gemma3:270m');
        if (gemmaModel) {
          unifiedLocalLLMService.setModel('gemma3:270m');
        }
      }
    });
  }, []);

  const handleSend = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const stream = await unifiedLocalLLMService.sendMessage(message);
      let fullResponse = '';
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setResponse(fullResponse);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <select onChange={(e) => unifiedLocalLLMService.setModel(e.target.value)}>
        {models.map(model => (
          <option key={model.id} value={model.name}>
            {model.displayName}
          </option>
        ))}
      </select>
      
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={handleSend} disabled={isLoading}>
        Send
      </button>
      
      <div>{response}</div>
    </div>
  );
}
```

## Notes

- The model `gemma3:270m` is automatically detected when you call `initialize()`
- You can use either the Ollama model name (`gemma3:270m`) or the model ID (`ollama/gemma3-270m`)
- Dynamic models (not in predefined list) are automatically created with basic capabilities
- The service handles model name formatting for display (e.g., `gemma3:270m` → `Gemma 3 270M`)

