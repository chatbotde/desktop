# System Prompts Architecture

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (Chat)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          SystemPromptSelector Component                │ │
│  │  [🎓 Learning] [💬 General] [💻 Code] [✨ Creative]  │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Unified AI Service (Controller)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • setSystemPrompt(id)                                 │ │
│  │  • setCustomSystemPrompt(prompt, name)                 │ │
│  │  • getCurrentSystemPrompt()                            │ │
│  │  • sendMessage(message, attachments)                   │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌──────────────────┐ ┌─────────────┐ ┌──────────────────┐
│  Gemini Service  │ │   OpenAI    │ │ Anthropic Claude │
│                  │ │  Service    │ │     Service      │
│ addSystemContext │ │addSysContext│ │addSystemContext  │
└──────────────────┘ └─────────────┘ └──────────────────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                System Prompts Configuration                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  LEARNING_ASSISTANT_PROMPT                             │ │
│  │  • Patient & encouraging teaching                      │ │
│  │  • Adaptive to learner's level                         │ │
│  │  • Interactive with questions                          │ │
│  │  • Multi-modal explanations                            │ │
│  │  • Step-by-step problem solving                        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  GENERAL_ASSISTANT_PROMPT                              │ │
│  │  • Balanced, helpful approach                          │ │
│  │  • Clear and concise responses                         │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  CODE_ASSISTANT_PROMPT                                 │ │
│  │  • Technical expertise                                 │ │
│  │  • Best practices focus                                │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  CREATIVE_ASSISTANT_PROMPT                             │ │
│  │  • Imaginative and engaging                            │ │
│  │  • Brainstorming support                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### Initialization Flow
```
App Startup
    │
    ▼
UnifiedAIService Constructor
    │
    ▼
setSystemPrompt('learning')  ← Default
    │
    ├──► Gemini.addSystemContext(LEARNING_PROMPT)
    ├──► OpenAI.addSystemContext(LEARNING_PROMPT)
    └──► Anthropic.addSystemContext(LEARNING_PROMPT)
```

### User Interaction Flow
```
User Clicks "Code Assistant"
    │
    ▼
SystemPromptSelector.handlePromptChange('code')
    │
    ▼
unifiedAIService.setSystemPrompt('code')
    │
    ├──► Gemini.addSystemContext(CODE_PROMPT)
    ├──► OpenAI.addSystemContext(CODE_PROMPT)
    └──► Anthropic.addSystemContext(CODE_PROMPT)
    │
    ▼
localStorage.setItem('preferredSystemPrompt', 'code')
    │
    ▼
Update UI to show "Code Assistant" active
```

### Message Flow
```
User sends: "How do I implement binary search?"
    │
    ▼
UnifiedAIService.sendMessage(...)
    │
    ▼
Detect selected model provider (e.g., Google)
    │
    ▼
GeminiService.sendMessageWithMedia(...)
    │
    ├──► Context: CODE_ASSISTANT_PROMPT
    ├──► History: Previous conversation
    └──► User message: "How do I implement binary search?"
    │
    ▼
Stream response back to UI
    │
    ▼
Display with syntax highlighting and explanations
```

## 🔄 State Management

```
┌─────────────────────────────────────────┐
│      Unified AI Service (Singleton)      │
│                                          │
│  State:                                  │
│  • currentSystemPrompt: SystemPrompt     │
│                                          │
│  Methods:                                │
│  • setSystemPrompt(id)                   │
│  • getCurrentSystemPrompt()              │
│  • setCustomSystemPrompt(text, name)     │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        Individual AI Services            │
│                                          │
│  Gemini Service                          │
│  • chatHistory: GeminiChatHistory[]      │
│                                          │
│  OpenAI Service                          │
│  • chatHistory: MessageParam[]           │
│    (includes system message)             │
│                                          │
│  Anthropic Service                       │
│  • chatHistory: MessageParam[]           │
│  • systemContext: string                 │
└─────────────────────────────────────────┘
```

## 🎨 Component Hierarchy

