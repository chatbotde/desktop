# CSS Architecture - SOLID Principles Applied

## Overview
This CSS architecture follows SOLID principles to create a maintainable, scalable, and modular styling system.

## Architecture Principles

### 1. Single Responsibility Principle (SRP)
**Each stylesheet has ONE clear purpose and responsibility**

#### Foundation Layer (`foundation/`)
- **variables.css**: Design tokens and CSS custom properties only
- **reset.css**: Browser normalization and reset only
- **typography.css**: Font definitions and text styles only
- **layout.css**: Spacing, grid systems, and layout utilities only

#### Component Layer (`components/`)
Each component file contains styles for ONE specific component:
- **button.css**: All button variants and states
- **input.css**: Text inputs and form elements
- **dropdown.css**: Dropdown menus and select elements
- **badge.css**: Badge and tag components
- **card.css**: Card-based layouts

#### Feature Layer (`features/`)
Feature-specific styling modules:
- **chat-input/**: All chat input related styles
  - `collapsed-state.css`: Collapsed UI behavior
  - `expanded-state.css`: Expanded UI behavior
  - `transparent-mode.css`: Transparency effects
- **capture/**: Media capture features
  - `audio-tablet.css`: Audio recording tablet
  - `audio-tablet-states.css`: State-specific styles (recording, paused, preview)
  - `control-panel.css`: Recording control panel
  - `transcription.css`: Live transcription panel
- **recording/**: Recording-specific features

#### Theme Layer (`themes/`)
- **light-theme.css**: Light theme overrides
- **dark-theme.css**: Dark theme (using base variables)
- **theme-adapters.css**: System preference detection

#### Utility Layer (`utilities/`)
- **animations.css**: Reusable animation keyframes
- **helpers.css**: Utility classes (.sr-only, .visually-hidden)
- **responsive.css**: Breakpoint-specific utilities

### 2. Open/Closed Principle (OCP)
**Styles are open for extension but closed for modification**

#### Implementation Strategy:
1. **CSS Custom Properties for Extension**
   ```css
   /* Base component - closed for modification */
   .btn {
     padding: var(--btn-padding, 8px 16px);
     border-radius: var(--btn-radius, 8px);
     background: var(--btn-bg, var(--color-primary));
   }
   
   /* Extension through variable override - open for extension */
   .btn-large {
     --btn-padding: 12px 24px;
     --btn-radius: 12px;
   }
   ```

2. **Composition Over Modification**
   ```css
   /* Don't modify base styles */
   /* Bad: .btn.special { ... } */
   
   /* Compose modifiers */
   /* Good: .btn.btn--primary, .btn.btn--large */
   ```

3. **Variant Classes**
   - Use BEM modifiers for variants
   - Never modify base component styles
   - Always extend through new classes

### 3. Liskov Substitution Principle (LSP)
**Component variants should be interchangeable**

#### Implementation:
1. **Consistent Interface**
   All button variants share the same base structure:
   ```css
   .btn { /* base interface */ }
   .btn--primary { /* variant */ }
   .btn--secondary { /* variant */ }
   .btn--danger { /* variant */ }
   ```

2. **Behavioral Consistency**
   - All variants support the same states (hover, active, disabled)
   - Same dimensions and spacing patterns
   - Predictable interaction patterns

### 4. Interface Segregation Principle (ISP)
**Create focused, client-specific style modules**

#### Structure:
```
components/
  button/
    button-base.css       # Core button styles
    button-variants.css   # Primary, secondary, etc.
    button-states.css     # Hover, active, disabled
    button-sizes.css      # Small, medium, large
