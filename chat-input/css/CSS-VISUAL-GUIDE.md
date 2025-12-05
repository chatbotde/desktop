# CSS SOLID Architecture - Visual Guide

## Layer Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         APPLICATION                              │
│                      (HTML Components)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      main-solid.css                              │
│                    (Entry Point)                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┏━━━━━━━━━━━━┓    ┏━━━━━━━━━━━━┓    ┏━━━━━━━━━━━━┓
┃  LAYER 1   ┃    ┃  LAYER 2   ┃    ┃  LAYER 3   ┃
┃ FOUNDATION ┃───▶┃ COMPONENTS ┃───▶┃  FEATURES  ┃
┗━━━━━━━━━━━━┛    ┗━━━━━━━━━━━━┛    ┗━━━━━━━━━━━━┛
     │                  │                  │
     │                  │                  │
     ▼                  ▼                  ▼
┏━━━━━━━━━━━━┓    ┏━━━━━━━━━━━━┓    ┏━━━━━━━━━━━━┓
┃  LAYER 4   ┃    ┃  LAYER 5   ┃    ┃  LEGACY    ┃
┃   THEMES   ┃    ┃ UTILITIES  ┃    ┃   FILES    ┃
┗━━━━━━━━━━━━┛    ┗━━━━━━━━━━━━┛    ┗━━━━━━━━━━━━┛
```

## Detailed Layer Breakdown

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: FOUNDATION (Design System Core)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ variables.css    │  │ reset.css        │                    │
│  │ ──────────────   │  │ ──────────────   │                    │
│  │ • Color tokens   │  │ • Box model      │                    │
│  │ • Spacing scale  │  │ • Normalize      │                    │
│  │ • Typography     │  │ • Scrollbars     │                    │
│  │ • Shadows        │  │ • Focus states   │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ typography.css   │  │ layout.css       │                    │
│  │ ──────────────   │  │ ──────────────   │                    │
│  │ • Font system    │  │ • Flexbox utils  │                    │
│  │ • Text styles    │  │ • Grid utils     │                    │
│  │ • Headings       │  │ • Spacing utils  │                    │
│  │ • Utilities      │  │ • Position utils │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ▼ Depends on
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: COMPONENTS (Reusable UI Building Blocks)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ button/          │  │ input/           │                    │
│  │ ──────────────   │  │ ──────────────   │                    │
│  │ • Base styles    │  │ • Base styles    │                    │
│  │ • Variants       │  │ • Variants       │                    │
│  │ • States         │  │ • States         │                    │
│  │ • Sizes          │  │ • Validation     │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ dropdown/        │  │ badge/           │                    │
│  │ ──────────────   │  │ ──────────────   │                    │
│  │ • Base styles    │  │ • Base styles    │                    │
│  │ • Positioning    │  │ • Variants       │                    │
│  │ • Animations     │  │ • Colors         │                    │
│  │ • States         │  │ • Sizes          │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ▼ Composes
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: FEATURES (Feature-Specific Compositions)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────┐                │
│  │ chat-input/                                │                │
│  │ ──────────────────────────────────────────│                │
│  │ • Base layout                              │                │
│  │ • Collapsed state behavior                 │                │
│  │ • Expanded state behavior                  │                │
│  │ • Transparent mode effects                 │                │
│  └────────────────────────────────────────────┘                │
│                                                                  │
│  ┌────────────────────────────────────────────┐                │
│  │ capture/audio-tablet/                      │                │
│  │ ──────────────────────────────────────────│                │
│  │ • Base tablet structure                    │                │
│  │ • Layout and positioning                   │                │
│  │ • State management (recording/paused)      │                │
│  │ • Control interactions                     │                │
│  └────────────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ▼ Enhanced by
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 4: THEMES (Theme Variations)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ dark-theme.css   │  │ light-theme.css  │                    │
│  │ ──────────────   │  │ ──────────────   │                    │
│  │ • Token override │  │ • Token override │                    │
│  │ • Dark colors    │  │ • Light colors   │                    │
│  │ • Shadows        │  │ • Shadows        │                    │
│  │ • Specifics      │  │ • Specifics      │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ▼ Utilities
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 5: UTILITIES (Helper Classes & Animations)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ animations.css   │  │ helpers.css      │                    │
│  │ ──────────────   │  │ ──────────────   │                    │
│  │ • @keyframes     │  │ • Opacity utils  │                    │
│  │ • Pulse effects  │  │ • Shadow utils   │                    │
│  │ • Transitions    │  │ • Border utils   │                    │
│  │ • Spins          │  │ • State helpers  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ responsive.css   │                                           │
│  │ ──────────────   │                                           │
│  │ • Breakpoints    │                                           │
│  │ • Mobile-first   │                                           │
│  │ • Media queries  │                                           │
│  │ • Adaptations    │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## SOLID Principles Mapping

```
┌───────────────────────────────────────────────────────────────────┐
│                    SOLID PRINCIPLES IN CSS                        │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ S - Single Responsibility Principle                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │
│ Each file has ONE reason to change                               │
│                                                                   │
│ ✓ variables.css    → Only design tokens                          │
│ ✓ reset.css        → Only browser normalization                  │
│ ✓ typography.css   → Only text styles                            │
│ ✓ layout.css       → Only layout utilities                       │
│ ✓ animations.css   → Only keyframes                              │
│ ✓ helpers.css      → Only utility classes                        │
│ ✓ responsive.css   → Only media queries                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ O - Open/Closed Principle                                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │
│ Open for extension, closed for modification                      │
│                                                                   │
│ Base Component:                                                   │
│   .btn {                                                          │
│     padding: var(--btn-padding, 8px 16px);                       │
│     background: var(--btn-bg, var(--color-primary));             │
│   }                                                               │
│                                                                   │
│ Extension (not modification):                                     │
│   .btn-large {                                                    │
│     --btn-padding: 12px 24px;  ← Extend, don't modify           │
│   }                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ L - Liskov Substitution Principle                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │
│ Variants should be interchangeable                               │
│                                                                   │
│ Base:      .btn { /* interface */ }                              │
│ Variants:  .btn--primary { /* variant 1 */ }                     │
│            .btn--secondary { /* variant 2 */ }                   │
│            .btn--danger { /* variant 3 */ }                      │
│                                                                   │
│ All variants:                                                     │
│   ✓ Share same base structure                                    │
│   ✓ Support same states (hover, active, disabled)                │
│   ✓ Have consistent dimensions                                   │
│   ✓ Behave predictably                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ I - Interface Segregation Principle                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │
│ Focused, client-specific modules                                 │
│                                                                   │
│ Instead of one giant file:                                        │
│   ✗ buttons.css (5000 lines)                                     │
│                                                                   │
│ Use focused modules:                                              │
│   ✓ button/button-base.css (100 lines)                           │
│   ✓ button/button-variants.css (150 lines)                       │
│   ✓ button/button-states.css (80 lines)                          │
│   ✓ button/button-sizes.css (60 lines)                           │
│                                                                   │
│ Components import only what they need!                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ D - Dependency Inversion Principle                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │
│ Depend on abstractions, not concrete values                      │
│                                                                   │
│ Abstraction Layer (variables.css):                               │
│   :root {                                                         │
│     --color-primary: #3b82f6;                                    │
│     --spacing-unit: 8px;                                         │
│   }                                                               │
│                                                                   │
│ Components depend on abstractions:                                │
│   .btn {                                                          │
│     background: var(--color-primary);  ← Abstraction             │
│     padding: calc(var(--spacing-unit) * 2);  ← Abstraction       │
│   }                                                               │
│                                                                   │
│ Benefits:                                                         │
│   ✓ Change theme by updating tokens                              │
│   ✓ Consistent design system                                     │
│   ✓ Easy maintenance                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│  variables   │  ← Design Tokens (Abstractions)
│    .css      │
└──────┬───────┘
       │
       │ Provides tokens to
       ▼
