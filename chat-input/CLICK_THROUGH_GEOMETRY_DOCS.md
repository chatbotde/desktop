# Chat Input Window - Click-Through & Geometry Control Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Click-Through System](#click-through-system)
3. [Geometry Control System](#geometry-control-system)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This documentation covers the advanced click-through and geometry control systems implemented for the chat-input window. These features provide:

- **Selective Click-Through**: UI elements are interactive, empty areas pass clicks through to windows behind
- **Advanced Geometry Control**: Smart positioning for dropdowns and future UI elements
- **Multi-Monitor Support**: Proper positioning across different displays
- **Smooth Animations**: Hardware-accelerated transitions and animations

---

## 🖱️ Click-Through System

### What is Click-Through?

Click-through allows mouse events to pass through the window to applications behind it, while keeping UI elements interactive. This creates a true floating UI experience.

### Features

#### 1. **Smart Detection**
- Automatically detects when mouse is over UI elements vs empty areas
- Disables click-through when hovering over interactive elements
- Re-enables click-through when mouse moves to empty areas

#### 2. **Manual Control**
- Toggle button in the UI (↕️ icon)
- Keyboard shortcut: `Ctrl+T`
- Visual feedback with active state indication

#### 3. **UI Elements That Remain Interactive**
- All action buttons (upload, capture, model select, etc.)
- Text input area (`#messageInput`)
- Dropdown menus
- Attachments section
- Drag handle area

### How It Works

```javascript
// Smart detection logic
function handleSmartClickThrough(event) {
    const target = event.target;
    const isUIElement = target.closest('.action-btn, #messageInput, .dropdown-menu, .attachments-section, .prompt-input');
    
    if (isUIElement) {
        // Disable click-through for UI interaction
        disableClickThrough();
        // Re-enable after delay
        setTimeout(() => enableClickThrough(), 1000);
    } else {
        // Enable click-through for empty areas
        enableClickThrough();
    }
}
```

### Visual Indicators

- **Active State**: Click-through button glows blue when enabled
- **Pulsing Animation**: Subtle pulse animation shows click-through is active
- **Tooltip Updates**: Button tooltip shows current state

---

## 📐 Geometry Control System

### Overview

The geometry control system provides advanced positioning capabilities for dropdowns and future UI elements with multi-monitor support and smooth animations.

### Key Components

#### 1. **GeometryController Class**
```javascript
class GeometryController {
    constructor() {
        this.screenInfo = null;
        this.windowGeometry = null;
        this.animationQueue = [];
        this.isAnimating = false;
    }
}
```

#### 2. **Advanced Dropdown Positioning**
- Multi-monitor support with automatic display detection
- Screen boundary constraints
- Smart positioning (above/below with fallbacks)
- Hardware-accelerated animations

#### 3. **Window Geometry Management**
- Smooth window resizing with easing
- Animation queue for sequential changes
- Constraint validation (min/max dimensions)

### Features

#### **Multi-Monitor Support**
- Automatically detects which display the window is on
- Positions elements relative to the correct screen
- Handles screen changes and updates

#### **Smart Positioning**
- Dropdowns position above or below buttons intelligently
- Adjusts position if it would go off-screen
- Maintains proper spacing and alignment

#### **Smooth Animations**
- Hardware-accelerated transitions using `transform: translateZ(0)`
- Cubic-bezier easing for professional feel
- Animation queue prevents conflicts

---

## 🔧 API Reference

### Click-Through API

#### `window.chatInputAPI.enableClickThrough()`
Enables click-through mode for the entire window.

```javascript
// Enable click-through
window.chatInputAPI.enableClickThrough();
```

#### `window.chatInputAPI.disableClickThrough()`
Disables click-through mode, making the window capture all mouse events.

```javascript
// Disable click-through
window.chatInputAPI.disableClickThrough();
```

#### `window.chatInputAPI.toggleClickThrough()`
Toggles click-through mode on/off.

```javascript
// Toggle click-through
window.chatInputAPI.toggleClickThrough();
```

### Geometry Control API

#### `window.chatInputAPI.setWindowBounds(bounds)`
Sets precise window bounds with validation.

```javascript
window.chatInputAPI.setWindowBounds({
    x: 100,
    y: 200,
    width: 600,
    height: 120
});
```

#### `window.chatInputAPI.getWindowGeometry()`
Gets current window geometry information.

```javascript
const geometry = await window.chatInputAPI.getWindowGeometry();
console.log(geometry);
// Returns: { position: {x, y}, size: {width, height}, bounds: {...}, isVisible: true, isFocused: false }
```

#### `window.chatInputAPI.setWindowSize(width, height, center)`
Sets window size with optional centering.

```javascript
// Set size without centering
window.chatInputAPI.setWindowSize(600, 120);

// Set size with centering
window.chatInputAPI.setWindowSize(600, 120, true);
```

#### `window.chatInputAPI.animateWindowGeometry(targetBounds, duration)`
Animates window to new geometry with smooth transitions.

```javascript
window.chatInputAPI.animateWindowGeometry({
    x: 100,
    y: 200,
    width: 800,
    height: 200
}, 300); // 300ms animation
```

#### `window.chatInputAPI.getScreenInfo()`
Gets multi-monitor screen information.

```javascript
const screenInfo = await window.chatInputAPI.getScreenInfo();
console.log(screenInfo.primary); // Primary display info
console.log(screenInfo.all); // All displays info
```

### Utility Functions

#### `positionDropdownAdvanced(dropdown, triggerButton, options)`
Advanced dropdown positioning with options.

```javascript
positionDropdownAdvanced(dropdown, triggerButton, {
    preferredPosition: 'below',
    offset: 8,
    margin: 20,
    constrainToScreen: true,
    preferAbove: false
});
```

#### `positionElementSmart(element, referenceElement, options)`
Smart positioning for any UI element.

```javascript
positionElementSmart(element, referenceElement, {
    position: 'below',
    offset: 8,
    align: 'left',
    constrainToViewport: true
});
```

---

## 💡 Usage Examples

### Basic Click-Through Usage

```javascript
// Enable click-through on window load
document.addEventListener('DOMContentLoaded', () => {
    window.chatInputAPI.enableClickThrough();
});

// Toggle click-through with button
document.getElementById('clickThroughButton').addEventListener('click', () => {
    window.chatInputAPI.toggleClickThrough();
});

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        window.chatInputAPI.toggleClickThrough();
    }
});
```

### Advanced Dropdown Positioning

```javascript
// Position model selector dropdown
function showModelSelector(triggerButton) {
    const dropdown = document.getElementById('modelSelectDropdown');
    positionDropdownAdvanced(dropdown, triggerButton, {
        preferredPosition: 'below',
        offset: 8,
        margin: 20,
        constrainToScreen: true,
        preferAbove: false
    });
}
```

### Window Geometry Animation

```javascript
// Animate window expansion
async function expandWindow() {
    const currentGeometry = await window.chatInputAPI.getWindowGeometry();
    const targetBounds = {
        x: currentGeometry.bounds.x,
        y: currentGeometry.bounds.y - 100, // Move up
        width: currentGeometry.bounds.width,
        height: currentGeometry.bounds.height + 100 // Increase height
    };
    
    await window.chatInputAPI.animateWindowGeometry(targetBounds, 300);
}
```

### Multi-Monitor Positioning

```javascript
// Position element on correct display
async function positionOnCurrentDisplay(element) {
    const screenInfo = await window.chatInputAPI.getScreenInfo();
    const currentDisplay = geometryController.getCurrentDisplay();
    
    if (currentDisplay) {
        // Position relative to current display
        const bounds = currentDisplay.workArea;
        element.style.left = `${bounds.x + 100}px`;
        element.style.top = `${bounds.y + 100}px`;
    }
}
```

---

## ⚙️ Configuration

### Click-Through Configuration

```javascript
// Click-through settings
const clickThroughConfig = {
    enabled: true, // Start with click-through enabled
    hoverDelay: 100, // Delay before re-enabling click-through
    clickDelay: 1000, // Delay after UI interaction
    uiSelectors: [
        '.action-btn',
        '#messageInput',
        '.dropdown-menu',
        '.attachments-section',
        '.prompt-input'
    ]
};
```

### Geometry Control Configuration

```javascript
// Geometry control settings
const geometryConfig = {
    animationDuration: 300, // Default animation duration
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // CSS easing
    constraints: {
        minWidth: 100,
        maxWidth: 1400,
        minHeight: 80,
        maxHeight: 800
    },
    positioning: {
        defaultOffset: 8,
        defaultMargin: 20,
        preferAbove: false
    }
};
```

---

## 🐛 Troubleshooting

### Common Issues

#### Click-Through Not Working
**Problem**: Mouse events not passing through window.

**Solutions**:
1. Check if click-through is enabled: `window.chatInputAPI.enableClickThrough()`
2. Verify UI elements are properly marked with correct selectors
3. Check browser console for errors

#### Dropdowns Positioning Incorrectly
**Problem**: Dropdowns appear in wrong position or off-screen.

**Solutions**:
1. Ensure `geometryController` is initialized
2. Check screen info is loaded: `await window.chatInputAPI.getScreenInfo()`
3. Verify trigger button has proper `getBoundingClientRect()`

#### Window Geometry Changes Not Smooth
**Problem**: Window resizing is jerky or not animated.

**Solutions**:
1. Check if `requestAnimationFrame` is available
2. Verify animation duration is reasonable (100-500ms)
3. Ensure only one animation runs at a time

### Debug Mode

Enable debug logging:

```javascript
// Enable debug mode
window.chatInputDebug = true;

// Check click-through state
console.log('Click-through enabled:', isClickThroughEnabled);

// Check geometry controller state
console.log('Screen info:', geometryController.screenInfo);
console.log('Window geometry:', geometryController.windowGeometry);
```

### Performance Issues

If experiencing performance issues:

1. **Reduce animation frequency**: Increase delays between animations
2. **Limit concurrent animations**: Use animation queue
3. **Optimize selectors**: Use more specific CSS selectors
4. **Check hardware acceleration**: Ensure `transform: translateZ(0)` is applied

---

## 🔄 Updates and Maintenance

### Adding New UI Elements

When adding new interactive elements:

1. Add selector to click-through detection:
```javascript
const isUIElement = target.closest('.action-btn, #messageInput, .dropdown-menu, .attachments-section, .prompt-input, .new-element');
```

2. Update CSS for proper interaction:
```css
.new-element {
    pointer-events: auto;
}
```

### Extending Geometry Control

To add new positioning features:

1. Extend `GeometryController` class
2. Add new API methods to preload script
3. Add corresponding IPC handlers in window manager
4. Update documentation

---

## 📚 Additional Resources

- [Electron setIgnoreMouseEvents Documentation](https://www.electronjs.org/docs/latest/api/browser-window#winsetignoremouseeventsignore-options)
- [CSS Transform and Hardware Acceleration](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [Multi-Monitor Support in Electron](https://www.electronjs.org/docs/latest/api/screen)

---

*Last updated: December 2024*
*Version: 1.0.0*
