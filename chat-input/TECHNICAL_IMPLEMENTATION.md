# Technical Implementation Guide

## 🏗️ Architecture Overview

The click-through and geometry control system is built on three main layers:

```
┌─────────────────────────────────────┐
│           Renderer Process          │
│  ┌─────────────────────────────────┐│
│  │        chat-input.js            ││
│  │  - GeometryController Class    ││
│  │  - Click-through Detection     ││
│  │  - Smart Positioning           ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
                    │
                    │ IPC Communication
                    ▼
┌─────────────────────────────────────┐
│           Preload Script            │
│  ┌─────────────────────────────────┐│
│  │    chat-input-preload.js       ││
│  │  - API Bridge                  ││
│  │  - Method Exposures            ││
│  │  - Event Handling              ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
                    │
                    │ IPC Messages
                    ▼
┌─────────────────────────────────────┐
│           Main Process              │
│  ┌─────────────────────────────────┐│
│  │    chat-input-window.js        ││
│  │  - Electron API Calls          ││
│  │  - Window Management           ││
│  │  - Screen Detection            ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## 🔧 Implementation Details

### 1. Click-Through System

#### Core Mechanism
Uses Electron's `setIgnoreMouseEvents()` API with smart detection:

```javascript
// Main Process (chat-input-window.js)
ipcMain.on("chat-input-enable-click-through", (event) => {
    chatInputWindow.setIgnoreMouseEvents(true, { forward: true });
});

ipcMain.on("chat-input-disable-click-through", (event) => {
    chatInputWindow.setIgnoreMouseEvents(false);
});
```

#### Smart Detection Algorithm
```javascript
// Renderer Process (chat-input.js)
function handleSmartClickThrough(event) {
    const target = event.target;
    const isUIElement = target.closest('.action-btn, #messageInput, .dropdown-menu, .attachments-section, .prompt-input');
    
    if (isUIElement) {
        disableClickThrough();
        // Re-enable after interaction delay
        setTimeout(() => enableClickThrough(), 1000);
    } else {
        enableClickThrough();
    }
}
```

#### Event Flow
1. **Mouse Move**: Detects hover over UI elements
2. **Click Detection**: Temporarily disables click-through for UI interaction
3. **Timeout Reset**: Re-enables click-through after delay
4. **State Management**: Tracks current click-through state

### 2. Geometry Control System

#### GeometryController Class
```javascript
class GeometryController {
    constructor() {
        this.screenInfo = null;           // Multi-monitor info
        this.windowGeometry = null;       // Current window state
        this.animationQueue = [];         // Animation queue
        this.isAnimating = false;         // Animation state
    }
    
