# CSS Architecture - SOLID Principles

> A scalable, maintainable CSS architecture following SOLID principles

## 📚 Documentation

This folder contains a complete CSS architecture refactored using SOLID principles. Here's where to find what you need:

### Quick Links

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[This README](#)** | Overview and quick start | Start here! |
| **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** | Step-by-step migration guide | When adding new code |
| **[CSS-ARCHITECTURE.md](./CSS-ARCHITECTURE.md)** | Complete architecture details | For deep understanding |
| **[CSS-SOLID-SUMMARY.md](./CSS-SOLID-SUMMARY.md)** | SOLID principles explained | To understand "why" |
| **[CSS-VISUAL-GUIDE.md](./CSS-VISUAL-GUIDE.md)** | Visual diagrams & flow | For visual learners |

---

## 🚀 Quick Start

### For New Projects

Use the new SOLID architecture:

```html
<!-- In your HTML file -->
<link rel="stylesheet" href="css/main-solid.css">
```

### For Existing Projects

No changes needed! Your code continues to work:

```html
<!-- Keep using the legacy structure -->
<link rel="stylesheet" href="css/main.css">
```

Migrate when you're ready - both can coexist.

---

## 📁 Folder Structure

```
css/
├── 📖 Documentation
│   ├── CSS-ARCHITECTURE.md        ← Complete architecture guide
│   ├── CSS-SOLID-SUMMARY.md       ← SOLID principles explained
│   ├── CSS-VISUAL-GUIDE.md        ← Visual diagrams
│   ├── MIGRATION-GUIDE.md         ← Migration instructions
│   └── README.md                  ← This file
│
├── 🎯 Entry Points
│   ├── main-solid.css             ← NEW: SOLID architecture
│   └── main.css                   ← LEGACY: Original structure
│
├── 🏗️ NEW: Foundation Layer
│   ├── variables.css              ← Design tokens (DIP)
│   ├── reset.css                  ← Browser reset (SRP)
│   ├── typography.css             ← Typography system (SRP)
│   └── layout.css                 ← Layout utilities (SRP)
│
├── 🧩 NEW: Components Layer (Future)
│   ├── button/                    ← Button components
│   ├── input/                     ← Input components
│   ├── dropdown/                  ← Dropdown components
│   ├── badge/                     ← Badge components
│   └── card/                      ← Card components
│
├── 🎨 NEW: Features Layer (Future)
│   ├── chat-input/                ← Chat input feature
│   ├── capture/                   ← Capture features
│   │   └── audio-tablet/          ← Audio recording tablet
│   └── recording/                 ← Recording features
│
├── 🌈 NEW: Themes Layer (Future)
│   ├── light-theme.css            ← Light theme
│   ├── dark-theme.css             ← Dark theme
│   └── theme-system.css           ← Theme switcher
│
├── 🛠️ NEW: Utilities Layer
│   ├── animations.css             ← Animation keyframes (SRP)
│   ├── helpers.css                ← Utility classes (ISP)
│   └── responsive.css             ← Responsive breakpoints (SRP)
│
└── 📦 LEGACY: Existing Files (Backward Compatible)
    ├── core/                      ← Core styles & themes
    ├── ui/                        ← UI components
    ├── capture/                   ← Capture features
    ├── media/                     ← Media components
    └── input/                     ← Input components
```

---

## ⭐ Key Features

### ✅ SOLID Principles Applied

| Principle | What it means | How it's applied |
|-----------|---------------|------------------|
| **S**ingle Responsibility | One file, one purpose | Each file has one clear responsibility |
| **O**pen/Closed | Extend, don't modify | Use CSS variables to extend components |
| **L**iskov Substitution | Variants are interchangeable | All button variants work the same way |
| **I**nterface Segregation | Focused modules | Small, specific files instead of monoliths |
| **D**ependency Inversion | Depend on abstractions | All styles use design tokens |

### ✅ Benefits

- 🎯 **Maintainable**: Each file has a single, clear purpose
- 📈 **Scalable**: Easy to add new components without touching existing ones
- ♻️ **Reusable**: Design tokens and utilities used everywhere
- 👥 **Team-Friendly**: Clear boundaries reduce merge conflicts
- 🚀 **Performance**: Can load only necessary styles per page
- 🧪 **Testable**: Isolated modules are easier to test

---

## 🎨 Design Tokens

All styles use design tokens for consistency and easy theming:

```css
/* Colors */
var(--color-bg-primary)      /* #1e1e1f */
var(--color-text-primary)    /* #f5f5f5 */
var(--color-accent)          /* #3b82f6 */
var(--color-danger)          /* #ef4444 */

/* Spacing (8px grid system) */
var(--spacing-2)             /* 8px */
var(--spacing-4)             /* 16px */
var(--spacing-6)             /* 24px */

/* Typography */
var(--font-size-base)        /* 14px */
var(--font-weight-medium)    /* 500 */

/* Border Radius */
var(--radius-md)             /* 8px */
var(--radius-lg)             /* 12px */
var(--radius-full)           /* 9999px */

/* Shadows */
var(--shadow-sm)             /* Small shadow */
var(--shadow-md)             /* Medium shadow */
var(--shadow-lg)             /* Large shadow */
```

See [`foundation/variables.css`](./foundation/variables.css) for the complete list.

---

## 🛠️ Common Utilities

Utility classes for rapid development:

```css
/* Layout */
.flex .flex-col .items-center .justify-between .gap-4

/* Spacing */
.p-4 .px-6 .py-2 .mt-4 .mb-6

/* Typography */
.text-base .font-medium .text-center .text-primary

/* Opacity */
.opacity-50 .opacity-80

/* Shadows */
.shadow-sm .shadow-md .shadow-lg

/* Border Radius */
.rounded-md .rounded-lg .rounded-full

/* Background */
.bg-primary .bg-secondary .bg-accent

/* States */
.is-active .is-disabled .is-loading
```

See [`utilities/helpers.css`](./utilities/helpers.css) for the complete list.

---

## 📖 Usage Examples

### Example 1: Using Design Tokens

```css
/* ✅ Good - Uses design tokens */
.my-component {
    background: var(--color-bg-primary);
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
}

/* ❌ Bad - Hard-coded values */
.my-component {
    background: #1e1e1f;
    padding: 16px;
    border-radius: 8px;
    color: #f5f5f5;
}
```

### Example 2: Extending Components (OCP)

```css
/* ✅ Good - Extend through variables */
.btn {
    padding: var(--btn-padding, 8px 16px);
    background: var(--btn-bg, var(--color-accent));
}

.btn--large {
    --btn-padding: 12px 24px;  /* Extend */
}

/* ❌ Bad - Modify directly */
.btn.large {
    padding: 12px 24px !important;  /* Modify */
}
```

### Example 3: Using Utilities

```css
/* ✅ Good - Use utility classes */
<div class="flex items-center gap-4 p-4 rounded-lg shadow-md">
    <button class="btn btn--primary">Click me</button>
</div>

/* ❌ Bad - Custom styles for common patterns */
<div style="display: flex; align-items: center; gap: 16px; padding: 16px;">
    <button style="background: #3b82f6;">Click me</button>
</div>
```

---

## 🔄 Migration Path

### Current State
- ✅ Foundation layer created
- ✅ Utilities layer created
- ✅ Documentation complete
- ✅ Backward compatibility maintained

### Next Steps
1. **Migrate Components** (buttons, inputs, dropdowns)
2. **Migrate Features** (chat-input, audio-tablet)
3. **Extract Themes** (light/dark themes)
4. **Remove Legacy Files** (after full migration)

### How to Migrate

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for step-by-step instructions.

---

## 📚 Learn More

### New to SOLID Principles in CSS?
Start with:
1. [CSS-SOLID-SUMMARY.md](./CSS-SOLID-SUMMARY.md) - Understand the principles
2. [CSS-VISUAL-GUIDE.md](./CSS-VISUAL-GUIDE.md) - See visual diagrams
3. [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Try migrating a component

### Want Deep Understanding?
Read:
1. [CSS-ARCHITECTURE.md](./CSS-ARCHITECTURE.md) - Complete architecture details
2. Explore code in `foundation/` and `utilities/` folders

### Ready to Build?
Follow:
1. [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Migration checklist
2. Use existing files as templates
3. Test thoroughly

---

## 🤔 FAQ

### Q: Do I need to migrate all my code?
**A:** No! The new architecture is fully backward compatible. Migrate when you're ready, or use it for new features only.

### Q: Can I use both `main.css` and `main-solid.css`?
**A:** Yes, but pick one. Use `main-solid.css` for new projects, `main.css` for existing ones.

### Q: Where do I put a new component?
**A:** 
- Reusable UI element (button, input) → `components/`
- Feature-specific (chat input) → `features/`
- Utility/helper → `utilities/`

### Q: How do I create a variant?
**A:** Use CSS variables to extend, don't modify the base:
```css
.btn--large {
    --btn-padding: 12px 24px;
}
```

### Q: Can I use `!important`?
**A:** Only in utility classes. Avoid it in components.

### Q: What's the import order?
**A:** 
1. Foundation (variables, reset, typography, layout)
2. Components
3. Features
4. Themes
5. Utilities

See [`main-solid.css`](./main-solid.css) for the exact order.

---

## 🎯 Best Practices

### ✅ DO:
- ✅ Use design tokens (`var(--color-*)`)
- ✅ Follow BEM naming (`.component__element--modifier`)
- ✅ Keep specificity low (avoid deep nesting)
- ✅ One file, one responsibility (SRP)
- ✅ Extend through composition (OCP)
- ✅ Use semantic names (`.btn--primary` not `.btn--blue`)
- ✅ Mobile-first responsive design

### ❌ DON'T:
- ❌ Hard-code values (use tokens instead)
- ❌ Use `!important` (except utilities)
- ❌ Create deep nesting (`.a .b .c .d`)
- ❌ Mix concerns in one file
- ❌ Modify base components directly
- ❌ Use presentational names (`.btn--blue`)

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Styles not applying | Check import order in `main-solid.css` |
| Variables not working | Ensure `variables.css` is imported first |
| Themes not switching | Check theme class application |
| Specificity issues | Keep selectors flat, avoid deep nesting |

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for more troubleshooting tips.

---

## 📊 Architecture at a Glance

```
Design Tokens (variables.css)
        ↓
Foundation Layer (reset, typography, layout)
        ↓
Components Layer (button, input, dropdown)
        ↓
Features Layer (chat-input, audio-tablet)
        ↓
Themes Layer (light, dark)
        ↓
Utilities Layer (animations, helpers, responsive)
        ↓
Application
```

---

## 🎉 Summary

This CSS architecture:
- ✅ Follows SOLID principles
- ✅ Is fully backward compatible
- ✅ Provides clear organization
- ✅ Scales with your application
- ✅ Is well-documented
- ✅ Is team-friendly

**Ready to get started?** Check out the [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)!

---

## 📝 License & Credits

Part of the SonicPlane project. Built with SOLID principles for long-term maintainability.

---

**Questions?** Check the documentation files linked above or explore the code!
