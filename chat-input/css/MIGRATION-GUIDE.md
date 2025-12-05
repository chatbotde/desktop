# CSS SOLID Migration Guide

## Quick Start

### For New Developers

**Option 1: Use New SOLID Architecture (Recommended)**
```html
<!-- In your HTML file -->
<link rel="stylesheet" href="css/main-solid.css">
```

**Option 2: Use Legacy Structure (For compatibility)**
```html
<!-- In your HTML file -->
<link rel="stylesheet" href="css/main.css">
```

Both work! The new architecture provides better organization and maintainability.

---

## For Existing Developers

### No Changes Required! ✅

Your existing code will continue to work. The new SOLID structure:
- ✅ Is completely backward compatible
- ✅ Doesn't break any existing styles
- ✅ Can coexist with current code
- ✅ Allows gradual adoption

### When You're Ready to Migrate

Follow this simple checklist for each component:

---

## Component Migration Checklist

### Step 1: Identify Component Type

Is your component:
- [ ] A reusable UI element (button, input, dropdown)? → Go to **Components**
- [ ] A feature-specific UI (chat input, audio tablet)? → Go to **Features**
- [ ] A utility or helper? → Already done! (See `utilities/`)

### Step 2: Create Component File

#### For Reusable Components (e.g., Button)

**Create:** `components/button/button-base.css`

```css
/* ==================== BUTTON COMPONENT ==================== */
/* Single Responsibility: Button base styles only */
/* Depends on: foundation/variables.css (DIP) */

.btn {
    /* Use design tokens (DIP) */
    padding: var(--button-padding-md);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    
    /* Base styles */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-button);
    border: 1px solid var(--color-border-default);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    cursor: pointer;
    
    /* Transitions */
    transition: var(--transition-colors);
}

.btn:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border-hover);
}

.btn:active {
    transform: scale(0.98);
}

.btn:disabled {
    opacity: var(--opacity-50);
    cursor: not-allowed;
    pointer-events: none;
}
```

**Create:** `components/button/button-variants.css`

```css
/* ==================== BUTTON VARIANTS ==================== */
/* Single Responsibility: Button color/style variants */
/* Following OCP: Extend base, don't modify */

/* Primary variant */
.btn--primary {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
}

.btn--primary:hover {
    background: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
}

/* Danger variant */
.btn--danger {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: white;
}

.btn--danger:hover {
    background: var(--color-danger-hover);
    border-color: var(--color-danger-hover);
}

/* Success variant */
.btn--success {
    background: var(--color-success);
    border-color: var(--color-success);
    color: white;
}

.btn--success:hover {
    background: var(--color-success-hover);
    border-color: var(--color-success-hover);
}
```

**Create:** `components/button/button-sizes.css`

```css
/* ==================== BUTTON SIZES ==================== */
/* Single Responsibility: Button size variants */
/* Following OCP: Extend through CSS variables */

.btn--sm {
    --button-padding-current: var(--button-padding-sm);
    --font-size-current: var(--font-size-sm);
    padding: var(--button-padding-current);
    font-size: var(--font-size-current);
}

.btn--md {
    /* Default size, uses base values */
}

.btn--lg {
    --button-padding-current: var(--button-padding-lg);
    --font-size-current: var(--font-size-lg);
    padding: var(--button-padding-current);
    font-size: var(--font-size-current);
}
```

#### For Features (e.g., Chat Input)

**Create:** `features/chat-input/chat-input-base.css`

```css
/* ==================== CHAT INPUT FEATURE ==================== */
/* Single Responsibility: Chat input base structure */

.chat-input-container {
    /* Use design tokens */
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-card);
    
    /* Layout */
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    
    /* Position */
    position: fixed;
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-fixed);
}

.prompt-input {
    display: flex;
    flex-direction: column;
    width: 100%;
}

#messageInput {
    /* Use design tokens */
    font-size: var(--font-size-md);
    line-height: var(--line-height-normal);
    color: var(--color-text-primary);
    
    /* Base styles */
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    min-height: var(--input-height-md);
}
```

**Create:** `features/chat-input/chat-input-collapsed.css`

```css
/* ==================== CHAT INPUT COLLAPSED STATE ==================== */
/* Single Responsibility: Collapsed state behavior */

.prompt-input:not(.expanded) {
    flex-direction: row;
    align-items: center;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-full);
    height: var(--input-height-md);
}

.prompt-input:not(.expanded) #messageInput {
    max-height: var(--input-height-md);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.prompt-input:not(.expanded) .left-actions {
    display: none;
}
```

### Step 3: Update main-solid.css

Add your new component imports:

```css
/* In main-solid.css */

/* ==================== LAYER 2: COMPONENTS ==================== */
@import url('./components/button/button-base.css');
@import url('./components/button/button-variants.css');
@import url('./components/button/button-sizes.css');

/* ==================== LAYER 3: FEATURES ==================== */
@import url('./features/chat-input/chat-input-base.css');
@import url('./features/chat-input/chat-input-collapsed.css');
@import url('./features/chat-input/chat-input-expanded.css');
```

### Step 4: Test

1. Switch your HTML to use `main-solid.css`
2. Verify all styles work correctly
3. Check different states and variants
4. Test responsive behavior
5. Verify theme switching

### Step 5: Remove Old File (Optional)

