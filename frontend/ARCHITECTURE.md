# Frontend Architecture - Scalable Modular Design

> **Current tree and overlay routing:** [docs/frontend-architecture.md](../docs/frontend-architecture.md)  
> **Every feature:** [docs/features.md](../docs/features.md)  
> This file is the **module isolation / import-rules** guide. If a folder name here disagrees with disk, trust the repo and the docs above.

## Overview

This document describes the scalable, modular architecture designed to support multiple developers working in parallel with minimal merge conflicts.

## Core Principles

### 1. Module Isolation
Each feature/module is self-contained with its own:
- Components
- Hooks
- Services/Logic
- Types
- Tests

### 2. Barrel Export Pattern
Every module has a single `index.ts` that exports all public APIs.

### 3. No Deep Relative Imports
Use path aliases (`@/features/chat`) instead of `../../../` imports.

### 4. Namespace Exports for Root Barrels
Root barrel exports use namespaces to avoid naming conflicts:
```typescript
export * as chat from './chat'
export * as settings from './settings'
```

## Directory Structure

```
src/
├── app/                    # App shell, providers, root components
│   ├── context/             # Global context providers
│   ├── overlays/            # Global overlay components
│   └── App.tsx              # Root component
│
├── components/              # Shared UI components (buttons, inputs, etc.)
│   ├── ui/                  # Primitive UI components
│   ├── animations/          # Animation components
│   └── index.ts             # Barrel export
│
├── features/                # Feature modules (business logic)
│   ├── audio/               # Audio recording/playback
│   ├── capture/             # Screenshot/video capture
│   ├── chat/                # Chat/conversation
│   ├── feature-flags/       # Feature flag system
│   ├── output-window/       # Output window overlay
│   ├── prompt/              # Prompt input UI
│   ├── settings/            # Settings/preferences
│   ├── text-selection/      # Text selection popup
│   ├── voice/               # Voice input/output
│   └── index.ts             # Namespace exports only
│
├── hooks/                   # Global shared hooks
│   ├── useChatManager.ts
│   └── index.ts             # Barrel export
│
├── lib/                     # Core utilities & configurations
│   ├── ai/                  # AI services (Vercel AI SDK)
│   ├── audio/               # Audio utilities (deprecated, use services/)
│   ├── prompt/              # Prompt building (deprecated, use services/)
│   ├── settings/            # Settings management
│   ├── subscription.ts      # Subscription logic
│   ├── supabase.ts          # Supabase client
│   ├── utils.ts             # Utility functions
│   └── index.ts             # Namespace exports + direct exports
│
├── services/                # Business logic & API calls
│   ├── ai/                  # AI service implementations
│   ├── audio/               # Audio service
│   ├── prompts/             # Prompt building services
│   └── index.ts             # Barrel export
│
├── shared/                  # Shared utilities (being consolidated)
│   ├── components/          # Shared UI components
│   ├── hooks/               # Shared hooks
│   ├── lib/                 # Shared utilities
│   └── index.ts             # Barrel export
│
├── types/                   # Global TypeScript types
│   └── index.ts             # Global type definitions
│
└── utils/                   # Utility functions
```

## Import Patterns

### 1. Feature Module Imports
```typescript
// Import from specific feature modules
import { SmartMessage, useMessageManager } from '@/features/chat'
import { SettingsModal } from '@/features/settings'
import { PromptInput } from '@/features/prompt'

// For nested imports, use the feature's barrel
import { useDraggable } from '@/features/output-window'
```

### 2. Component Imports
```typescript
// UI components
import { Button, Input, Modal } from '@/components'
```

### 3. Hook Imports
```typescript
// Global hooks
import { useChatManager, useUIState } from '@/hooks'
```

### 4. Service Imports
```typescript
// AI services
import { unifiedAIService, sendMessage } from '@/services/ai'
import { createTranscriptionService } from '@/services/audio'
```

### 5. Utility Imports
```typescript
// Utilities
import { cn } from '@/shared/lib'
import { supabase } from '@/lib/supabase'
```

