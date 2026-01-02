# Architecture Patterns Guide

This document describes the architectural patterns implemented in the codebase to ensure maintainability, scalability, and extensibility.

## Table of Contents

1. [Interface Contracts](#interface-contracts)
2. [Service Container](#service-container)
3. [Event Bus](#event-bus)
4. [Configuration Manager](#configuration-manager)
5. [Adapter Pattern](#adapter-pattern)
6. [Repository Pattern](#repository-pattern)
7. [Plugin Registry](#plugin-registry)
8. [Testing Utilities](#testing-utilities)

---

## Interface Contracts

**Location:** `shared/contracts/`

**Purpose:** Define contracts (interfaces) that all service implementations must follow.

**Benefits:**
- Easy to swap implementations
- Type safety
- Easy to mock for testing
- Clear contracts for new developers

**Example:**
```typescript
import type { IAIService } from '@/shared/contracts'

// Use interface, not concrete class
function useAI(ai: IAIService) {
  // Can work with any implementation
}
```

**Available Contracts:**
- `IAIService` - AI/LLM service interface
- `IStorageService` - Storage service interface
- `ITranscriptionService` - Audio transcription interface

---

## Service Container

**Location:** `shared/services/service-container.ts`

**Purpose:** Centralized dependency injection container.

**Benefits:**
- Lazy initialization
- Easy to replace services (especially for testing)
- Single source of truth for service instances
- Prevents circular dependencies

**Usage:**
```typescript
import { serviceContainer } from '@/shared/services'

// Register a service
serviceContainer.register('ai', () => new UnifiedAIService())

// Use a service
const ai = serviceContainer.get('ai')

// Replace for testing
serviceContainer.replace('ai', mockAIService)
```

**Initialization:**
```typescript
import { initializeServices } from '@/shared/services'

// In app initialization
initializeServices()
```

---

## Event Bus

**Location:** `shared/events/event-bus.ts`

**Purpose:** Type-safe event system for inter-feature communication.

**Benefits:**
- Prevents direct feature-to-feature dependencies
- Type-safe events
- Decoupled communication
- Easy to debug and trace

**Usage:**
```typescript
import { eventBus, useEvent } from '@/shared/events'

// Emit an event
eventBus.emit('text:selected', { text: 'Hello', source: 'popup' })

// Listen to events
const unsubscribe = eventBus.on('text:selected', ({ text }) => {
  console.log(text)
})

// React hook
function MyComponent() {
  useEvent('text:selected', ({ text }) => {
    setPromptText(text)
  })
}
```

**Adding New Events:**
1. Add event to `EventMap` type in `event-bus.ts`
2. Use the event throughout the codebase

---

## Configuration Manager

**Location:** `shared/config/config-manager.ts`

**Purpose:** Centralized configuration management with persistence.

**Benefits:**
- Single source of truth for config
- Automatic persistence
- Reactive updates
- Type-safe configuration

**Usage:**
```typescript
import { configManager, useConfig } from '@/shared/config'

// Get config
const aiConfig = configManager.get('ai')

// Update config
configManager.set('ai', { ...aiConfig, timeout: 60000 })

// Subscribe to changes
const unsubscribe = configManager.subscribe((config) => {
  console.log('Config changed:', config)
})

// React hook
function MyComponent() {
  const aiConfig = useConfig('ai')
  return <div>Timeout: {aiConfig.timeout}ms</div>
}
```

---

## Adapter Pattern

**Location:** `shared/adapters/`

**Purpose:** Abstract external dependencies (like Electron APIs).

**Benefits:**
- Easy to mock for testing
- Can swap implementations (e.g., Electron → Tauri)
- Browser fallbacks
- Type-safe APIs

**Usage:**
```typescript
import { electronAdapter } from '@/shared/adapters'

// Use adapter instead of direct electron calls
await electronAdapter.clipboard.writeText('Hello')

// Easy to mock
electronAdapter.clipboard.writeText = vi.fn()
```

**Available Adapters:**
- `electronAdapter` - Electron API adapter

---

## Repository Pattern

**Location:** `shared/repositories/`

**Purpose:** Abstract data access layer.

**Benefits:**
- Swap storage backends easily
- Consistent data access interface
- Easy to test
- Business logic separated from data access

**Usage:**
```typescript
import type { IRepository } from '@/shared/repositories'

class MessageRepository implements IRepository<Message> {
  async findById(id: string): Promise<Message | null> {
    // Implementation
  }
  // ... implement other methods
}
```

**Base Repository:**
```typescript
import { BaseRepository } from '@/shared/repositories'

class MessageRepository extends BaseRepository<Message> {
  // Only implement required methods
}
```

---

## Plugin Registry

**Location:** `shared/plugins/plugin-registry.ts`

**Purpose:** Extensible plugin system for registering features, providers, etc.

**Benefits:**
- Easy to add new plugins
- Priority-based ordering
- Enable/disable plugins
- Metadata support

**Usage:**
```typescript
import { pluginRegistry } from '@/shared/plugins'

// Register a plugin
pluginRegistry.register({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  priority: 10,
  instance: myPluginInstance
})

// Get all plugins
const plugins = pluginRegistry.getAll()

// Get plugin instance
const instance = pluginRegistry.getInstance('my-plugin')
```

---

## Testing Utilities

**Location:** `shared/test-utils/`

**Purpose:** Shared utilities for consistent test setup.

**Benefits:**
- Consistent test setup
- Mock services easily
- Reusable test utilities

**Usage:**
```typescript
import { 
  renderWithProviders, 
  createMockServiceContainer,
  createMockAIService 
} from '@/shared/test-utils'

test('my component', () => {
  const container = createMockServiceContainer()
  const { getByText } = renderWithProviders(
    <MyComponent />, 
    { services: container }
  )
  expect(getByText('Hello')).toBeInTheDocument()
})
```

---

## Best Practices

### 1. Always Use Interfaces

✅ **Good:**
```typescript
function useAI(ai: IAIService) { }
```

❌ **Bad:**
```typescript
function useAI(ai: UnifiedAIService) { }
```

### 2. Use Service Container

✅ **Good:**
```typescript
const ai = serviceContainer.get('ai')
```

❌ **Bad:**
```typescript
const ai = new UnifiedAIService()
```

### 3. Use Event Bus for Cross-Feature Communication

✅ **Good:**
```typescript
eventBus.emit('text:selected', { text, source })
```

❌ **Bad:**
```typescript
// Direct import from another feature
import { textSelectionHandler } from '@/features/text-selection'
```

### 4. Use Adapters for External APIs

✅ **Good:**
```typescript
await electronAdapter.clipboard.writeText(text)
```

❌ **Bad:**
```typescript
window.electron.clipboard.writeText(text)
```

### 5. Use Configuration Manager

✅ **Good:**
```typescript
const timeout = configManager.get('ai').timeout
```

❌ **Bad:**
```typescript
const timeout = localStorage.getItem('ai-timeout')
```

---

## Migration Guide

### Migrating Existing Code

1. **Replace direct service instantiation:**
   ```typescript
   // Before
   const ai = new UnifiedAIService()
   
   // After
   const ai = serviceContainer.get('ai')
   ```

2. **Replace direct Electron calls:**
   ```typescript
   // Before
   window.electron.clipboard.writeText(text)
   
   // After
   await electronAdapter.clipboard.writeText(text)
   ```

3. **Replace localStorage calls:**
   ```typescript
   // Before
   localStorage.setItem('key', JSON.stringify(value))
   const value = JSON.parse(localStorage.getItem('key'))
   
   // After
   const storage = serviceContainer.get('storage')
   await storage.set('key', value)
   const value = await storage.get('key')
   ```

4. **Use Event Bus for cross-feature communication:**
   ```typescript
   // Before
   import { handleTextSelection } from '@/features/text-selection'
   handleTextSelection(text)
   
   // After
   eventBus.emit('text:selected', { text, source: 'popup' })
   ```

---

## Next Steps

1. **Initialize services in app startup:**
   ```typescript
   import { initializeServices } from '@/shared/services'
   initializeServices()
   ```

2. **Register services as needed:**
   - AI service (already registered)
   - Storage service (already registered)
   - Transcription service (register when needed)

3. **Start using patterns:**
   - Replace direct service calls with service container
   - Use event bus for feature communication
   - Use adapters for external APIs
   - Use configuration manager for settings

4. **Add tests:**
   - Use test utilities for consistent setup
   - Mock services using service container
   - Test event emissions

---

## References

- [SOLID Principles](../solid-principle.md)
- [Frontend Architecture Guide](../ARCHITECTURE.md)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Service Locator Pattern](https://en.wikipedia.org/wiki/Service_locator_pattern)

