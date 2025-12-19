# Frontend Architecture Guide

This document outlines the folder structure and organization principles for the frontend codebase.

---

## Folder Structure

```
src/
│
├── app/                          # Application shell
│   ├── App.tsx                   # Main component (only layout, no logic)
│   ├── main.tsx                  # Entry point
│   └── providers.tsx             # All context providers wrapped together
│
├── shared/                       # 🔄 REUSABLE CODE ACROSS FEATURES
│   ├── components/               # Shared UI components
│   │   ├── ui/                   # shadcn primitives (Button, Dialog, etc.)
│   │   ├── common/               # App-specific shared (ClickThrough, etc.)
│   │   ├── feedback/             # Toasts, alerts, notifications
│   │   ├── layout/               # Layout components
│   │   ├── media/                # Media preview components
│   │   ├── markdown/             # Markdown rendering
│   │   ├── message/              # Message components (MessageContent, etc.)
│   │   ├── actions/              # Action buttons (Copy, Insert, Replace)
│   │   └── index.ts
│   ├── hooks/                    # Shared hooks (useDebounce, useLocalStorage)
│   ├── providers/                # Global contexts (Theme, Feature, Toast)
│   ├── lib/                      # Pure utilities (cn, formatDate)
│   ├── types/                    # Global TypeScript types
│   └── styles/                   # Global styles & themes
│
├── features/                     # Feature modules (self-contained)
│   │
│   ├── chat/                     # 💬 Chat/Messages feature
│   │   ├── components/
│   │   │   ├── Messages.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── SmartMessage.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── hooks/
│   │   │   ├── useMessageManager.ts
│   │   │   └── useChatManager.ts
│   │   ├── types.ts
│   │   └── index.ts              # Public exports
│   │
│   ├── prompt/                   # ✍️ Prompt input feature
│   │   ├── components/
│   │   │   ├── PromptInput.tsx
│   │   │   ├── PromptInputCollapsed.tsx
│   │   │   ├── PromptInputExpanded.tsx
│   │   │   └── ModelSelector.tsx
│   │   ├── hooks/
│   │   │   └── usePromptInput.ts
│   │   ├── theme.ts
│   │   └── index.ts
│   │
│   ├── output-window/            # 🪟 Output window feature
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── WindowControls.tsx
│   │   │   ├── DragButton.tsx
│   │   │   ├── ResizeHandle.tsx
│   │   │   ├── ThinkingIndicator.tsx
│   │   │   ├── TextSelectionActions.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useDraggable.ts
│   │   │   ├── useResizable.ts
│   │   │   ├── useAutoScroll.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   ├── theme.ts
│   │   └── index.ts
│   │
│   ├── capture/                  # 📸 Screenshot/Screen capture
│   │   ├── components/
│   │   │   ├── ScreenCaptureModal.tsx
│   │   │   ├── AreaScreenshotOverlay.tsx
│   │   │   └── ScreenshotButton.tsx
│   │   ├── hooks/
│   │   │   └── useAutoScreenshot.ts
│   │   └── index.ts
│   │
│   ├── audio/                    # 🎤 Audio recording & voice
│   │   ├── components/
│   │   │   ├── VoiceToPrompt.tsx
│   │   │   ├── AudioRecorderPill.tsx
│   │   │   └── AudioPreview.tsx
│   │   ├── hooks/
│   │   │   └── useAudioRecording.ts
│   │   └── index.ts
│   │
│   ├── text-selection/           # 🔤 Text selection actions
│   │   ├── components/
│   │   │   ├── TextSelectionPopup.tsx
│   │   │   └── TextSelectionActions.tsx
│   │   ├── hooks/
│   │   │   └── useTextSelectionActions.ts
│   │   └── index.ts
│   │
│   ├── settings/                 # ⚙️ Settings
│   │   ├── components/
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── SettingsSidebar.tsx
│   │   │   └── sections/
│   │   │       ├── GeneralSection.tsx
│   │   │       └── ModelsSection.tsx
│   │   └── index.ts
│   │
│   └── feature-flags/            # 🚩 Feature toggle system
│       ├── definitions/          # .feature.ts files
│       ├── effects/
│       ├── context.tsx           # FeatureContext
│       ├── registry.ts
│       ├── types.ts
│       └── index.ts
│
├── services/                     # Business logic & API calls
│   ├── ai/                       # AI providers
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── gemini.ts
│   │   │   ├── deepseek.ts
│   │   │   ├── cerebras.ts
│   │   │   ├── kimi.ts
│   │   │   ├── xai.ts
│   │   │   └── openrouter.ts
│   │   ├── local-llm/
│   │   │   ├── ollama.ts
│   │   │   └── unified-local-service.ts
│   │   ├── unified-ai-service.ts
│   │   ├── model-config.ts
│   │   ├── usage-tracker.ts
│   │   └── index.ts
│   │
│   ├── audio/                    # Audio transcription services
│   │   ├── assemblyai.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── prompts/                  # Prompt templates & system prompts
│       ├── actions/
│       │   ├── add-prompt.ts
│       │   ├── ask-prompt.ts
│       │   ├── change-prompt.ts
│       │   └── explain-prompt.ts
│       ├── templates/
│       │   └── base-templates.ts
│       ├── system-prompts.ts
│       └── index.ts
│
└── assets/                       # Static assets (images, fonts, etc.)
    └── ...
```

