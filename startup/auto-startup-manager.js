/**
 * Auto Startup Manager
 * Handles automatic startup of the application on system boot/login
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

class AutoStartupManager {
  constructor() {
    this.appName = 'Buddy';
    this.isSetup = false;
  }

  /**
   * Setup auto-startup functionality based on platform
   */
  async setupAutoStartup() {
    try {
      console.log('AutoStartup: Setting up auto-startup functionality...');
      
      // Check if auto-startup is already enabled
      if (app.getLoginItemSettings().openAtLogin) {
        console.log('AutoStartup: Already enabled');
        this.isSetup = true;
        return true;
      }

      // Enable auto-startup based on platform
      await this.enableAutoStartup();
      
      console.log('AutoStartup: Setup completed successfully');
      this.isSetup = true;
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to setup auto-startup:', error);
      return false;
    }
  }

  /**
   * Enable auto-startup for the application
   */
  async enableAutoStartup() {
    try {
      if (process.platform === 'win32') {
        await this.enableWindowsAutoStartup();
      } else if (process.platform === 'darwin') {
        await this.enableMacAutoStartup();
      } else if (process.platform === 'linux') {
        await this.enableLinuxAutoStartup();
      }
      
      console.log('AutoStartup: Enabled for platform:', process.platform);
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to enable auto-startup:', error);
      return false;
    }
  }

  /**
   * Enable auto-startup on Windows
   */
  async enableWindowsAutoStartup() {
    try {
      // Use Electron's built-in method for Windows
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false, // Start visible so launch window appears
        path: process.execPath,
        args: [
          '--startup', // Custom flag to indicate startup launch
        ]
      });

      // Additional registry entry for more reliability (optional)
      await this.addWindowsRegistryEntry();
      
      console.log('AutoStartup: Windows auto-startup enabled');
    } catch (error) {
      console.error('AutoStartup: Failed to enable Windows auto-startup:', error);
      throw error;
    }
  }

  /**
   * Enable auto-startup on macOS
   */
  async enableMacAutoStartup() {
    try {
      // Use Electron's built-in method for macOS
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false, // Start visible so launch window appears
        path: process.execPath
      });
      
      console.log('AutoStartup: macOS auto-startup enabled');
    } catch (error) {
      console.error('AutoStartup: Failed to enable macOS auto-startup:', error);
      throw error;
    }
  }

  /**
   * Enable auto-startup on Linux
   */
  async enableLinuxAutoStartup() {
    try {
      const autostartDir = path.join(os.homedir(), '.config', 'autostart');
      const desktopFile = path.join(autostartDir, `${this.appName}.desktop`);
      
      // Create autostart directory if it doesn't exist
      if (!fs.existsSync(autostartDir)) {
        fs.mkdirSync(autostartDir, { recursive: true });
      }
      
      // Create desktop entry for autostart
      const desktopEntry = `[Desktop Entry]
Type=Application
Name=${this.appName}
Comment=Desktop companion app
Exec=${process.execPath} --startup
Icon=${path.join(__dirname, '..', 'icons', 'icon.png')}
Terminal=false
StartupNotify=true
Hidden=false
X-GNOME-Autostart-enabled=true
Categories=Utility;
`;
      
      fs.writeFileSync(desktopFile, desktopEntry);
      fs.chmodSync(desktopFile, 0o755); // Make executable
      
      // Also use Electron's method as fallback
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false,
        path: process.execPath,
        args: ['--startup']
      });
      
      console.log('AutoStartup: Linux auto-startup enabled');
    } catch (error) {
      console.error('AutoStartup: Failed to enable Linux auto-startup:', error);
      throw error;
    }
  }

  /**
   * Add Windows registry entry for additional reliability
   */
  async addWindowsRegistryEntry() {
    try {
      const { spawn } = require('child_process');
      
      const regCommand = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${this.appName}" /t REG_SZ /d "${process.execPath} --startup" /f`;
      
      return new Promise((resolve, reject) => {
        const process = spawn('cmd', ['/c', regCommand], { 
          windowsHide: true,
          stdio: 'ignore'
        });
        
        process.on('close', (code) => {
          if (code === 0) {
            console.log('AutoStartup: Windows registry entry added');
            resolve();
          } else {
            console.warn('AutoStartup: Failed to add registry entry (non-critical)');
            resolve(); // Don't fail the whole process
          }
        });
        
        process.on('error', (error) => {
          console.warn('AutoStartup: Registry command failed (non-critical):', error);
          resolve(); // Don't fail the whole process
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          process.kill();
          resolve();
        }, 5000);
      });
    } catch (error) {
      console.warn('AutoStartup: Registry entry failed (non-critical):', error);
      // Don't throw - this is optional
    }
  }

  /**
   * Disable auto-startup
   */
  async disableAutoStartup() {
    try {
      // Use Electron's method
      app.setLoginItemSettings({
        openAtLogin: false
      });
      
      // Platform-specific cleanup
      if (process.platform === 'win32') {
        await this.removeWindowsRegistryEntry();
      } else if (process.platform === 'linux') {
        await this.removeLinuxDesktopEntry();
      }
      
      console.log('AutoStartup: Disabled');
      this.isSetup = false;
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to disable auto-startup:', error);
      return false;
    }
  }

  /**
   * Remove Windows registry entry
   */
  async removeWindowsRegistryEntry() {
    try {
      const { spawn } = require('child_process');
      
      const regCommand = `reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${this.appName}" /f`;
      
      return new Promise((resolve) => {
        const process = spawn('cmd', ['/c', regCommand], { 
          windowsHide: true,
          stdio: 'ignore'
        });
        
        process.on('close', () => {
          console.log('AutoStartup: Windows registry entry removed');
          resolve();
        });
        
        process.on('error', () => {
          resolve(); // Don't fail
        });
        
        setTimeout(() => {
          process.kill();
          resolve();
        }, 3000);
      });
    } catch (error) {
      console.warn('AutoStartup: Failed to remove registry entry:', error);
    }
  }

  /**
   * Remove Linux desktop entry
   */
  async removeLinuxDesktopEntry() {
    try {
      const desktopFile = path.join(os.homedir(), '.config', 'autostart', `${this.appName}.desktop`);
      
      if (fs.existsSync(desktopFile)) {
        fs.unlinkSync(desktopFile);
        console.log('AutoStartup: Linux desktop entry removed');
      }
    } catch (error) {
      console.warn('AutoStartup: Failed to remove desktop entry:', error);
    }
  }

  /**
   * Check if auto-startup is enabled
   */
  isAutoStartupEnabled() {
    try {
      return app.getLoginItemSettings().openAtLogin;
    } catch (error) {
      console.error('AutoStartup: Failed to check status:', error);
      return false;
    }
  }

  /**
   * Toggle auto-startup
   */
  async toggleAutoStartup() {
    try {
      if (this.isAutoStartupEnabled()) {
        return await this.disableAutoStartup();
      } else {
        return await this.enableAutoStartup();
      }
    } catch (error) {
      console.error('AutoStartup: Failed to toggle:', error);
      return false;
    }
  }

  /**
   * Check if this is a startup launch (launched by system on boot)
   */
  isStartupLaunch() {
    return process.argv.includes('--startup');
  }

  /**
   * Get startup info
   */
  getStartupInfo() {
    return {
      isSetup: this.isSetup,
      isEnabled: this.isAutoStartupEnabled(),
      isStartupLaunch: this.isStartupLaunch(),
      platform: process.platform
    };
  }
}

module.exports = { AutoStartupManager };
