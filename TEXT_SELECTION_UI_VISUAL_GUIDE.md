# Text Selection UI - Visual Design Guide

## Panel Layout

```
┌─────────────────────────────────────────┐
│ 📝 Here is the selected text that...     │  Preview Section
│    will appear in the floating panel     │  (max 3 lines, truncated)
├─────────────────────────────────────────┤  Divider
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │  Actions Section
│  │ ↑ Ask    │  │ ➕ Add   │  │ ✕ Close│ │  (3 buttons)
│  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────┘
```

## Button States

### Ask Button (Blue)
```
Default:   │ ↑ Ask     │  (light blue background)
Hover:     │ ↑ Ask     │  (brighter blue, lifted -2px)
Active:    │ ↑ Ask     │  (darker blue, normal position)
Focused:   │ ↑ Ask     │  (focus ring around button)
```

### Add Button (Green)
```
Default:   │ ➕ Add    │  (light green background)
Hover:     │ ➕ Add    │  (brighter green, lifted -2px)
Active:    │ ➕ Add    │  (darker green, normal position)
Focused:   │ ➕ Add    │  (focus ring around button)
```

### Close Button (Red on hover)
```
Default:   │ ✕ │  (neutral gray)
Hover:     │ ✕ │  (red background, lifted -2px)
Active:    │ ✕ │  (dark red, normal position)
Focused:   │ ✕ │  (focus ring around button)
```

## Animation Timeline

### Entrance (300ms)
```
0ms:    opacity: 0, transform: translateY(-10px) scale(0.95)
150ms:  [mid-animation]
300ms:  opacity: 1, transform: translateY(0) scale(1) ✓ Visible
```

### Exit (300ms)
```
0ms:    opacity: 1, transform: translateY(0) scale(1)
150ms:  [mid-animation]
300ms:  opacity: 0, transform: translateY(-10px) scale(0.95) ✓ Hidden
```

## Positioning Examples

### Above Chat Input (Normal)
```
┌──────────────────────┐
│ 📝 Selected text...   │  ← Text Selection Panel
├──────────────────────┤
└──────────────────────┘

┌──────────────────────┐
│ Chat Input Area      │
└──────────────────────┘
```

### Viewport Boundary (Left Edge)
```
┌──────────────────────┐
│ 📝 Text...           │  ← Panel repositioned to fit
├──────────────────────┤
│ 📝 Normal position    │

[Left edge of screen]
```

### Viewport Boundary (Right Edge)
```
          ┌──────────────────────┐
          │ 📝 Selected text...   │  ← Panel repositioned to fit
          ├──────────────────────┤

                [Right edge of screen]
```

## Color Scheme

### Dark Mode (Default)
```
Background:      rgba(14, 18, 26, 0.98)      [Very Dark Blue]
Border:          rgba(148, 163, 184, 0.35)   [Gray-Blue]
Text:            rgba(255, 255, 255, 0.7)    [Light Gray]
Shadow:          rgba(0, 0, 0, 0.3)          [Dark Shadow]

Ask Button:      rgba(59, 130, 246, 0.25)    [Light Blue]
Add Button:      rgba(34, 197, 94, 0.15)     [Light Green]
Close Button:    rgba(255, 255, 255, 0.06)   [Very Light Gray]

Hover Ask:       rgba(59, 130, 246, 0.35)    [Brighter Blue]
Hover Add:       rgba(34, 197, 94, 0.25)     [Brighter Green]
Hover Close:     rgba(239, 68, 68, 0.2)      [Red]
```

### Light Mode
```
Background:      rgba(255, 255, 255, 0.98)   [White]
Border:          rgba(200, 210, 220, 0.5)    [Light Gray]
Text:            rgba(0, 0, 0, 0.65)         [Dark Gray]
Shadow:          rgba(0, 0, 0, 0.2)          [Light Shadow]

Ask Button:      rgba(59, 130, 246, 0.1)     [Very Light Blue]
Add Button:      rgba(34, 197, 94, 0.1)      [Very Light Green]
Close Button:    rgba(0, 0, 0, 0.03)         [Almost White]
```

## Responsive Breakpoints

### Desktop (> 1024px)
```
Panel Width:     280px - 350px
Button Size:     Full width proportional
Font Size:       12px (buttons), 13px (preview)
Padding:         12px
Gap:             8px between buttons
```

