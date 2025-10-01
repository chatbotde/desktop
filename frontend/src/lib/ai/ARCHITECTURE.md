# AI Module Architecture

## 📁 Folder Structure

```
ai/
├── types/                          # Type definitions and interfaces
│   ├── base.ts                     # Core interfaces (IAIProvider, BaseAIProvider)
│   └── index.ts                    # Type exports
│
├── providers/                      # AI provider implementations
│   ├── gemini-provider.ts          # Google Gemini implementation
│   ├── openai-provider.ts          # OpenAI implementation
│   ├── anthropic-provider.ts       # Anthropic Claude implementation
│   └── index.ts                    # Provider exports
│
├── registry/                       # Provider registry system
│   ├── provider-registry.ts        # Central provider management
│   └── index.ts                    # Registry exports
│
├── services/                       # High-level services
│   ├── unified-service.ts          # Unified AI service facade
│   └── index.ts                    # Service exports
│
├── examples/                       # Usage examples and patterns
│   └── usage-examples.ts           # Practical code examples
│
├── index.ts                        # Main module entry point
├── model-config.ts                 # Legacy model configuration (kept for compatibility)
├── gemini.ts                       # Legacy Gemini service (deprecated)
├── gemini-utils.ts                 # Legacy Gemini utilities (deprecated)
├── openai.ts                       # Legacy OpenAI service (deprecated)
├── antropic.ts                     # Legacy Anthropic file (deprecated)
├── unified-ai-service.ts           # Old unified service (deprecated)
│
├── README.md                       # Original documentation
├── README.new.md                   # New architecture documentation
├── MIGRATION_GUIDE.md              # Migration guide from old to new
└── ARCHITECTURE.md                 # This file
```

## 🏗️ Architecture Layers

### Layer 1: Types (`types/`)

**Purpose**: Define contracts and interfaces that all providers must follow.

**Key Components**:
- `IAIProvider`: Interface that all providers implement
- `BaseAIProvider`: Abstract base class with common functionality
- `MediaAttachment`, `ChatMessage`, `AIModel`: Shared data types
- `ProviderCapabilities`: Define what each provider can do
- `AIRequestOptions`, `AIResponse`: Request/response types

**Why**: 
- Ensures consistency across providers
- Provides type safety
- Makes it easy to add new providers
- Documents expected behavior

### Layer 2: Providers (`providers/`)

**Purpose**: Concrete implementations of AI providers.

**Each Provider**:
- Extends `BaseAIProvider`
- Implements provider-specific logic
- Handles API communication
- Manages provider-specific state
- Converts between formats

**Current Providers**:
1. **GeminiProvider**: Google's Gemini AI
   - Full multimodal support (text, images, audio, video)
   - Streaming responses
   - Long context window (1M tokens)

2. **OpenAIProvider**: OpenAI's GPT models
   - Text and image support
   - Streaming responses
   - Function calling
   - 128K context window

3. **AnthropicProvider**: Anthropic's Claude
   - Text and image support
   - Streaming responses
   - 200K context window

**Why**:
- Encapsulates provider-specific details
- Easy to add/remove providers
- Each provider is independent
- Can be tested in isolation

### Layer 3: Registry (`registry/`)

**Purpose**: Central management of all available providers.

**Key Features**:
- Register/unregister providers
- Get provider by name
- Switch between providers
- List available models
- Check provider status
- Persist selection

**Why**:
- Single source of truth
- Easy provider discovery
- Centralized configuration
- Makes adding providers simple

### Layer 4: Services (`services/`)

**Purpose**: High-level API for application use.

**Key Features**:
- Simplified API for common operations
- Provider-agnostic interface
- Error handling
- Response formatting
- Model management

**Why**:
- Easy to use
- Hides complexity
- Consistent interface
- Good error handling

## 🔄 Data Flow

### Sending a Message

```
User Code
    ↓
unifiedAIService.sendMessage()
    ↓
providerRegistry.getCurrentProvider()
    ↓
provider.sendMessage()
    ↓
Provider-specific API call
    ↓
Stream back to user
```

### Switching Providers

```
User Code
    ↓
switchProvider('openai')
    ↓
providerRegistry.setCurrentProvider()
    ↓
localStorage.setItem()
    ↓
Provider switched
```

### Adding a Model

```
User Code
    ↓
handleModelChange('gpt-4o')
    ↓
providerRegistry.findProviderByModel()
    ↓
Switch to provider
    ↓
provider.setModel()
    ↓
Model updated
```

## 🎯 Design Patterns

### 1. Strategy Pattern

Each provider is a different strategy for AI communication:

```typescript
interface IAIProvider {
  sendMessage(): Promise<AsyncGenerator>;
}

class GeminiProvider implements IAIProvider { /* ... */ }
class OpenAIProvider implements IAIProvider { /* ... */ }
```

### 2. Registry Pattern

Central registry manages all providers:

