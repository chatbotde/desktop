# Quick Setup Guide

## Prerequisites

1. **Install Visual Studio Build Tools**
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Install "Desktop development with C++" workload
   - OR run: `npm install --global windows-build-tools` (requires admin)

2. **Install Python** (for node-gyp)
   - Download from: https://www.python.org/downloads/
   - OR run: `choco install python` (if you have Chocolatey)

## Installation Steps

1. Navigate to the tsf-framework directory:
   ```powershell
   cd buddy\interface-window\os-system\tsf-framwork
   ```

2. Install dependencies and build:
   ```powershell
   npm install
   ```

   This will automatically:
   - Install node-addon-api
   - Install node-gyp
   - Build the native C++ module

3. Verify the build:
   ```powershell
   npm test
   ```

## Troubleshooting

### Build Fails with "MSBuild not found"

Install Visual Studio Build Tools or Visual Studio 2019/2022 with C++ workload.

### Build Fails with "Python not found"

Install Python 3.x and ensure it's in your PATH.

### Module Not Loading

Check that the build succeeded:
```powershell
dir build\Release\tsf_native.node
```

If the file exists, the build succeeded.

### Still Having Issues?

Try a clean rebuild:
```powershell
npm run clean
npm run build
```

Or build in debug mode for more information:
```powershell
npm run build:debug
```

## Integration with Your Electron App

1. In your main process (main.js or similar):
   ```javascript
   const tsf = require('./interface-window/os-system/tsf-framwork');
   
   app.whenReady().then(async () => {
       await tsf.initialize();
       // ... your app code
   });
   ```

2. Set up IPC handlers (see examples/electron-integration.js)

3. In your preload script (see examples/preload.js)

4. In your renderer (see examples/renderer-usage.js)

## Usage Example

```javascript
const tsf = require('./tsf-framwork');

// Initialize
await tsf.initialize();

// Insert text into focused app
await tsf.insertText('Hello World!');

// Get focus info
const info = await tsf.getFocusInfo();
console.log('Focused:', info.processName);

// Cleanup
await tsf.cleanup();
```

## Next Steps

1. Build the module: `npm install`
2. Run tests: `npm test`
3. Integrate into your Electron app
4. Test with different applications (Chrome, Notepad, VS Code, etc.)
