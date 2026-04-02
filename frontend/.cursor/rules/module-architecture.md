# Module Architecture Rules

## Purpose
Define the modular structure to enable scalable development with minimal merge conflicts across teams.

## Rules

### 1. Barrel Export Pattern (MANDATORY)
Every module MUST have a single `index.ts` at its root that exports all public APIs.

```typescript
// Good: src/features/chat/index.ts
export { ChatComponent } from './components/ChatComponent'
export { useChat } from './hooks/useChat'
export type { ChatMessage } from './types'
```

### 2. No Deep Relative Imports
NEVER use `../../../` style imports. Always import from the module root.

```typescript
// Bad
import { useChat } from '../../../features/chat/hooks/useChat'

// Good
import { useChat } from '@/features/chat'
```

### 3. Module Boundaries
Each module is self-contained. Cross-module imports only through barrel exports.

```
src/
  features/
    chat/
      components/     # UI components
      hooks/          # Feature-specific hooks
      services/       # API calls
      types/          # TypeScript types
      utils/          # Feature utilities
      index.ts        # Public API
```

### 4. Import Order (Enforced)
```typescript
// 1. External libraries
import React from 'react'

// 2. Internal modules (alphabetical)
import { Button } from '@/components'
import { useChat } from '@/features/chat'
import { apiClient } from '@/services'
import { formatDate } from '@/utils'

// 3. Relative imports (within same module only)
import { ChatHeader } from './components/ChatHeader'
```

### 5. Feature-Based Code Ownership
Assign code owners per module to reduce merge conflicts:
```
# .github/CODEOWNERS
/src/features/chat/       @team-chat
/src/features/settings/   @team-core
/src/components/          @team-ui
```

## Module Export Pattern

Every module follows this export structure:

```typescript
// src/features/{name}/index.ts

// Components
export { ComponentName } from './components/ComponentName'
export type { ComponentNameProps } from './components/ComponentName'

// Hooks
export { useHookName } from './hooks/useHookName'
export type { UseHookNameOptions } from './hooks/useHookName'

// Services
export { serviceName } from './services/serviceName'

// Types
export type * from './types'

// Constants
export { CONSTANT_NAME } from './constants'
```
