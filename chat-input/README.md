# Chat Input Window

A modern, flexible floating chat input window component for the Buddy desktop app with an enhanced prompt-style interface.

## Features

- **Modern Prompt Interface**: React-inspired design with action buttons and flexible layout
- **Dynamic Window Resizing**: Window automatically adjusts height based on content expansion
- **Enhanced Action Bar**: Multiple action buttons including add, search, voice, and more actions
- **Flexible Input Area**: Auto-expanding textarea with smooth animations (up to 200px height)
- **Loading States**: Visual feedback with loading spinner and disabled states
- **Voice Recording**: Visual feedback for voice input with pulse animation
- **Message Integration**: Messages sent from this window appear in the main window's chat interface
- **Keyboard Shortcuts**: 
  - Enter to send message
  - Shift+Enter for new line
  - Escape to blur input
  - Auto-focus on any keypress
- **Responsive Design**: Adapts to different screen sizes with mobile-friendly layout
- **Accessibility**: Full ARIA support and keyboard navigation

## Usage

### Creating the Chat Input Window

```javascript
const { ChatInputWindow } = require('./chat-input/chat-input-window');

const chatInputWindow = new ChatInputWindow();
const window = chatInputWindow.createChatInputWindow();

// Set reference to main window for message forwarding
chatInputWindow.setMainWindow(mainWindow);
```

### Window Controls

```javascript
// Show the chat input window
chatInputWindow.show();

// Hide the chat input window
chatInputWindow.hide();

// Toggle visibility
chatInputWindow.toggle();

// Destroy the window
chatInputWindow.destroy();
```

### Integration with Main Window

The chat input window automatically forwards messages to the main window via IPC:

1. User types message in chat input window
2. Message is sent via `send-chat-message` IPC event
3. Main window receives message via `receive-chat-message` IPC event
4. Message appears in main window's chat interface

### Styling

The window features a modern prompt-style design:
- Clean, rounded interface with subtle shadows
- Dynamic height adjustment based on content
- Smooth animations and transitions
- Action buttons with hover states and visual feedback
- Blue accent color for primary actions
- Loading states with spinner animations
- Responsive design that adapts to content and screen size

### IPC Events

**Outgoing (from chat input window):**
- `send-chat-message`: Sends message data to main process
- `chat-input-resize-height`: Requests window height adjustment

**Incoming (to chat input window):**
- `clear-input`: Clears the input field
- `focus-input`: Focuses the input field

### Action Buttons

The current interface includes these active buttons:

- **Add Button**: For attachments and file uploads (extensible)
- **Lighting Button**: Toggles transparency/diamond lighting effect
- **Send Button**: Primary action with loading states

### Future Buttons (Commented Out)

These buttons are prepared for future implementation:
- **Search Button**: For web search functionality 
- **Voice Button**: For voice input with recording feedback
- **More Actions**: For additional features and settings

All action buttons are designed to be easily extensible for future features.

## File Structure

```
chat-input/
├── chat-input-window.js    # Window manager class
├── chat-input.html         # HTML interface
└── README.md              # This file
```

## Dependencies

- Electron BrowserWindow
- Node.js IPC (Inter-Process Communication)
- CSS backdrop-filter for blur effects