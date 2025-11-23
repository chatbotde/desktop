# macOS Input Method Framework

A native Node.js/Electron module for macOS that provides programmatic access to the Input Method framework, enabling text insertion, manipulation, and monitoring across all applications.

## Features

- ✅ **Text Insertion**: Insert text at cursor position in any application
- ✅ **Typing Simulation**: Insert text with realistic typing effect
- ✅ **Text Selection**: Get and replace selected text
- ✅ **Application Info**: Get active application details
- ✅ **Cursor Position**: Retrieve cursor coordinates
- ✅ **Keyboard Shortcuts**: Send keyboard shortcuts programmatically
- ✅ **Event Monitoring**: Monitor keyboard events system-wide
- ✅ **Accessibility API**: Full integration with macOS Accessibility APIs

## Platform Support

- **macOS Only**: This module requires macOS 10.13 (High Sierra) or later
- **Frameworks Used**: Cocoa, Carbon, InputMethodKit, Accessibility APIs

## Installation

```bash
npm install
npm run build
```

### Prerequisites

1. **Xcode Command Line Tools**:
```bash
xcode-select --install
```

2. **Node.js**: Version 14 or later
3. **node-gyp**: Install globally if needed
```bash
npm install -g node-gyp
```

## Accessibility Permissions

⚠️ **Important**: This module requires accessibility permissions to function properly.

### Granting Permissions

1. Go to **System Preferences** → **Security & Privacy** → **Privacy** → **Accessibility**
2. Click the lock icon to make changes
3. Add your application (Terminal, Electron app, etc.)
4. Enable the checkbox

The module will prompt for permissions automatically on first use.

## Usage

### Basic Example

```javascript
const { MacOSInputMethod } = require('macos-input-method');

// Create instance
const inputMethod = new MacOSInputMethod();

// Insert text
inputMethod.insertText('Hello, macOS!');

// Insert text with typing effect
await inputMethod.insertTextWithTyping('Typing simulation...', 50);

// Get selected text
const selected = inputMethod.getSelectedText();
console.log('Selected:', selected);

// Replace selected text
inputMethod.replaceSelectedText('NEW TEXT');

// Get active application
const appInfo = inputMethod.getActiveApplication();
console.log('Active App:', appInfo.name);

// Check if text input is active
const isActive = inputMethod.isTextInputActive();

// Get cursor position
const position = inputMethod.getCursorPosition();
console.log('Cursor at:', position);

// Send keyboard shortcut (Cmd+S)
inputMethod.sendKeyboardShortcut('s', { command: true });
```

### Electron Integration

See `examples/electron-integration.js` for a complete Electron example.

**Main Process:**
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const { MacOSInputMethod } = require('macos-input-method');

const inputMethod = new MacOSInputMethod();

ipcMain.handle('insert-text', async (event, text) => {
    return inputMethod.insertText(text);
});
```

**Preload Script:**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inputMethod', {
    insertText: (text) => ipcRenderer.invoke('insert-text', text)
});
```

**Renderer Process:**
```javascript
// Insert text from renderer
await window.inputMethod.insertText('Hello!');
```

## API Reference

### Class: MacOSInputMethod

#### `insertText(text: string): boolean`
Inserts text at the current cursor position.

**Parameters:**
- `text` - Text to insert

**Returns:** Success status

#### `insertTextWithTyping(text: string, delayMs: number): Promise<boolean>`
Inserts text with typing effect (delay between characters).

**Parameters:**
- `text` - Text to insert
- `delayMs` - Delay between characters in milliseconds

**Returns:** Promise resolving to success status

#### `getSelectedText(): string`
Gets the currently selected text in the active application.

**Returns:** Selected text (or empty string)

#### `replaceSelectedText(text: string): boolean`
Replaces the selected text with new text.

**Parameters:**
- `text` - New text

**Returns:** Success status

#### `getActiveApplication(): Object`
Gets information about the active application.

**Returns:** Object with `{ name, bundleId, pid }`

#### `isTextInputActive(): boolean`
Checks if text input is available in the focused element.

**Returns:** Boolean indicating text input availability

#### `sendKeyboardShortcut(key: string, modifiers: Object): boolean`
Simulates a keyboard shortcut.

**Parameters:**
- `key` - Key character or key name
- `modifiers` - Object with `{ command, shift, option, control }` flags

**Returns:** Success status

**Example:**
```javascript
// Cmd+S
inputMethod.sendKeyboardShortcut('s', { command: true });

// Cmd+Shift+P
inputMethod.sendKeyboardShortcut('p', { command: true, shift: true });
```

#### `getCursorPosition(): Object|null`
Gets the cursor position in the current text field.

**Returns:** Object with `{ x, y }` or `null` if not available

#### `startMonitoring(callback: Function): void`
Starts monitoring text input events system-wide.

**Parameters:**
- `callback` - Function called with event data

**Event Data:**
```javascript
{
    type: 'keyDown',
    characters: 'a',
    keyCode: 0,
    modifiers: {
        command: false,
        shift: false,
        option: false,
        control: false
    }
}
```

