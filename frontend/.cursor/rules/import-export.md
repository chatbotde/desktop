# Import/Export Conventions

## Path Aliases (NON-NEGOTIABLE)
Configure `tsconfig.json` with these aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@features/*": ["src/features/*"],
      "@hooks/*": ["src/hooks/*"],
      "@lib/*": ["src/lib/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

## Import Patterns by Use Case

### 1. Importing from Another Module
```typescript
// Always use barrel export
import { Button, Input } from '@/components'
import { useChat, ChatWindow } from '@/features/chat'
```

### 2. Importing Within Same Module
```typescript
// Use relative paths only within same module
import { ChatMessage } from './components/ChatMessage'
import { useChatHistory } from './hooks/useChatHistory'
```

### 3. Type Imports
```typescript
// Always use `import type` for types
import type { ChatMessage, User } from '@/features/chat'
import type { ButtonProps } from '@/components'
```

## Forbidden Patterns

### 1. No Wildcard Exports from Modules
```typescript
// Bad - pollutes namespace
export * from './hooks/useChat'
export * from './services/chatApi'

// Good - explicit exports
export { useChat, useChatHistory } from './hooks'
export { chatApi, messageApi } from './services'
```

### 2. No Circular Dependencies
```typescript
// BAD: features/chat imports features/settings, which imports features/chat
// Use event bus or shared types module instead
```

### 3. No Cross-Module Internal Imports
```typescript
// Bad - reaching into another module's internals
import { internalHelper } from '@/features/chat/utils/internalHelper'

// Good - only import from barrel export
import { chatUtils } from '@/features/chat'
```

## Export Organization Template

```typescript
// src/{module}/index.ts

// ==================== COMPONENTS ====================
export { ComponentA } from './components/ComponentA'
export { ComponentB } from './components/ComponentB'
export type { ComponentAProps, ComponentBProps } from './components'

// ==================== HOOKS ====================
export { useHookA } from './hooks/useHookA'
export { useHookB } from './hooks/useHookB'
export type { UseHookAOptions } from './hooks/useHookA'

// ==================== SERVICES ====================
export { serviceA } from './services/serviceA'
export { serviceB } from './services/serviceB'

// ==================== TYPES ====================
export type { ModuleTypeA, ModuleTypeB } from './types'

// ==================== UTILS ====================
export { utilA, utilB } from './utils'
```
