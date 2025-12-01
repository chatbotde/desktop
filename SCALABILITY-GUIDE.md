# Scalability & Architecture Guide for Buddy

## 📋 Overview

This guide provides a practical, incremental playbook to make the Buddy codebase more scalable, easy to extend, and testable. Follow this guide whenever you're adding new features or refactoring existing code.

---

## 🎯 Current State Analysis

### What You Already Have ✅

- **Clear separation** of main process (`main.js`) and modular chat-input window
- **Modular structure** with window utils, handlers, security, and capture modules
- **Modern frontend** with React + TypeScript + Vite (good for modularity and testing)
- **Live development** via `npm run dev` with hot reload
- **Feature-based organization** in chat-input (core/, input/, capture/, clipboard/, media/, ui/)

### Current Architecture

```
buddy/
├── main.js                    # Main process entry (needs splitting)
├── frontend/                  # React + TypeScript + Vite
├── chat-input/               # Chat input window modules
│   ├── modules/              # Feature modules
│   ├── window/               # Window management
│   ├── capture/              # Capture functionality
│   └── electron-api/         # Electron API wrappers
├── auth/                     # Authentication
├── global-shortcut/          # Keyboard shortcuts
└── startup/                  # Auto-startup
```

---

## 🎯 Scalability Goals

1. **Faster and safer feature addition** (plugin-like modules, scaffolding)
2. **Strong contracts between layers** (typed IPC boundaries)
3. **Predictable architecture** (clear boundaries and patterns)
4. **Testability** across unit, integration (IPC), and e2e
5. **Easy onboarding** for new developers

---

## 🏗️ Architecture Improvements

### 1. Solidify Architecture Boundaries

#### Main Process Structure (Refactor `main.js`)

**Current Problem**: `main.js` is 631 lines handling everything—app init, windows, shortcuts, IPC, services.

**Solution**: Split into focused modules:

```
buddy/
├── main.js                           # Entry point only
├── main-process/
│   ├── app-init.js                  # Process setup, auth, environment, deep-links
│   ├── window-manager.js            # Chat input creation and window lifecycle
│   ├── shortcut-manager.js          # Global shortcut registration
│   ├── ipc/
│   │   ├── index.js                 # IPC handler registry
│   │   ├── ai-models.js             # AI model handlers
│   │   ├── environment.js           # Environment config handlers
│   │   ├── media.js                 # Media streaming handlers
│   │   └── mcp.js                   # MCP server handlers
│   └── services/
│       ├── clipboard-service.js     # Clipboard monitor
│       ├── selection-service.js     # Text selection monitor
│       └── tsf-service.js           # TSF initialization
```

**Benefits**:
- Each area is testable and replaceable
- Easier maintenance and debugging
- New developers understand structure quickly
- Clearer dependency graph

#### Renderer/Chat Input Structure

**Keep Current Structure** but add:

```
chat-input/
├── core/
│   ├── feature-registry.js          # NEW: Feature registration system
│   ├── event-bus.js                 # NEW: Cross-module communication
│   ├── service-container.js         # NEW: Lightweight DI container
│   └── ipc-contracts.ts             # NEW: Typed IPC definitions
├── modules/
│   ├── [feature]/
│   │   ├── manifest.json            # NEW: Feature metadata
│   │   ├── index.js                 # Feature entry point
│   │   ├── handlers.js              # IPC handlers
│   │   └── __tests__/               # Feature tests
```

---

### 2. Service Registry (Dependency Injection)

**Problem**: Tight coupling makes testing and substitutions harder.

**Solution**: Simple service registry for runtime dependency resolution.

```javascript
// core/service-container.js
class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }
  
  register(name, factory, singleton = true) {
    this.services.set(name, { factory, singleton });
  }
  
  resolve(name) {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service ${name} not found`);
    
    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory(this));
      }
      return this.singletons.get(name);
    }
    
    return service.factory(this);
  }
  
  // For testing: replace a service
  mock(name, mockImplementation) {
    this.singletons.set(name, mockImplementation);
  }
}

