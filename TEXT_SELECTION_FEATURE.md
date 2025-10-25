# Text Selection Feature Documentation

## Overview
The text selection feature allows users to select text in any application and have it appear in the Buddy chat input as a prompt option. This feature enhances productivity by enabling quick capture of relevant text for AI processing.

## Architecture

### Components
1. **Text Selection Monitor** ([text-selection-monitor.js](file:///c:/Users/yadav/OneDrive/Desktop/sonicplane/buddy/chat-input/electron-api/text-selection/text-selection-monitor.js))
   - Uses the `selection-hook` library to monitor system-wide text selection
   - Runs in the main process
   - Debounces rapid selection changes

2. **IPC Communication**
   - Main process → Renderer process communication via Electron IPC
   - Events: `text-selection-changed`, `add-text-to-input`

3. **Renderer Integration** ([text-selection.js](file:///c:/Users/yadav/OneDrive/Desktop/sonicplane/buddy/chat-input/modules/text-selection.js))
   - Handles incoming text selection events
   - Integrates with clipboard UI system

4. **UI Presentation** ([clipboard-ui.js](file:///c:/Users/yadav/OneDrive/Desktop/sonicplane/buddy/chat-input/modules/clipboard-ui.js))
   - Displays text selection in the same prompt bar as clipboard content
   - Different visual treatment for text selection vs clipboard

## Implementation Details

### Event Flow
1. User selects text in any application
2. `selection-hook` detects the selection change
3. Text Selection Monitor processes the selection
4. Main process sends selection to renderer via IPC
5. Renderer dispatches `clipboard:detected` event
6. Clipboard UI displays prompt bar with text selection
7. User can choose to add text to chat input

### Data Structure
```javascript
// Selection data sent from main to renderer
{
  text: "Selected text content",
  source: "application name or window title",
  timestamp: 1234567890
}

// Signature for deduplication
{
  t: "text-selection",
  c: "first 1024 characters of text",
  timestamp: 1234567890
}
```

## Testing

### Manual Testing
1. Run the application
2. Select text in any other application (browser, text editor, etc.)
3. Observe the prompt bar appearing above the chat input
4. Click "Add" to insert the text into the chat input

### Automated Testing
- Use `npm run test-text-selection` to run the test script
- Use `npm run debug-text-selection-monitor` to debug the monitor directly

## Configuration

### Adjustable Parameters
- Debounce delay (default: 300ms)
- Maximum text length for preview (default: 200 characters)
- Duplicate detection via signature comparison

## Troubleshooting

### Common Issues
1. **Text selection not detected**
   - Ensure `selection-hook` is properly installed
   - Check if the application has necessary permissions
   - Verify text selection monitoring is active

2. **Prompt bar not appearing**
   - Check if chat input window is visible
   - Verify IPC communication is working
   - Check browser console for errors

### Debugging Commands
```bash
# Run text selection monitor debug script
npm run debug-text-selection-monitor

# Run test application with selectable text
npm run test-text-selection
```

## Future Improvements
1. Add keyboard shortcut for quick text addition
2. Implement smart filtering to ignore irrelevant selections
3. Add option for automatic text addition without prompt
4. Enhance source identification for better context