    async init() {
        await this.updateScreenInfo();
        await this.updateWindowGeometry();
        this.setupEventListeners();
    }
}
```

#### Multi-Monitor Support
```javascript
getCurrentDisplay() {
    const windowCenterX = window.screenX + window.innerWidth / 2;
    const windowCenterY = window.screenY + window.innerHeight / 2;
    
    for (const display of this.screenInfo.all) {
        const { x, y, width, height } = display.bounds;
        if (windowCenterX >= x && windowCenterX <= x + width &&
            windowCenterY >= y && windowCenterY <= y + height) {
            return display;
        }
    }
    return this.screenInfo.primary;
}
```

#### Advanced Positioning Algorithm
```javascript
positionDropdownAdvanced(dropdown, triggerButton, options = {}) {
    const {
        preferredPosition = 'below',
        offset = 8,
        margin = 20,
        constrainToScreen = true
    } = options;
    
    // Get measurements
    const buttonRect = triggerButton.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    const currentDisplay = this.getCurrentDisplay();
    
    // Calculate position
    let top, left;
    if (preferredPosition === 'below') {
        top = windowTop + buttonRect.bottom + offset;
        left = windowLeft + buttonRect.left;
    } else {
        top = windowTop + buttonRect.top - dropdownRect.height - offset;
        left = windowLeft + buttonRect.left;
    }
    
    // Apply screen constraints
    if (constrainToScreen) {
        const screenBounds = currentDisplay.workArea;
        // Constrain to screen bounds...
    }
    
    // Apply positioning
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${top - windowTop}px`;
    dropdown.style.left = `${left - windowLeft}px`;
    dropdown.style.zIndex = '9999';
}
```

### 3. Animation System

#### Hardware Acceleration
```css
.geometry-optimized {
    contain: layout style paint;
    will-change: transform, opacity;
    transform: translateZ(0);
}
```

#### Animation Queue
```javascript
async animateWindowGeometry(targetBounds, duration = 300) {
    if (this.isAnimating) {
        this.animationQueue.push({ targetBounds, duration });
        return;
    }
    
    this.isAnimating = true;
    const currentBounds = chatInputWindow.getBounds();
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        
        const newBounds = {
            x: currentBounds.x + (targetBounds.x - currentBounds.x) * easeProgress,
            y: currentBounds.y + (targetBounds.y - currentBounds.y) * easeProgress,
            width: currentBounds.width + (targetBounds.width - currentBounds.width) * easeProgress,
            height: currentBounds.height + (targetBounds.height - currentBounds.height) * easeProgress
        };
        
        chatInputWindow.setBounds(newBounds);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            this.isAnimating = false;
            this.processAnimationQueue();
        }
    };
    
    requestAnimationFrame(animate);
}
```

## 🔄 Data Flow

### Click-Through Flow
```
User Interaction → Smart Detection → State Check → IPC Call → Electron API
     ↓                    ↓              ↓           ↓           ↓
Mouse Event → isUIElement? → Enable/Disable → Preload → setIgnoreMouseEvents()
```

### Geometry Control Flow
```
UI Request → GeometryController → Screen Detection → Position Calculation → CSS Application
     ↓              ↓                    ↓                ↓                    ↓
User Action → positionDropdownAdvanced() → getCurrentDisplay() → Calculate Bounds → Apply Styles
```

## 🎯 Performance Optimizations

### 1. Event Throttling
```javascript
// Throttle mouse move events
let mouseMoveTimeout;
document.addEventListener('mousemove', (event) => {
    if (mouseMoveTimeout) return;
    mouseMoveTimeout = setTimeout(() => {
        handleMouseMove(event);
        mouseMoveTimeout = null;
    }, 16); // ~60fps
});
```

### 2. Hardware Acceleration
```css
.dropdown-menu {
    transform: translateZ(0);
    will-change: transform, opacity;
    contain: layout style paint;
}
```

### 3. Animation Queue
```javascript
// Prevent animation conflicts
if (this.isAnimating) {
    this.animationQueue.push({ targetBounds, duration });
    return;
}
```

## 🛡️ Error Handling

### Click-Through Errors
```javascript
function enableClickThrough() {
    try {
        if (window.chatInputAPI?.enableClickThrough) {
            window.chatInputAPI.enableClickThrough();
            isClickThroughEnabled = true;
        } else {
            console.warn('Click-through API not available');
        }
    } catch (error) {
        console.error('Failed to enable click-through:', error);
    }
}
```

### Geometry Control Errors
```javascript
async positionDropdownAdvanced(dropdown, triggerButton, options = {}) {
    try {
        if (!dropdown || !triggerButton || !this.screenInfo) {
            console.warn('Missing required parameters for positioning');
            return;
        }
        // Positioning logic...
    } catch (error) {
        console.error('Failed to position dropdown:', error);
    }
}
```

## 🔍 Debugging

### Debug Mode
```javascript
// Enable debug logging
window.chatInputDebug = true;

// Debug click-through state
console.log('Click-through enabled:', isClickThroughEnabled);

// Debug geometry state
console.log('Screen info:', geometryController.screenInfo);
console.log('Window geometry:', geometryController.windowGeometry);
```

### Performance Monitoring
```javascript
// Monitor animation performance
const startTime = performance.now();
// ... animation code ...
const endTime = performance.now();
console.log(`Animation took ${endTime - startTime} milliseconds`);
```

## 📊 Browser Compatibility

### Electron API Support
- `setIgnoreMouseEvents()`: Electron 5.0+
- `getAllDisplays()`: Electron 1.0+
- `getBounds()`: Electron 1.0+

### CSS Support
- `transform: translateZ(0)`: All modern browsers
- `will-change`: Chrome 36+, Firefox 36+, Safari 9.1+
- `contain`: Chrome 52+, Firefox 69+, Safari 15.4+

### JavaScript Features
- `requestAnimationFrame`: All modern browsers
- `getBoundingClientRect()`: All modern browsers
- `closest()`: Chrome 41+, Firefox 35+, Safari 9+

---

*This technical guide provides deep insights into the implementation details of the click-through and geometry control systems.*
