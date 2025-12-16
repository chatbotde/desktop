# Prompt Library

Centralized prompt management system for all AI interactions in the application. This library provides a well-organized structure for managing prompts, making it easy to expand and maintain.

## Structure

```
prompt/
├── actions/              # Button action prompts
│   ├── ask-prompt.ts     # Ask button prompts
│   ├── explain-prompt.ts # Explain button prompts
│   ├── change-prompt.ts  # Change button prompts
│   ├── add-prompt.ts     # Add button prompts
│   └── index.ts         # Action prompts exports
│
├── text-selection/       # Text selection prompt builders
│   ├── prompt-builder.ts # Text selection utilities
│   └── index.ts
│
├── model-behavior/       # Model behavior configurations
│   ├── config.ts         # Behavior presets and configs
│   └── index.ts
│
├── templates/            # Reusable prompt templates
│   ├── base-templates.ts # Common template patterns
│   └── index.ts
│
├── index.ts              # Main export file
└── README.md             # This file
```

## Usage

### Action Prompts

#### Ask Prompt
Used when the "Ask" button is clicked with selected text.

```typescript
import { buildAskPrompt } from '@/lib/prompt'

const prompt = buildAskPrompt({
  selectedText: 'Some code here',
  userInput: 'What does this do?',
  includeLabel: true,
  label: 'Selected text:'
})
// Result: "What does this do?\n\nSelected text:\n\"Some code here\""
```

#### Explain Prompt
Used when the "Explain" button is clicked with selected text.

```typescript
import { buildExplainPrompt } from '@/lib/prompt'

const prompt = buildExplainPrompt({
  selectedText: 'Complex concept',
  style: 'beginner', // 'clear' | 'detailed' | 'simple' | 'technical' | 'beginner'
  focus: 'key concepts',
  includeQuotes: true
})
// Result: "Please explain the following text as if I am a beginner, focusing on: key concepts:\n\n\"Complex concept\""
```

#### Change Prompt
Used when the "Change" button is clicked to modify selected text.

```typescript
import { buildChangePrompt } from '@/lib/prompt'

const prompt = buildChangePrompt({
  selectedText: 'Original text',
  instruction: 'Make this more concise',
  defaultInstruction: 'Improve this text',
  separator: '\n\n---\n\n'
})
// Result: "Make this more concise\n\n---\n\nOriginal text"
```

#### Add Prompt
Used when the "Add" button is clicked to add selected text to input.

```typescript
import { buildAddPrompt } from '@/lib/prompt'

const prompt = buildAddPrompt({
  selectedText: 'Text to add',
  userInput: 'User notes',
  separator: '\n\n---\n\n'
})
// Result: "User notes\n\n---\n\nText to add"
```

### Text Selection Prompts

For building prompts in text selection contexts:

```typescript
import { 
  buildTextSelectionAskPrompt,
  buildTextSelectionExplainPrompt,
  formatSelectedTextForMessage,
  combineMessageWithSelection
} from '@/lib/prompt'

// Build ask prompt with context
const askPrompt = buildTextSelectionAskPrompt({
  selectedText: 'Selected code',
  currentMessage: 'User question',
  source: 'message-bubble'
})

// Format selected text for inclusion
const formatted = formatSelectedTextForMessage('Selected text', true, 'Selected text:')

// Combine message with selection
const combined = combineMessageWithSelection('User message', 'Selected text', true)
```

### Model Behavior Configuration

Configure how models should behave for different actions:

```typescript
import { 
  DEFAULT_MODEL_BEHAVIOR,
  LEARNING_MODEL_BEHAVIOR,
  CODE_MODEL_BEHAVIOR,
  getModelBehaviorPreset,
  mergeModelBehavior
} from '@/lib/prompt'

// Use preset
const behavior = getModelBehaviorPreset('learning')

// Merge configurations
const customBehavior = mergeModelBehavior(DEFAULT_MODEL_BEHAVIOR, {
  explainBehavior: {
    depth: 'comprehensive',
    audience: 'beginner'
  }
})
```

