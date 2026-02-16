# SOLID Principles Analysis - Frontend

This document analyzes files in the frontend that violate SOLID principles and provides recommendations for refactoring.

## 1. `src/app/App.tsx` - Violation of SRP & OCP

The `App.tsx` file is a classic example of a **"God Component"**. It orchestrates the entire application but also handles way too many specific responsibilities.

### Violations:
- **Single Responsibility Principle (SRP)**:
    - Manages global UI state (visibility of various windows).
    - Handles chat history initialization and autosaving logic.
    - Orchestrates multiple complex features like auto-screenshots, auto-insert, and global window APIs.
    - Contains logic for image generation model detection to decide which UI to show.
    - Directly renders over 10 different high-level sections and overlays.
- **Open/Closed Principle (OCP)**:
    - To add a new feature or overlay to the app, you must modify `App.tsx`. There is no plugin or registry system for features.
- **Dependency Inversion Principle (DIP)**:
    - It depends on a multitude of concrete hooks (`useAutoScreenshot`, `useAutoInsert`, `useMessageManager`, etc.) and components directly.

### Refactoring Recommendation:
- **Feature Registry**: Implement a registry where features can "register" themselves to be rendered or handled.
- **Service Layer**: Move orchestration logic (like autosave and API setup) into dedicated service providers or specialized hooks.
- **Composition**: Use a specialized `Layout` component and sub-route/module components to break down the massive JSX return.

---

## 2. `src/components/clipboard.tsx` - Violation of SRP & ISP

The `ClipboardPill` component handles everything related to clipboard monitoring and display.

### Violations:
- **Single Responsibility Principle (SRP)**:
    - **Logic**: It contains low-level clipboard reading logic for both Web and Electron APIs, including buffer conversion and base64 encoding.
    - **Monitoring**: It handles polling logic with `setInterval` to detect changes.
    - **State**: It manages module-level global state to persist data across remounts.
    - **UI**: It handles the rendering and animations of the pill itself.
- **Interface Segregation Principle (ISP)**:
    - The `ClipboardContent` type is a "fat" object containing text, html, rtf, imageDataUrl, and bookmarks, forcing consumers to handle all these possibilities even if they only care about one.

### Refactoring Recommendation:
- **Hooks & Services**: Move the clipboard polling and format detection into a specialized `useClipboard` hook or a `ClipboardService`.
- **Adapters**: Create an adapter for Electron vs Web clipboard APIs to hide the implementation details.
- **Pure Component**: Make `ClipboardPill` a pure UI component that only receives the current clipboard state as props.

---

## 3. `src/features/chat/hooks/useMessageManager.ts` - Violation of SRP

This hook is responsible for managing the logic of sending and receiving messages.

### Violations:
- **Single Responsibility Principle (SRP)**:
    - It manages the state of messages.
    - It contains conditional logic for **Image Generation** vs **Text Generation**.
    - It handles both **Local LLM (Ollama)** and **Cloud AI** services.
    - It manages request abortion and streaming logic.

### Refactoring Recommendation:
- **Strategy Pattern**: Use a strategy pattern to handle different types of generation (Image, Text, Local, Cloud) so the hook doesn't need to know the details of each.
- **State vs Logic**: Separate the message list state management from the AI communication logic.

---

## Summary Table

| File | Primary Violation | Impact |
| :--- | :--- | :--- |
| `App.tsx` | SRP, OCP, DIP | High complexity, hard to add new features without breaking existing ones. |
| `clipboard.tsx` | SRP | Difficult to test logic in isolation; coupled to specific APIs. |
| `useMessageManager.ts` | SRP | High cognitive load to understand message flow; coupled to specific AI providers. |

---

## 4. Other Large Files (Potential SRP Violators)

The following files are significantly larger than the project average (over 10KB), suggesting they may be handling too many responsibilities:

### Highly Complex Hooks
- `src/hooks/useVideoRecording.ts` (~20 KB)
- `src/hooks/useGeminiLiveAudioStream.ts` (~18 KB)
- `src/hooks/useChatHistory.ts` (~12 KB)
- `src/hooks/useChatManager.ts` (~11 KB)
- `src/features/audio/hooks/useAudioRecorder.ts` (~11 KB)
- `src/lib/ai/usage-tracker.ts` (~9 KB)

### Complex UI Components
- `src/features/output-window/components/TextSelectionActions.tsx` (~12 KB)
- `src/features/prompt/components/ModelSelectorPopover.tsx` (~12 KB)
- `src/features/prompt/components/ModelSelector.tsx` (~11 KB)
- `src/components/video-generation-window.tsx` (~12 KB)
- `src/components/image-generation-window.tsx` (~10 KB)
- `src/components/SystemPromptSelector.tsx` (~10 KB)
- `src/features/output-window/components/AssistantMessageBubble.tsx` (~10 KB)
- `src/components/output-messages.tsx` (~9 KB)


---

## 5. Recently Identified Violators

### `src/features/settings/sections/IntegrationsSection.tsx` - Violation of SRP & OCP
**Issue**: This file is 36KB and handles everything related to external integrations.
- **SRP Violation**: It manages UI for cards/dialogs, local storage persistence, and the complex OAuth protocol logic (token exchange, popup management, state verification).
- **OCP Violation**: To add a new integration (e.g., Slack or GitHub), you must modify this single file and add more conditional logic and UI, rather than having a plugin-based system.
- **Refactoring**: Split into a `useNotionOAuth` hook, separate UI files for each dialogue, and an `IntegrationService` for external calls.

### `src/features/settings/sections/CustomModelsSection.tsx` - Violation of SRP
**Issue**: A 21KB file managing custom AI model configurations.
- **SRP Violation**: Combines UI for model lists, complex validation logic for model parameters, and persistence logic for custom model profiles.
- **Refactoring**: Extract validation logic into a schema/utility and move state management to a specialized hook.

### `src/icons/icons.tsx` - Violation of ISP (Interface Segregation)
**Issue**: A massive 62KB file containing almost all app icons.
- **ISP Violation**: Any component needing a single icon from this file is effectively dependent on a module containing hundreds of unrelated SVG paths.
- **OCP Violation**: Adding one new icon requires modifying this huge central file.
- **Refactoring**: Split into categorized files (e.g., `brand-icons.tsx`, `ui-icons.tsx`, `feature-icons.tsx`).

### `src/lib/ai/ai-sdk/unified-service.ts` - Violation of SRP & DIP
**Issue**: A 21KB core orchestration class for AI interactions.
- **SRP Violation**: It manages chat history, media conversion (blob to base64), validation wrapping, usage tracking orchestration, and multiple generation types (text, image, video).
- **DIP Violation**: It is tightly coupled to specific third-party generator functions (Replicate) instead of using a generic `MediaGenerator` interface.
- **OCP Violation**: Adding a new generation capability (e.g., Music or 3D) requires modifying this central service.
- **Refactoring**: Split into a `ChatHistoryService`, a `MediaConversionProvider`, and use a **Strategy Pattern** for different generation engines.

---

## 6. Summary of Critical Refactoring Targets

| Priority | File | Main Issue | Refactoring Strategy |
| :--- | :--- | :--- | :--- |
| **P0** | `App.tsx` | God Component | Layout Composition + Feature Registry |
| **P0** | `unified-service.ts` | God Service | Strategy Pattern + Service Extraction |
| **P1** | `IntegrationsSection.tsx` | UI/Logic Bloat | Hook Extraction + Adapter Pattern |
| **P1** | `icons.tsx` | ISP Violation | File Categorization |
| **P2** | `clipboard.tsx` | SRP Violation | Hook Extraction (Logic vs UI) |



