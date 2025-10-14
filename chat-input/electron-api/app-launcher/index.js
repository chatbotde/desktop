const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');

const execAsync = promisify(exec);

/**
 * Application Launcher API Module
 * Launch and manage applications on the system
 */

class ApplicationLauncher {
  constructor() {
    this.runningApps = new Map();
    this.commonApps = this.getCommonApplications();
    this.customApps = new Map(); // User-defined applications
    this.configPath = null;
    this.loadCustomApps();
  }

  /**
   * Load custom applications from config file
   */
  async loadCustomApps() {
    try {
      if (!this.configPath) {
        const userDataPath = app.getPath('userData');
        this.configPath = path.join(userDataPath, 'custom-apps.json');
      }

      const data = await fs.readFile(this.configPath, 'utf-8');
      const customApps = JSON.parse(data);
      
      // Load into Map
      Object.entries(customApps).forEach(([name, appPath]) => {
        this.customApps.set(name.toLowerCase(), appPath);
      });

      console.log(`Loaded ${this.customApps.size} custom apps`);
    } catch (error) {
      // File doesn't exist yet, that's okay
      if (error.code !== 'ENOENT') {
        console.error('Error loading custom apps:', error);
      }
    }
  }

  /**
   * Save custom applications to config file
   */
  async saveCustomApps() {
    try {
      if (!this.configPath) {
        const userDataPath = app.getPath('userData');
        this.configPath = path.join(userDataPath, 'custom-apps.json');
      }

      const customAppsObj = {};
      this.customApps.forEach((appPath, name) => {
        customAppsObj[name] = appPath;
      });

      await fs.writeFile(
        this.configPath,
        JSON.stringify(customAppsObj, null, 2),
        'utf-8'
      );

      console.log('Custom apps saved');
      return true;
    } catch (error) {
      console.error('Error saving custom apps:', error);
      return false;
    }
  }