### Templates

Reusable prompt templates for common patterns:

```typescript
import {
  wrapSelectedText,
  combineInputWithSelection,
  buildInstructionPrompt,
  buildQuestionPrompt,
  buildExplanationRequest,
  buildImprovementRequest
} from '@/lib/prompt'

// Wrap selected text
const wrapped = wrapSelectedText('Text', 'Selected text:', true)

// Combine input with selection
const combined = combineInputWithSelection('Input', 'Selection', '\n\n---\n\n')

// Build instruction prompt
const instruction = buildInstructionPrompt('Improve this', 'Text content')

// Build question prompt
const question = buildQuestionPrompt('What is this?', 'Context text', true)

// Build explanation request
const explanation = buildExplanationRequest('Text', 'beginner', 'key concepts')

// Build improvement request
const improvement = buildImprovementRequest('Text', 'Make it clearer', 'clarity')
```

## Adding New Actions

To add a new action prompt:

1. Create a new file in `actions/` (e.g., `summarize-prompt.ts`)
2. Define the prompt builder function with options interface
3. Export from `actions/index.ts`
4. Add to main `index.ts` export

Example:

```typescript
// actions/summarize-prompt.ts
export interface SummarizePromptOptions {
  selectedText: string
  length?: 'short' | 'medium' | 'long'
}

export function buildSummarizePrompt(options: SummarizePromptOptions): string {
  const { selectedText, length = 'medium' } = options
  const lengthMap = {
    short: 'brief',
    medium: 'concise',
    long: 'detailed'
  }
  return `Please provide a ${lengthMap[length]} summary of the following text:\n\n"${selectedText.trim()}"`
}
```

## Adding New Model Behaviors

To add a new model behavior preset:

1. Add configuration to `model-behavior/config.ts`
2. Export from `model-behavior/index.ts`
3. Add to preset getter if needed

Example:

```typescript
// model-behavior/config.ts
export const CREATIVE_MODEL_BEHAVIOR: ModelBehaviorConfig = {
  askBehavior: {
    tone: 'friendly',
    length: 'detailed',
    askFollowUps: true,
  },
  // ... other configs
}
```

## Best Practices

1. **Always use prompt builders** - Don't hardcode prompt strings in components
2. **Use TypeScript interfaces** - Define clear option types for all prompt builders
3. **Keep prompts configurable** - Allow customization through options
4. **Document prompt formats** - Add JSDoc comments explaining prompt structure
5. **Test prompt outputs** - Ensure prompts generate expected formats
6. **Use templates for common patterns** - Reuse base templates when possible

## Future Expansion

The structure is designed to easily accommodate:

- New action types (e.g., summarize, translate, analyze)
- Context-specific prompts (e.g., code-specific, document-specific)
- User-customizable prompts
- Prompt versioning
- A/B testing different prompt formats
- Prompt analytics and optimization

## Examples

### In Components

```typescript
// components/SomeComponent.tsx
import { buildAskPrompt, buildExplainPrompt } from '@/lib/prompt'

function MyComponent() {
  const handleAsk = (text: string) => {
    const prompt = buildAskPrompt({ selectedText: text })
    // Send prompt to AI
  }
  
  const handleExplain = (text: string) => {
    const prompt = buildExplainPrompt({ 
      selectedText: text,
      style: 'beginner' 
    })
    // Send prompt to AI
  }
}
```

### With Model Behavior

```typescript
import { buildExplainPrompt, LEARNING_MODEL_BEHAVIOR } from '@/lib/prompt'

// Use behavior-aware prompt building
const behavior = LEARNING_MODEL_BEHAVIOR
const prompt = buildExplainPrompt({
  selectedText: text,
  style: behavior.explainBehavior?.audience === 'beginner' ? 'beginner' : 'clear'
})
```

