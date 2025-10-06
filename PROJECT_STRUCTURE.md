# Buddy Project - Clean Structure

## 📁 Root Directory Structure

```
buddy/
├── 📄 main.js                    # Main Electron process
├── 📄 package.json               # Project dependencies
├── 📄 forge.config.js            # Electron Forge config
├── 📄 build-frontend.js          # Frontend build script
├── 📄 clipboard-monitor.js       # Clipboard monitoring
├── 📄 cleanup.ps1                # Cleanup script
├── 📄 .gitignore                 # Git ignore rules
├── 📄 .env.example               # Environment template
│
├── 📁 frontend/                  # React/Vite Frontend App
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── mcp-client/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── 📁 chat-input/                # Floating Chat Input
│   ├── chat-input-window.js
│   ├── chat-input-preload.js
│   ├── chat-input.html
│   ├── capture/
│   ├── css/
│   ├── electron-api/
│   ├── modules/
│   └── window/
│
├── 📁 launch-window/             # Launch Window
│   ├── launch-window-manager.js
│   ├── launch-window-preload.js
│   ├── index.js
│   └── launch-window.html
│
├── 📁 screen-capture/            # Screen Capture
│   ├── screen-capture-window-manager.js
│   ├── screen-capture-preload.js
│   ├── screen-capture-ipc-handlers.js
│   └── screen-capture.html
│
├── 📁 startup/                   # Auto-Startup
│   ├── auto-startup-manager.js
│   └── index.js
│
└── 📁 icons/                     # App Icons
    ├── icon.png
    ├── icon.ico
    ├── icon.icns
    └── icon.jpeg
```

## 🎯 Module Purposes

### Frontend (`frontend/`)
- Main React application UI
- Built with Vite + TypeScript
- Uses Tailwind CSS + shadcn/ui components
- Contains AI integration logic
- MCP (Model Context Protocol) client

### Chat Input (`chat-input/`)
- Floating chat input window
- Screen capture integration
- Independent preload script
- Custom styling and interactions

### Launch Window (`launch-window/`)
- Application launcher interface
- Window management
- Always-on-top functionality

### Screen Capture (`screen-capture/`)
- Screen recording functionality
- Audio utilities
- IPC handlers for capture operations

### Startup (`startup/`)
- Auto-startup manager
- System integration

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `main.js` | Main Electron process entry point |
| `clipboard-monitor.js` | Monitor clipboard changes |
| `build-frontend.js` | Build and copy frontend to app-frontend |
| `forge.config.js` | Electron Forge packaging config |

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build frontend only
npm run build

# Build everything
npm run build:all

# Package the app
npm run package

# Create distributable
npm run make
```

## 📝 Important Notes

- **app-frontend/** is auto-generated - don't edit directly
- Each window has its own preload script for security
- Frontend uses Vite for fast development
- All build outputs are gitignored

## 🧹 Maintenance

Run cleanup script to remove old files:
```powershell
.\cleanup.ps1
```

## 🔗 Related Documentation

- Frontend: `frontend/README.md`
- Chat Input: `chat-input/README.md`
- Launch Window: `launch-window/README.md`
- MCP Setup: `frontend/src/mcp-client/README.md`
