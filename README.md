# 🚀 Buddy - Desktop Companion

A modern Electron-based desktop companion application with AI integration and floating UI components.

## ✨ Recent Cleanup

**Status**: ✅ Project cleaned and organized (October 2025)
- Removed 10+ old/unused files
- Consolidated documentation
- Updated `.gitignore`
- See `CLEANUP_SUMMARY.md` for details

## 📁 Project Structure

See `PROJECT_STRUCTURE.md` for detailed structure.

```
buddy/
├── frontend/          # React + Vite main UI
├── chat-input/        # Floating chat window
├── launch-window/     # Launch manager
├── screen-capture/    # Screen recording
├── startup/           # Auto-startup
└── main.js           # Electron main process
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
cd frontend && npm install
```

### Development Mode
```bash
npm run dev
```
This starts both the Vite dev server and Electron.

### Build Application
```bash
npm run build:all
```

### Package for Distribution
```bash
npm run make
```

## 🛠️ Key Technologies

- **Electron** - Desktop app framework
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **MCP (Model Context Protocol)** - AI integration

## 📖 Documentation

- **Main README**: You're reading it!
- **Project Structure**: `PROJECT_STRUCTURE.md`
- **Cleanup Summary**: `CLEANUP_SUMMARY.md`
- **Frontend Setup**: `frontend/README.md`
- **MCP Setup**: `frontend/MCP_SETUP.md`
- **Chat Input**: `chat-input/README.md`
- **Launch Window**: `launch-window/README.md`

## 🧹 Maintenance

### Run Cleanup Script
Remove old/unused files:
```powershell
.\cleanup.ps1
```

### Optional: Review Documentation
Analyze potentially redundant docs:
```powershell
.\cleanup-docs.ps1
```

## 🔧 Configuration

1. Copy `.env.example` to `.env`
2. Add your API keys:
   ```
   VITE_ANTHROPIC_API_KEY=your_key_here
   VITE_OPENAI_API_KEY=your_key_here
   VITE_GOOGLE_API_KEY=your_key_here
   ```

## 📦 Building

The build process:
1. `npm run build` - Builds React frontend
2. `build-frontend.js` - Copies to `app-frontend/`
3. `npm run package` - Creates Electron package

## 🤝 Contributing

1. Keep code organized by module
2. Update relevant README files
3. Run cleanup scripts periodically
4. Follow TypeScript best practices

## 📝 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode |
| `npm run build` | Build frontend only |
| `npm run build:all` | Build everything |
| `npm run package` | Package for distribution |
| `npm run make` | Create distributable |
| `npm start` | Start Electron (production) |

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is in use, kill the process:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
```

### Frontend Not Loading
1. Check if `frontend/dist` exists
2. Run `npm run build:all`
3. Verify `app-frontend/` was created

### Module Not Found
```bash
# Root directory
npm install

# Frontend directory
cd frontend && npm install
```

## 📄 License

ISC - See package.json for details

## 👤 Author

sonicthinking

---

**Last Updated**: October 7, 2025  
**Version**: 1.0.0