export const container = new ServiceContainer();

// Usage in main.js or chat-input
container.register('clipboardMonitor', () => new ClipboardMonitor());
container.register('tsfManager', () => new TsfManager());
container.register('captureAPI', () => new CaptureAPI());

// Resolve when needed
const clipboard = container.resolve('clipboardMonitor');
```

**Benefits**:
- Easy mocking in tests
- Clear lifecycle management
- Plugin-friendly architecture
- Swap implementations without code changes

---

### 3. Event Bus for Decoupled Communication

**Problem**: Direct function calls between modules create tight coupling.

**Solution**: Centralized event bus for pub/sub communication.

```javascript
// core/event-bus.js
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.middleware = [];
  }
  
  on(event, handler, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const listener = {
      handler,
      once: options.once || false,
      priority: options.priority || 0
    };
    
    this.listeners.get(event).push(listener);
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }
  
  off(event, handler) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    
    const index = listeners.findIndex(l => l.handler === handler);
    if (index !== -1) listeners.splice(index, 1);
  }
  
  async emit(event, data) {
    console.log(`[EventBus] Emitting: ${event}`, data);
    
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.length === 0) return;
    
    // Apply middleware (logging, validation, etc.)
    let processedData = data;
    for (const middleware of this.middleware) {
      processedData = await middleware(event, processedData);
    }
    
    // Execute listeners
    for (const listener of listeners) {
      try {
        await listener.handler(processedData);
        if (listener.once) {
          this.off(event, listener.handler);
        }
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }
    }
  }
  
  // Add middleware (e.g., logging, validation)
  use(middleware) {
    this.middleware.push(middleware);
  }
}

export const eventBus = new EventBus();

// Usage Example
// In clipboard module
eventBus.emit('clipboard:changed', { type: 'image', data: imageData });

// In input module
eventBus.on('clipboard:changed', async (data) => {
  await handleClipboardData(data);
});
```

**Common Events**:
- `clipboard:changed` - Clipboard content changed
- `text:selected` - Text selected from external app
- `capture:screenshot` - Screenshot captured
- `capture:audio:start` - Audio recording started
- `capture:audio:stop` - Audio recording stopped
- `ai:model:changed` - AI model changed
- `window:focus:changed` - Window focus changed
- `tsf:insert:requested` - TSF text insertion requested

**Benefits**:
- Decoupled modules
- Centralized event logging (easier debugging)
- Better testability
- Plugin-friendly architecture
- Easy feature enable/disable

---

### 4. Strong IPC Contracts (Typed & Validated)

**Problem**: Untyped IPC calls lead to runtime errors and integration issues.

**Solution**: Define all IPC contracts with TypeScript types + Zod schemas.

```typescript
// frontend/src/lib/ipc/contracts.ts
import { z } from 'zod';

// Schema definitions
export const AIModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(['openai', 'anthropic', 'google', 'deepseek', 'openrouter']),
  capabilities: z.object({
    text: z.boolean(),
    image: z.boolean(),
    audio: z.boolean(),
    video: z.boolean(),
  }),
});

export const ClipboardDataSchema = z.object({
  type: z.enum(['text', 'image', 'html']),
  content: z.string().optional(),
  base64: z.string().optional(),
});

export const CaptureRequestSchema = z.object({
  type: z.enum(['screenshot', 'area', 'audio', 'video']),
  options: z.object({
    quality: z.number().min(0).max(100).optional(),
    format: z.enum(['png', 'jpg', 'webm', 'wav']).optional(),
  }).optional(),
});

// Type inference
export type AIModel = z.infer<typeof AIModelSchema>;
export type ClipboardData = z.infer<typeof ClipboardDataSchema>;
export type CaptureRequest = z.infer<typeof CaptureRequestSchema>;