---

## Core Principles

### 1. Feature-Based Organization

Each feature is **self-contained** with its own:
- `components/` - UI components
- `hooks/` - Feature-specific hooks
- `types.ts` - TypeScript types
- `index.ts` - Public API exports

```
features/chat/
├── components/     # Only chat-related components
├── hooks/          # Only chat-related hooks
├── types.ts        # Only chat-related types
└── index.ts        # Export ONLY what others need
```

### 2. Public API Pattern

Each feature exposes only what's needed through `index.ts`:

```typescript
// features/chat/index.ts
export { ChatMessages } from './components/Messages'
export { useMessageManager } from './hooks/useMessageManager'
export type { Message, ChatState } from './types'
```

**Import Rule:**
```typescript
// ✅ GOOD - import from feature's public API
import { ChatMessages, useMessageManager } from '@/features/chat'

// ❌ BAD - importing internal files directly
import { MessageBubble } from '@/features/chat/components/MessageBubble'
```

### 3. Separation of Concerns

| Layer | Purpose | Example |
|-------|---------|---------|
| `components/ui/` | Generic UI primitives | Button, Dialog, Input |
| `components/common/` | Shared app components | ClickThrough, Container |
| `features/` | Business feature modules | Chat, Capture, Settings |
| `services/` | Business logic, API calls | AI providers, transcription |
| `hooks/` | Global reusable hooks | useLocalStorage |
| `lib/` | Pure utility functions | utils.ts, constants |

### 4. Services vs Features

```
services/ai/          # API calls, streaming, token counting (NO UI)
features/chat/        # UI components that USE the ai service
```

Services contain **pure business logic** with no React components.

### 5. Shared vs Feature-Specific Code

| Location | When to Use |
|----------|-------------|
| `shared/hooks/` | Generic, used by 2+ features |
| `shared/components/` | UI used by 2+ features |
| `features/xxx/hooks/` | Only used by that feature |
| `features/xxx/components/` | Only used by that feature |

**Rule**: If you copy-paste code between features, move it to `shared/`.

---

## Adding a New Feature

### Step 1: Create Feature Folder

```
features/
└── plugins/
    ├── components/
    │   ├── PluginList.tsx
    │   └── PluginCard.tsx
    ├── hooks/
    │   └── usePlugins.ts
    ├── types.ts
    └── index.ts
```

### Step 2: Create Public API

```typescript
// features/plugins/index.ts
export { PluginList } from './components/PluginList'
export { PluginCard } from './components/PluginCard'
export { usePlugins } from './hooks/usePlugins'
export type { Plugin, PluginConfig } from './types'
```

### Step 3: Use in App

```tsx
import { PluginList } from '@/features/plugins'

function App() {
  return <PluginList />
}
```

---

## Adding a New AI Provider

### Step 1: Create Provider File

```typescript
// services/ai/providers/newprovider.ts
export async function* streamNewProvider(params: StreamParams) {
  // Implementation
}
```

### Step 2: Register in Unified Service

```typescript
// services/ai/unified-ai-service.ts
import { streamNewProvider } from './providers/newprovider'

// Add to provider map
```

### Step 3: Add Model Config

```typescript
// services/ai/model-config.ts
export const NEW_PROVIDER_MODELS = [
  { id: 'model-1', name: 'Model 1', ... }
]
```

---

## Migration Checklist

