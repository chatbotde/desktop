/**
 * Registry Manager
 * Handles Windows Registry operations for auto-startup
 * Follows: Single Responsibility Principle (SRP)
 */

const { spawn } = require('child_process');

class RegistryManager {
  /**
   * Add registry entry for auto-startup
   * @param {string} appName - Application name
   * @param {string} command - Command to execute on startup
   * @returns {Promise<void>}
   */
  async addEntry(appName, command) {
    try {
      const regCommand = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${appName}" /t REG_SZ /d "${command}" /f`;
      
      await this.executeRegistryCommand(regCommand);
      console.log('Registry: Entry added successfully');
    } catch (error) {
      console.warn('Registry: Failed to add entry (non-critical):', error);
      // Don't throw - this is optional
    }
  }

  /**
   * Remove registry entry for auto-startup
   * @param {string} appName - Application name
   * @returns {Promise<void>}
   */
  async removeEntry(appName) {
    try {
      const regCommand = `reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${appName}" /f`;
      
      await this.executeRegistryCommand(regCommand);
      console.log('Registry: Entry removed successfully');
    } catch (error) {
      console.warn('Registry: Failed to remove entry:', error);
      // Don't throw - this is optional cleanup
    }
  }

  /**
   * Execute a registry command
   * @param {string} command - Registry command to execute
   * @returns {Promise<void>}
   * @private
   */
  async executeRegistryCommand(command) {
    return new Promise((resolve, reject) => {
      const proc = spawn('cmd', ['/c', command], { 
        windowsHide: true,
        stdio: 'ignore'
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Registry command failed with code ${code}`));
        }
      });
      
      proc.on('error', (error) => {
        reject(error);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        proc.kill();
        resolve(); // Don't fail on timeout
      }, 5000);
    });
  }
}

module.exports = { RegistryManager };