// IPC Channel definitions
export const IPC_CHANNELS = {
  // AI Models
  GET_ALL_AI_MODELS: 'get-all-ai-models',
  AI_MODEL_CHANGED: 'ai-model-changed',
  
  // Clipboard
  CLIPBOARD_CHANGED: 'clipboard-changed',
  START_CLIPBOARD_MONITORING: 'start-clipboard-monitoring',
  STOP_CLIPBOARD_MONITORING: 'stop-clipboard-monitoring',
  
  // Capture
  CAPTURE_SCREENSHOT: 'capture-screenshot',
  CAPTURE_AREA: 'capture-area',
  START_AUDIO_RECORDING: 'start-audio-recording',
  STOP_AUDIO_RECORDING: 'stop-audio-recording',
  
  // MCP
  MCP_CONNECT: 'mcp:connect',
  MCP_SEND: 'mcp:send',
  MCP_DISCONNECT: 'mcp:disconnect',
  
  // Environment
  GET_FRONTEND_URL: 'get-frontend-url',
  IS_DEVELOPMENT: 'is-development',
} as const;

// Helper for validated IPC calls
export async function invokeIPC<T>(
  channel: string,
  schema: z.ZodSchema<T>,
  ...args: any[]
): Promise<T> {
  const result = await window.electron.ipcRenderer.invoke(channel, ...args);
  return schema.parse(result);
}

// Usage in components
const models = await invokeIPC(
  IPC_CHANNELS.GET_ALL_AI_MODELS,
  z.array(AIModelSchema)
);
```

**Main Process Contract Validation**:

```javascript
// main-process/ipc/validate.js
const { z } = require('zod');

