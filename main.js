const { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer, screen } = require("electron");
const path = require("path");

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: true,
        hasShadow: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        hiddenInMissionControl: true, // Hide from mission control/task switcher
        roundedCorners: true,
        vibrancy: 'ultra-dark',
        resizable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            spellcheck: true,
            preload: path.join(__dirname, "preload.js")
        },
        backgroundColor: 'rgba(0, 0, 0, 0)',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
        // Cross-platform window properties
        focusable: true,
        fullscreenable: false,
        kiosk: false,
        autoHideMenuBar: true,
        // Linux-specific properties
        ...(process.platform === 'linux' && {
            icon: path.join(__dirname, 'assets/icon.png'), // Add app icon for Linux
            frame: false,
        }),
    });

    // Set the window to always stay on top with highest priority
    // This ensures it stays above taskbar/dock and all other windows across all platforms
    win.setAlwaysOnTop(true, 'screen-saver', 1);
    
    // Platform-specific configurations for maximum always-on-top behavior
    if (process.platform === 'win32') {
        // Windows: Stay above taskbar and system menus
        win.setAlwaysOnTop(true, 'pop-up-menu', 1);
    } else if (process.platform === 'darwin') {
        // macOS: Stay above dock and mission control
        win.setAlwaysOnTop(true, 'floating', 1);
        win.setAlwaysOnTop(true, 'pop-up-menu', 1);
    } else if (process.platform === 'linux') {
        // Linux: Stay above panels and system elements
        win.setAlwaysOnTop(true, 'pop-up-menu', 1);
        // Additional Linux-specific settings
        win.setAlwaysOnTop(true, 'modal-panel', 1);
    }

    // Enable content protection to prevent this app from being captured/recorded
    // while still allowing it to capture other applications
    win.setContentProtection(true);

    // Add blue light border and rounded corners styling
    win.webContents.on('did-finish-load', () => {
        win.webContents.insertCSS(`
            * {
                box-sizing: border-box;
            }
            
            html {
                background: transparent;
                border-radius: 15px;
                overflow: hidden;
            }
            
            body {
                border: 2px solid #00a8ff;
                border-radius: 15px;
                box-shadow: 
                    0 0 20px rgba(0, 168, 255, 0.4),
                    0 0 40px rgba(0, 168, 255, 0.2);
                overflow: hidden;
                margin: 0;
                padding: 0;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                width: 100vw;
                height: 100vh;
                position: relative;
            }
            
            /* Mask to create rounded window effect */
            body::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 15px;
                background: transparent;
                pointer-events: none;
                z-index: 9999;
                box-shadow: inset 0 0 0 2000px rgba(0, 0, 0, 0);
                -webkit-mask: radial-gradient(circle at 15px 15px, transparent 14px, black 15px),
                              radial-gradient(circle at calc(100% - 15px) 15px, transparent 14px, black 15px),
                              radial-gradient(circle at 15px calc(100% - 15px), transparent 14px, black 15px),
                              radial-gradient(circle at calc(100% - 15px) calc(100% - 15px), transparent 14px, black 15px),
                              linear-gradient(to bottom, black, black);
                -webkit-mask-composite: intersect;
                mask: radial-gradient(circle at 15px 15px, transparent 14px, black 15px),
                      radial-gradient(circle at calc(100% - 15px) 15px, transparent 14px, black 15px),
                      radial-gradient(circle at 15px calc(100% - 15px), transparent 14px, black 15px),
                      radial-gradient(circle at calc(100% - 15px) calc(100% - 15px), transparent 14px, black 15px),
                      linear-gradient(to bottom, black, black);
                mask-composite: intersect;
            }
        `);
    });

    if (process.env.NODE_ENV === "development") {
        win.loadURL("http://localhost:5173");
    } else {
        // Load the local HTML file as fallback, or the built frontend
        const frontendPath = path.join(__dirname, "frontend/dist/index.html");
        const fallbackPath = path.join(__dirname, "index.html");
        
        // Check if frontend build exists, otherwise use fallback
        const fs = require('fs');
        if (fs.existsSync(frontendPath)) {
            win.loadFile(frontendPath);
        } else {
            win.loadFile(fallbackPath);
        }
    }

    // IPC handlers for window controls
    ipcMain.handle('window-close', () => {
        win.close();
    });

    ipcMain.handle('window-minimize', () => {
        win.minimize();
    });

    ipcMain.handle('window-maximize', () => {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });

    ipcMain.handle('window-set-opacity', (event, opacity) => {
        win.setOpacity(opacity);
    });

    // Track mouse ignore state
    let mouseIgnoreEnabled = false;
    // Track content protection state
    let contentProtectionEnabled = true; // Default to enabled as set above

    ipcMain.handle('window-toggle-mouse-ignore', () => {
        mouseIgnoreEnabled = !mouseIgnoreEnabled;
        win.setIgnoreMouseEvents(mouseIgnoreEnabled);
        return mouseIgnoreEnabled;
    });

    // Content protection toggle handler
    ipcMain.handle('window-toggle-content-protection', () => {
        contentProtectionEnabled = !contentProtectionEnabled;
        win.setContentProtection(contentProtectionEnabled);
        console.log(`Content protection ${contentProtectionEnabled ? 'enabled' : 'disabled'}`);
        return contentProtectionEnabled;
    });

    // Get current content protection state
    ipcMain.handle('window-get-content-protection', () => {
        return contentProtectionEnabled;
    });

    // Screen capture handlers
    ipcMain.handle('get-desktop-sources', async () => {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['window', 'screen'],
                thumbnailSize: { width: 150, height: 150 }
            });
            
            // Filter out this application's own window to avoid showing it in capture list
            const filteredSources = sources.filter(source => {
                // Cross-platform filtering for own window
                const isOwnWindow = source.name.toLowerCase().includes('buddy') ||
                                  source.name.toLowerCase().includes('electron') ||
                                  source.id.includes(win.webContents.id.toString()) ||
                                  // Additional filters for different platforms
                                  (process.platform === 'win32' && source.name.includes('Buddy')) ||
                                  (process.platform === 'darwin' && source.name.includes('Buddy')) ||
                                  (process.platform === 'linux' && (source.name.includes('Buddy') || source.name.includes('buddy')));
                return !isOwnWindow;
            });
            
            return filteredSources.map(source => ({
                id: source.id,
                name: source.name,
                thumbnail: source.thumbnail.toDataURL()
            }));
        } catch (error) {
            console.error('Error getting desktop sources:', error);
            return [];
        }
    });

    ipcMain.handle('get-screen-info', () => {
        const displays = screen.getAllDisplays();
        const primaryDisplay = screen.getPrimaryDisplay();
        return {
            displays: displays.map(display => ({
                id: display.id,
                bounds: display.bounds,
                workArea: display.workArea,
                scaleFactor: display.scaleFactor,
                rotation: display.rotation,
                primary: display.id === primaryDisplay.id
            })),
            primaryDisplay: {
                id: primaryDisplay.id,
                bounds: primaryDisplay.bounds,
                workArea: primaryDisplay.workArea,
                scaleFactor: primaryDisplay.scaleFactor
            }
        };
    });

    // Register global shortcuts with cross-platform compatibility
    // Hide/show window shortcut
    const hideShowShortcut = process.platform === 'darwin' ? 'Cmd+\\' : 'Ctrl+\\';
    
    globalShortcut.register(hideShowShortcut, () => {
        if (win.isVisible()) {
            win.hide();
        } else {
            win.showInactive();
        }
    });

    // Mouse ignore toggle shortcut
    const mouseIgnoreShortcut = process.platform === 'darwin' ? 'Cmd+Shift+\\' : 'Ctrl+Shift+\\';
    
    globalShortcut.register(mouseIgnoreShortcut, () => {
        mouseIgnoreEnabled = !mouseIgnoreEnabled;
        win.setIgnoreMouseEvents(mouseIgnoreEnabled);
        console.log(`Mouse ignore ${mouseIgnoreEnabled ? 'enabled' : 'disabled'}`);
    });

    // Additional Linux-specific shortcuts (if needed)
    if (process.platform === 'linux') {
        // Alternative shortcut for Linux window managers that might intercept Ctrl+\
        const linuxHideShowShortcut = 'Ctrl+Alt+\\';
        globalShortcut.register(linuxHideShowShortcut, () => {
            if (win.isVisible()) {
                win.hide();
            } else {
                win.showInactive();
            }
        });
    }

    // Log shortcut registration with platform info
    console.log(`Global shortcuts registered for ${process.platform}:`);
    console.log(`- ${hideShowShortcut}: Toggle window visibility`);
    console.log(`- ${mouseIgnoreShortcut}: Toggle mouse ignore`);
    if (process.platform === 'linux') {
        console.log(`- Ctrl+Alt+\\: Alternative toggle window visibility (Linux)`);
    }

    return win;
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  // Unregister all global shortcuts before quitting
  globalShortcut.unregisterAll();
});
