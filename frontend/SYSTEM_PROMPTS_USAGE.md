# System Prompts Usage Guide

The Buddy AI assistant now includes a comprehensive system prompt system with multiple preset modes and the ability to create custom prompts.

## 📚 Available System Prompt Modes

### 1. **Learning Assistant** (Default)
Perfect for educational content, tutoring, and skill development.

**Features:**
- Patient and encouraging teaching style
- Adaptive explanations based on learner's level
- Interactive learning with questions
- Multi-modal explanations (examples, diagrams, practice problems)
- Step-by-step breakdowns of complex topics
- Socratic method to guide discovery

**Best for:**
- Students learning new subjects
- Homework help
- Understanding complex concepts
- Skill development
- Practice problems and exercises

### 2. **General Assistant**
Balanced assistant for general-purpose tasks and conversations.

**Features:**
- Clear and concise responses
- Adapts to user's needs
- Handles diverse topics
- Professional and helpful tone

**Best for:**
- General questions
- Research assistance
- Information lookup
- Day-to-day tasks

### 3. **Code Assistant**
Specialized for programming, debugging, and technical tasks.

**Features:**
- Expert programming knowledge
- Well-commented code examples
- Best practices and conventions
- Debugging with detailed analysis
- Code optimization suggestions

**Best for:**
- Writing code
- Debugging issues
- Learning programming concepts
- Code reviews
- Technical documentation

### 4. **Creative Assistant**
For creative writing, brainstorming, and ideation.

**Features:**
- Imaginative and engaging
- Helps generate creative ideas
- Narrative development
- Multiple perspectives
- Refinement and improvement

**Best for:**
- Creative writing
- Story development
- Brainstorming sessions
- Content creation
- Marketing copy

## 🚀 How to Use System Prompts

### Basic Usage

```typescript
import { unifiedAIService } from '@/lib/ai';

// Set the system prompt mode
unifiedAIService.setSystemPrompt('learning');  // Learning Assistant
unifiedAIService.setSystemPrompt('general');   // General Assistant
unifiedAIService.setSystemPrompt('code');      // Code Assistant
unifiedAIService.setSystemPrompt('creative');  // Creative Assistant

// Then send messages as usual
const response = await unifiedAIService.sendMessage('Explain quantum physics');
```

### Custom System Prompts

```typescript
import { unifiedAIService } from '@/lib/ai';

// Create your own custom system prompt
const customPrompt = `You are a friendly fitness coach who specializes in 
beginner-friendly workout plans. Always encourage users and focus on building 
healthy habits gradually.`;

unifiedAIService.setCustomSystemPrompt(customPrompt, 'Fitness Coach');

// Now all messages will use this custom prompt
const response = await unifiedAIService.sendMessage('Help me start exercising');
```

### Check Current System Prompt

```typescript
import { unifiedAIService } from '@/lib/ai';

const currentPrompt = unifiedAIService.getCurrentSystemPrompt();
console.log('Current mode:', currentPrompt?.name);
console.log('Description:', currentPrompt?.description);
```

### Access System Prompt Library

```typescript
import { SYSTEM_PROMPTS, getSystemPromptById } from '@/lib/ai';

// List all available prompts
SYSTEM_PROMPTS.forEach(prompt => {
  console.log(`${prompt.name}: ${prompt.description}`);
});

// Get specific prompt details
const learningPrompt = getSystemPromptById('learning');
console.log(learningPrompt?.prompt); // Full prompt text
```

## 🎯 Integration Examples

### Example 1: Dynamic Mode Switching

```typescript
// In your chat component
import { unifiedAIService } from '@/lib/ai';

function handleModeChange(mode: string) {
  unifiedAIService.setSystemPrompt(mode);
  console.log(`Switched to ${mode} mode`);
  
  // Optionally clear history when switching modes
  unifiedAIService.clearHistory();
}

// Usage
<select onChange={(e) => handleModeChange(e.target.value)}>
  <option value="learning">Learning Assistant</option>
  <option value="general">General Assistant</option>
  <option value="code">Code Assistant</option>
  <option value="creative">Creative Assistant</option>
</select>
```

### Example 2: Context-Aware Prompting

