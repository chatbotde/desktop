# Quick Start Guide - Architecture Patterns

This guide will help you quickly start using the new architecture patterns in your codebase.

## 🚀 Initial Setup

### 1. Initialize Services

In your app entry point (`app/main.tsx` or `app/App.tsx`):

```typescript
import { initializeServices } from '@/shared/services'

// Initialize all default services
initializeServices()
```

### 2. Start Using Patterns

#### Using Service Container

```typescript
import { serviceContainer } from '@/shared/services'

// Get a service
const ai = serviceContainer.get('ai')
const storage = serviceContainer.get('storage')

// Use the service
for await (const chunk of ai.streamMessage({ 
  message: 'Hello', 
  model: 'gpt-4' 
})) {
  console.log(chunk.content)
}
```

#### Using Event Bus

```typescript
import { eventBus, useEvent } from '@/shared/events'

// Emit events
eventBus.emit('text:selected', { 
  text: 'Hello World', 
  source: 'popup' 
})

// Listen in React components
function MyComponent() {
  useEvent('text:selected', ({ text }) => {
    console.log('Text selected:', text)
  })
  
  return <div>...</div>
}
```

#### Using Configuration Manager

```typescript
import { configManager, useConfig } from '@/shared/config'

// Get config
const aiConfig = configManager.get('ai')
console.log('Timeout:', aiConfig.timeout)

// Update config
configManager.set('ai', {
  ...aiConfig,
  timeout: 60000
})

// React hook
function SettingsComponent() {
  const aiConfig = useConfig('ai')
  
  return (
    <div>
      <input 
        type="number" 
        value={aiConfig.timeout}
        onChange={(e) => {
          configManager.setNested('ai', 'timeout', Number(e.target.value))
        }}
      />
    </div>
  )
}
```

#### Using Electron Adapter

```typescript
import { electronAdapter } from '@/shared/adapters'

// Use adapter instead of direct electron calls
await electronAdapter.clipboard.writeText('Hello')

const position = await electronAdapter.window.getPosition()
electronAdapter.window.setSize(800, 600)
```

#### Using Storage Service

```typescript
import { serviceContainer } from '@/shared/services'

const storage = serviceContainer.get('storage')

// Store data
await storage.set('user-preferences', {
  theme: 'dark',
  language: 'en'
})

// Retrieve data
const preferences = await storage.get<{
  theme: string
  language: string
}>('user-preferences')

// Check if exists
if (await storage.has('user-preferences')) {
  // ...
}
```

## 📝 Common Patterns

### Pattern 1: Feature Communication

**Before (Direct Import):**
```typescript
// ❌ Bad - Direct dependency
import { handleTextSelection } from '@/features/text-selection'
handleTextSelection(text)
```

**After (Event Bus):**
```typescript
// ✅ Good - Decoupled
import { eventBus } from '@/shared/events'
eventBus.emit('text:selected', { text, source: 'popup' })
```

### Pattern 2: Service Usage

**Before (Direct Instantiation):**
```typescript
// ❌ Bad - Hard to test, tightly coupled
const ai = new UnifiedAIService()
```

**After (Service Container):**
```typescript
// ✅ Good - Easy to test, loosely coupled
const ai = serviceContainer.get('ai')
```

### Pattern 3: External API Calls

**Before (Direct Electron):**
```typescript
// ❌ Bad - Hard to test, browser incompatible
window.electron.clipboard.writeText(text)
```

**After (Adapter):**
```typescript
// ✅ Good - Testable, browser compatible
await electronAdapter.clipboard.writeText(text)
```

### Pattern 4: Configuration

**Before (Direct localStorage):**
```typescript
// ❌ Bad - No type safety, manual serialization
localStorage.setItem('timeout', '30000')
const timeout = Number(localStorage.getItem('timeout'))
```

**After (Config Manager):**
```typescript
// ✅ Good - Type safe, automatic persistence
configManager.setNested('ai', 'timeout', 30000)
const timeout = configManager.getNested('ai', 'timeout')
```

## 🧪 Testing

### Mock Services

```typescript
import { 
  createMockServiceContainer,
  createMockAIService 
} from '@/shared/test-utils'

test('my feature', () => {
  const container = createMockServiceContainer()
  const ai = container.get('ai')
  
  // Use mocked service
  // ...
})
```

### Mock Event Bus

```typescript
import { createMockEventBus } from '@/shared/test-utils'

test('event handling', () => {
  const eventBus = createMockEventBus()
  eventBus.emit('text:selected', { text: 'test' })
  
  expect(eventBus.emit).toHaveBeenCalledWith(
    'text:selected',
    { text: 'test' }
  )
})
```

## 🔄 Migration Checklist

- [ ] Initialize services in app startup
- [ ] Replace direct service instantiation with service container
- [ ] Replace direct Electron calls with adapter
- [ ] Replace localStorage calls with storage service
- [ ] Replace cross-feature imports with event bus
- [ ] Replace manual config with config manager
- [ ] Update tests to use test utilities

## 📚 Next Steps

1. Read [ARCHITECTURE-PATTERNS.md](./ARCHITECTURE-PATTERNS.md) for detailed documentation
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for overall architecture
3. Review [solid-principle.md](../solid-principle.md) for SOLID principles

## 💡 Tips

1. **Always use interfaces** - Don't depend on concrete classes
2. **Use service container** - Don't instantiate services directly
3. **Use event bus** - Don't import from other features
4. **Use adapters** - Don't call external APIs directly
5. **Use config manager** - Don't use localStorage directly

## 🆘 Need Help?

- Check the [ARCHITECTURE-PATTERNS.md](./ARCHITECTURE-PATTERNS.md) for detailed examples
- Look at existing code that uses these patterns
- Ask in team discussions

