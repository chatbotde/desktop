/**
 * Desktop File Manager
 * Handles Linux desktop entry file operations
 * Follows: Single Responsibility Principle (SRP)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class DesktopFileManager {
  /**
   * @param {string} appName - Application name
   */
  constructor(appName) {
    this.appName = appName;
    this.autostartDir = path.join(os.homedir(), '.config', 'autostart');
    this.desktopFilePath = path.join(this.autostartDir, `${this.appName}.desktop`);
  }

  /**
   * Create desktop entry file for auto-startup
   * @returns {Promise<void>}
   */
  async createDesktopEntry() {
    try {
      // Create autostart directory if it doesn't exist
      if (!fs.existsSync(this.autostartDir)) {
        fs.mkdirSync(this.autostartDir, { recursive: true });
      }
      
      const desktopEntry = this.generateDesktopEntryContent();
      
      fs.writeFileSync(this.desktopFilePath, desktopEntry);
      fs.chmodSync(this.desktopFilePath, 0o755); // Make executable
      
      console.log('DesktopFile: Entry created successfully');
    } catch (error) {
      console.error('DesktopFile: Failed to create desktop entry:', error);
      throw error;
    }
  }

  /**
   * Remove desktop entry file
   * @returns {Promise<void>}
   */
  async removeDesktopEntry() {
    try {
      if (fs.existsSync(this.desktopFilePath)) {
        fs.unlinkSync(this.desktopFilePath);
        console.log('DesktopFile: Entry removed successfully');
      }
    } catch (error) {
      console.warn('DesktopFile: Failed to remove desktop entry:', error);
      // Don't throw - this is optional cleanup
    }
  }

  /**
   * Check if desktop entry exists
   * @returns {boolean}
   */
  desktopEntryExists() {
    return fs.existsSync(this.desktopFilePath);
  }

  /**
   * Generate desktop entry file content
   * @returns {string}
   * @private
   */
  generateDesktopEntryContent() {
    const iconPath = path.join(__dirname, '..', 'icons', 'icon.png');
    
    return `[Desktop Entry]
Type=Application
Name=${this.appName}
Comment=Desktop companion app
Exec=${process.execPath} --startup
Icon=${iconPath}
Terminal=false
StartupNotify=true
Hidden=false
X-GNOME-Autostart-enabled=true
Categories=Utility;
`;
  }
}

module.exports = { DesktopFileManager };