  /**
   * Add a custom application
   * @param {string} name - Application name/alias
   * @param {string} appPath - Path to application
   * @returns {Promise<Object>} Result
   */
  async addCustomApp(name, appPath) {
    try {
      // Expand path
      const expandedPath = this.expandPath(appPath);

      // Verify app exists
      const exists = await this.applicationExists(expandedPath);
      if (!exists) {
        return {
          success: false,
          error: `Application not found at: ${expandedPath}`
        };
      }

      // Add to custom apps
      this.customApps.set(name.toLowerCase(), expandedPath);

      // Save to file
      await this.saveCustomApps();

      return {
        success: true,
        name: name.toLowerCase(),
        path: expandedPath,
        message: `Added ${name} → ${expandedPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove a custom application
   * @param {string} name - Application name
   * @returns {Promise<Object>} Result
   */
  async removeCustomApp(name) {
    const lowerName = name.toLowerCase();
    
    if (!this.customApps.has(lowerName)) {
      return {
        success: false,
        error: `Custom app '${name}' not found`
      };
    }

    this.customApps.delete(lowerName);
    await this.saveCustomApps();

    return {
      success: true,
      name: lowerName,
      message: `Removed ${name}`
    };
  }

  /**
   * Get all custom applications
   * @returns {Object} Custom apps
   */
  getCustomApps() {
    const result = {};
    this.customApps.forEach((appPath, name) => {
      result[name] = appPath;
    });
    return result;
  }

  /**
   * Update a custom application path
   * @param {string} name - Application name
   * @param {string} newPath - New path
   * @returns {Promise<Object>} Result
   */
  async updateCustomApp(name, newPath) {
    const lowerName = name.toLowerCase();
    
    if (!this.customApps.has(lowerName)) {
      return {
        success: false,
        error: `Custom app '${name}' not found`
      };
    }

    const expandedPath = this.expandPath(newPath);
    const exists = await this.applicationExists(expandedPath);
    
    if (!exists) {
      return {
        success: false,
        error: `Application not found at: ${expandedPath}`
      };
    }

    this.customApps.set(lowerName, expandedPath);
    await this.saveCustomApps();

    return {
      success: true,
      name: lowerName,
      path: expandedPath,
      message: `Updated ${name} → ${expandedPath}`
    };
  }

  /**
   * Browse for application and add it
   * @param {string} name - Application name/alias
   * @returns {Promise<Object>} Result with path
   */
  async browseAndAddApp(name) {
    const { dialog } = require('electron');
    
    const filters = process.platform === 'win32'
      ? [{ name: 'Applications', extensions: ['exe'] }]
      : process.platform === 'darwin'
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'All Files', extensions: ['*'] }];

    const result = await dialog.showOpenDialog({
      title: `Select ${name} application`,
      properties: ['openFile'],
      filters
    });

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        canceled: true
      };
    }

    const appPath = result.filePaths[0];
    return await this.addCustomApp(name, appPath);
  }

  /**
   * Get application path (checks custom apps first, then common apps)
   * @param {string} appName - Application name
   * @returns {string|null} Application path
   */
  getAppPath(appName) {
    const lowerName = appName.toLowerCase();
    
    // Check custom apps first (higher priority)
    if (this.customApps.has(lowerName)) {
      return this.customApps.get(lowerName);
    }
    
    // Then check common apps
    if (this.commonApps[lowerName]) {
      return this.commonApps[lowerName];
    }
    
    return null;
  }

  /**
   * Get common applications by platform
   * @returns {Object} Common applications
   */
  getCommonApplications() {
    const platform = process.platform;

    if (platform === 'win32') {
      return {
        // Browsers
        chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        firefox: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
        edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        brave: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        
        // Development
        vscode: 'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
        notepad: 'notepad.exe',
        notepadplusplus: 'C:\\Program Files\\Notepad++\\notepad++.exe',
        sublimetext: 'C:\\Program Files\\Sublime Text\\sublime_text.exe',
        
        // Communication
        discord: 'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9015\\Discord.exe',
        slack: 'C:\\Users\\%USERNAME%\\AppData\\Local\\slack\\slack.exe',
        zoom: 'C:\\Users\\%USERNAME%\\AppData\\Roaming\\Zoom\\bin\\Zoom.exe',
        teams: 'C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\Teams\\current\\Teams.exe',
        
        // Utilities
        calculator: 'calc.exe',
        paint: 'mspaint.exe',
        explorer: 'explorer.exe',
        cmd: 'cmd.exe',
        powershell: 'powershell.exe',
        terminal: 'wt.exe', // Windows Terminal
        
        // Office
        word: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
        excel: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE',
        powerpoint: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE',
        
        // Media
        spotify: 'C:\\Users\\%USERNAME%\\AppData\\Roaming\\Spotify\\Spotify.exe',
        vlc: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
        
        // Other
        steam: 'C:\\Program Files (x86)\\Steam\\steam.exe',
        postman: 'C:\\Users\\%USERNAME%\\AppData\\Local\\Postman\\Postman.exe'
      };
    } else if (platform === 'darwin') {
      return {
        // Browsers
        chrome: '/Applications/Google Chrome.app',
        firefox: '/Applications/Firefox.app',
        safari: '/Applications/Safari.app',
        brave: '/Applications/Brave Browser.app',
        
        // Development
        vscode: '/Applications/Visual Studio Code.app',
        sublimetext: '/Applications/Sublime Text.app',
        
        // Communication
        discord: '/Applications/Discord.app',
        slack: '/Applications/Slack.app',
        zoom: '/Applications/zoom.us.app',
        
        // Utilities
        terminal: '/Applications/Utilities/Terminal.app',
        
        // Media
        spotify: '/Applications/Spotify.app',
        vlc: '/Applications/VLC.app'
      };
    } else {
      return {
        // Linux common apps
        chrome: 'google-chrome',
        firefox: 'firefox',
        vscode: 'code',
        terminal: 'gnome-terminal',
        calculator: 'gnome-calculator'
      };
    }
  }

  /**
   * Launch an application by name or path
   * @param {string} appName - Application name or path
   * @param {Object} options - Launch options
   * @returns {Promise<Object>} Launch result
   */
  async launchApplication(appName, options = {}) {
    try {
      // Replace environment variables
      const expandedPath = this.expandPath(appName);
      
      // Check custom apps first, then common apps
      const appPath = this.getAppPath(appName) || expandedPath;
      
      // Check if app exists
      const exists = await this.applicationExists(appPath);
      if (!exists) {
        throw new Error(`Application not found: ${appName}. Try adding it with addCustomApp().`);
      }

      // Launch based on platform
      const result = await this.launchByPlatform(appPath, options);
      
      return {
        success: true,
        appName,
        appPath,
        pid: result.pid,
        launched: new Date()
      };
    } catch (error) {
      return {
        success: false,
        appName,
        error: error.message
      };
    }
  }

  /**
   * Launch application based on platform
   * @param {string} appPath - Application path
   * @param {Object} options - Launch options
   * @returns {Promise<Object>} Process info
   */
  async launchByPlatform(appPath, options = {}) {
    const platform = process.platform;

    if (platform === 'win32') {
      return await this.launchWindows(appPath, options);
    } else if (platform === 'darwin') {
      return await this.launchMacOS(appPath, options);
    } else {
      return await this.launchLinux(appPath, options);
    }
  }

  /**
   * Launch application on Windows
   * @param {string} appPath - Application path
   * @param {Object} options - Launch options
   * @returns {Promise<Object>} Process info
   */
  async launchWindows(appPath, options = {}) {
    const args = options.args || [];
    const detached = options.detached !== false;

    if (appPath.endsWith('.exe')) {
      // Launch executable
      const child = spawn(appPath, args, {
        detached,
        stdio: 'ignore',
        shell: true
      });

      if (detached) {
        child.unref();
      }

      return { pid: child.pid };
    } else {
      // Use start command
      const command = `start "" "${appPath}" ${args.join(' ')}`;
      await execAsync(command);
      return { pid: null };
    }
  }

  /**
   * Launch application on macOS
   * @param {string} appPath - Application path
   * @param {Object} options - Launch options
   * @returns {Promise<Object>} Process info
   */
  async launchMacOS(appPath, options = {}) {
    const args = options.args || [];
    const command = `open -a "${appPath}" ${args.join(' ')}`;
    
    await execAsync(command);
    return { pid: null };
  }

  /**
   * Launch application on Linux
   * @param {string} appPath - Application path
   * @param {Object} options - Launch options
   * @returns {Promise<Object>} Process info
   */
  async launchLinux(appPath, options = {}) {
    const args = options.args || [];
    const detached = options.detached !== false;

    const child = spawn(appPath, args, {
      detached,
      stdio: 'ignore'
    });

    if (detached) {
      child.unref();
    }

    return { pid: child.pid };
  }

  /**
   * Launch application with arguments
   * @param {string} appName - Application name
   * @param {Array<string>} args - Command line arguments
   * @returns {Promise<Object>} Launch result
   */
  async launchWithArgs(appName, args = []) {
    return await this.launchApplication(appName, { args });
  }

  /**
   * Open URL in default browser or specific browser
   * @param {string} url - URL to open
   * @param {string} browser - Browser name (optional)
   * @returns {Promise<Object>} Launch result
   */
  async openURL(url, browser = null) {
    if (browser) {
      return await this.launchApplication(browser, { args: [url] });
    } else {
      // Use default browser
      const { shell } = require('electron');
      await shell.openExternal(url);
      return { success: true, url, browser: 'default' };
    }
  }

  /**
   * Search for installed applications
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Found applications
   */
  async searchApplications(searchTerm) {
    const platform = process.platform;
    const results = [];

    if (platform === 'win32') {
      // Search in common installation directories
      const searchPaths = [
        'C:\\Program Files',
        'C:\\Program Files (x86)',
        process.env.LOCALAPPDATA,
        process.env.APPDATA
      ];

      for (const searchPath of searchPaths) {
        try {
          const found = await this.searchDirectory(searchPath, searchTerm, 2);
          results.push(...found);
        } catch (error) {
          // Skip inaccessible directories
        }
      }
    }

    // Add matching common apps
    const commonMatches = Object.entries(this.commonApps)
      .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(([name, path]) => ({ name, path }));

    results.push(...commonMatches);

    return results;
  }

  /**
   * Search directory for applications
   * @param {string} dirPath - Directory to search
   * @param {string} searchTerm - Search term
   * @param {number} depth - Search depth
   * @returns {Promise<Array>} Found applications
   */
  async searchDirectory(dirPath, searchTerm, depth = 1) {
    if (depth <= 0) return [];

    const results = [];

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (item.isFile() && item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          if (item.name.endsWith('.exe') || item.name.endsWith('.app')) {
            results.push({
              name: item.name,
              path: fullPath
            });
          }
        } else if (item.isDirectory() && depth > 1) {
          const subResults = await this.searchDirectory(fullPath, searchTerm, depth - 1);
          results.push(...subResults);
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }

    return results;
  }

  /**
   * Check if application exists
   * @param {string} appPath - Application path
   * @returns {Promise<boolean>} Exists status
   */
  async applicationExists(appPath) {
    // Expand path
    const expandedPath = this.expandPath(appPath);

    try {
      // Check if it's a system command
      if (!expandedPath.includes('\\') && !expandedPath.includes('/')) {
        const result = await execAsync(
          process.platform === 'win32' 
            ? `where ${expandedPath}` 
            : `which ${expandedPath}`,
          { timeout: 5000 }
        );
        return !!result.stdout;
      }

      // Check file existence
      await fs.access(expandedPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available common applications
   * @returns {Promise<Array>} Available applications
   */
  async getAvailableApplications() {
    const available = [];

    // Add custom apps (user-defined)
    for (const [name, path] of this.customApps.entries()) {
      const exists = await this.applicationExists(path);
      if (exists) {
        available.push({
          name,
          path: this.expandPath(path),
          category: 'Custom',
          isCustom: true
        });
      }
    }

    // Add common apps
    for (const [name, path] of Object.entries(this.commonApps)) {
      const exists = await this.applicationExists(path);
      if (exists) {
        available.push({
          name,
          path: this.expandPath(path),
          category: this.categorizeApp(name),
          isCustom: false
        });
      }
    }

    return available;
  }

  /**
   * Categorize application by name
   * @param {string} appName - Application name
   * @returns {string} Category
   */
  categorizeApp(appName) {
    const browsers = ['chrome', 'firefox', 'edge', 'brave', 'safari'];
    const development = ['vscode', 'notepad', 'notepadplusplus', 'sublimetext'];
    const communication = ['discord', 'slack', 'zoom', 'teams'];
    const utilities = ['calculator', 'paint', 'explorer', 'cmd', 'powershell', 'terminal'];
    const office = ['word', 'excel', 'powerpoint'];
    const media = ['spotify', 'vlc'];

    if (browsers.includes(appName)) return 'browser';
    if (development.includes(appName)) return 'development';
    if (communication.includes(appName)) return 'communication';
    if (utilities.includes(appName)) return 'utility';
    if (office.includes(appName)) return 'office';
    if (media.includes(appName)) return 'media';

    return 'other';
  }

  /**
   * Expand environment variables in path
   * @param {string} appPath - Path with variables
   * @returns {string} Expanded path
   */
  expandPath(appPath) {
    if (process.platform === 'win32') {
      return appPath.replace(/%([^%]+)%/g, (_, key) => {
        return process.env[key] || '';
      });
    }
    return appPath.replace(/\$([A-Z_]+)/g, (_, key) => {
      return process.env[key] || '';
    });
  }

  /**
   * Launch multiple applications
   * @param {Array<string>} appNames - Array of application names
   * @returns {Promise<Array>} Launch results
   */
  async launchMultiple(appNames) {
    const results = [];

    for (const appName of appNames) {
      const result = await this.launchApplication(appName);
      results.push(result);
    }

    return results;
  }

  /**
   * Create application shortcut command
   * @param {string} appName - Application name
   * @param {string} commandName - Command name
   * @returns {Object} Command info
   */
  createShortcut(appName, commandName) {
    const appPath = this.commonApps[appName.toLowerCase()];
    
    if (!appPath) {
      throw new Error(`Unknown application: ${appName}`);
    }

    return {
      command: commandName,
      appName,
      appPath,
      launch: () => this.launchApplication(appName)
    };
  }
}

// Create singleton instance
const appLauncher = new ApplicationLauncher();

module.exports = {
  appLauncher,
  
  // Main functions
  launchApp: (appName, options) => appLauncher.launchApplication(appName, options),
  launchWithArgs: (appName, args) => appLauncher.launchWithArgs(appName, args),
  openURL: (url, browser) => appLauncher.openURL(url, browser),
  
  // Discovery functions
  searchApps: (searchTerm) => appLauncher.searchApplications(searchTerm),
  getAvailableApps: () => appLauncher.getAvailableApplications(),
  appExists: (appPath) => appLauncher.applicationExists(appPath),
  
  // Utility functions
  launchMultiple: (appNames) => appLauncher.launchMultiple(appNames),
  getCommonApps: () => appLauncher.commonApps,
  createShortcut: (appName, commandName) => appLauncher.createShortcut(appName, commandName)
};
