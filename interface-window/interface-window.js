const { BrowserWindow, ipcMain, app } = require('electron');
const path = require('path');
const { ClickThroughManager } = require('./click-through');

class InterfaceWindow {
  constructor() {
    this.window = null;
    this.clickThroughManager = null;
  }

  create() {
    if (this.window) {
      this.window.focus();
      return this.window;
    }

    this.window = new BrowserWindow({
      width: 1200,
      height: 800,
      frame: false,
      transparent:true,
      alwaysOnTop:true,
      title:"",
      skipTaskbar:false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      },
      show: false // Don't show until ready-to-show
    });

    // Load the frontend
    // In development, load from Vite dev server
    // In production, use the custom protocol
    const isDev = !app.isPackaged; 
    const url = isDev ? 'http://localhost:5173' : 'buddy-app://frontend/index.html';
    
    console.log(`InterfaceWindow: Loading URL ${url}`);
    this.window.loadURL(url);

    this.window.once('ready-to-show', () => {
      this.window.show();
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    // Initialize click-through manager
    this.clickThroughManager = new ClickThroughManager(this.window);
    this.clickThroughManager.setup();

    this.setupHandlers();

    return this.window;
  }

  setupHandlers() {
    ipcMain.on('interface-window:minimize', () => {
      if (this.window) this.window.minimize();
    });

    ipcMain.on('interface-window:maximize', () => {
      if (this.window) {
        if (this.window.isMaximized()) {
          this.window.unmaximize();
        } else {
          this.window.maximize();
        }
      }
    });

    ipcMain.on('interface-window:close', () => {
      if (this.window) this.window.close();
    });
  }

  show() {
    if (this.window) {
      this.window.show();
      this.window.focus();
    } else {
      this.create();
    }
  }

  hide() {
    if (this.window) {
      this.window.hide();
    }
  }

  toggle() {
    if (this.window) {
      if (this.window.isVisible()) {
        this.hide();
      } else {
        this.show();
      }
    } else {
      this.create();
    }
  }

  isVisible() {
    return this.window ? this.window.isVisible() : false;
  }
}

module.exports = { InterfaceWindow };