### Tablet (768px - 1024px)
```
Panel Width:     250px - 320px
Button Size:     Full width proportional
Font Size:       12px (buttons), 13px (preview)
Padding:         12px
Gap:             8px between buttons
```

### Mobile (< 768px)
```
Panel Width:     240px - 280px
Button Size:     Full width proportional
Font Size:       11px (buttons), 12px (preview)
Padding:         8px-10px
Gap:             6px between buttons
Lines Clamped:   2 lines (instead of 3)
```

## Interaction Flows

### Flow 1: Ask Button (Send to AI)
```
User selects text
        ↓
Panel appears (entrance animation)
        ↓
User clicks "Ask"
        ↓
Text added to chat input
        ↓
Message automatically sent
        ↓
Panel hides (exit animation)
        ↓
User sees AI response in chat
```

### Flow 2: Add Button (Manual Edit)
```
User selects text
        ↓
Panel appears (entrance animation)
        ↓
User clicks "Add"
        ↓
Text added to chat input
        ↓
Input field gets focus
        ↓
Panel hides (exit animation)
        ↓
User can edit text and send manually
```

### Flow 3: Close/Timeout
```
User selects text
        ↓
Panel appears (entrance animation)
        ↓
[Option A: Click Close button] OR [Option B: Wait 8 seconds]
        ↓
Panel hides (exit animation)
        ↓
Nothing changes
```

## Accessibility Features

### Keyboard Navigation
```
Tab:            Focus next button
Shift+Tab:      Focus previous button
Enter/Space:    Activate focused button
Escape:         Close panel (future enhancement)
```

### Focus Indicators
```
Focused Button:
┌──────────────┐
│  ↑ Ask       │  ← 2px outer ring
│              │     4px blue ring
└──────────────┘
```

### Screen Reader
```
<button aria-label="Ask AI">
  <svg>...</svg>
  <span>Ask</span>
</button>
```

## Typography

```
Panel Title (implicit):
  Font: System Font, sans-serif
  Size: 14px (implied by icon)
  Weight: Regular
  Color: rgba(255, 255, 255, 0.7)

Preview Text:
  Font: System Font, sans-serif
  Size: 13px
  Weight: 500 (medium)
  Color: rgba(255, 255, 255, 0.7)
  Line Height: 1.5

Button Text:
  Font: System Font, sans-serif
  Size: 12px
  Weight: 600 (semi-bold)
  Color: #fff (white)
  Text Transform: Capitalize first letter
```

## Icon Design

All icons are simple, 16x16px SVG with 2-2.5px stroke width:

- **Ask**: ↑ Arrow up (represents sending/uploading)
- **Add**: ➕ Plus sign (represents adding/inserting)
- **Close**: ✕ X mark (represents closing/removing)

Icons are stroke-based (not filled) for visual consistency.

## Effects

### Blur Effect
```
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
```

### Shadow Effect
```
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
```

### Hover Lift Effect
```
Before hover:  transform: translateY(0px)
On hover:      transform: translateY(-2px)
On click:      transform: translateY(0px)
```

## Timing & Easing

```
Entrance:      300ms cubic-bezier(0.25, 0.8, 0.25, 1)
Exit:          300ms cubic-bezier(0.25, 0.8, 0.25, 1)
Hover:         200ms cubic-bezier(0.25, 0.8, 0.25, 1)
Auto-hide:     8000ms (8 seconds idle time)
```

## Size Specifications

```
Panel:
  Min Width:    280px
  Max Width:    350px
  Min Height:   Auto (content-based, ~140px typical)
  Border Radius: 12px

Buttons:
  Height:       36px (with padding)
  Padding:      10px 12px
  Border Radius: 8px
  Gap:          8px (between buttons)

Icons:
  Size:         14px x 14px
  Stroke Width: 2-2.5px
  Gap from text: 6px

Preview Section:
  Icon Size:    20px
  Gap:          10px
  Line Clamp:   3 lines (2 on mobile)
```

## Z-Index Hierarchy

```
Body:               0
Chat Input:         50000
Text Selection UI:  50000 (same as chat input)
Floating Cards:     2000-3000 (below chat input)
```

---

This visual guide ensures consistent implementation across all screen sizes and interaction states.
