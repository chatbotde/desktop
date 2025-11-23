# Click-Through Integration for Frontend

This integration makes it easy to control click-through functionality from your React components in the frontend.

## Overview

Click-through mode allows mouse events to pass through the window, making it non-interactive. This is useful for overlay UIs that should allow interaction with the underlying application.

**This integration is completely general and flexible:**
- ✅ Works with ANY iframe structure
- ✅ Works WITHOUT iframes (direct API access)
- ✅ Automatically detects the best communication method
- ✅ Works with floating cards, WebViews, custom containers, or any future UI structure
- ✅ No assumptions about your UI organization

## Quick Start

### Option 1: Automatic Management (Recommended)

Wrap your UI component with `ClickThroughProvider` for automatic click-through management:

```tsx
import { ClickThroughProvider } from '@/components'

function MyUI() {
  return (
    <ClickThroughProvider>
      <YourUIComponent />
    </ClickThroughProvider>
  )
}
```

The provider automatically:
- Disables click-through when mouse enters the component
- Optionally re-enables click-through when mouse leaves (configurable)

### Option 2: Manual Control

Use the `useClickThrough` hook for manual control:

```tsx
import { useClickThrough } from '@/hooks'

function MyComponent() {
  const { enable, disable, toggle, enabled } = useClickThrough()

  return (
    <div>
      <button onClick={toggle}>
        {enabled ? 'Disable' : 'Enable'} Click-Through
      </button>
      <p>Status: {enabled ? 'Enabled' : 'Disabled'}</p>
    </div>
  )
}
```

## API Reference

### `useClickThrough()` Hook

Returns an object with:

- `enable()` - Enable click-through mode
- `disable()` - Disable click-through mode
- `toggle()` - Toggle click-through mode
- `enabled: boolean` - Current enabled state
- `isAvailable: boolean` - Whether the API is available

### `ClickThroughProvider` Component

Props:

- `children: ReactNode` - Child components
- `autoDisableOnHover?: boolean` - Auto-disable on mouse enter (default: `true`)
- `autoEnableOnLeave?: boolean` - Auto-enable on mouse leave (default: `false`)
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable automatic management

## Examples

### Basic Usage

```tsx
import { ClickThroughProvider } from '@/components'

function App() {
  return (
    <ClickThroughProvider>
      <div className="p-4">
        <h1>My UI</h1>
        <button>Click me</button>
      </div>
    </ClickThroughProvider>
  )
}
```

### Custom Behavior

```tsx
<ClickThroughProvider 
  autoDisableOnHover={true}
  autoEnableOnLeave={true}
>
  <YourComponent />
</ClickThroughProvider>
```

### Manual Control

```tsx
import { useClickThrough } from '@/hooks'

function ControlPanel() {
  const { toggle, enabled } = useClickThrough()

  return (
    <div>
      <button onClick={toggle}>
        {enabled ? 'Disable' : 'Enable'} Click-Through
      </button>
    </div>
  )
}
```

### Combining Both

```tsx
function App() {
  const { toggle, enabled } = useClickThrough()

  return (
    <div>
      {/* Manual toggle button */}
      <button onClick={toggle}>
        {enabled ? 'Disable' : 'Enable'} Click-Through
      </button>

      {/* Auto-managed UI */}
      <ClickThroughProvider>
        <YourUIComponent />
      </ClickThroughProvider>
    </div>
  )
}
```

## How It Works

The hook automatically detects the best communication method:

**Scenario 1: Direct API (No iframes)**
1. If `chatInputAPI` is directly available, uses it immediately
2. No postMessage needed - direct function calls
3. Listens for `clickthrough-changed` events for state updates

**Scenario 2: Iframe Mode**
1. If running in an iframe, uses `postMessage` to communicate with parent
2. Parent window handles the click-through control
3. State updates are broadcast to all iframes

**Backend (clickthrough.js):**
- Works gracefully with or without iframes
- Detects any iframe structure automatically
- No assumptions about container structure
- Handles zero iframes, one iframe, or many iframes seamlessly

The system automatically adapts to:
- Direct window access (no iframes)
- Any iframe container structure
- CSS classes or IDs (or lack thereof)
- DOM hierarchy (or flat structure)
- Future UI changes

## Notes

- The API is only available when running in an Electron iframe
- Click-through state is synchronized between the frontend and parent window
- The provider automatically handles mouse enter/leave events
- You can combine manual control with automatic management

## See Also

- `ClickThroughExample.tsx` - Full example implementation
- `buddy/chat-input/modules/input/clickthrough.js` - Backend implementation