### Phase 1: Setup Shared Layer ✅
- [x] Create `shared/` folder structure
- [x] Create `shared/components/ui/` (move existing shadcn)
- [x] Create `shared/components/common/`
- [x] Create `shared/components/markdown/`
- [x] Create `shared/components/media/`
- [x] Create `shared/components/actions/`
- [x] Create `shared/hooks/`
- [x] Create `shared/providers/`
- [x] Create `shared/lib/`
- [x] Create `shared/types/`

### Phase 2: Move Shared Code ✅
- [x] Move `components/ui/*` → `shared/components/ui/`
- [x] Move `lib/utils.ts` → `shared/lib/utils.ts`
- [x] Move `contexts/ThemeContext.tsx` → `shared/providers/ThemeProvider.tsx`
- [x] Move `contexts/FeatureContext.tsx` → `shared/providers/FeatureProvider.tsx`
- [x] Move `components/prompt-kit/markdown.tsx` → `shared/components/markdown/`
- [x] Move shared hooks → `shared/hooks/`
- [x] Move global types → `shared/types/`

### Phase 3: Create App Shell ✅
- [x] Create `app/` folder
- [x] Move `App.tsx` → `app/App.tsx`
- [x] Move `main.tsx` → `app/main.tsx`
- [x] Create `app/providers.tsx`

### Phase 4: Move Services ✅
- [x] Create `services/` folder
- [x] Move `lib/ai/` → `services/ai/` (re-exports)
- [x] Move `lib/audio/` → `services/audio/`
- [x] Move `lib/prompt/` → `services/prompts/`

### Phase 5: Organize Features ✅
- [x] Create `features/chat/` and move message components
- [x] Create `features/prompt/` and move prompt input components
- [x] Create `features/output-window/` (already organized)
- [x] Create `features/capture/` and move screenshot components
- [x] Create `features/audio/` and move audio components
- [x] Create `features/text-selection/` and move selection components
- [x] Create `features/settings/` and move settings components
- [x] Move feature-flags system to `features/feature-flags/`

### Phase 6: Move Common Components to Shared ✅
- [x] Move `click-through.tsx` → `shared/components/common/`
- [ ] Move `container.tsx` → `shared/components/common/` (skipped - feature-specific)
- [x] Move `right-transparent.tsx` → `shared/components/common/`
- [x] Move `insert-button.tsx` → `shared/components/actions/`
- [x] Move `replace-button.tsx` → `shared/components/actions/`

### Phase 7: Update Imports & Test ✅
- [x] Update path aliases in `tsconfig.json`
- [x] Update all import paths (gradual - old paths still work via re-exports)
- [x] Run TypeScript check ✅
- [x] Test application (dev server running)

### Phase 8: Final Component Organization ✅
- [x] Move output-window components to `features/output-window/components/`
- [x] Move Message components to `shared/components/message/`
- [x] Separate hooks into individual files in `features/output-window/hooks/`
- [x] Create backwards-compatible re-exports in old locations

### Phase 9: Cleanup & Optimization (NEXT)

#### 9a: Clean up `components/` folder
- [ ] `components/messages/` → Already re-exports from `features/chat/` (can delete)
- [ ] `components/output-window/` → Already re-exports from `features/output-window/` (can delete)
- [ ] `components/text-selection/` → Move to `features/text-selection/components/`
- [ ] `components/settings/` → Move to `features/settings/components/`
- [ ] `components/sections/` → Move to appropriate features or `shared/components/`
- [ ] `components/prompt-kit/` → Move to `shared/components/prompt/` (used by multiple features)
- [ ] `components/prompt-input*.tsx` → Move to `features/prompt/components/`
- [ ] `components/ScreenCaptureModal.tsx` → Move to `features/capture/components/`
- [ ] `components/audio-*.tsx` → Move to `features/audio/components/`
- [ ] `components/animate-ui/` → Move to `shared/components/animate-ui/`

#### 9b: Consolidate `hooks/` folder
- [ ] `useMessageManager.ts` → Already in `features/chat/hooks/` (can delete)
- [ ] `useChatManager.ts` → Move to `features/chat/hooks/`
- [ ] `useAutoScreenshot.ts` → Move to `features/capture/hooks/`
- [ ] `useAutoInsert.ts` → Move to `shared/hooks/`
- [ ] `useTextSelectionActions.ts` → Move to `features/text-selection/hooks/`
- [ ] `useUIState.ts` → Move to `shared/hooks/`
- [ ] `useGlobalWindowAPI.ts` → Move to `shared/hooks/`

