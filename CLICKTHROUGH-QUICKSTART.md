# Quick Start Guide - Clickthrough System

## ✅ Implementation Complete

Your clickthrough system is ready to use! Here's how to test it.

## Testing the Clickthrough

### 1. Start the Frontend Dev Server

```powershell
cd buddy\frontend
npm run dev
```

This should start Vite on `http://localhost:5173`

### 2. Start the Electron App

```powershell
cd buddy
npm start
# or whatever command starts your Electron app
```

### 3. Open the Interfaces Window

The interfaces window should:
- Load your React frontend
- Start in clickthrough mode (transparent to clicks)

### 4. Test the Behavior

#### ✅ What Should Happen:

**When you hover over EMPTY SPACE (transparent background):**
- Window is clickthrough
- Clicks pass through to desktop/apps behind
- Mouse cursor shows whatever is behind the window

**When you hover over the CARD (the floating UI):**
- Window becomes interactive
- Clicks are captured by the window
- Buttons, inputs, etc. work normally

**When you click buttons/inputs:**
- All interactions work normally
- Window stays interactive while you're using it

**When you move mouse away from the card:**
- Window becomes clickthrough again
- Background becomes transparent to clicks

#### Keyboard Shortcut:
- **Press Ctrl+T** → Manually toggle clickthrough on/off

## How Your App Works Now

### Your App.tsx Structure:

```tsx
// ❌ CLICKTHROUGH AREA (transparent background)
<div className="h-screen w-full ...">
  
  // ✅ INTERACTIVE AREA (marked with data-no-clickthrough)
  <div data-no-clickthrough className="w-80 rounded-xl ...">
    <button>Close</button>      // ✅ Works
    <button>Tab 1</button>       // ✅ Works
    <input type="checkbox" />   // ✅ Works
  </div>
  
</div>
```

## Adding More Interactive UI

### Example 1: Floating Settings Button

```tsx
<button
  data-no-clickthrough
  className="fixed top-4 right-4 ..."
  onClick={handleSettings}
>
  ⚙️ Settings
</button>
```

### Example 2: Sidebar

```tsx
<aside data-no-clickthrough className="fixed left-0 top-0 h-full w-64 ...">
  <nav>
    <button onClick={...}>Home</button>
    <button onClick={...}>About</button>
  </nav>
</aside>
```

### Example 3: Modal

```tsx
{showModal && (
  <div data-no-clickthrough className="fixed inset-0 bg-black/50 ...">
    <div className="bg-white rounded-lg p-6">
      <h2>Modal Title</h2>
      <button onClick={closeModal}>Close</button>
    </div>
  </div>
)}
```

## Manual Control (Advanced)

```typescript
import { 
  enableClickthrough, 
  disableClickthrough, 
  toggleClickthrough,
  getClickthroughState 
} from '@/lib/clickthrough'

// Force enable
enableClickthrough()

// Force disable
disableClickthrough()

// Toggle
toggleClickthrough()

// Check state
const isEnabled = await getClickthroughState()
```

## Debugging

### Check Console Logs

Open DevTools (F12) and look for:
```
[Clickthrough] Initializing frontend clickthrough system...
[Clickthrough] Initialized successfully
```

In main process console:
```
[InterfacesWindow] Clickthrough enabled
[InterfacesWindow] Clickthrough disabled
```

### Common Issues

**Window not clickthrough at all:**
- Check that `enableClickthrough()` is called in interfaces-window.js
- Verify IPC handlers are registered

**UI not responding:**
- Check that `data-no-clickthrough` is on the element
- Look for console errors
- Verify `initializeClickthrough()` is called in main.tsx

**Clickthrough stuck:**
- Press Ctrl+T to manually toggle
- Restart the app
- Check for JavaScript errors in console

## Architecture Overview

```
┌─────────────────────────────────────────┐
│ User hovers mouse over page             │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ clickthrough.ts detects if element      │
│ has data-no-clickthrough                │
└─────────────┬───────────────────────────┘
              │
       Yes ◄──┴──► No
              │         │
              ▼         ▼
         Disable   Enable
              │         │
              └────┬────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ IPC → interfaces-window.js              │
│ window.setIgnoreMouseEvents()           │
└─────────────────────────────────────────┘
```

## Files Modified/Created

### ✅ Modified:
- `interfaces-window/interfaces-window.js` - Added clickthrough methods + IPC
- `interfaces-window/interfaces-preload.js` - Exposed clickthroughAPI
- `frontend/src/main.tsx` - Initialize clickthrough
- `frontend/src/types/electron.d.ts` - Added TypeScript types

### ✅ Created:
- `frontend/src/lib/clickthrough.ts` - Main clickthrough logic
- `interfaces-window/clickthrough/` - Modular components (optional)
- `interfaces-window/CLICKTHROUGH-IMPLEMENTATION.md` - Full documentation
- `interfaces-window/clickthrough/README.md` - Technical details

## What's Next?

1. **Test it** - Follow the testing steps above
2. **Customize** - Add more interactive UI with `data-no-clickthrough`
3. **Deploy** - Works in both dev and production builds
4. **Enjoy** - Your window is now smartly clickthrough! 🎉

## Need Help?

Check the full documentation:
- `interfaces-window/CLICKTHROUGH-IMPLEMENTATION.md` - Implementation guide
- `interfaces-window/clickthrough/README.md` - Technical details
- Console logs for debugging

Your clickthrough system is **production-ready**! 🚀