```

#### Benefits:
- Components only import what they need
- Smaller file sizes through tree-shaking
- Easier to maintain specific concerns

### 5. Dependency Inversion Principle (DIP)
**Depend on abstractions (design tokens) not concrete values**

#### Implementation:
1. **Design Token Abstraction Layer**
   ```css
   /* foundation/variables.css - Abstraction */
   :root {
     --color-primary: #3b82f6;
     --spacing-unit: 8px;
     --radius-default: 8px;
   }
   
   /* components/button.css - Depends on abstraction */
   .btn {
     background: var(--color-primary);
     padding: calc(var(--spacing-unit) * 1);
     border-radius: var(--radius-default);
   }
   ```

2. **Semantic Naming**
   ```css
   /* Good - Semantic */
   --color-error: #ef4444;
   --spacing-section: calc(var(--spacing-unit) * 4);
   
   /* Bad - Concrete */
   --red: #ef4444;
   --spacing-32: 32px;
   ```

## File Organization

```
css/
├── main.css                    # Entry point (imports only)
├── foundation/                 # Layer 1: Foundation
│   ├── variables.css          # Design tokens
│   ├── reset.css              # Browser normalization
│   ├── typography.css         # Font systems
│   └── layout.css             # Layout utilities
├── components/                 # Layer 2: Components
│   ├── button/
│   │   ├── button-base.css
│   │   ├── button-variants.css
│   │   ├── button-states.css
│   │   └── button-sizes.css
│   ├── input/
│   │   └── ...
│   ├── dropdown/
│   │   └── ...
│   └── ...
├── features/                   # Layer 3: Features
│   ├── chat-input/
│   │   ├── chat-input-base.css
│   │   ├── collapsed-state.css
│   │   ├── expanded-state.css
│   │   └── transparent-mode.css
│   ├── capture/
│   │   ├── audio-tablet/
│   │   │   ├── audio-tablet-base.css
│   │   │   ├── audio-tablet-layout.css
│   │   │   ├── audio-tablet-states.css
│   │   │   └── audio-tablet-controls.css
│   │   ├── control-panel.css
│   │   └── transcription-panel.css
│   └── recording/
│       └── recording-indicator.css
├── themes/                     # Layer 4: Themes
│   ├── light-theme.css
│   ├── dark-theme.css
│   └── theme-system.css
└── utilities/                  # Layer 5: Utilities
    ├── animations.css
    ├── helpers.css
    └── responsive.css
```

## Benefits of This Architecture

1. **Maintainability**: Each file has a single, clear responsibility
2. **Scalability**: Easy to add new components without touching existing ones
3. **Reusability**: Components and utilities can be reused across features
4. **Testability**: Isolated modules are easier to test and verify
5. **Team Collaboration**: Clear boundaries reduce merge conflicts
6. **Performance**: Can load only necessary styles per page/feature
7. **Documentation**: Structure is self-documenting

## Migration Strategy

1. Create new folder structure
2. Extract foundation layer (variables, reset, typography, layout)
3. Refactor components into modular files (SRP)
4. Separate feature-specific styles
5. Extract themes into dedicated files
6. Move utilities to separate modules
7. Update main.css import order
8. Remove old files after verification

## Naming Conventions

### BEM (Block Element Modifier)
```css
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}
```

### Utility Classes
```css
.u-margin-top-2 {}
.u-text-center {}
.u-visually-hidden {}
```

### State Classes
```css
.is-active {}
.is-disabled {}
.is-loading {}
```

## Import Order in main.css

```css
/* 1. Foundation - Design tokens and base styles */
@import './foundation/variables.css';
@import './foundation/reset.css';
@import './foundation/typography.css';
@import './foundation/layout.css';

/* 2. Components - Reusable UI components */
@import './components/button/button-base.css';
@import './components/input/input-base.css';
/* ... */

/* 3. Features - Feature-specific compositions */
@import './features/chat-input/chat-input-base.css';
@import './features/capture/audio-tablet/audio-tablet-base.css';
/* ... */

/* 4. Themes - Theme overrides */
@import './themes/dark-theme.css';
@import './themes/light-theme.css';

/* 5. Utilities - Helper classes and animations */
@import './utilities/animations.css';
@import './utilities/helpers.css';
@import './utilities/responsive.css';
```

## Best Practices

1. **Never use !important** (except for utilities)
2. **Use CSS custom properties** for theming and variants
3. **Prefer composition** over inheritance
4. **Keep specificity low** (avoid deep nesting)
5. **Mobile-first** responsive design
6. **Semantic class names** over presentational
7. **Document complex selectors** with comments
8. **Use consistent spacing** (8px grid system)
9. **Leverage cascade** properly (layer ordering)
10. **Test cross-browser** compatibility