#### `stopMonitoring(): void`
Stops monitoring text input events.

## Examples

### 1. Auto-Complete Feature

```javascript
const inputMethod = new MacOSInputMethod();

// Watch for trigger pattern
inputMethod.startMonitoring((event) => {
    if (event.characters === '@') {
        // Get text before cursor and show suggestions
        setTimeout(() => {
            inputMethod.insertText('username');
        }, 100);
    }
});
```

### 2. Text Expansion

```javascript
const expansions = {
    'brb': 'be right back',
    'omw': 'on my way',
    'thx': 'thank you'
};

inputMethod.startMonitoring((event) => {
    if (event.characters === ' ') {
        const word = getLastWord(); // Your implementation
        if (expansions[word]) {
            deleteLastWord(); // Your implementation
            inputMethod.insertText(expansions[word]);
        }
    }
});
```

### 3. Multi-Language Input

```javascript
// Insert text in different languages
inputMethod.insertText('Hello');      // English
inputMethod.insertText('你好');       // Chinese
inputMethod.insertText('こんにちは');  // Japanese
inputMethod.insertText('مرحبا');      // Arabic
```

### 4. Clipboard Integration

```javascript
// Save selected text to clipboard
const selected = inputMethod.getSelectedText();
if (selected) {
    // Process and modify
    const modified = selected.toUpperCase();
    
    // Replace with modified version
    inputMethod.replaceSelectedText(modified);
}
```

## Architecture

### Components

1. **Objective-C++ Bridge** (`input_method_controller.mm`)
   - Interfaces with macOS frameworks
   - Handles Accessibility API calls
   - Manages event monitoring

2. **Text Inserter** (`text_inserter.mm`)
   - Handles text insertion methods
   - Cursor position tracking
   - Permission checking

3. **Node.js Module** (`input_method_module.mm`)
   - N-API/NAN wrapper
   - JavaScript ↔ Native bridge
   - Memory management

4. **JavaScript API** (`index.js`)
   - High-level API
   - Promise wrappers
   - Error handling

### Data Flow

```
JavaScript API
     ↓
Node.js Binding (NAN)
     ↓
Objective-C++ Bridge
     ↓
macOS Frameworks (Cocoa/Carbon/InputMethodKit)
     ↓
System-wide Text Input
```

## Troubleshooting

### Module Won't Load

**Error:** `Cannot find module './build/Release/macos_input_method.node'`

**Solution:** Build the native module:
```bash
npm run build
```

### No Permissions

**Error:** Text insertion doesn't work

**Solution:** Grant accessibility permissions:
1. System Preferences → Security & Privacy → Privacy → Accessibility
2. Add and enable your application

### Build Errors

**Error:** `xcrun: error: invalid active developer path`

**Solution:** Install Xcode Command Line Tools:
```bash
xcode-select --install
```

### Module Crashes

- Check macOS version (10.13+)
- Verify all dependencies are installed
- Check Console.app for crash logs
- Rebuild with debug symbols: `npm run build -- --debug`

## Development

### Building

```bash
# Clean build
npm run clean
npm run build

# Debug build
node-gyp rebuild --debug
```

### Testing

```bash
npm test
```

### Project Structure

```
macos-input-method/
├── binding.gyp              # Build configuration
├── index.js                 # JavaScript API
├── package.json
├── src/
│   ├── input_method_module.mm      # Node module entry
│   ├── input_method_controller.mm  # Main controller
│   ├── input_method_controller.h
│   ├── text_inserter.mm            # Text insertion logic
│   └── text_inserter.h
├── examples/
│   ├── basic-usage.js              # Basic example
│   ├── electron-integration.js     # Electron main process
│   ├── preload.js                  # Electron preload
│   └── renderer.html               # Electron UI
└── build/
    └── Release/
        └── macos_input_method.node  # Compiled binary
```

## Performance Considerations

- **Text Insertion**: ~1-5ms per operation
- **Event Monitoring**: Minimal overhead (<1% CPU)
- **Memory Usage**: ~2-5MB base footprint
- **Typing Simulation**: Configurable delay (recommended: 50-100ms)

## Security

- ✅ Requires explicit user permission (Accessibility)
- ✅ Does not capture passwords (respects secure text fields)
- ✅ Local-only operation (no network access)
- ⚠️ Can access text across all applications (use responsibly)

## Limitations

- macOS only (Windows/Linux not supported)
- Requires Accessibility permissions
- Some applications may block programmatic input
- Secure text fields (passwords) are protected

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Test on multiple macOS versions
4. Submit a pull request

## License

MIT

## Credits

Built with:
- [NAN](https://github.com/nodejs/nan) - Native Abstractions for Node.js
- macOS Cocoa Framework
- macOS Carbon Framework
- macOS InputMethodKit Framework

## Support

For issues and questions:
- Check the troubleshooting section
- Review examples
- Open an issue on GitHub

---

**Note**: This module provides powerful system-wide text manipulation capabilities. Use responsibly and respect user privacy.