```
App
└── ChatInterface
    ├── ChatHeader
    │   └── SystemPromptSelector  ← Prompt switcher
    │       └── PromptDropdown
    │           ├── LearningOption
    │           ├── GeneralOption
    │           ├── CodeOption
    │           └── CreativeOption
    ├── MessageList
    │   └── Message (styled based on mode)
    └── ChatInput
        └── SendMessage
            └── unifiedAIService.sendMessage()
```

## 🔐 Type Safety

```typescript
// Type hierarchy
SystemPrompt
├── id: string
├── name: string
├── description: string
└── prompt: string

UnifiedAIService
├── currentSystemPrompt: SystemPrompt | null
├── setSystemPrompt(promptId: string): void
├── getCurrentSystemPrompt(): SystemPrompt | null
└── setCustomSystemPrompt(prompt: string, name?: string): void

// Type guards ensure safety
const prompt = getSystemPromptById('learning');
if (prompt) {
  // TypeScript knows prompt is SystemPrompt, not undefined
  unifiedAIService.setCustomSystemPrompt(prompt.prompt, prompt.name);
}
```

## 📦 Module Dependencies

```
system-prompts.ts
    │
    └──► unified-ai-service.ts
            │
            ├──► gemini.ts
            ├──► openai.ts
            └──► anthropic.ts
                    │
                    └──► model-config.ts

index.ts (exports all)
    │
    └──► Components/App can import
```

## 🌊 Streaming Response Flow

```
User Message Input
    │
    ▼
UnifiedAIService.sendMessage()
    │
    ▼
Provider Service.sendMessageWithMedia()
    │
    ├─ System Prompt (injected)
    ├─ Conversation History
    └─ User Message + Attachments
    │
    ▼
API Request to Provider
    │
    ▼
Streaming Response
    │
    ├─ Chunk 1 → UI Update
    ├─ Chunk 2 → UI Update
    ├─ Chunk 3 → UI Update
    └─ ... → UI Update
    │
    ▼
Complete Response
    │
    └─ Add to conversation history
```

## 🎯 Key Design Decisions

### 1. **Singleton Pattern**
- `UnifiedAIService` is a singleton to maintain consistent state
- All AI services are singletons to preserve conversation history

### 2. **Broadcast to All Providers**
- System prompts are applied to ALL providers simultaneously
- Ensures consistency regardless of which provider is selected

### 3. **Lazy Loading**
- System prompts are only applied when services are initialized
- Reduces startup overhead

### 4. **Immutable Prompts**
- Built-in prompts are exported as constants
- Custom prompts can be created without modifying source

### 5. **Provider Abstraction**
- UI doesn't need to know which provider is active
- System prompts work the same across all providers

## 🔧 Extension Points

### Adding New System Prompts

```typescript
// In system-prompts.ts
export const MATH_TUTOR_PROMPT = `...`;

// Add to SYSTEM_PROMPTS array
{
  id: 'math-tutor',
  name: 'Math Tutor',
  description: 'Specialized mathematics instructor',
  prompt: MATH_TUTOR_PROMPT
}
```

### Adding New UI Components

```typescript
// Custom selector
import { SYSTEM_PROMPTS, unifiedAIService } from '@/lib/ai';

export function CustomPromptUI() {
  // Your custom implementation
  return <YourComponent />;
}
```

### Integration with Settings

```typescript
// Save to user preferences
function saveUserPreference(promptId: string) {
  // Save to backend
  await api.updateUserSettings({ defaultPrompt: promptId });
  
  // Apply locally
  unifiedAIService.setSystemPrompt(promptId);
}
```

## 📈 Future Enhancements

Potential additions to the system:

1. **Dynamic Prompts**: Load prompts from backend/CMS
2. **User-Created Prompts**: Allow users to create and save custom prompts
3. **Prompt Templates**: Variables in prompts (e.g., `{userLevel}`)
4. **Prompt Versioning**: Track and manage prompt versions
5. **A/B Testing**: Test different prompt variations
6. **Analytics**: Track which prompts are most effective
7. **Context-Aware**: Auto-select prompt based on conversation content
8. **Multi-Language**: Translate prompts to different languages

---

This architecture provides a solid foundation for system prompt management while remaining flexible and extensible for future needs.
