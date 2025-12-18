# System Prompts Documentation

This directory contains the modular system prompts architecture for different AI assistant modes.

## 📁 File Structure

```
prompts/
├── types.ts              # Shared TypeScript interfaces
├── system-prompts.ts     # Main aggregator & utility functions
├── general.ts            # General assistant prompt
├── code.ts               # Code assistant prompt
├── creative.ts           # Creative assistant prompt
└── README.md             # This file
```

## 🏗️ Architecture Overview

The system prompts are organized in a modular, scalable architecture:

1. **`types.ts`** - Contains shared TypeScript interfaces (e.g., `SystemPrompt`)
2. **Individual prompt files** - Each prompt type has its own file
3. **`system-prompts.ts`** - Aggregates all prompts and exports utilities
4. **Automatic integration** - Just import and add to array, that's it!

## 📝 Adding a New System Prompt

Follow these steps to add a new prompt type (e.g., "Business Assistant"):

### Step 1: Create a New File

Create `business.ts` in this directory:

```typescript
/**
 * Business Assistant System Prompt
 * Specialized for business and productivity tasks
 */

import type { SystemPrompt } from './types';

export const BUSINESS_ASSISTANT_PROMPT = `You are a professional business assistant.

Provide clear, actionable advice for business decisions and productivity.

Focus on efficiency, strategic thinking, and practical solutions for workplace challenges.`;

export const businessPrompt: SystemPrompt = {
  id: 'business',
  name: 'Business Assistant',
  description: 'Professional helper for business and productivity',
  prompt: BUSINESS_ASSISTANT_PROMPT,
};
```

### Step 2: Import in `system-prompts.ts`

Add the import at the top of `system-prompts.ts`:

```typescript
import { businessPrompt } from './business';
```

### Step 3: Add to SYSTEM_PROMPTS Array

Add your prompt to the `SYSTEM_PROMPTS` array:

```typescript
export const SYSTEM_PROMPTS: SystemPrompt[] = [
  generalPrompt,
  codePrompt,
  creativePrompt,
  businessPrompt,  // 👈 Add here
  // Add new prompts here
];
```

### Step 4: (Optional) Re-export the Constant

For backwards compatibility, re-export the prompt constant:

```typescript
export { BUSINESS_ASSISTANT_PROMPT } from './business';
```

That's it! Your new prompt is now available throughout the application.

## 🎯 Prompt File Template

Use this template when creating a new prompt file:

```typescript
/**
 * [Name] Assistant System Prompt
 * [Brief description of what this prompt is for]
 */

import type { SystemPrompt } from './types';

export const [NAME]_ASSISTANT_PROMPT = `[Your prompt text here]`;

export const [name]Prompt: SystemPrompt = {
  id: '[lowercase-id]',
  name: '[Display Name]',
  description: '[User-facing description]',
  prompt: [NAME]_ASSISTANT_PROMPT,
};
```

### Naming Conventions

- **File name**: `lowercase.ts` (e.g., `business.ts`, `data-analysis.ts`)
- **Constant**: `UPPERCASE_SNAKE_CASE` (e.g., `BUSINESS_ASSISTANT_PROMPT`)
- **Export**: `camelCasePrompt` (e.g., `businessPrompt`)
- **ID**: `lowercase-kebab-case` (e.g., `'business'`, `'data-analysis'`)

## 📦 SystemPrompt Interface

```typescript
interface SystemPrompt {
  id: string;           // Unique identifier (lowercase-kebab-case)
  name: string;         // Display name shown in UI
  description: string;  // User-facing description
  prompt: string;       // The actual system prompt text
}
```

## 🔧 Available Utility Functions

### `getSystemPromptById(id: string): SystemPrompt | undefined`

Retrieve a specific prompt by its ID:

```typescript
const codePrompt = getSystemPromptById('code');
```

### `getDefaultSystemPrompt(): SystemPrompt`

Get the default system prompt (General Assistant):

```typescript
const defaultPrompt = getDefaultSystemPrompt();
```

