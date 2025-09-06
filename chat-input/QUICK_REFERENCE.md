# Chat Input - Quick Reference Guide

## 🖱️ Click-Through Controls

| Action | Method | Description |
|--------|--------|-------------|
| **Enable** | `window.chatInputAPI.enableClickThrough()` | Enable click-through mode |
| **Disable** | `window.chatInputAPI.disableClickThrough()` | Disable click-through mode |
| **Toggle** | `window.chatInputAPI.toggleClickThrough()` | Toggle click-through on/off |
| **Button** | Click ↕️ button in UI | Manual toggle |
| **Keyboard** | `Ctrl+T` | Keyboard shortcut |

## 📐 Geometry Control

| Action | Method | Description |
|--------|--------|-------------|
| **Set Bounds** | `window.chatInputAPI.setWindowBounds(bounds)` | Set precise window bounds |
| **Get Geometry** | `await window.chatInputAPI.getWindowGeometry()` | Get current window info |
| **Set Size** | `window.chatInputAPI.setWindowSize(w, h, center)` | Set window size |
| **Animate** | `window.chatInputAPI.animateWindowGeometry(bounds, duration)` | Smooth animation |
| **Screen Info** | `await window.chatInputAPI.getScreenInfo()` | Get multi-monitor info |

## 🎯 Positioning Functions

| Function | Purpose | Usage |
|----------|---------|-------|
| `positionDropdownAdvanced()` | Advanced dropdown positioning | `positionDropdownAdvanced(dropdown, button, options)` |
| `positionElementSmart()` | Smart element positioning | `positionElementSmart(element, ref, options)` |
| `adjustWindowForElement()` | Window adjustment for elements | `adjustWindowForElement(id, options)` |

## ⚙️ Configuration Options

### Click-Through Options
```javascript
{
    enabled: true,           // Start enabled
    hoverDelay: 100,        // Hover detection delay
    clickDelay: 1000,       // Click interaction delay
    uiSelectors: [          // Interactive elements
        '.action-btn',
        '#messageInput',
        '.dropdown-menu',
        '.attachments-section',
        '.prompt-input'
    ]
}
```

### Positioning Options
```javascript
{
    preferredPosition: 'below',  // 'below', 'above', 'auto'
    offset: 8,                   // Distance from trigger
    margin: 20,                  // Screen edge margin
    constrainToScreen: true,     // Keep on screen
    preferAbove: false           // Prefer above when possible
}
```

## 🎨 CSS Classes

| Class | Purpose |
|-------|---------|
| `.geometry-controlled` | Advanced dropdown animations |
| `.geometry-transitioning` | Window geometry transitions |
| `.geometry-positioned` | Fixed positioned elements |
| `.geometry-optimized` | Performance optimizations |
| `.click-through-active` | Click-through enabled state |

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Click-through not working | Call `enableClickThrough()` |
| Dropdowns off-screen | Check screen bounds in `getScreenInfo()` |
| Jerky animations | Reduce animation duration or check `requestAnimationFrame` |
| UI not interactive | Verify element has `pointer-events: auto` |

## 📝 Common Patterns

### Basic Click-Through Setup
```javascript
// Initialize click-through
document.addEventListener('DOMContentLoaded', () => {
    window.chatInputAPI.enableClickThrough();
});
```

### Smart Dropdown Positioning
```javascript
// Position dropdown with smart detection
function showDropdown(dropdownId, triggerButton) {
    const dropdown = document.getElementById(dropdownId);
    positionDropdownAdvanced(dropdown, triggerButton, {
        preferredPosition: 'below',
        constrainToScreen: true
    });
}
```

### Window Animation
```javascript
// Animate window expansion
async function expandWindow() {
    const current = await window.chatInputAPI.getWindowGeometry();
    const target = { ...current.bounds, height: current.bounds.height + 100 };
    await window.chatInputAPI.animateWindowGeometry(target, 300);
}
```

---

*For detailed documentation, see `CLICK_THROUGH_GEOMETRY_DOCS.md`*