┌──────────────────────────────────────┐
│  All other CSS files depend on these │
│         (Dependency Inversion)       │
└──────┬───────────────────────────────┘
       │
   ┌───┴──────────┬──────────────┬──────────────┐
   │              │              │              │
   ▼              ▼              ▼              ▼
┌──────┐    ┌──────────┐  ┌──────────┐  ┌──────────┐
│reset │    │typography│  │ layout   │  │ themes   │
└──────┘    └──────────┘  └──────────┘  └──────────┘
   │              │              │              │
   └──────────────┴──────────────┴──────────────┘
                   │
                   ▼
          ┌────────────────┐
          │   Components   │
          └────────┬───────┘
                   │
                   ▼
          ┌────────────────┐
          │    Features    │
          └────────┬───────┘
                   │
                   ▼
          ┌────────────────┐
          │   Utilities    │
          └────────┬───────┘
                   │
                   ▼
          ┌────────────────┐
          │  Application   │
          └────────────────┘
```

## Import Order Cascade

```
main-solid.css
    ↓
    ├─ 1. FOUNDATION (lowest specificity)
    │   ├─ variables.css      [Design tokens]
    │   ├─ reset.css          [Browser reset]
    │   ├─ typography.css     [Text styles]
    │   └─ layout.css         [Layout utils]
    │
    ├─ 2. LEGACY CORE
    │   └─ core/mcp.css
    │
    ├─ 3. LEGACY UI COMPONENTS
    │   ├─ ui/buttons.css
    │   ├─ ui/chat-input.css
    │   ├─ ui/dropdowns.css
    │   └─ ...
    │
    ├─ 4. LEGACY FEATURES
    │   ├─ capture/recording.css
    │   ├─ capture/audio-recording-tablet.css
    │   └─ ...
    │
    ├─ 5. THEMES (override components)
    │   └─ core/themes.css
    │
    └─ 6. UTILITIES (highest specificity)
        ├─ utilities/animations.css
        ├─ utilities/helpers.css
        └─ utilities/responsive.css
