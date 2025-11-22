# Building and Distributing Buddy with Electron Builder

## Overview

This project uses **Electron Builder** for packaging and distribution. Electron Builder provides a complete solution for building, packaging, and publishing Electron apps.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- For Windows builds: Windows 7+ (64-bit)
- For macOS builds: macOS 10.13+ 
- For Linux builds: Ubuntu, Fedora, or compatible distribution

## Available Commands

### Development
```bash
npm start              # Start the app in production mode
npm run dev            # Start the app in development mode with hot reload
```

### Building

```bash
npm run build          # Build the frontend only
npm run build:all      # Build frontend and prepare for distribution
```

### Distribution

```bash
npm run dist           # Build for the current platform
npm run dist:win       # Build for Windows (NSIS installer + portable)
npm run dist:mac       # Build for macOS (DMG + ZIP)
npm run dist:linux     # Build for Linux (AppImage + deb + rpm)
npm run dist:all       # Build for all platforms (Windows, macOS, Linux)
npm run pack           # Package without installer (faster for testing)
```

## Output

Built distributions will be placed in the `dist/` directory:

### Windows
- `Buddy-1.0.0-win-x64.exe` - NSIS installer
- `Buddy-1.0.0-portable.exe` - Portable executable

### macOS
- `Buddy-1.0.0-mac.dmg` - DMG installer
- `Buddy-1.0.0-mac.zip` - ZIP archive

### Linux
- `Buddy-1.0.0.AppImage` - AppImage (universal)
- `buddy_1.0.0_amd64.deb` - Debian/Ubuntu package
- `buddy-1.0.0.x86_64.rpm` - Fedora/RHEL package

## Configuration

The build configuration is stored in `electron-builder.json`. Key settings:

- **appId**: `com.sonicthinking.buddy`
- **productName**: `Buddy`
- **Icon**: Platform-specific icons from the `icons/` folder
- **ASAR**: Enabled with selective unpacking for native modules

### Native Modules

Native modules (ffi-napi, selection-hook, etc.) are automatically unpacked from ASAR to ensure they work correctly in the packaged app.

## Code Signing

### Windows
To sign Windows builds, set environment variables:
```powershell
$env:CSC_LINK="path/to/certificate.pfx"
$env:CSC_KEY_PASSWORD="your_password"
```

### macOS
To sign and notarize macOS builds:
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
export APPLE_ID=your@apple.id
export APPLE_APP_SPECIFIC_PASSWORD=app_specific_password
```

## Publishing

To publish to GitHub Releases:

1. Set your GitHub token:
```bash
export GH_TOKEN=your_github_token
```

2. Build and publish:
```bash
npm run dist -- --publish always
```

## Debugging Build Issues

### Check configuration
```bash
npx electron-builder --help
```

### Dry run (no actual build)
```bash
npx electron-builder --dir
```

### Verbose logging
```bash
DEBUG=electron-builder npm run dist
```

## Platform-Specific Notes

### Windows
- Builds require admin rights for some installers
- NSIS installer supports silent installation: `installer.exe /S`
- Portable version requires no installation

### macOS
- First build may require Xcode Command Line Tools
- Code signing requires Apple Developer account
- Notarization is required for distribution outside App Store

### Linux
- AppImage is the most universal format
- DEB for Debian/Ubuntu-based systems
- RPM for Fedora/RHEL-based systems

## Troubleshooting

### Native module errors
If you get errors about native modules, ensure they're in the `asarUnpack` list in `electron-builder.json`.

### Build fails on Windows
Make sure Visual Studio Build Tools are installed for native modules.

### Icon not appearing
Verify icon files exist in the `icons/` directory with correct formats:
- Windows: `icon.ico`
- macOS: `icon.icns`
- Linux: `icon.png`

## Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Code Signing Guide](https://www.electron.build/code-signing)
