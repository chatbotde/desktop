# Code Organization for Multi-Developer Teams

## Branch Strategy Alignment

### Module-Based Branches
```
feature/chat-message-reactions
feature/settings-dark-mode
bugfix/voice-recording-crash
refactor/components-button-api
```

### Conflict Minimization Rules
1. **One module per branch** - Avoid touching multiple feature modules in one PR
2. **Shared changes require coordination** - Changes to `src/components/` or `src/shared/` need team sync
3. **No cross-module refactors** - Split large refactors into module-specific PRs

## File Naming Conventions

### Components
```
PascalCase for components:     ChatMessage.tsx, UserAvatar.tsx
kebab-case for folders:        chat-message/, user-avatar/
camelCase for hooks:           useChat.ts, useSettings.ts
```

### Co-Location Principle
Keep related files together:
```
components/
  Button/
    Button.tsx          # Component
    Button.test.tsx     # Test
    Button.stories.tsx  # Storybook
    index.ts            # Export
    types.ts            # Component types
    utils.ts            # Component utilities
```

## Merge Conflict Prevention

### 1. Barrel Export Append-Only
When adding new exports, always append to `index.ts`:
```typescript
// Before
export { ComponentA } from './ComponentA'

// After - append, don't re-sort
export { ComponentA } from './ComponentA'
export { ComponentB } from './ComponentB'  // New line at end
```

### 2. Shared Registry Pattern
For plugin/overlay systems, use registries instead of conditional imports:
```typescript
// src/features/registry.ts
export const featureRegistry = {
  chat: () => import('@/features/chat'),
  settings: () => import('@/features/settings'),
} as const
```

### 3. Feature Flags for WIP
Use feature flags to merge incomplete work:
```typescript
// In component
import { isFeatureEnabled } from '@/features/feature-flags'

export const MyComponent = () => {
  if (!isFeatureEnabled('new-feature')) return null
  // ... new feature code
}
```

## Code Review Checklist

### For PR Authors
- [ ] Only one module affected (or minimal cross-module changes)
- [ ] Barrel exports updated
- [ ] No deep relative imports (`../../`)
- [ ] No new dependencies on shared/ code without team discussion

### For Reviewers
- [ ] Import paths use `@/` aliases
- [ ] No circular dependencies introduced
- [ ] Module boundaries respected
- [ ] Export organization follows template