```typescript
class ProviderRegistry {
  private providers: Map<string, IAIProvider>;
  registerProvider(name: string, provider: IAIProvider);
  getProvider(name: string): IAIProvider;
}
```

### 3. Singleton Pattern

Services are singletons to maintain state:

```typescript
class UnifiedAIService {
  private static instance: UnifiedAIService;
  static getInstance(): UnifiedAIService;
}
```

### 4. Factory Pattern

Registry creates and manages provider instances:

```typescript
const provider = providerRegistry.getProvider('openai');
```

### 5. Facade Pattern

Unified service provides simple interface to complex system:

```typescript
// Complex
const provider = providerRegistry.getCurrentProvider();
const stream = await provider.sendMessage(msg, options);

// Simple
const stream = await sendMessage(msg);
```

## 🔌 Extension Points

### Adding a New Provider

1. **Create Provider Class** (`providers/new-provider.ts`):
   ```typescript
   export class NewProvider extends BaseAIProvider {
     // Implement required methods
   }
   ```

2. **Register Provider** (`registry/provider-registry.ts`):
   ```typescript
   import { newProvider } from '../providers/new-provider';
   this.registerProvider('newprovider', newProvider);
   ```

3. **Update Type** (`registry/provider-registry.ts`):
   ```typescript
   export type ProviderName = 'gemini' | 'openai' | 'anthropic' | 'newprovider';
   ```

4. **Export** (`providers/index.ts`):
   ```typescript
   export { NewProvider, newProvider } from './new-provider';
   ```

That's it! The new provider is now available throughout the app.

### Adding Custom Functionality

1. **Add to Interface** (`types/base.ts`):
   ```typescript
   interface IAIProvider {
     customMethod(): void;
   }
   ```

2. **Implement in Providers**:
   ```typescript
   class GeminiProvider extends BaseAIProvider {
     customMethod() { /* ... */ }
   }
   ```

3. **Use in Service**:
   ```typescript
   const provider = getCurrentProvider();
   provider.customMethod();
   ```

## 🔒 Security Considerations

### API Keys

- Stored in environment variables
- Never committed to version control
- Accessed via `import.meta.env`
- Warning: Client-side keys are visible in browser

**Recommendation**: Use backend proxy for production:

```typescript
// Instead of calling API directly
const client = new OpenAI({ apiKey: env.VITE_OPENAI_API_KEY });

// Proxy through your backend
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ message }),
});
```

### Content Protection

- Validate user input
- Sanitize media attachments
- Limit message size
- Rate limiting (implement in backend)

## 📊 Performance Considerations

### Streaming

All providers support streaming for better UX:

```typescript
const stream = await sendMessage('Long response...');
for await (const chunk of stream) {
  updateUI(chunk); // Update UI as chunks arrive
}
```

### Lazy Loading

Providers are loaded on-demand:

```typescript
// Provider initialized only when first used
const provider = getCurrentProvider();
```

### Caching

Consider implementing:
- Response caching for identical queries
- Model information caching
- Provider status caching

## 🧪 Testing Strategy

### Unit Tests

Test each provider independently:

```typescript
describe('GeminiProvider', () => {
  it('should send message', async () => {
    const provider = new GeminiProvider();
    const stream = await provider.sendMessage('test');
    // Assert...
  });
});
```

### Integration Tests

Test registry and service integration:

```typescript
describe('ProviderRegistry', () => {
  it('should switch providers', () => {
    providerRegistry.setCurrentProvider('openai');
    expect(providerRegistry.getCurrentProviderName()).toBe('openai');
  });
});
```

### E2E Tests

Test complete user flows:

```typescript
describe('Chat Flow', () => {
  it('should send message and receive response', async () => {
    // Simulate user interaction
    // Verify complete flow
  });
});
```

## 📈 Future Enhancements

### Planned Features

1. **Response Caching**
   - Cache identical queries
   - Configurable TTL
   - Cache invalidation

2. **Batch Processing**
   - Send multiple messages at once
   - Parallel processing
   - Result aggregation

3. **Function Calling**
   - Tool use
   - API integration
   - Code execution

4. **Advanced Streaming**
   - Partial JSON parsing
   - Structured output
   - Event-based updates

5. **Monitoring**
   - Usage tracking
   - Cost estimation
   - Performance metrics

6. **More Providers**
   - Cohere
   - Mistral
   - Local models (Ollama)
   - Custom endpoints

## 🤝 Contributing

When contributing to this module:

1. **Follow patterns**: Use existing provider as template
2. **Update types**: Add types for new features
3. **Document**: Update README and examples
4. **Test**: Write tests for new code
5. **Migrate carefully**: Maintain backward compatibility

## 📚 Resources

- [README.new.md](./README.new.md) - Usage documentation
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration guide
- [examples/usage-examples.ts](./examples/usage-examples.ts) - Code examples
- [Electron Docs](https://www.electronjs.org/docs/latest/api) - Electron API reference