## Module Structure Template

Each feature module follows this structure:

```
features/{feature-name}/
├── components/              # React components
│   ├── ComponentA.tsx
│   ├── ComponentB.tsx
│   └── index.ts             # Export all components
│
├── hooks/                   # Feature-specific hooks
│   ├── useHookA.ts
│   ├── useHookB.ts
│   └── index.ts             # Export all hooks
│
├── services/                # Feature-specific services (optional)
│   ├── serviceA.ts
│   └── index.ts
│
├── store/                   # Feature-specific state (optional)
│   └── store.ts
│
├── types/                   # Feature-specific types
│   └── index.ts
│
├── utils/                   # Feature-specific utilities (optional)
│   └── utils.ts
│
└── index.ts                 # Public API barrel export
```

## Barrel Export Template

### Feature Module Barrel (features/{name}/index.ts)
```typescript
/**
 * Feature Name
 * 
 * Brief description of the feature
 * 
 * @example
 * import { ComponentA, useHookA } from '@/features/feature-name'
 */

// Components
export { ComponentA, ComponentB } from './components'
export type { ComponentAProps } from './components'

// Hooks
export { useHookA, useHookB } from './hooks'
export type { UseHookAOptions } from './hooks'

// Services (if any)
export { serviceA } from './services'

// Store (if any)
export { useStore } from './store'

// Types
export type { FeatureTypeA, FeatureTypeB } from './types'
```

### Root Barrel (features/index.ts)
```typescript
/**
 * Features Module
 * 
 * Note: Import from specific feature modules, not from this root.
 * This file only provides namespace exports for organization.
 */

export * as audio from './audio'
export * as capture from './capture'
export * as chat from './chat'
// ... etc
```

## Development Rules

### 1. No Cross-Module Internal Imports
```typescript
// Bad - reaching into another module's internals
import { internalHelper } from '@/features/chat/utils/internalHelper'

// Good - only import from barrel export
import { chatUtils } from '@/features/chat'
```

### 2. Feature-Based Code Ownership
Assign code owners per module in `.github/CODEOWNERS`:
```
/src/features/chat/       @team-chat
/src/features/settings/   @team-core
/src/components/          @team-ui
```

### 3. Branch Naming
```
feature/chat-message-reactions
feature/settings-dark-mode
bugfix/voice-recording-crash
refactor/components-button-api
```

### 4. PR Guidelines
- One module per PR (avoid touching multiple features)
- Shared changes require team coordination
- No cross-module refactors in a single PR

## Migration Path

### From Old Structure
1. Identify module boundaries
2. Create barrel exports for each module
3. Update imports to use path aliases
4. Consolidate `shared/` into appropriate modules
5. Add CODEOWNERS file

### Handling Legacy Imports
Some files are marked as `@deprecated` and re-export from new locations for backward compatibility:
```typescript
/**
 * @deprecated Import from '@/services/audio' instead
 */
export * from '@/services/audio'
```

## Troubleshooting

### Naming Conflicts
If two modules export the same name, use direct imports:
```typescript
// Instead of ambiguous root import
import { useAutoScroll } from '@/features'  // Error: ambiguous

// Use specific module import
import { useAutoScroll } from '@/features/chat'
import { useAutoScroll } from '@/features/output-window'  // Different implementation
```

### Circular Dependencies
Use the event bus or shared types module instead of direct imports:
```typescript
// Bad: Circular dependency
// features/chat imports features/settings
// features/settings imports features/chat

// Good: Use event bus
import { eventBus } from '@/shared/events'
eventBus.emit('settings:changed', newSettings)
```

## Benefits

1. **Parallel Development**: Multiple developers can work on different features without conflicts
2. **Clear Boundaries**: Each module has a well-defined public API
3. **Easy Refactoring**: Internal changes don't affect other modules
4. **Better Testing**: Each module can be tested in isolation
5. **Scalable Onboarding**: New developers can focus on one module at a time
