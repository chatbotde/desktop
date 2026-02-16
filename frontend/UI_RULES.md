# UI Design Design Principles

All future UI components (Windows, Popups, Overlays) for the SonicPlane/Buddy application must follow these architectural and aesthetic rules:

## 1. Draggable Interface
Every floating UI component must be draggable to allow the user to position it anywhere on the screen.
- **Technology**: Use `framer-motion`'s `motion.div` with the `drag` prop.
- **Controls**: Use `useDragControls` and `dragListener={false}`.
- **Drag Handle**: Access to dragging should be via a specific drag handle (typically using the `GripVertical` icon from `lucide-react`).
- **Interaction**: The drag handle should ideally be revealed on hover or located in a dedicated "actions" area to keep the main UI clean.

## 2. Conditional Rendering (Clean Exit)
Components must not leave empty containers or "ghost" frames on the screen when closed.
- **Implementation**: Always wrap the draggable container in a conditional check (e.g., `{isVisible && (...) }`) in the parent component.
- **AnimatePresence**: Use `AnimatePresence` from `framer-motion` for smooth entry and exit transitions.

### 3. Solid Premium Aesthetic
*   **No Glassmorphism**: Avoid `backdrop-blur` or high transparency backgrounds.
*   **Solid Colors**: Use solid, deep backgrounds (e.g., `bg-zinc-950` for dark mode, `bg-white` for light mode).
*   **Direct Styling**: Apply borders and shadows directly to the `motion.div` or its immediate Card child.
*   **No Redundant Wrappers**: Avoid empty container divs that catch events or leave ghost frames.

## 4. Implementation Example
```tsx
const dragControls = useDragControls();

return (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        className="absolute z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl"
      >
        <div className="flex justify-end p-1">
          <button onPointerDown={(e) => dragControls.start(e)} className="cursor-grab">
            <GripVertical className="size-4" />
          </button>
        </div>
        {/* Content */}
      </motion.div>
    )}
  </AnimatePresence>
);
```