#### 9c: Clean up `lib/` folder
- [ ] `lib/ai/` → Already re-exports from `services/ai/` (can delete)
- [ ] `lib/audio/` → Already re-exports from `services/audio/` (can delete)
- [ ] `lib/prompt/` → Already re-exports from `services/prompts/` (can delete)
- [ ] `lib/utils.ts` → Already re-exports from `shared/lib/` (can delete)
- [ ] `lib/dashboard/` → Move to `features/dashboard/` or `services/dashboard/`
- [ ] `lib/settings/` → Move to `features/settings/` or `services/settings/`
- [ ] `lib/clickthrough.ts` → Move to `shared/lib/`

#### 9d: Infrastructure & Documentation
- [ ] Add CODEOWNERS file for feature ownership
- [ ] Set up dependency-cruiser for import validation
- [ ] Add feature-level README.md documentation
- [ ] Delete empty re-export files after updating all imports

---

## Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/features/*": ["./src/features/*"],
      "@/services/*": ["./src/services/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

### Import Examples After Migration

```typescript
// Shared components
import { Button, Dialog } from '@/shared/components/ui'
import { LoadingSpinner, ErrorBoundary } from '@/shared/components/common'
import { Markdown } from '@/shared/components/markdown'
import { CopyButton, InsertButton } from '@/shared/components/actions'

// Shared hooks
import { useDebounce, useLocalStorage, useCopyToClipboard } from '@/shared/hooks'

// Shared providers
import { useTheme, useFeature, useToast } from '@/shared/providers'

// Shared utilities
import { cn, formatDate } from '@/shared/lib'

// Shared types
import type { MediaAttachment, BaseMessage } from '@/shared/types'

// Features (public API only)
import { ChatMessages, useMessageManager } from '@/features/chat'
import { PromptInput } from '@/features/prompt'
import { OutputWindow } from '@/features/output-window'

// Services
import { UnifiedAIService, getModelConfig } from '@/services/ai'
import { transcribeAudio } from '@/services/audio'
```

---

## Shared Components & Features (Avoid Duplication)

This section explains how to organize reusable code that is used across multiple features.

---

### Shared Layer Structure

```
src/
├── shared/                        # 🔄 ALL REUSABLE CODE GOES HERE
│   │
│   ├── components/                # Shared UI components
│   │   ├── ui/                    # shadcn primitives (Button, Dialog, etc.)
│   │   ├── common/                # App-specific shared components
│   │   │   ├── ClickThrough.tsx
│   │   │   ├── Container.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── index.ts
│   │   ├── feedback/              # Toasts, alerts, notifications
│   │   │   ├── Toast.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── index.ts
│   │   ├── layout/                # Layout components
│   │   │   ├── PageContainer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   ├── media/                 # Media display components
│   │   │   ├── ImagePreview.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   └── index.ts
│   │   ├── markdown/              # Markdown rendering
│   │   │   ├── Markdown.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   └── index.ts
│   │   └── index.ts               # Export all shared components
│   │
│   ├── hooks/                     # Shared hooks (used by 2+ features)
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useClickOutside.ts
│   │   ├── useKeyboardShortcut.ts
│   │   ├── useNetworkStatus.ts
│   │   ├── useScrollManager.ts
│   │   ├── useWindowSize.ts
│   │   ├── useCopyToClipboard.ts
│   │   └── index.ts
│   │
│   ├── providers/                 # Global context providers
│   │   ├── ThemeProvider.tsx
│   │   ├── FeatureProvider.tsx
│   │   ├── ToastProvider.tsx
│   │   └── index.ts
│   │
│   ├── lib/                       # Pure utility functions (no React)
│   │   ├── utils.ts               # cn(), formatDate(), etc.
│   │   ├── constants.ts           # App-wide constants
│   │   ├── validators.ts          # Validation functions
│   │   ├── formatters.ts          # Data formatting functions
│   │   └── index.ts
│   │
│   ├── types/                     # Shared TypeScript types
│   │   ├── common.ts              # Common types (ID, Timestamp, etc.)
│   │   ├── api.ts                 # API response types
│   │   ├── electron.d.ts          # Electron type definitions
│   │   └── index.ts
│   │
│   └── styles/                    # Shared styles & themes
│       ├── themes.ts              # Theme definitions
│       ├── animations.ts          # Shared animations
│       └── index.css              # Global CSS
```

---

### When to Put Code in `shared/`

| Scenario | Location | Example |
|----------|----------|---------|
| Used by **1 feature only** | `features/xxx/` | `features/chat/hooks/useChatScroll.ts` |
| Used by **2+ features** | `shared/` | `shared/hooks/useDebounce.ts` |
| Generic UI primitive | `shared/components/ui/` | Button, Dialog, Input |
| App-specific reusable UI | `shared/components/common/` | LoadingSpinner, ErrorBoundary |
| Pure utility function | `shared/lib/` | `cn()`, `formatDate()` |
| Global state/context | `shared/providers/` | ThemeProvider, ToastProvider |

---

### Shared Components Examples

#### 1. Markdown Component (Used by Chat, Output Window, Explanation)

```
shared/components/markdown/
├── Markdown.tsx           # Main markdown renderer
├── CodeBlock.tsx          # Code block with syntax highlighting
├── CopyButton.tsx         # Copy code button
├── types.ts               # Markdown-related types
└── index.ts               # Public exports
```

```typescript
// shared/components/markdown/index.ts
export { Markdown } from './Markdown'
export { CodeBlock } from './CodeBlock'
export type { MarkdownProps } from './types'
```

**Usage in features:**
```typescript
// features/chat/components/MessageBubble.tsx
import { Markdown } from '@/shared/components/markdown'

// features/output-window/components/MessageContent.tsx
import { Markdown } from '@/shared/components/markdown'
```

#### 2. Media Preview Component (Used by Chat, Prompt, Output)

```
shared/components/media/
├── ImagePreview.tsx       # Image display with zoom
├── VideoPlayer.tsx        # Video player
├── AudioPlayer.tsx        # Audio player with waveform
├── MediaGrid.tsx          # Grid layout for multiple media
├── types.ts
└── index.ts
```

```typescript
// shared/components/media/index.ts
export { ImagePreview } from './ImagePreview'
export { VideoPlayer } from './VideoPlayer'
export { AudioPlayer } from './AudioPlayer'
export { MediaGrid } from './MediaGrid'
```

#### 3. Action Buttons (Used by Chat, Output Window, Text Selection)

```
shared/components/actions/
├── CopyButton.tsx         # Copy to clipboard
├── InsertButton.tsx       # Insert text
├── ReplaceButton.tsx      # Replace text
├── ActionBar.tsx          # Group of action buttons
└── index.ts
```

---

### Shared Hooks Examples

```typescript
// shared/hooks/index.ts

// Storage
export { useLocalStorage } from './useLocalStorage'
export { useSessionStorage } from './useSessionStorage'

// UI Utilities
export { useDebounce } from './useDebounce'
export { useThrottle } from './useThrottle'
export { useClickOutside } from './useClickOutside'
export { useKeyboardShortcut } from './useKeyboardShortcut'
export { useWindowSize } from './useWindowSize'
export { useMediaQuery } from './useMediaQuery'

// Clipboard
export { useCopyToClipboard } from './useCopyToClipboard'

// Network
export { useNetworkStatus } from './useNetworkStatus'

// Scroll
export { useScrollPosition } from './useScrollPosition'
export { useScrollToBottom } from './useScrollToBottom'
```

**Usage:**
```typescript
// Any feature can import shared hooks
import { useDebounce, useCopyToClipboard } from '@/shared/hooks'
```

---

### Shared Types Examples

```typescript
// shared/types/common.ts

// Base types used everywhere
export type ID = string
export type Timestamp = number

// Media types
export interface MediaAttachment {
  id: ID
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  name: string
  size: number
  mimeType: string
}

// Message types (used by chat, output-window, etc.)
export interface BaseMessage {
  id: ID
  content: string
  timestamp: Timestamp
  attachments?: MediaAttachment[]
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'
```

```typescript
// shared/types/index.ts
export * from './common'
export * from './api'
```

---

### Shared Providers Examples

```typescript
// shared/providers/index.ts
export { ThemeProvider, useTheme } from './ThemeProvider'
export { FeatureProvider, useFeature } from './FeatureProvider'
export { ToastProvider, useToast } from './ToastProvider'
```

```typescript
// app/providers.tsx - Combine all providers
import { ThemeProvider, FeatureProvider, ToastProvider } from '@/shared/providers'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FeatureProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </FeatureProvider>
    </ThemeProvider>
  )
}
```

---

### Import Rules for Shared Code

```typescript
// ✅ GOOD - Import from shared
import { Button, Dialog } from '@/shared/components/ui'
import { Markdown } from '@/shared/components/markdown'
import { useDebounce } from '@/shared/hooks'
import { cn, formatDate } from '@/shared/lib'
import type { MediaAttachment } from '@/shared/types'

// ✅ GOOD - Import from feature's public API
import { ChatMessages } from '@/features/chat'

// ❌ BAD - Direct import from feature internals
import { MessageBubble } from '@/features/chat/components/MessageBubble'
```

---

### Promoting Feature Code to Shared

When a component/hook is used in multiple features, move it to `shared/`:

**Before (duplicated):**
```
features/chat/components/CopyButton.tsx
features/output-window/components/CopyButton.tsx  # Duplicate!
```

**After (shared):**
```
shared/components/actions/CopyButton.tsx          # Single source
```

**Migration steps:**
1. Move the component to `shared/components/`
2. Export from `shared/components/index.ts`
3. Update all imports in features
4. Delete duplicates

---

### Updated Folder Structure (Complete)

```
src/
│
├── app/                          # Application shell
│   ├── App.tsx
│   ├── main.tsx
│   └── providers.tsx
│
├── shared/                       # 🔄 REUSABLE CODE (NEW)
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── common/               # App shared components
│   │   ├── feedback/             # Toasts, alerts
│   │   ├── layout/               # Layout components
│   │   ├── media/                # Media display
│   │   ├── markdown/             # Markdown rendering
│   │   ├── actions/              # Action buttons
│   │   └── index.ts
│   ├── hooks/
│   ├── providers/
│   ├── lib/
│   ├── types/
│   └── styles/
│
├── features/                     # Feature modules
│   ├── chat/
│   ├── prompt/
│   ├── output-window/
│   ├── capture/
│   ├── audio/
│   ├── text-selection/
│   ├── settings/
│   └── feature-flags/
│
├── services/                     # Business logic
│   ├── ai/
│   ├── audio/
│   └── prompts/
│
└── assets/
```

---

### Quick Reference: Where Does It Go?

| Code Type | Location | Import From |
|-----------|----------|-------------|
| shadcn Button, Dialog | `shared/components/ui/` | `@/shared/components/ui` |
| Custom LoadingSpinner | `shared/components/common/` | `@/shared/components/common` |
| Markdown renderer | `shared/components/markdown/` | `@/shared/components/markdown` |
| useDebounce hook | `shared/hooks/` | `@/shared/hooks` |
| ThemeProvider context | `shared/providers/` | `@/shared/providers` |
| cn() utility | `shared/lib/` | `@/shared/lib` |
| MediaAttachment type | `shared/types/` | `@/shared/types` |
| Chat message UI | `features/chat/` | `@/features/chat` |
| AI streaming logic | `services/ai/` | `@/services/ai` |

---

## Best Practices

### DO ✅
- Keep features isolated and self-contained
- Export only what's needed from `index.ts`
- Put business logic in `services/`
- Use path aliases for imports
- Create new feature folders for new functionality
- **Move duplicated code to `shared/` immediately**
- **Create shared components when 2+ features need them**
- **Use shared hooks for common patterns**

### DON'T ❌
- Import internal feature files directly
- Put UI components in `services/`
- Create circular dependencies between features
- Put feature-specific hooks in global `hooks/`
- Mix business logic with UI components
- **Duplicate components across features**
- **Copy-paste code between features**
- **Create feature-specific versions of shared utilities**

---

## Multi-Developer Scalability Guidelines

This section ensures multiple developers can work on the codebase **independently** without conflicts.

---

### 1. Feature Ownership & CODEOWNERS

Create a `CODEOWNERS` file in the repository root:

```
# CODEOWNERS - Assign feature ownership

# Core team owns shared infrastructure
/src/shared/                    @core-team
/src/app/                       @core-team
/src/services/ai/               @ai-team

# Feature ownership (1-2 owners per feature)
/src/features/chat/             @dev-alice @dev-bob
/src/features/prompt/           @dev-charlie
/src/features/output-window/    @dev-alice
/src/features/capture/          @dev-dave
/src/features/audio/            @dev-eve
/src/features/text-selection/   @dev-charlie
/src/features/settings/         @dev-frank
/src/features/feature-flags/    @core-team
```

**Benefits:**
- Clear ownership = clear responsibility
- PRs auto-request reviewers
- Reduces conflicts and duplicate work

---

### 2. Feature Contracts & Inter-Feature Communication

**Rule:** Features should NEVER import from each other directly.

**Communication Patterns:**

```
┌─────────────┐       ┌─────────────┐
│  Feature A  │       │  Feature B  │
└──────┬──────┘       └──────┬──────┘
       │                     │
       │   ┌─────────────┐   │
       └──►│   Shared    │◄──┘
           │  (Context/  │
           │   Events)   │
           └─────────────┘
```

#### Option 1: Shared Context (Recommended)

```typescript
// shared/providers/AppStateProvider.tsx
interface AppState {
  selectedText: string | null
  activeModel: string
  isStreaming: boolean
}

export const AppStateContext = createContext<AppState>(...)
export const useAppState = () => useContext(AppStateContext)
```

```typescript
// features/text-selection/ uses it
import { useAppState } from '@/shared/providers'

// features/chat/ uses it
import { useAppState } from '@/shared/providers'
```

#### Option 2: Event Bus (For Decoupled Communication)

```typescript
// shared/lib/event-bus.ts
type EventMap = {
  'text:selected': { text: string; source: string }
  'model:changed': { modelId: string }
  'chat:message-sent': { messageId: string }
}

class EventBus {
  private listeners = new Map<string, Set<Function>>()

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) { ... }
  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) { ... }
  off<K extends keyof EventMap>(event: K, callback: Function) { ... }
}

export const eventBus = new EventBus()
```

```typescript
// features/text-selection/ emits
eventBus.emit('text:selected', { text: selectedText, source: 'popup' })

// features/prompt/ listens
eventBus.on('text:selected', ({ text }) => setPromptText(text))
```

---

### 3. Feature Independence Rules

Each feature should be **deployable independently** (when using feature flags).

| Rule | Description |
|------|-------------|
| No cross-feature imports | Feature A cannot import from Feature B |
| Self-contained state | Each feature manages its own state |
| Shared dependencies only | Only import from `shared/` or `services/` |
| Independent testing | Tests don't depend on other features |
| Graceful degradation | Feature works even if others fail |

**Dependency Flow:**

```
┌──────────────────────────────────────────────────────┐
│                        app/                          │
│                    (orchestrator)                    │
└───────────────────────┬──────────────────────────────┘
                        │ imports
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ chat/   │    │ prompt/ │    │ capture/│  ◄── features/
    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │
         └──────────────┼──────────────┘
                        │ imports
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ shared/ │    │services/│    │ shared/ │  ◄── foundation
    └─────────┘    └─────────┘    └─────────┘
```

---

### 4. Testing Strategy (Per Feature)

Each feature should have its own test folder:

```
features/chat/
├── components/
├── hooks/
├── __tests__/                    # Feature tests
│   ├── Messages.test.tsx         # Component tests
│   ├── useMessageManager.test.ts # Hook tests
│   └── integration.test.tsx      # Feature integration
├── __mocks__/                    # Feature-specific mocks
│   └── mockMessages.ts
├── types.ts
└── index.ts
```

**Test Independence:**
```typescript
// features/chat/__tests__/Messages.test.tsx

// ✅ GOOD - Mock services, don't depend on other features
vi.mock('@/services/ai', () => ({
  streamMessage: vi.fn()
}))

// ✅ GOOD - Use shared test utilities
import { render, screen } from '@/shared/test-utils'
```

**Shared Test Utilities:**
```
shared/
├── test-utils/
│   ├── render.tsx          # Custom render with providers
│   ├── mocks/              # Shared mocks
│   │   ├── mockElectron.ts
│   │   └── mockAIService.ts
│   └── index.ts
```

---

### 5. Code Splitting & Lazy Loading (Per Feature)

Each feature should be lazy-loadable for performance:

```typescript
// app/App.tsx
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/shared/components/common'

// Lazy load features
const Chat = lazy(() => import('@/features/chat'))
const Settings = lazy(() => import('@/features/settings'))
const Capture = lazy(() => import('@/features/capture'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Chat />
      <Capture />
      {showSettings && <Settings />}
    </Suspense>
  )
}
```

**Feature Default Export:**
```typescript
// features/chat/index.ts
export { ChatMessages } from './components/Messages'
export { useMessageManager } from './hooks/useMessageManager'

// Default export for lazy loading
export { ChatFeature as default } from './ChatFeature'
```

---

### 6. Error Boundaries Per Feature

Isolate failures so one feature crashing doesn't break the app:

```typescript
// shared/components/common/FeatureErrorBoundary.tsx
export function FeatureErrorBoundary({ 
  feature, 
  children,
  fallback 
}: {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <ErrorBoundary
      fallback={fallback || <FeatureError feature={feature} />}
      onError={(error) => logFeatureError(feature, error)}
    >
      {children}
    </ErrorBoundary>
  )
}
```

```typescript
// app/App.tsx
<FeatureErrorBoundary feature="chat">
  <Chat />
</FeatureErrorBoundary>

<FeatureErrorBoundary feature="capture">
  <Capture />
</FeatureErrorBoundary>
```

---

### 7. Feature Documentation Template

Each feature should have a `README.md`:

```markdown
# Chat Feature

## Overview
Handles message display, streaming responses, and conversation management.

## Public API
- `ChatMessages` - Main component
- `useMessageManager` - State hook
- `Message` type

## Dependencies
- `@/services/ai` - AI streaming
- `@/shared/components/markdown` - Message rendering

## State Management
- Local state via `useMessageManager`
- Global state via `AppStateContext`

## Events Emitted
- `chat:message-sent`
- `chat:response-complete`

## Events Listened
- `text:selected` (from text-selection)

## Testing
```bash
npm run test -- features/chat
```

## Owner
@dev-alice, @dev-bob
```

---

### 8. Branch & PR Strategy

```
main
 │
 ├── feature/chat-voice-messages      (dev-alice)
 ├── feature/prompt-templates         (dev-charlie)
 ├── feature/capture-video            (dev-dave)
 └── fix/settings-dark-mode           (dev-frank)
```

**PR Rules:**
- PRs should only touch ONE feature (except shared/)
- Changes to `shared/` require core-team review
- Feature PRs auto-assign feature owner

---

### 9. Dependency Graph Validation

Add a script to prevent circular/cross-feature imports:

```json
// package.json
{
  "scripts": {
    "lint:deps": "dependency-cruiser --validate .dependency-cruiser.js src",
    "precommit": "npm run lint:deps"
  }
}
```

```javascript
// .dependency-cruiser.js
module.exports = {
  forbidden: [
    {
      name: 'no-cross-feature-imports',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: { 
        path: '^src/features/(?!\\1)[^/]+/',
        pathNot: 'index\\.ts$'  // Allow importing from index.ts only
      }
    },
    {
      name: 'no-feature-to-feature',
      severity: 'error',
      comment: 'Features cannot import from other features',
      from: { path: '^src/features/' },
      to: { path: '^src/features/', pathNot: '^src/features/[^/]+/index\\.ts$' }
    }
  ]
}
```

---

### 10. Shared Component Versioning

For shared components, use JSDoc to track breaking changes:

```typescript
// shared/components/markdown/Markdown.tsx

/**
 * Markdown renderer component
 * 
 * @version 2.0.0
 * @since 1.0.0
 * 
 * @changelog
 * - 2.0.0: Added streaming support, changed `content` to `children`
 * - 1.1.0: Added syntax highlighting
 * - 1.0.0: Initial release
 * 
 * @example
 * <Markdown>{content}</Markdown>
 */
export function Markdown({ children, streaming }: MarkdownProps) { ... }
```

---

### Quick Reference: Multi-Dev Rules

| Rule | Enforced By |
|------|-------------|
| Feature isolation | `dependency-cruiser` lint |
| Code ownership | `CODEOWNERS` file |
| No cross-feature imports | ESLint + dependency-cruiser |
| Feature has tests | CI pipeline |
| Shared changes reviewed | CODEOWNERS auto-request |
| Documentation exists | PR template checklist |

---

### Parallel Development Workflow

```
Developer A (Chat)              Developer B (Prompt)
     │                               │
     ├─► Create branch               ├─► Create branch
     │   feature/chat-xxx            │   feature/prompt-xxx
     │                               │
     ├─► Work in features/chat/      ├─► Work in features/prompt/
     │   (no conflicts!)             │   (no conflicts!)
     │                               │
     ├─► Need shared component?      │
     │   └─► PR to shared/ first     │
     │       (core-team reviews)     │
     │                               │
     ├─► PR to main                  ├─► PR to main
     │   (auto-assigns @dev-alice)   │   (auto-assigns @dev-charlie)
     │                               │
     ▼                               ▼
   [Both merge independently]
```