### `applySystemPrompt(prompt: string): string`

Apply a system prompt to AI services:

```typescript
const applied = applySystemPrompt(GENERAL_ASSISTANT_PROMPT);
```

## 💡 Example Use Cases

### Example 1: Adding a Data Analysis Prompt

**File: `data-analysis.ts`**
```typescript
import type { SystemPrompt } from './types';

export const DATA_ANALYSIS_ASSISTANT_PROMPT = `You are a data analysis expert.

Help users understand data patterns, create visualizations, and derive insights.

Provide clear explanations of statistical concepts and data-driven recommendations.`;

export const dataAnalysisPrompt: SystemPrompt = {
  id: 'data-analysis',
  name: 'Data Analysis Assistant',
  description: 'Expert in data analysis and statistics',
  prompt: DATA_ANALYSIS_ASSISTANT_PROMPT,
};
```

### Example 2: Adding a Teaching Assistant

**File: `teaching.ts`**
```typescript
import type { SystemPrompt } from './types';

export const TEACHING_ASSISTANT_PROMPT = `You are a patient teaching assistant.

Break down complex topics into simple explanations. Use examples and analogies.

Adapt your teaching style to the learner's level. Ask questions to check understanding.`;

export const teachingPrompt: SystemPrompt = {
  id: 'teaching',
  name: 'Teaching Assistant',
  description: 'Patient educator for learning and understanding',
  prompt: TEACHING_ASSISTANT_PROMPT,
};
```

## ✅ Best Practices

### 1. Keep Prompts Focused
Each prompt should have a clear, specific purpose. Don't try to make one prompt do everything.

### 2. Use Clear, Concise Language
System prompts should be easy to understand and follow. Avoid ambiguity.

### 3. Test Your Prompts
After adding a new prompt, test it with various queries to ensure it behaves as expected.

### 4. Document Intent
Use JSDoc comments to explain what the prompt is for and when to use it.

### 5. Maintain Consistency
Follow the established patterns and naming conventions in existing files.

### 6. Use Type Imports
Use `import type` for TypeScript types to avoid runtime imports:
```typescript
import type { SystemPrompt } from './types';  // ✅ Good
import { SystemPrompt } from './types';       // ❌ Avoid
```

## 🔍 How It Works

1. **Individual files** define prompt constants and export a `SystemPrompt` object
2. **`system-prompts.ts`** imports all individual prompts
3. **SYSTEM_PROMPTS array** aggregates all prompts in one place
4. **Utility functions** provide convenient access to prompts
5. **Re-exports** maintain backwards compatibility with existing code

## 📚 Integration Points

This module is used by:
- `src/lib/ai/system-prompts.ts` - Re-exports for AI services
- UI components - For selecting different assistant modes
- Chat services - For applying context to conversations

## 🚀 Quick Start Checklist

Adding a new prompt? Follow this checklist:

- [ ] Create new file (e.g., `my-prompt.ts`)
- [ ] Define prompt constant (`MY_PROMPT_ASSISTANT_PROMPT`)
- [ ] Export `SystemPrompt` object (`myPromptPrompt`)
- [ ] Import in `system-prompts.ts`
- [ ] Add to `SYSTEM_PROMPTS` array
- [ ] (Optional) Re-export constant for backwards compatibility
- [ ] Test the prompt in the application
- [ ] Update this README if needed

## 🤔 Common Questions

**Q: Can I have multiple prompts in one file?**  
A: It's better to keep one prompt per file for maintainability, but you can if they're closely related.

**Q: How do I modify an existing prompt?**  
A: Just edit the appropriate file (e.g., `general.ts`, `code.ts`). Changes are automatically reflected.

**Q: Can I remove a prompt?**  
A: Yes, delete the file and remove the import/array entry from `system-prompts.ts`.

**Q: Do I need to restart the dev server?**  
A: Yes, after adding new files, restart your dev server to ensure proper compilation.

## 📄 License

Part of the Sonicplane Buddy project.
