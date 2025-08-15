/**
 * Global shortcuts management
 */

const { globalShortcut } = require("electron");

class ShortcutManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.registeredShortcuts = [];
  }

  registerAllShortcuts() {
    this.registerHideShowShortcut();
    this.registerMouseIgnoreShortcut();
    this.registerLinuxAlternativeShortcuts();
    this.logRegisteredShortcuts();
  }

  registerHideShowShortcut() {
    const hideShowShortcut = process.platform === "darwin" ? "Cmd+\\" : "Ctrl+\\";
    
    const success = globalShortcut.register(hideShowShortcut, () => {
      const currentWindow = this.windowManager.getCurrentWindow();
      if (currentWindow) {
        if (currentWindow.isVisible()) {
          currentWindow.hide();
        } else {
          currentWindow.showInactive();
        }
      }
    });

    if (success) {
      this.registeredShortcuts.push({
        shortcut: hideShowShortcut,
        description: "Toggle window visibility"
      });
    }
  }

  registerMouseIgnoreShortcut() {
    const mouseIgnoreShortcut = process.platform === "darwin" ? "Cmd+Shift+\\" : "Ctrl+Shift+\\";
    
    const success = globalShortcut.register(mouseIgnoreShortcut, () => {
      const currentWindow = this.windowManager.getCurrentWindow();
      if (currentWindow) {
        const mouseIgnoreEnabled = !this.windowManager.isMouseIgnoreEnabled();
        this.windowManager.setMouseIgnoreEnabled(mouseIgnoreEnabled);
        currentWindow.setIgnoreMouseEvents(mouseIgnoreEnabled);
        console.log(`Mouse ignore ${mouseIgnoreEnabled ? "enabled" : "disabled"}`);
      }
    });

    if (success) {
      this.registeredShortcuts.push({
        shortcut: mouseIgnoreShortcut,
        description: "Toggle mouse ignore"
      });
    }
  }

  registerLinuxAlternativeShortcuts() {
    if (process.platform === "linux") {
      // Alternative shortcut for Linux window managers that might intercept Ctrl+\
      const linuxHideShowShortcut = "Ctrl+Alt+\\";
      
      const success = globalShortcut.register(linuxHideShowShortcut, () => {
        const currentWindow = this.windowManager.getCurrentWindow();
        if (currentWindow) {
          if (currentWindow.isVisible()) {
            currentWindow.hide();
          } else {
            currentWindow.showInactive();
          }
        }
      });

      if (success) {
        this.registeredShortcuts.push({
          shortcut: linuxHideShowShortcut,
          description: "Alternative toggle window visibility (Linux)"
        });
      }
    }
  }

  logRegisteredShortcuts() {
    console.log(`Global shortcuts registered for ${process.platform}:`);
    this.registeredShortcuts.forEach(({ shortcut, description }) => {
      console.log(`- ${shortcut}: ${description}`);
    });
  }

  unregisterAllShortcuts() {
    globalShortcut.unregisterAll();
    this.registeredShortcuts = [];
    console.log("All global shortcuts unregistered");
  }

  unregisterMainWindowShortcuts() {
    // Unregister only the shortcuts registered by this manager
    this.registeredShortcuts.forEach(({ shortcut }) => {
      if (globalShortcut.isRegistered(shortcut)) {
        globalShortcut.unregister(shortcut);
        console.log(`Unregistered shortcut: ${shortcut}`);
      }
    });
    this.registeredShortcuts = [];
    console.log("Main window shortcuts unregistered");
  }

  getRegisteredShortcuts() {
    return [...this.registeredShortcuts];
  }
}

module.exports = { ShortcutManager };
