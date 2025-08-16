# Chat Input Window Guide

## Overview

The Chat Input Window is a floating, always-on-top input field that allows you to send messages to the main Buddy chat interface from anywhere on your screen.

## Features

### Design
- **Rounded Corners**: Modern glassmorphism design with 25px border-radius
- **Transparent Background**: Semi-transparent black with blur effects
- **Always On Top**: Stays above all other windows
- **Auto-positioning**: Appears at bottom center of screen
- **Responsive**: Auto-resizes as you type (up to 100px height)

### Functionality
- **Message Integration**: Messages appear instantly in main window chat
- **Keyboard Shortcuts**: 
  - `Enter` to send message
  - `Shift + Enter` for new line
  - Auto-focus on any keypress
- **Visual Feedback**: Typing indicator and smooth animations
- **Auto-clear**: Input clears after sending message

## How to Use

### Opening the Chat Input Window

1. **From Launch Window**: Click the launch window to open main window (chat input opens automatically)
2. **From Main Window**: Click the chat input toggle button (💬) in the title bar
3. **Programmatically**: Send `toggle-chat-input` IPC event

### Sending Messages

1. **Type your message** in the floating input field
2. **Press Enter** to send (or click the send button)
3. **Message appears** in the main window chat interface
4. **Input clears** automatically and refocuses

### Window Controls

- **Show/Hide**: Toggle visibility using the main window button
- **Auto-focus**: Window automatically focuses when you start typing
- **Always on top**: Stays visible above other applications

## Integration

### IPC Communication

The chat input window communicates with the main window via Electron IPC:

```javascript
// Sending message from chat input
ipcRenderer.send('send-chat-message', {
  content: 'Hello world!',
  timestamp: new Date().toISOString(),
  id: Date.now().toString()
});

// Receiving in main window
ipcRenderer.on('receive-chat-message', (event, messageData) => {
  // Add message to chat interface
});
```

### Message Format

Messages sent from the chat input window include:
- `content`: The message text
- `timestamp`: ISO timestamp when sent
- `id`: Unique identifier for the message

## Styling

The window uses a modern glassmorphism design:

```css
.chat-input-wrapper {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

## Keyboard Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line
- `Any key`: Auto-focus input (when window is visible)
- `Escape`: (Future) Hide window

## Tips

1. **Quick Access**: The chat input window is designed for quick message sending without switching to the main window
2. **Multi-line Messages**: Use Shift+Enter to create multi-line messages
3. **Auto-focus**: Just start typing when the window is visible - no need to click first
4. **Visual Feedback**: Watch for the typing indicator when sending messages

## Troubleshooting

### Window Not Appearing
- Check if main window is open first
- Try toggling the chat input button in main window
- Restart the application

### Messages Not Appearing in Main Window
- Ensure main window is open
- Check console for IPC communication errors
- Verify the main window is properly receiving messages

### Styling Issues
- Ensure your system supports backdrop-filter CSS property
- Check if transparency is enabled in your OS settings