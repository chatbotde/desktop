# macOS Input Method Setup Guide

This guide will help you set up and build the macOS Input Method native module.

## Prerequisites

### 1. Xcode Command Line Tools

Install the Xcode Command Line Tools, which include the necessary compilers and build tools:

```bash
xcode-select --install
```

Verify installation:
```bash
xcode-select -p
# Should output: /Library/Developer/CommandLineTools or /Applications/Xcode.app/Contents/Developer
```

### 2. Node.js and npm

Ensure you have Node.js version 14 or later:

```bash
node --version
npm --version
```

If not installed, download from [nodejs.org](https://nodejs.org/) or use Homebrew:

```bash
brew install node
```

### 3. Python (for node-gyp)

node-gyp requires Python 3. Check if installed:

```bash
python3 --version
```

Install via Homebrew if needed:
```bash
brew install python3
```

## Installation Steps

### Step 1: Install Dependencies

Navigate to the module directory and install npm dependencies:

```bash
cd macos-input-method
npm install
```

This will install:
- `nan` (Native Abstractions for Node.js)
- `node-gyp` (build tool)

### Step 2: Build the Native Module

Build the C++/Objective-C++ code:

```bash
npm run build
```

Or manually:
```bash
node-gyp configure
node-gyp build
```

**Expected output:**
```
  CXX(target) Release/obj.target/macos_input_method/src/input_method_module.o
  CXX(target) Release/obj.target/macos_input_method/src/input_method_controller.o
  CXX(target) Release/obj.target/macos_input_method/src/text_inserter.o
  SOLINK_MODULE(target) Release/macos_input_method.node
```

The compiled binary will be at: `build/Release/macos_input_method.node`

### Step 3: Verify Build

Test that the module loads correctly:

```bash
node -e "console.log(require('./index').version)"
```

Should output the version number without errors.

## Troubleshooting Build Issues

### Error: "xcrun: error: invalid active developer path"

**Solution:** Install or reset Xcode Command Line Tools:
```bash
xcode-select --install
# Or reset the path:
sudo xcode-select --reset
```

### Error: "node-gyp not found"

**Solution:** Install node-gyp globally:
```bash
npm install -g node-gyp
```

### Error: "Python not found"

**Solution:** Configure node-gyp to use Python 3:
```bash
npm config set python python3
```

Or specify during build:
```bash
node-gyp configure --python=/usr/bin/python3
node-gyp build
```

### Error: "Framework not found"

**Solution:** Ensure you're on macOS and have the required frameworks. Check your macOS version:
```bash
sw_vers
```

Requires macOS 10.13 (High Sierra) or later.

### Error: "NAN headers not found"

**Solution:** Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

### Build succeeds but module crashes

**Solution:** Rebuild with debug symbols:
```bash
node-gyp rebuild --debug
```

Check Console.app for crash logs.

## Granting Accessibility Permissions

The module requires accessibility permissions to function.

### macOS 10.14 (Mojave) and earlier:

1. Open **System Preferences**
2. Go to **Security & Privacy** → **Privacy** → **Accessibility**
3. Click the lock icon and enter your password
4. Click the **+** button
5. Add your application (Terminal, Electron app, etc.)
6. Enable the checkbox

### macOS 10.15 (Catalina) and later:

The system will automatically prompt for permissions when you first use the module. You can also:

1. Open **System Preferences**
2. Go to **Security & Privacy** → **Privacy** → **Accessibility**
3. Look for your application in the list
4. Enable if disabled

### Checking Permissions Programmatically

```javascript
const { MacOSInputMethod } = require('./index');
const inputMethod = new MacOSInputMethod();

// This will prompt if permissions not granted
const hasPermission = inputMethod.controller.checkAccessibilityPermissions();
console.log('Has permissions:', hasPermission);
```

## Testing the Module

### Quick Test

```bash
node examples/basic-usage.js
```

This will run through various features and test functionality.

### Manual Test

Create a test file:

```javascript
// test.js
const { MacOSInputMethod } = require('./index');

const im = new MacOSInputMethod();
console.log('Active app:', im.getActiveApplication());
console.log('Text input active:', im.isTextInputActive());

// Click on a text field and run:
setTimeout(() => {
    im.insertText('Test successful!');
}, 3000);
```

Run it:
```bash
node test.js
```

## Electron Integration Setup

### Step 1: Install in Electron Project

If using in an Electron project, you may need to rebuild for Electron:

```bash
npm install --save-dev electron-rebuild

# After installing the module:
npx electron-rebuild
```

Or use electron-builder:

```bash
npm install --save-dev electron-builder
```

Add to package.json:
```json
{
  "build": {
    "appId": "com.yourapp.id",
    "mac": {
      "hardenedRuntime": true,
      "entitlements": "entitlements.mac.plist"
    }
  }
}
```

### Step 2: Entitlements for macOS

Create `entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
</dict>
</plist>
```

### Step 3: Use in Electron

See `examples/electron-integration.js` for complete example.

## Clean Rebuild

If you encounter issues, try a clean rebuild:

```bash
# Clean all build artifacts
npm run clean

# Or manually:
node-gyp clean
rm -rf build/

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Architecture Notes

### Build Configuration

The `binding.gyp` file configures:
- **Target**: `macos_input_method`
- **Sources**: `.mm` files (Objective-C++)
- **Includes**: NAN headers
- **Frameworks**: Cocoa, Carbon, InputMethodKit
- **C++ Standard**: C++17
- **Deployment Target**: macOS 10.13+

### File Extensions

- `.mm` - Objective-C++ (allows mixing C++ and Objective-C)
- `.h` - C/C++ headers
- `.js` - JavaScript API

## Development Workflow

### 1. Make Changes to C++ Code

Edit files in `src/`:
- `input_method_module.mm`
- `input_method_controller.mm`
- `text_inserter.mm`

### 2. Rebuild

```bash
npm run build
```

### 3. Test Changes

```bash
node examples/basic-usage.js
```

### 4. Debug

For debugging with lldb:

```bash
# Build with debug symbols
node-gyp rebuild --debug

# Run with lldb
lldb node
(lldb) run examples/basic-usage.js
```

## Performance Optimization

### Release vs Debug Builds

- **Debug**: `node-gyp rebuild --debug`
  - Includes symbols, no optimization
  - Larger binary size
  - Slower execution

- **Release**: `node-gyp rebuild` (default)
  - Optimized, no debug symbols
  - Smaller binary size
  - Faster execution

### Build Configuration

For production, ensure you're using release builds:
```bash
node-gyp rebuild --release
```

## Deployment

### Packaging for Distribution

When distributing your application:

1. **Include the compiled binary**: `build/Release/macos_input_method.node`
2. **Include package.json** and **index.js**
3. **DO NOT include**: `src/`, `node_modules/`, `build/` intermediate files

### Electron Builder

If using electron-builder, it will automatically package the native module.

Add to package.json:
```json
{
  "build": {
    "files": [
      "build/Release/*.node",
      "index.js",
      "package.json"
    ]
  }
}
```

## Version Compatibility

### macOS Versions
- ✅ macOS 14 Sonoma
- ✅ macOS 13 Ventura
- ✅ macOS 12 Monterey
- ✅ macOS 11 Big Sur
- ✅ macOS 10.15 Catalina
- ✅ macOS 10.14 Mojave
- ✅ macOS 10.13 High Sierra

### Node.js Versions
- ✅ Node.js 20.x
- ✅ Node.js 18.x (LTS)
- ✅ Node.js 16.x
- ✅ Node.js 14.x

### Electron Versions
- ✅ Electron 28.x
- ✅ Electron 27.x
- ✅ Electron 26.x
- ✅ Earlier versions (may require electron-rebuild)

## Support and Resources

- **Apple Documentation**: [Input Method Kit](https://developer.apple.com/documentation/inputmethodkit)
- **Accessibility API**: [Accessibility Programming Guide](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/)
- **NAN Documentation**: [github.com/nodejs/nan](https://github.com/nodejs/nan)
- **node-gyp**: [github.com/nodejs/node-gyp](https://github.com/nodejs/node-gyp)

## Next Steps

1. ✅ Build the module successfully
2. ✅ Grant accessibility permissions
3. ✅ Run example scripts
4. ✅ Integrate into your application
5. 📚 Read the API documentation in README.md
6. 🚀 Build amazing text input features!

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.
