# Floating Cards Visual Guide

## 🎨 UI Components Visualization

### 1. Floating Card Header (Enhanced)

```
┌────────────────────────────────────────────────────────────────┐
│  [1] Display Card              [+] [👁] [⤢] [📥] [✕]           │
│────────────────────────────────────────────────────────────────│
│                                                                 │
│                        Card Content Area                        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Legend:**
- `[1]` - Color-coded number badge
- `[+]` - Create new card
- `[👁]` - Toggle iframe visibility
- `[⤢]` - Expand/collapse
- `[📥]` - **NEW** Hide button
- `[✕]` - Close card

### 2. Cards Manager Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  DISPLAY CARDS        [👁 Show All] [Hide All] [+ New]         │
│─────────────────────────────────────────────────────────────────│
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                        │
│ │ [1]  │  │ [2]  │  │ [3]  │  │ [4]  │  ← scroll →            │
│ │Card 1│  │Card 2│  │Card 3│  │Card 4│                         │
│ │Visible│ │Hidden│  │Visible│ │Visible│                        │
│ │ 👁 ✕ │  │ 👁 ✕ │  │ 👁 ✕ │  │ 👁 ✕ │                        │
│ └──────┘  └──────┘  └──────┘  └──────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Horizontal scroll for many cards
- Color-coded badges (blue, violet, emerald, amber...)
- Status indicators (Visible/Hidden)
- Quick actions per card (show/focus, close)
- Bulk actions (Show All, Hide All, New)

### 3. Chat Input with Cards Manager Button

```
┌─────────────────────────────────────────────────────────────────┐
│  ╔══════════════════════════════════════════════════════════╗  │
│  ║ Ask Anything...                                      [⤢] ║  │
│  ╚══════════════════════════════════════════════════════════╝  │
│  [⚙️] [⊞] [+] ... other controls ...                [Send →]  │
└─────────────────────────────────────────────────────────────────┘
         ↑
     Cards Manager Button (Grid Icon)
```

### 4. Resize Handles (Improved)

```
┌─────────────────────────────────────────────────────────────────┐
│NW    ←───────── N (Top Edge) ───────→    NE                   │
│↑                                           ↑                    │
│W                                           E                    │
│(Left)          Card Content              (Right)                │
│                                                                 │
│↓                                           ↓                    │
│SW    ←───────── S (Bottom) ──────→    SE                       │
└─────────────────────────────────────────────────────────────────┘
```

**Sizes:**
- Corner handles: 16x16px
- Edge handles: 8px thick
- Hover: Blue tint (35% opacity)
- Active: Blue tint (50% opacity)

### 5. Card States Visual

#### Visible Card
```
┌────────────────────────────────────────┐
│  [1] Card Title      [+] [👁] [⤢] [📥] [✕] │
│────────────────────────────────────────│
│                                         │
│   Solid border, full opacity           │
│                                         │
└────────────────────────────────────────┘
```

#### Hidden Card (in Manager)
```
┌ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┐
  [1] Card Title    
  Hidden            
  👁 ✕             
└ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┘
  Dashed border, 50% opacity
```

#### Expanded Card
```
┌────────────────────────────────────────────────────────┐
│  [1] Card Title                  [+] [👁] [⤢] [📥] [✕] │
│────────────────────────────────────────────────────────│
│                                                         │
│                                                         │
│              1200x700px (larger size)                   │
│                                                         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 6. Color Palette (Visual)

```
Card 1:  ██ Blue      (#60a5fa)
Card 2:  ██ Violet    (#a78bfa)
Card 3:  ██ Emerald   (#34d399)
Card 4:  ██ Amber     (#f59e0b)
Card 5:  ██ Pink      (#ec4899)
Card 6:  ██ Cyan      (#06b6d4)
Card 7:  ██ Orange    (#f97316)
Card 8:  ██ Purple    (#8b5cf6)
Card 9:  ██ Teal      (#14b8a6)
Card 10: ██ Red       (#ef4444)
(cycles back to Blue for Card 11+)
```

### 7. Interaction Flows

#### Opening Cards Manager
```
User clicks [⊞] → Manager slides up above chat input
                 ↓
            Cards appear in grid
                 ↓
            Auto-positions above chat
```

#### Hiding a Card
```
User clicks [📥] on card → Card fades out
                          ↓
                     display: none
                          ↓
                  Manager updates preview
                          ↓
                  Preview shows "Hidden" status
                          ↓
                  Dashed border applied
```

#### Showing Hidden Card
```
User clicks preview → Card fades in
                     ↓
                Centers on screen
                     ↓
                Brings to front
                     ↓
                Manager updates
```

### 8. Layout Hierarchy

```
<body>
  ├── <floatingCardsContainer>
  │   └── [Card 1, Card 2, Card 3...]  (z: 2000+)
  │
  ├── <floatingCardsManager>           (z: 49999)
  │   └── <cardsManagerSection>
  │       ├── Header (title + actions)
  │       └── Grid (card previews)
  │
  ├── <attachmentsContainer>           (z: 999)
  │
  └── <chatInputContainer>             (z: 50000)
      └── [Cards Manager Button]
```

### 9. Responsive Breakpoints

#### Desktop (> 1280px)
```
Manager: 600px wide
Cards:   850x500 (default)
         1200x700 (expanded)
```

#### Tablet (768px - 1280px)
```
Manager: 90vw max
Cards:   min(90vw, 850px)
         min(95vw, 1200px) expanded
```

#### Mobile (< 768px)
```
Manager: 95vw
Cards:   96vw x 60vh
         96vw x 75vh (expanded)
```

### 10. Animation Timing

```
┌─────────────────────────────────────────┐
│ Action              Duration    Easing  │
├─────────────────────────────────────────┤
│ Manager show/hide   300ms      ease    │
│ Card hide/show      300ms      ease    │
│ Resize handles      150ms      ease    │
│ Preview hover       200ms      ease    │
│ Drag/resize         NONE       -       │
│ Card create         300ms      spring  │
│ Card close          300ms      ease    │
└─────────────────────────────────────────┘
```

### 11. Hover States

#### Resize Handle
```
Normal:  Invisible
Hover:   35% blue opacity ─┐
Active:  50% blue opacity  │ cursor changes
```

#### Card Preview
```
Normal:  border: transparent
         transform: none
         
Hover:   border: accent color
         transform: translateY(-2px)
         shadow: elevated
```

#### Control Buttons
```
Normal:  background: none
         
Hover:   background: accent 20%
         transform: scale(1.05)
         
Active:  transform: scale(0.95)
```

---

## 🎯 Quick Visual Reference

### Icons Used

| Icon | Purpose              | SVG Path                    |
|------|---------------------|-----------------------------|
| ⊞    | Cards Manager       | 4 rectangles (grid)         |
| +    | Create new          | Plus sign                   |
| 👁    | Toggle visibility   | Eye                         |
| ⤢    | Expand/collapse     | Diagonal arrows             |
| 📥   | Hide (minimize)     | Downward chevron            |
| ✕    | Close               | X mark                      |

### Color System

| Element           | Color                 | Purpose              |
|-------------------|-----------------------|---------------------|
| Card background   | rgba(14,18,26,0.45)  | Liquid glass base   |
| Card border       | rgba(148,163,184,0.35)| Subtle outline     |
| Accent (varies)   | See palette above     | Brand identity      |
| Danger (close)    | #ef4444               | Destructive action  |
| Text              | #ffffff               | Primary text        |

---

**This visual guide helps understand the UI layout and interactions at a glance.**