function createValidatedHandler(schema, handler) {
  return async (event, ...args) => {
    try {
      // Validate input
      const validatedInput = schema.parse(args[0]);
      
      // Execute handler
      const result = await handler(event, validatedInput, ...args.slice(1));
      
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('IPC validation error:', error.errors);
        throw new Error(`Invalid IPC arguments: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  };
}

// Usage in IPC handlers
ipcMain.handle('mcp:connect', createValidatedHandler(
  z.object({
    serverId: z.string(),
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  }),
  async (event, config) => {
    // config is now validated
    // ... handler logic
  }
));
```

**Benefits**:
- Catch integration errors at development time
- Self-documenting IPC API
- Safer feature integrations
- Easy contract testing
- Better IDE autocomplete

---

### 5. Feature Plugin System with Manifests

**Problem**: Adding features requires scattered changes across multiple files.

**Solution**: Self-contained feature modules with manifests.

```json
// modules/capture/manifest.json
{
  "id": "capture",
  "name": "Capture & Screenshots",
  "version": "1.0.0",
  "description": "Screenshot, audio, and video capture functionality",
  
  "entry": "./index.js",
  "lazyLoad": true,
  
  "dependencies": [
    "core",
    "clipboard"
  ],
  
  "ipcChannels": {
    "handlers": [
      "capture-screenshot",
      "capture-area",
      "start-audio-recording",
      "stop-audio-recording"
    ],
    "listeners": [
      "clipboard-changed"
    ]
  },
  
  "uiInjectionPoints": [
    {
      "id": "capture-button",
      "location": "toolbar",
      "component": "./ui/CaptureButton.js"
    }
  ],
  
  "commands": [
    {
      "id": "capture.screenshot",
      "title": "Take Screenshot",
      "shortcut": "Ctrl+Shift+S"
    },
    {
      "id": "capture.area",
      "title": "Capture Area",
      "shortcut": "Ctrl+Shift+A"
    }
  ],
  
  "settings": [
    {
      "key": "capture.defaultFormat",
      "type": "string",
      "default": "png",
      "enum": ["png", "jpg"]
    },
    {
      "key": "capture.quality",
      "type": "number",
      "default": 90,
      "min": 0,
      "max": 100
    }
  ]
}
```

```javascript
// core/feature-registry.js
class FeatureRegistry {
  constructor() {
    this.features = new Map();
    this.loadedFeatures = new Set();
  }
  
  async registerFeature(manifest) {
    console.log(`[FeatureRegistry] Registering feature: ${manifest.id}`);
    
    this.features.set(manifest.id, {
      manifest,
      instance: null,
      loaded: false
    });
    
    // Load immediately if not lazy
    if (!manifest.lazyLoad) {
      await this.loadFeature(manifest.id);
    }
  }
  
  async loadFeature(featureId) {
    const feature = this.features.get(featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }
    
    if (feature.loaded) {
      return feature.instance;
    }
    
    console.log(`[FeatureRegistry] Loading feature: ${featureId}`);
    
    // Load dependencies first
    if (feature.manifest.dependencies) {
      for (const dep of feature.manifest.dependencies) {
        await this.loadFeature(dep);
      }
    }
    
    // Dynamic import
    const module = await import(feature.manifest.entry);
    feature.instance = module.default || module;
    feature.loaded = true;
    this.loadedFeatures.add(featureId);
    
    // Initialize feature
    if (feature.instance.init) {
      await feature.instance.init();
    }
    
    return feature.instance;
  }
  
  async loadAllFeatures() {
    const promises = [];
    for (const [id, feature] of this.features) {
      if (!feature.loaded) {
        promises.push(this.loadFeature(id));
      }
    }
    return Promise.all(promises);
  }
  
  getFeature(featureId) {
    const feature = this.features.get(featureId);
    return feature?.instance;
  }
  
  isLoaded(featureId) {
    return this.loadedFeatures.has(featureId);
  }
}

export const featureRegistry = new FeatureRegistry();
```

**Usage in modules/index.js**:

```javascript
import { featureRegistry } from './core/feature-registry.js';

// Register features
import captureManifest from './capture/manifest.json';
import clipboardManifest from './clipboard/manifest.json';
import inputManifest from './input/manifest.json';

async function initializeApp() {
  // Register all features
  await featureRegistry.registerFeature(captureManifest);
  await featureRegistry.registerFeature(clipboardManifest);
  await featureRegistry.registerFeature(inputManifest);
  
  // Load critical features immediately
  await featureRegistry.loadFeature('core');
  await featureRegistry.loadFeature('input');
  
  // Lazy load others on demand
  document.addEventListener('click', async (e) => {
    if (e.target.closest('[data-feature="capture"]')) {
      await featureRegistry.loadFeature('capture');
    }
  });
}

initializeApp();
```

**Benefits**:
- Self-contained features
- Easy enable/disable features
- Lazy loading for faster startup
- Clear feature dependencies
- Plugin architecture foundation

---

### 6. Lazy Loading Non-Critical Modules

**Problem**: All modules load on startup, increasing initial load time.

**Solution**: Load critical modules first, defer others.

```javascript
// modules/lazy-loader.js
const moduleRegistry = {
  'core': () => import('./core/index.js'),
  'input': () => import('./input/input-enhancements.js'),
  'capture': () => import('./capture/uploads-capture.js'),
  'clipboard': () => import('./clipboard/clipboard-ui.js'),
  'mcp': () => import('./core/mcp-manager.js'),
  'media': () => import('./media/attachments.js'),
  'richmedia': () => import('./media/richmedia.js'),
};

class LazyModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
  }
  
  async loadModule(name) {
    if (this.loadedModules.has(name)) {
      console.log(`[LazyLoader] Module ${name} already loaded`);
      return;
    }
    
    if (this.loadingPromises.has(name)) {
      console.log(`[LazyLoader] Module ${name} is loading...`);
      return this.loadingPromises.get(name);
    }
    
    console.log(`[LazyLoader] Loading module: ${name}`);
    const startTime = performance.now();
    
    const promise = moduleRegistry[name]()
      .then(module => {
        this.loadedModules.add(name);
        this.loadingPromises.delete(name);
        const loadTime = performance.now() - startTime;
        console.log(`[LazyLoader] Module ${name} loaded in ${loadTime.toFixed(2)}ms`);
        return module;
      })
      .catch(error => {
        console.error(`[LazyLoader] Failed to load module ${name}:`, error);
        this.loadingPromises.delete(name);
        throw error;
      });
    
    this.loadingPromises.set(name, promise);
    return promise;
  }
  
  async loadModules(names) {
    return Promise.all(names.map(name => this.loadModule(name)));
  }
  
  isLoaded(name) {
    return this.loadedModules.has(name);
  }
}

export const lazyLoader = new LazyModuleLoader();

// Usage in modules/index.js
import { lazyLoader } from './lazy-loader.js';

// Load critical modules immediately
await lazyLoader.loadModules(['core', 'input']);

// Load on interaction
document.getElementById('capture-btn').addEventListener('click', async () => {
  await lazyLoader.loadModule('capture');
  // Now use capture features
});

document.getElementById('clipboard-btn').addEventListener('click', async () => {
  await lazyLoader.loadModule('clipboard');
});

// Load on timer (low priority)
setTimeout(() => {
  lazyLoader.loadModule('mcp');
  lazyLoader.loadModule('richmedia');
}, 3000);
```

**Loading Strategy**:
- **Immediate** (< 100ms): `core`, `input`, `dom`, `state`
- **On First Interaction** (< 500ms): `capture`, `clipboard`, `media`
- **Deferred** (> 2s): `mcp`, `richmedia`, `webview`

**Benefits**:
- 40-60% faster initial load
- Reduced memory footprint
- Better code splitting
- Improved user experience

---

## 🧪 Testing Strategy

### Testing Pyramid

```
       /\
      /E2E\           - 5-10 tests (critical flows)
     /------\
    /Integr..\        - 20-30 tests (IPC contracts, service integration)
   /----------\
  /   Unit     \      - 100+ tests (components, utilities, business logic)
 /--------------\
```

### 1. Unit Tests

#### Frontend (Vitest)

```bash
# Install Vitest
cd frontend
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event
```

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

```typescript
// src/components/ChatInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  it('renders input field', () => {
    render(<ChatInput />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
  
  it('calls onSubmit when Enter is pressed', async () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(onSubmit).toHaveBeenCalledWith('test message');
  });
});
```

```json
// frontend/package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### Main Process (Vitest in Node mode)

```bash
# In buddy root
npm install -D vitest
```

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.js'],
  },
});
```

```javascript
// main-process/services/__tests__/clipboard-service.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClipboardService } from '../clipboard-service';

describe('ClipboardService', () => {
  let service;
  
  beforeEach(() => {
    service = new ClipboardService();
  });
  
  afterEach(() => {
    service.stopMonitoring();
  });
  
  it('starts monitoring', () => {
    service.startMonitoring();
    expect(service.isActive()).toBe(true);
  });
  
  it('emits change event when clipboard changes', async () => {
    const handler = vi.fn();
    service.on('change', handler);
    
    service.startMonitoring();
    
    // Simulate clipboard change
    await service._checkClipboard();
    
    expect(handler).toHaveBeenCalled();
  });
});
```

### 2. IPC Contract Tests

```javascript
// __tests__/ipc-contracts.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app, ipcMain } from 'electron';
import { z } from 'zod';

describe('IPC Contracts', () => {
  beforeAll(async () => {
    await app.whenReady();
    // Register IPC handlers
    require('../main-process/ipc/index.js');
  });
  
  it('get-all-ai-models returns valid schema', async () => {
    const AIModelSchema = z.array(z.object({
      id: z.string(),
      name: z.string(),
      provider: z.string(),
    }));
    
    const result = await ipcMain.handle('get-all-ai-models');
    expect(() => AIModelSchema.parse(result)).not.toThrow();
  });
  
  it('mcp:connect validates input', async () => {
    const invalidConfig = { serverId: 123 }; // Should be string
    
    await expect(
      ipcMain.handle('mcp:connect', null, invalidConfig)
    ).rejects.toThrow('Invalid IPC arguments');
  });
});
```

### 3. E2E Tests (Playwright + Electron)

```bash
npm install -D playwright @playwright/test
```

```javascript
// e2e/chat-input.spec.js
const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');

test.describe('Chat Input Window', () => {
  let electronApp;
  let window;
  
  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['main.js'] });
    window = await electronApp.firstWindow();
  });
  
  test.afterAll(async () => {
    await electronApp.close();
  });
  
  test('shows chat input on Ctrl+H', async () => {
    await window.keyboard.press('Control+H');
    
    await expect(window.locator('#chat-input')).toBeVisible();
  });
  
  test('toggles minimal mode on Ctrl+M', async () => {
    await window.keyboard.press('Control+M');
    
    const isMinimal = await window.evaluate(() => {
      return document.body.classList.contains('minimal-mode');
    });
    
    expect(isMinimal).toBe(true);
  });
  
  test('captures screenshot on button click', async () => {
    await window.click('#capture-dropdown');
    await window.click('#screenshot-option');
    
    await expect(window.locator('.screenshot-preview')).toBeVisible({
      timeout: 5000
    });
  });
});
```

```json
// package.json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 4. Pseudo Mode for Sensitive Operations

**Problem**: Testing system-level operations (text insertion, file operations) is risky.

**Solution**: Implement dry-run mode that logs instead of executing.

```javascript
// core/pseudo-mode.js
class PseudoMode {
  constructor() {
    this.enabled = process.env.PSEUDO_MODE === 'true';
    this.logs = [];
  }
  
  isEnabled() {
    return this.enabled;
  }
  
  enable() {
    this.enabled = true;
    console.log('[PseudoMode] Enabled - operations will be logged, not executed');
  }
  
  disable() {
    this.enabled = false;
    console.log('[PseudoMode] Disabled - operations will execute normally');
  }
  
  log(operation, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      operation,
      details,
    };
    
    this.logs.push(entry);
    console.log('[PseudoMode]', operation, details);
  }
  
  getLogs() {
    return this.logs;
  }
  
  clearLogs() {
    this.logs = [];
  }
}

export const pseudoMode = new PseudoMode();

// Usage in TSF insert
import { pseudoMode } from '../core/pseudo-mode.js';

async function insertTextAtCursor(text) {
  if (pseudoMode.isEnabled()) {
    pseudoMode.log('tsf:insert', { text, cursor: 'current' });
    return { success: true, pseudo: true };
  }
  
  // Real implementation
  return await tsf.insertText(text);
}
```

**Enable in tests**:
```javascript
// In test setup
import { pseudoMode } from './core/pseudo-mode.js';

beforeEach(() => {
  pseudoMode.enable();
});

afterEach(() => {
  expect(pseudoMode.getLogs()).toContainEqual({
    operation: 'tsf:insert',
    details: { text: 'test text' }
  });
  pseudoMode.clearLogs();
});
```

---

## 🛠️ Feature Scaffolding Script

**Create features quickly with consistent structure.**

```javascript
// scripts/new-feature.js
const fs = require('fs');
const path = require('path');

function createFeature(featureName) {
  const featureDir = path.join(__dirname, '../chat-input/modules', featureName);
  
  // Create directories
  fs.mkdirSync(featureDir, { recursive: true });
  fs.mkdirSync(path.join(featureDir, 'handlers'), { recursive: true });
  fs.mkdirSync(path.join(featureDir, '__tests__'), { recursive: true });
  
  // Create manifest.json
  const manifest = {
    id: featureName,
    name: featureName.charAt(0).toUpperCase() + featureName.slice(1),
    version: '1.0.0',
    description: `${featureName} feature`,
    entry: './index.js',
    lazyLoad: true,
    dependencies: ['core'],
    ipcChannels: {
      handlers: [],
      listeners: []
    }
  };
  
  fs.writeFileSync(
    path.join(featureDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  // Create index.js
  const indexContent = `/**
 * ${featureName} Feature
 * Auto-generated by new-feature script
 */

export default {
  async init() {
    console.log('[${featureName}] Feature initialized');
  },
  
  async activate() {
    console.log('[${featureName}] Feature activated');
  },
  
  async deactivate() {
    console.log('[${featureName}] Feature deactivated');
  }
};
`;
  
  fs.writeFileSync(path.join(featureDir, 'index.js'), indexContent);
  
  // Create handlers/index.js
  const handlersContent = `/**
 * ${featureName} IPC Handlers
 */

export function registerHandlers(ipcMain) {
  // Add your IPC handlers here
}
`;
  
  fs.writeFileSync(
    path.join(featureDir, 'handlers', 'index.js'),
    handlersContent
  );
  
  // Create test file
  const testContent = `import { describe, it, expect } from 'vitest';
import feature from '../index.js';

describe('${featureName} Feature', () => {
  it('initializes successfully', async () => {
    await expect(feature.init()).resolves.toBeUndefined();
  });
});
`;
  
  fs.writeFileSync(
    path.join(featureDir, '__tests__', 'index.test.js'),
    testContent
  );
  
  // Create README.md
  const readmeContent = `# ${featureName} Feature

## Description

[Add feature description here]

## Usage

\`\`\`javascript
import ${featureName} from './${featureName}';

await ${featureName}.init();
\`\`\`

## IPC Channels

- [ ] Add IPC channel documentation

## Events

- [ ] Add event documentation

## Testing

\`\`\`bash
npm test -- ${featureName}
\`\`\`
`;
  
  fs.writeFileSync(path.join(featureDir, 'README.md'), readmeContent);
  
  console.log(`✅ Feature '${featureName}' scaffolded successfully!`);
  console.log(`📁 Location: ${featureDir}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Edit ${featureName}/manifest.json with feature metadata`);
  console.log(`   2. Implement feature logic in ${featureName}/index.js`);
  console.log(`   3. Add IPC handlers in ${featureName}/handlers/index.js`);
  console.log(`   4. Write tests in ${featureName}/__tests__/`);
  console.log(`   5. Register feature in modules/index.js`);
}

// Get feature name from command line
const featureName = process.argv[2];

if (!featureName) {
  console.error('❌ Error: Please provide a feature name');
  console.log('Usage: node scripts/new-feature.js <feature-name>');
  process.exit(1);
}

createFeature(featureName);
```

**Usage**:
```bash
node scripts/new-feature.js my-awesome-feature
```

**Output**:
```
chat-input/modules/my-awesome-feature/
├── manifest.json
├── index.js
├── README.md
├── handlers/
│   └── index.js
└── __tests__/
    └── index.test.js
```

---

## 📊 Suggested Roadmap

### Week 1: Foundation
- [ ] Extract `main.js` into focused modules (app-init, window-manager, shortcut-manager, ipc/, services/)
- [ ] Add `FeatureRegistry` in `chat-input/core/`
- [ ] Add `EventBus` in `chat-input/core/`
- [ ] Define IPC contracts with TypeScript + Zod in `frontend/src/lib/ipc/contracts.ts`
- [ ] Add validation in main process IPC handlers

### Week 2: Scalability
- [ ] Implement lazy-loading for capture/clipboard/media modules
- [ ] Create feature scaffolding script (`scripts/new-feature.js`)
- [ ] Set up Vitest for frontend tests
- [ ] Set up Vitest for main process tests
- [ ] Write 10-20 unit tests for critical components

### Week 3: Testing & Documentation
- [ ] Write IPC contract tests
- [ ] Set up Playwright for E2E tests
- [ ] Write 3-5 E2E tests for critical flows (shortcuts, capture, minimal mode)
- [ ] Implement pseudo mode for sensitive operations
- [ ] Document contribution flow
- [ ] Create feature template documentation

### Week 4: Polish & Migration
- [ ] Migrate existing features to use EventBus
- [ ] Add feature manifests for capture, clipboard, input, media
- [ ] Performance audit and optimization
- [ ] Update developer onboarding docs
- [ ] Code review and refactoring

---

## 🎓 Developer Onboarding Checklist

### For New Features

- [ ] Run scaffolding script: `node scripts/new-feature.js <name>`
- [ ] Fill out `manifest.json` with feature metadata
- [ ] Define IPC contracts in `frontend/src/lib/ipc/contracts.ts`
- [ ] Implement feature in `index.js` with `init()`, `activate()`, `deactivate()`
- [ ] Add IPC handlers with validation
- [ ] Use EventBus for cross-module communication
- [ ] Write unit tests (min 80% coverage)
- [ ] Write IPC contract tests
- [ ] Add E2E test if critical flow
- [ ] Document in feature README.md
- [ ] Register feature in `modules/index.js`
- [ ] Test with pseudo mode enabled
- [ ] Code review with team

---

## 📚 Best Practices

### Code Organization
- ✅ One feature = one directory
- ✅ Keep features self-contained
- ✅ Use EventBus for cross-feature communication
- ✅ Define clear contracts (IPC schemas)
- ❌ Don't create circular dependencies
- ❌ Don't import from other features directly

### IPC Communication
- ✅ Always validate IPC payloads with Zod
- ✅ Use typed channels from `IPC_CHANNELS` constant
- ✅ Handle errors gracefully
- ✅ Log IPC calls in development
- ❌ Don't send large data (> 1MB) through IPC
- ❌ Don't block the main process

### Testing
- ✅ Test one thing at a time
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ✅ Test error cases
- ✅ Use pseudo mode for sensitive ops
- ❌ Don't test implementation details
- ❌ Don't write flaky tests

### Performance
- ✅ Lazy load non-critical features
- ✅ Debounce/throttle frequent events
- ✅ Clean up event listeners
- ✅ Profile before optimizing
- ❌ Don't optimize prematurely
- ❌ Don't block the UI thread

---

## 🚀 Quick Start Guide

### Adding a New Feature (5-Step Process)

1. **Scaffold the feature**
   ```bash
   node scripts/new-feature.js notification-system
   ```

2. **Define IPC contracts**
   ```typescript
   // frontend/src/lib/ipc/contracts.ts
   export const NotificationSchema = z.object({
     title: z.string(),
     message: z.string(),
     type: z.enum(['info', 'warning', 'error']),
   });
   ```

3. **Implement the feature**
   ```javascript
   // modules/notification-system/index.js
   import { eventBus } from '../core/event-bus.js';
   
   export default {
     async init() {
       eventBus.on('notification:show', this.handleNotification);
     },
     
     handleNotification(data) {
       // Show notification
     }
   };
   ```

4. **Write tests**
   ```javascript
   // modules/notification-system/__tests__/index.test.js
   import { describe, it, expect } from 'vitest';
   import feature from '../index.js';
   
   describe('Notification System', () => {
     it('shows notification', async () => {
       // Test implementation
     });
   });
   ```

5. **Register the feature**
   ```javascript
   // modules/index.js
   import notificationManifest from './notification-system/manifest.json';
   
   featureRegistry.registerFeature(notificationManifest);
   ```

---

## 🔍 Troubleshooting

### Common Issues

**Q: Feature not loading?**
- Check manifest.json is valid JSON
- Verify entry path is correct
- Check dependencies are loaded first
- Look for errors in console

**Q: IPC validation failing?**
- Verify schema matches data structure
- Check for type mismatches (string vs number)
- Use `.passthrough()` for extra fields
- Log the payload before validation

**Q: Tests failing in CI?**
- Ensure pseudo mode is enabled
- Check for race conditions
- Verify mocks are properly set up
- Add proper wait/timeouts for async ops

**Q: Slow startup?**
- Profile with DevTools Performance tab
- Enable lazy loading for non-critical features
- Check for synchronous file I/O
- Reduce initial dependencies

---

## 📖 Additional Resources

- **Electron IPC**: https://www.electronjs.org/docs/latest/tutorial/ipc
- **Zod Validation**: https://zod.dev/
- **Vitest Testing**: https://vitest.dev/
- **Playwright E2E**: https://playwright.dev/

---

## 🎯 Success Metrics

Track these to measure scalability improvements:

- **Startup Time**: < 2 seconds
- **Feature Addition Time**: < 30 minutes
- **Test Coverage**: > 80%
- **Build Time**: < 1 minute
- **Memory Usage**: < 200MB idle
- **IPC Latency**: < 50ms average

---

**Last Updated**: December 2025  
**Maintained By**: Development Team  
**Questions?** Open an issue or discuss in team chat.
