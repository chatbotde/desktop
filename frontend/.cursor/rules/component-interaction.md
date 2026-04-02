# Component Interaction Anti-Patterns

## Issue: Uncontrolled Click-Through Component

### Problem
A component designed for "click-through" behavior (transparent overlay allowing clicks to pass through to underlying elements) caused unexpected global behavior:
- Captured all mouse events
- Prevented interaction with unrelated UI elements
- Created difficult-to-debug state pollution

### Root Cause
1. **Global Event Interception**: Component registered global mouse event listeners without proper scoping
2. **No Boundary Checks**: Events were intercepted regardless of component's actual position/visibility
3. **State Leakage**: Click-through state persisted even when component was visually hidden
4. **Missing Cleanup**: Event listeners not properly removed on unmount

### Solution Pattern

#### 1. Scoped Event Handling
```typescript
// Bad - Global interception
document.addEventListener('click', handleClick) // Intercepts ALL clicks

// Good - Scoped to component
const handleClick = (e: React.MouseEvent) => {
  e.stopPropagation() // Only stops bubbling, not global capture
}
```

#### 2. Visibility-Gated Logic
```typescript
// Good - Check visibility before intercepting
const handleMouseEvent = (e: MouseEvent) => {
  if (!isVisible || !ref.current?.contains(e.target as Node)) {
    return // Early exit if not relevant
  }
  // ... handle event
}
```

#### 3. Proper Cleanup
```typescript
useEffect(() => {
  if (!isActive) return
  
  const controller = new AbortController()
  document.addEventListener('click', handler, { 
    signal: controller.signal,
    capture: true // Only if necessary
  })
  
  return () => controller.abort() // Clean removal
}, [isActive])
```

#### 4. Boundary-Respecting Click-Through
```typescript
// ClickThrough.tsx - Correct implementation
export const ClickThrough = ({ children, isActive }) => {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!isActive) return
    
    const handleClickOutside = (e: MouseEvent) => {
      // Only handle if click is within our boundary
      if (ref.current?.contains(e.target as Node)) {
        e.stopPropagation()
        // Allow click to pass through to specific targets only
      }
    }
    
    // Use capture phase only for specific elements
    const element = ref.current
    element?.addEventListener('click', handleClickOutside)
    
    return () => {
      element?.removeEventListener('click', handleClickOutside)
    }
  }, [isActive])
  
  return (
    <div ref={ref} style={{ pointerEvents: isActive ? 'none' : 'auto' }}>
      {children}
    </div>
  )
}
```

## Prevention Guidelines

### 1. Event Handler Checklist
- [ ] Event handlers scoped to component boundaries only
- [ ] Visibility state checked before event processing
- [ ] Cleanup functions registered for ALL event listeners
- [ ] No global `document`/`window` listeners without explicit team review

### 2. Testing Requirements
Click-through components must have tests for:
```typescript
// Test: Events pass through when active
it('allows clicks to pass through to underlying elements', () => {
  const underlyingClick = vi.fn()
  render(
    <div onClick={underlyingClick}>
      <ClickThrough isActive={true}>
        <button>Overlay</button>
      </ClickThrough>
    </div>
  )
  
  fireEvent.click(screen.getByText('Overlay'))
  expect(underlyingClick).toHaveBeenCalled()
})

// Test: Component doesn't capture unrelated clicks
it('does not intercept clicks outside its boundary', () => {
  const outsideClick = vi.fn()
  render(
    <>
      <ClickThrough isActive={true}><div>Overlay</div></ClickThrough>
      <button onClick={outsideClick}>Outside</button>
    </>
  )
  
  fireEvent.click(screen.getByText('Outside'))
  expect(outsideClick).toHaveBeenCalled()
})
```

### 3. Code Review Requirements
Any PR with event interception must have:
- Screenshot/GIF of interaction working correctly
- Test coverage for event handling
- Explicit documentation of which events are intercepted and why

### 4. Architecture Pattern
For complex overlay interactions, use the **Portal + Boundary** pattern:
```typescript
// Good - Isolated overlay with clear boundaries
<OverlayBoundary>
  <ClickThroughArea onClick={handleOverlayClick}>
    {/* Transparent to specific targets only */}
  </ClickThroughArea>
  <InteractiveContent>
    {/* Normal interaction */}
  </InteractiveContent>
</OverlayBoundary>
```

## Warning Signs
Watch for these patterns in PRs:
- `document.addEventListener` without `useEffect` cleanup
- `stopPropagation()` or `preventDefault()` without comment explaining why
- Global state changes on mouse events
- Pointer-events manipulation without visual boundary indicators

## Related Rules
- See `team-collaboration.md` - Feature flag pattern for risky components
- See `import-export.md` - Keep click-through logic co-located with UI component
