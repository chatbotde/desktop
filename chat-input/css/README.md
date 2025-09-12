# CSS Module Structure

This directory contains the modularized CSS files for the chat input application. The large `chat-css.css` file has been broken down into smaller, organized modules for better maintainability.

## File Structure

### Core Files
- **`main.css`** - Main entry point that imports all modules
- **`base.css`** - Base styles, CSS variables, and reset styles
- **`themes.css`** - Theme-specific styles (dark theme, paper theme)
- **`animations.css`** - All keyframe animations and transitions

### Component Files
- **`chat-input.css`** - Main chat input component styles
- **`buttons.css`** - Button component styles and states
- **`dropdowns.css`** - Dropdown menu styles and positioning
- **`attachments.css`** - File attachment and media preview styles
- **`recording.css`** - Recording indicator and audio/video capture styles
- **`floating-cards.css`** - Floating display card styles

## Usage

The HTML file references `css/main.css` which automatically imports all the module files in the correct order. This ensures proper CSS cascade and prevents style conflicts.

## Benefits

1. **Maintainability** - Each component has its own file, making it easier to find and modify specific styles
2. **Organization** - Related styles are grouped together logically
3. **Performance** - Smaller files are easier to cache and load
4. **Collaboration** - Multiple developers can work on different components without conflicts
5. **Debugging** - Easier to identify which file contains specific styles

## File Sizes

- Original `chat-css.css`: ~2,243 lines
- Modularized files: 8 smaller files with clear separation of concerns

## Import Order

The `main.css` file imports modules in this order to ensure proper CSS cascade:
1. `base.css` - Foundation styles
2. `themes.css` - Theme overrides
3. `animations.css` - Animation definitions
4. `buttons.css` - Button components
5. `chat-input.css` - Main input component
6. `dropdowns.css` - Dropdown components
7. `attachments.css` - Attachment components
8. `recording.css` - Recording components
9. `floating-cards.css` - Floating card components

## Adding New Styles

When adding new styles:
1. Identify which component the styles belong to
2. Add the styles to the appropriate module file
3. If creating a new component, create a new CSS file and import it in `main.css`
4. Follow the existing naming conventions and structure