Once verified, you can remove the old CSS file from the legacy imports.

---

## Best Practices Checklist

When writing new CSS:

### ✅ DO:
- [ ] Use design tokens from `variables.css`
  ```css
  /* Good */
  background: var(--color-bg-primary);
  padding: var(--spacing-4);
  ```
  
- [ ] Follow BEM naming convention
  ```css
  /* Good */
  .component {}
  .component__element {}
  .component--modifier {}
  ```
  
- [ ] Keep specificity low (avoid deep nesting)
  ```css
  /* Good */
  .btn--primary {}
  
  /* Avoid */
  .container .wrapper .btn.primary {}
  ```
  
- [ ] Use semantic class names
  ```css
  /* Good */
  .btn--primary
  
  /* Avoid */
  .btn--blue
  ```
  
- [ ] Follow Single Responsibility - one file, one purpose
  
- [ ] Extend through composition, not modification (OCP)
  ```css
  /* Good - extend */
  .btn--large {
    --btn-padding: 12px 24px;
  }
  
  /* Avoid - modify */
  .btn.large {
    padding: 12px 24px !important;
  }
  ```

### ❌ DON'T:
- [ ] Use hard-coded values
  ```css
  /* Bad */
  background: #3b82f6;
  padding: 16px;
  ```
  
- [ ] Use `!important` (except in utilities)
  ```css
  /* Bad */
  color: red !important;
  ```
  
- [ ] Create deep nesting
  ```css
  /* Bad */
  .a .b .c .d .e { }
  ```
  
- [ ] Mix concerns in one file
  ```css
  /* Bad - mixing button, input, and dropdown in one file */
  ```

---

## Common Patterns

### Pattern 1: Creating a New Component

```css
/* components/your-component/your-component-base.css */

.your-component {
    /* 1. Use design tokens */
    padding: var(--spacing-4);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    
    /* 2. Layout */
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    
    /* 3. Typography */
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    
    /* 4. Transitions */
    transition: var(--transition-colors);
}

.your-component:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border-hover);
}
```

### Pattern 2: Creating Variants (OCP)

```css
/* components/your-component/your-component-variants.css */

/* Extend, don't modify */
.your-component--primary {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
}

.your-component--large {
    --component-padding: var(--spacing-6);
    --component-font-size: var(--font-size-lg);
    padding: var(--component-padding);
    font-size: var(--component-font-size);
}
```

### Pattern 3: State Management

```css
/* components/your-component/your-component-states.css */

.your-component.is-active {
    background: var(--color-accent);
    border-color: var(--color-accent);
}

.your-component.is-disabled {
    opacity: var(--opacity-50);
    cursor: not-allowed;
    pointer-events: none;
}

.your-component.is-loading {
    cursor: wait;
}
```

### Pattern 4: Responsive Design

```css
/* Use utilities/responsive.css or inline media queries */

/* Mobile first */
.your-component {
    width: 100%;
}

/* Tablet and up */
@media (min-width: 768px) {
    .your-component {
        width: 50%;
    }
}

/* Desktop and up */
@media (min-width: 1024px) {
    .your-component {
        width: 33.333%;
    }
}
```

---

## Troubleshooting

### My styles aren't applying

**Check:**
1. Is `main-solid.css` imported in your HTML?
2. Is your new file imported in `main-solid.css`?
3. Is the import order correct?
4. Are you using the correct class names?
5. Check browser DevTools for specificity issues

### Variables aren't working

**Check:**
1. Is `foundation/variables.css` imported first?
2. Are you using the correct variable name?
3. Check for typos: `var(--color-bg-primary)` not `var(--bg-primary-color)`

### Themes aren't switching

**Check:**
1. Is `core/themes.css` imported after components?
2. Are you applying theme classes correctly? (`.light-theme` or `[data-theme="light"]`)

---

## Quick Reference

### Design Tokens

```css
/* Colors */
var(--color-bg-primary)
var(--color-text-primary)
var(--color-accent)
var(--color-danger)

/* Spacing */
var(--spacing-2)    /* 8px */
var(--spacing-4)    /* 16px */
var(--spacing-6)    /* 24px */

/* Typography */
var(--font-size-base)
var(--font-weight-medium)
var(--line-height-normal)

/* Borders */
var(--radius-md)
var(--radius-lg)
var(--radius-full)

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
```

### Common Utilities

```css
/* Layout */
.flex .flex-col .items-center .justify-between .gap-4

/* Spacing */
.p-4 .px-6 .py-2 .m-auto

/* Typography */
.text-base .font-medium .text-center

/* Opacity */
.opacity-50 .opacity-80

/* Shadows */
.shadow-sm .shadow-md

/* Border Radius */
.rounded-md .rounded-lg .rounded-full
```

---

## Need Help?

1. **Read the docs:**
   - `CSS-ARCHITECTURE.md` - Full architecture details
   - `CSS-SOLID-SUMMARY.md` - SOLID principles explained
   - `CSS-VISUAL-GUIDE.md` - Visual diagrams

2. **Check examples:**
   - Look at existing files in `foundation/` and `utilities/`
   - Use them as templates for your components

3. **Test incrementally:**
   - Migrate one component at a time
   - Test thoroughly before moving to the next

---

**Remember:** Migration is gradual. You don't have to do everything at once!
