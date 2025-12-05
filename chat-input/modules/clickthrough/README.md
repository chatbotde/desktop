# Clickthrough Module

A SOLID-compliant, modular system for managing clickthrough behavior in Electron applications.

## 📁 Architecture

This module follows SOLID principles with clear separation of concerns:

```
modules/clickthrough/
├── core/                    # Core functionality (SRP)
│   ├── state-manager.js     # State management with event emission
│   ├── mouse-tracker.js     # Mouse position tracking
│   └── ui-detector.js       # UI element detection using heuristics
├── services/                # Business logic services (SRP)
│   ├── clickthrough-service.js      # Enable/disable clickthrough
│   ├── iframe-monitor-service.js    # Iframe hover monitoring
│   └── button-controller.js         # UI button state updates
├── handlers/                # Event handlers (SRP)
│   ├── renderer-handlers.js         # DOM event handlers
│   └── message-handlers.js          # PostMessage handlers
├── utils/                   # Utilities
│   ├── patterns.js          # UI detection patterns
│   └── dom-helpers.js       # DOM utility functions
├── types/                   # TypeScript definitions
│   ├── clickthrough.types.ts        # Type definitions
│   └── ipc-channels.js              # IPC channel constants
└── index.js                 # Public API

```

## 🎯 SOLID Principles Applied

### Single Responsibility Principle (SRP)
- **StateManager**: Only manages clickthrough state
- **MouseTracker**: Only tracks mouse position
- **UIDetector**: Only detects UI elements
- **ClickthroughService**: Only handles enable/disable logic
- **IframeMonitor**: Only monitors iframe hover state
- **ButtonController**: Only updates button UI

### Open/Closed Principle (OCP)
- Easy to add new UI detection patterns without modifying core logic
- Easy to add new integrations without changing existing services

### Liskov Substitution Principle (LSP)
- Services can be replaced with compatible implementations
- Consistent interfaces across all modules

### Interface Segregation Principle (ISP)
- Focused, client-specific interfaces
- Each integration is isolated and optional

### Dependency Inversion Principle (DIP)
- Services depend on abstractions (injected dependencies)
- Easy to mock for testing

## 📖 Usage

### Basic Initialization

```javascript
import { initialize, toggle, enable, disable, isEnabled } from './modules/clickthrough/index.js';

// Initialize with dependencies
initialize({
  chatInputAPI: window.chatInputAPI,  // API with enable/disableClickThrough methods
  button: document.getElementById('clickthrough-button')
});

// Toggle clickthrough
toggle();

// Enable clickthrough
enable();

// Disable clickthrough
disable();

// Check state
if (isEnabled()) {
  console.log('Clickthrough is enabled');
}
```

### Advanced Usage

```javascript
import {
  clickthroughService,
  stateManager,
  mouseTracker,
  iframeMonitor
} from './modules/clickthrough/index.js';

// Listen for state changes
stateManager.onChange(({ enabled }) => {
  console.log('Clickthrough state changed:', enabled);
});

// Get mouse position
const position = mouseTracker.getPosition();

// Check if over iframe
if (mouseTracker.isOverIframe()) {
  console.log('Mouse is over iframe');
}

// Custom iframe monitoring
iframeMonitor.start((isOverIframe) => {
  console.log('Iframe hover state:', isOverIframe);
});
```

## 🔧 Key Features

### Automatic UI Detection
The UIDetector uses multiple heuristics to automatically identify interactive elements:
- Interactive HTML elements (button, input, etc.)
- Elements with event handlers
- ARIA roles
- Data attributes
- CSS cursor styles
- Z-index layering
- Position (fixed/absolute)
- Class name patterns
- Parent element analysis

### Iframe Monitoring
Continuously monitors iframe hover state using polling (every 50ms) to detect when the mouse enters/leaves iframes, even when mouse events don't fire inside iframes.

### State Persistence
State is automatically persisted to sessionStorage and restored on initialization.

### PostMessage Communication
Supports bidirectional communication with iframes for coordinated clickthrough control.

### Keyboard Shortcut
**Ctrl+T** toggles clickthrough mode.

## 🧪 Testing

Each module can be tested independently due to the SOLID architecture:

```javascript
// Example: Testing state manager
import { stateManager } from './core/state-manager.js';

// Test enable
stateManager.enable();
console.assert(stateManager.isEnabled() === true);

// Test disable
stateManager.disable();
console.assert(stateManager.isEnabled() === false);

// Test event emission
stateManager.onChange(({ enabled }) => {
  console.log('State changed:', enabled);
});
```

## 🔌 Integration Points

### WebView Integration
The module works seamlessly with WebView containers and detects hover state over WebContentsView elements.

### Clipboard Integration
Automatically handles clickthrough for clipboard UI elements.

### Floating Cards
Detects interaction state (dragging, resizing) and automatically manages clickthrough.

## 📦 Dependencies

- **No external dependencies**: Pure JavaScript/TypeScript
- **DOM API**: For event handling and element detection
- **SessionStorage**: For state persistence

## 🚀 Performance

- **Efficient polling**: Iframe monitoring runs at 20fps (50ms interval)
- **Event delegation**: Uses single event listeners on document
- **Lazy initialization**: Only initializes when needed
- **Memory efficient**: Singleton pattern for services

## 🐛 Debugging

Enable debug logging:

```javascript
// All services log to console with prefixed messages
// Examples:
// [ClickthroughService] Enabled
// [IframeMonitor] Started
// [MouseTracker] Position updated
// [ButtonController] Initialized
```

## 📝 Migration from Old Structure

The old `modules/input/clickthrough.js` file can be replaced with:

```javascript
import { initialize, toggle } from './clickthrough/index.js';
import { dom } from '../core/dom.js';

// Old way
// initializeClickThrough();

// New way
initialize({
  chatInputAPI: window.chatInputAPI,
  button: dom.clickThroughButton
});

// Both use same public API
export { toggle as toggleClickThrough };
```

## 🤝 Contributing

When adding new features:
1. Follow SOLID principles
2. Each class/module should have ONE responsibility
3. Use dependency injection for external dependencies
4. Add TypeScript types for new interfaces
5. Update this README with new features

## 📄 License

Part of the SonicPlane project.
