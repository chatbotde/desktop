# TypeScript Migration Guide

## 📋 Overview

This document tracks the ongoing migration of the chat-input module from JavaScript to TypeScript.

## 🎯 Goals

- **Type Safety**: Catch errors at compile-time instead of runtime
- **Better IntelliSense**: Improved IDE support and auto-completion
- **Maintainability**: Easier refactoring and code navigation
- **Documentation**: Types serve as living documentation
- **Scalability**: Better structure for growing codebase

## 📁 Project Structure

```
chat-input/
├── src/
│   └── types/           # TypeScript type definitions
│       ├── electron.types.ts
│       ├── ipc.types.ts
│       ├── window.types.ts
│       ├── capture.types.ts
│       └── index.ts
├── dist/                # Compiled JavaScript output
├── modules/             # Renderer process modules (ES Modules)
├── window/              # Main process window management (CommonJS)
├── capture/             # Capture system handlers
├── electron-api/        # Electron API wrappers
├── ui-components/       # UI components
├── tsconfig.json        # TypeScript configuration
└── package.json         # Package configuration
```

## 🔧 Setup

### 1. Install Dependencies

```bash
cd buddy/chat-input
npm install
```

### 2. Build TypeScript

```bash
# One-time build
npm run build

# Watch mode (rebuilds on changes)
npm run build:watch

# Type check only (no emit)
npm run type-check
```

## 📚 Type Definitions

### Core Types

- **`electron.types.ts`**: Electron-specific types (BrowserWindow, IPC events)
- **`ipc.types.ts`**: IPC channel definitions and message contracts
- **`window.types.ts`**: Window management interfaces
- **`capture.types.ts`**: Screenshot/video/audio capture types

### Usage

```typescript
import type { WindowBounds, IpcChannel, CaptureResult } from './src/types';
```

## 🗺️ Migration Strategy

### Phase 1: Foundation ✅ COMPLETE
- [x] Create tsconfig.json
- [x] Set up build process
- [x] Define core type definitions
- [x] Configure path aliases

### Phase 2: Type Definitions 🚧 IN PROGRESS
- [ ] Create Electron API type definitions
- [ ] Define IPC message contracts
- [ ] Create domain models

### Phase 3: Core Modules 📝 PLANNED
- [ ] Migrate `window/utils/` (utilities)
- [ ] Migrate `modules/core/` (core abstractions)
- [ ] Migrate `window/security/` (security manager)

### Phase 4: Feature Modules 📝 PLANNED
- [ ] Migrate window management system
- [ ] Migrate capture system
- [ ] Migrate clipboard system
- [ ] Migrate UI components

### Phase 5: Integration 📝 PLANNED
- [ ] Migrate IPC handlers
- [ ] Migrate main window file
- [ ] Migrate preload scripts

## 🔄 Migration Process

### Converting a JavaScript File to TypeScript

1. **Rename file**: `.js` → `.ts` (or `.jsx` → `.tsx`)

2. **Add type annotations**:
   ```typescript
   // Before (JS)
   function calculateBounds(x, y, width, height) {
     return { x, y, width, height };
   }

   // After (TS)
   import type { WindowBounds } from '@types';
   
   function calculateBounds(
     x: number,
     y: number,
     width: number,
     height: number
   ): WindowBounds {
     return { x, y, width, height };
   }
   ```

3. **Update imports**:
   ```typescript
   // CommonJS → ES Modules (if applicable)
   const { BrowserWindow } = require('electron');
   // becomes
   import { BrowserWindow } from 'electron';
   ```

4. **Define interfaces for classes**:
   ```typescript
   interface IWindowManager {
     show(): void;
     hide(): void;
     // ... other methods
   }

   class WindowManager implements IWindowManager {
     // ...
   }
   ```

5. **Build and check for errors**:
   ```bash
   npm run type-check
   ```

## 🛠️ Path Aliases

Use path aliases for cleaner imports:

```typescript
// Instead of:
import { WindowBounds } from '../../../src/types/window.types';

// Use:
import { WindowBounds } from '@types';
```

Available aliases:
- `@/*` - src directory
- `@types/*` - src/types directory
- `@modules/*` - modules directory
- `@window/*` - window directory
- `@capture/*` - capture directory
- `@ui/*` - ui-components directory
- `@electron-api/*` - electron-api directory

## 📝 Coding Standards

### Naming Conventions

- **Interfaces**: PascalCase, prefix with `I` for behavior contracts
  - `IWindowManager`, `ICaptureHandler`
- **Types**: PascalCase
  - `WindowBounds`, `CaptureResult`
- **Enums**: PascalCase for enum name, UPPER_CASE for values
  - `IpcChannel.WINDOW_SHOW`

### Type Annotations

- Always annotate function parameters and return types
- Use `readonly` for immutable properties
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and aliases

### Error Handling

```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function performAction(): Promise<Result<WindowBounds>> {
  try {
    const bounds = await getBounds();
    return { success: true, data: bounds };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

## 🐛 Common Issues

### Issue: Cannot find module

**Problem**: `Cannot find module '@types' or its corresponding type declarations`

**Solution**: Run `npm run build` to generate type declarations

### Issue: Module resolution

**Problem**: Path aliases not resolving

**Solution**: Check `tsconfig.json` paths configuration and ensure `baseUrl` is set

### Issue: Mixed modules

**Problem**: ES modules and CommonJS conflicts

**Solution**: Use appropriate module system per context:
- Main process: CommonJS (`require/module.exports`)
- Renderer process: ES Modules (`import/export`)

## 📊 Progress Tracking

Track migration progress in the checklist above. Update this document as files are migrated.

## 🤝 Contributing

When migrating files:
1. Create a branch for the migration
2. Migrate related files together (e.g., a module and its tests)
3. Run `npm run type-check` to verify no errors
4. Test the functionality in the application
5. Update this README with progress

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Electron TypeScript Guide](https://www.electronjs.org/docs/latest/tutorial/typescript)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