```typescript
import { unifiedAIService } from '@/lib/ai';

function setupContextualAssistant(userProfile: UserProfile) {
  if (userProfile.isStudent) {
    unifiedAIService.setSystemPrompt('learning');
  } else if (userProfile.isDeveloper) {
    unifiedAIService.setSystemPrompt('code');
  } else if (userProfile.isWriter) {
    unifiedAIService.setSystemPrompt('creative');
  } else {
    unifiedAIService.setSystemPrompt('general');
  }
}
```

### Example 3: Hybrid Custom Prompts

```typescript
import { getSystemPromptById, unifiedAIService } from '@/lib/ai';

// Combine existing prompt with custom context
const basePrompt = getSystemPromptById('learning');
const customContext = `
Additional Context: 
- Focus on high school level mathematics
- Use simple language, avoid jargon
- Provide visual diagrams when explaining
`;

const combinedPrompt = basePrompt!.prompt + '\n\n' + customContext;
unifiedAIService.setCustomSystemPrompt(combinedPrompt, 'Math Tutor');
```

## 🔧 Advanced Configuration

### Persisting User Preferences

```typescript
// Save user's preferred mode
function saveSystemPromptPreference(mode: string) {
  localStorage.setItem('preferredSystemPrompt', mode);
  unifiedAIService.setSystemPrompt(mode);
}

// Load on app initialization
function loadSystemPromptPreference() {
  const savedMode = localStorage.getItem('preferredSystemPrompt') || 'learning';
  unifiedAIService.setSystemPrompt(savedMode);
}
```

### Creating a Prompt Builder UI

```typescript
import { SYSTEM_PROMPTS } from '@/lib/ai';

function PromptSelector() {
  return (
    <div className="prompt-selector">
      <h3>Choose Your AI Assistant Mode</h3>
      {SYSTEM_PROMPTS.map(prompt => (
        <button
          key={prompt.id}
          onClick={() => unifiedAIService.setSystemPrompt(prompt.id)}
          className="prompt-option"
        >
          <strong>{prompt.name}</strong>
          <p>{prompt.description}</p>
        </button>
      ))}
    </div>
  );
}
```

## 📝 Best Practices

1. **Set the prompt early**: Initialize the system prompt when the app loads or when starting a new conversation.

2. **Clear history when switching**: When changing system prompts, consider clearing the conversation history to avoid context confusion.

3. **Match prompt to use case**: Choose the appropriate prompt mode for the user's current task.

4. **Test custom prompts**: When creating custom prompts, test them thoroughly to ensure desired behavior.

5. **Document custom prompts**: If creating custom prompts, document their purpose and expected behavior.

## 🎓 The Learning Assistant Prompt (Default)

The default Learning Assistant prompt is designed with educational best practices:

- **Patient & Encouraging**: Maintains supportive, non-judgmental tone
- **Adaptive Teaching**: Adjusts explanations based on learner's level
- **Interactive Learning**: Uses questions to check understanding
- **Multi-Modal**: Explains through examples, diagrams, analogies
- **Structured**: Clear organization with headings, bullets, code blocks
- **Problem-Solving Focus**: Guides reasoning rather than giving direct answers
- **Growth Mindset**: Frames mistakes as learning opportunities

This makes it ideal for:
- K-12 education
- University students
- Self-learners
- Professional development
- Skill acquisition

## 🔍 Troubleshooting

**System prompt not applying?**
- Ensure you call `setSystemPrompt()` after initializing the AI service
- Check console logs for confirmation messages

**Different providers behaving differently?**
- System prompts work across all providers (Google, OpenAI, Anthropic)
- Each provider may interpret prompts slightly differently
- Test with your specific use case

**Need to reset?**
- Call `unifiedAIService.setSystemPrompt('learning')` to reset to default
- Or reload the application

## 📚 Further Reading

- See `system-prompts.ts` for full prompt text
- Check `unified-ai-service.ts` for implementation details
- Refer to provider documentation for prompt engineering tips:
  - [Google Gemini](https://ai.google.dev/docs)
  - [OpenAI](https://platform.openai.com/docs/guides/prompt-engineering)
  - [Anthropic Claude](https://docs.anthropic.com/claude/docs/prompt-engineering)