```

## Backward Compatibility Strategy

```
┌─────────────────────────────────────┐
│         CURRENT STATE               │
│                                     │
│   main.css (old structure)          │
│        │                            │
│        ├─ core/base.css             │
│        ├─ core/themes.css           │
│        ├─ ui/buttons.css            │
│        └─ ... (existing files)      │
└─────────────────────────────────────┘
              │
              │ Parallel existence
              │
┌─────────────────────────────────────┐
│         NEW SOLID STRUCTURE         │
│                                     │
│   main-solid.css (new structure)    │
│        │                            │
│        ├─ foundation/               │
│        ├─ utilities/                │
│        └─ (imports old files too)   │
│                                     │
│   Both can coexist!                 │
└─────────────────────────────────────┘
              │
              │ Gradual migration
              ▼
┌─────────────────────────────────────┐
│         FUTURE STATE                │
│                                     │
│   main-solid.css (fully migrated)   │
│        │                            │
│        ├─ foundation/               │
│        ├─ components/               │
│        ├─ features/                 │
│        ├─ themes/                   │
│        └─ utilities/                │
│                                     │
│   main.css removed ✓                │
└─────────────────────────────────────┘
```

## Quick Reference

### When to use what:

| Need                     | Use                        | Location                |
|-------------------------|----------------------------|-------------------------|
| Color                   | `var(--color-*)`           | variables.css           |
| Spacing                 | `var(--spacing-*)`         | variables.css           |
| Typography              | `.text-*`, `.font-*`       | typography.css          |
| Layout                  | `.flex`, `.grid`, `.gap-*` | layout.css              |
| Animation               | `@keyframes *`             | animations.css          |
| Utility class           | `.opacity-*`, `.shadow-*`  | helpers.css             |
| Responsive              | `@media`                   | responsive.css          |
| New component           | Create in `components/`    | Components layer        |
| New feature             | Create in `features/`      | Features layer          |
| Theme variant           | Create in `themes/`        | Themes layer            |

---

**Remember**: This is a living architecture. As you build, the structure will grow naturally while maintaining SOLID principles.
