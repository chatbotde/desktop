# Chat Input Window

A floating chat input window component for the Buddy desktop app.

## Features

- **Floating Window**: Always-on-top chat input that appears at the bottom center of the screen
- **Rounded Corners**: Modern glassmorphism design with rounded corners and blur effects
- **Auto-resize**: Input field automatically expands as you type (up to 100px height)
- **Message Integration**: Messages sent from this window appear in the main window's chat interface
- **Keyboard Shortcuts**: 
  - Enter to send message
  - Shift+Enter for new line
  - Auto-focus on any keypress
- **Visual Feedback**: Typing indicator and smooth animations

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

The window features a modern glassmorphism design:
- Semi-transparent black background with blur effect
- Rounded corners (25px border-radius)
- Smooth hover and focus transitions
- Blue accent color for send button
- Responsive design that adapts to content

### IPC Events

**Outgoing (from chat input window):**
- `send-chat-message`: Sends message data to main process

**Incoming (to chat input window):**
- `clear-input`: Clears the input field
- `focus-input`: Focuses the input field

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