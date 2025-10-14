const { shell, app } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Shell Integration API Module
 * Provides shell operations like opening files, folders, URLs with default apps
 */

/**
 * Open a file with the default application
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Empty string on success, error message on failure
 */
async function openFile(filePath) {
  try {
    const error = await shell.openPath(filePath);
    if (error) {
      console.error('Failed to open file:', error);
      return error;
    }
    return '';
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
}

/**
 * Open a URL in the default browser
 * @param {string} url - URL to open
 * @returns {Promise<void>}
 */
async function openExternal(url) {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error('Error opening URL:', error);
    throw error;
  }
}

/**
 * Show a file in the system file manager
 * @param {string} filePath - Path to file
 */
function showInFolder(filePath) {
  try {
    shell.showItemInFolder(filePath);
  } catch (error) {
    console.error('Error showing file in folder:', error);
    throw error;
  }
}

/**
 * Move a file to trash/recycle bin
 * @param {string} filePath - Path to file
 * @returns {Promise<void>}
 */
async function moveToTrash(filePath) {
  try {
    await shell.trashItem(filePath);
  } catch (error) {
    console.error('Error moving to trash:', error);
    throw error;
  }
}

/**
 * Beep sound
 */
function beep() {
  shell.beep();
}

/**
 * Write text to clipboard and perform paste
 * @param {string} text - Text to write
 */
function writeTextAndPaste(text) {
  // Note: This is a placeholder. Actual implementation would require
  // additional clipboard and keyboard simulation
  console.warn('writeTextAndPaste: Not fully implemented');
}

/**
 * Open a folder in the system file manager
 * @param {string} folderPath - Path to folder
 * @returns {Promise<string>} Empty string on success, error message on failure
 */
async function openFolder(folderPath) {
  return await openFile(folderPath);
}

/**
 * Get the default application for a file type
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Default app path
 */
async function getDefaultApp(filePath) {
  // Electron doesn't provide this directly, but we can infer from openPath behavior
  // This is a best-effort implementation
  const ext = path.extname(filePath).toLowerCase();
  
  if (process.platform === 'win32') {
    try {
      // Query Windows registry for default app
      const result = execSync(`assoc ${ext}`, { encoding: 'utf-8' }).trim();
      return result || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }
  
  return 'System Default';
}

/**
 * Open a path with a specific application
 * @param {string} filePath - Path to file
 * @param {string} appPath - Path to application
 * @returns {Promise<void>}
 */
async function openWith(filePath, appPath) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    if (process.platform === 'win32') {
      await execAsync(`"${appPath}" "${filePath}"`);
    } else if (process.platform === 'darwin') {
      await execAsync(`open -a "${appPath}" "${filePath}"`);
    } else {
      await execAsync(`"${appPath}" "${filePath}"`);
    }
  } catch (error) {
    console.error('Error opening with specific app:', error);
    throw error;
  }
}

/**
 * Open terminal/command prompt at a specific path
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function openTerminal(dirPath) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    if (process.platform === 'win32') {
      // Windows Command Prompt
      await execAsync(`start cmd /K cd /d "${dirPath}"`);
    } else if (process.platform === 'darwin') {
      // macOS Terminal
      await execAsync(`open -a Terminal "${dirPath}"`);
    } else {
      // Linux terminal (varies by distro)
      try {
        await execAsync(`gnome-terminal --working-directory="${dirPath}"`);
      } catch {
        try {
          await execAsync(`xterm -e "cd '${dirPath}' && bash"`);
        } catch {
          await execAsync(`x-terminal-emulator -e "cd '${dirPath}' && bash"`);
        }
      }
    }
  } catch (error) {
    console.error('Error opening terminal:', error);
    throw error;
  }
}

/**
 * Open PowerShell at a specific path (Windows only)
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function openPowerShell(dirPath) {
  if (process.platform !== 'win32') {
    throw new Error('PowerShell is only available on Windows');
  }
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    await execAsync(`start powershell -NoExit -Command "Set-Location '${dirPath}'"`);
  } catch (error) {
    console.error('Error opening PowerShell:', error);
    throw error;
  }
}

/**
 * Reveal app in system file manager
 */
function showAppInFolder() {
  const appPath = app.getPath('exe');
  shell.showItemInFolder(appPath);
}

/**
 * Open app data folder
 * @returns {Promise<string>}
 */
async function openAppDataFolder() {
  const appDataPath = app.getPath('userData');
  return await openFolder(appDataPath);
}

/**
 * Open logs folder
 * @returns {Promise<string>}
 */
async function openLogsFolder() {
  const logsPath = app.getPath('logs');
  return await openFolder(logsPath);
}

/**
 * Execute a shell command
 * @param {string} command - Command to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Result with stdout and stderr
 */
async function executeCommand(command, options = {}) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const result = await execAsync(command, {
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 30000,
      maxBuffer: options.maxBuffer || 1024 * 1024
    });
    
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      error: error.message
    };
  }
}

/**
 * Check if a command exists in PATH
 * @param {string} command - Command name
 * @returns {Promise<boolean>}
 */
async function commandExists(command) {
  try {
    const checkCommand = process.platform === 'win32' 
      ? `where ${command}`
      : `which ${command}`;
    
    execSync(checkCommand, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment variables
 * @returns {Object} Environment variables
 */
function getEnvironment() {
  return process.env;
}

/**
 * Get system PATH
 * @returns {Array<string>} Array of PATH directories
 */
function getSystemPath() {
  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  return (process.env.PATH || '').split(pathSeparator).filter(Boolean);
}

/**
 * Internal helper: safe file existence check
 * @param {string} p
 * @returns {boolean}
 */
function fileExists(p) {
  if (!p) return false;
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

/**
 * Get a heuristic list of installed common desktop applications on the current platform.
 * This does NOT scan the whole drive; it only checks a curated list of well-known paths.
 * @returns {Array<{ name: string, path: string }>} applications found
 */
function getAvailableApplications() {
  const results = [];
  const platform = process.platform;
  const env = process.env;

  /**
   * Add a candidate with multiple possible paths.
   * @param {string} name
   * @param {string[]} paths
   */
  function addCandidate(name, paths) {
    const found = paths.find(p => fileExists(p));
    if (found) results.push({ name, path: found });
  }

  if (platform === 'win32') {
    const pf = env['PROGRAMFILES'] || 'C\\Program Files';
    const pf86 = env['PROGRAMFILES(X86)'] || 'C\\Program Files (x86)';
    const local = env['LOCALAPPDATA'];
    const windir = env['WINDIR'] || 'C\\Windows';

    addCandidate('chrome', [
      `${pf}\\Google\\Chrome\\Application\\chrome.exe`,
      `${pf86}\\Google\\Chrome\\Application\\chrome.exe`,
      local && `${local}\\Google\\Chrome\\Application\\chrome.exe`
    ]);
    addCandidate('edge', [
      `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${pf86}\\Microsoft\\Edge\\Application\\msedge.exe`
    ]);
    addCandidate('firefox', [
      `${pf}\\Mozilla Firefox\\firefox.exe`,
      `${pf86}\\Mozilla Firefox\\firefox.exe`
    ]);
    addCandidate('vscode', [
      `${pf}\\Microsoft VS Code\\Code.exe`,
      `${pf86}\\Microsoft VS Code\\Code.exe`,
      local && `${local}\\Programs\\Microsoft VS Code\\Code.exe`
    ]);
    addCandidate('notepad++', [
      `${pf}\\Notepad++\\notepad++.exe`,
      `${pf86}\\Notepad++\\notepad++.exe`
    ]);
    addCandidate('git-bash', [
      `${pf}\\Git\\git-bash.exe`,
      `${pf86}\\Git\\git-bash.exe`
    ]);
    addCandidate('notepad', [
      `${windir}\\System32\\notepad.exe`
    ]);
    addCandidate('powershell', [
      `${windir}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
    ]);
    addCandidate('windows-terminal', [
      local && `${local}\\Microsoft\\WindowsApps\\wt.exe`
    ]);
    addCandidate('slack', [
      local && `${local}\\slack\\slack.exe`,
      `${pf}\\Slack\\slack.exe`,
      `${pf86}\\Slack\\slack.exe`
    ]);
    addCandidate('discord', [
      local && `${local}\\Discord\\Discord.exe`,
      local && `${local}\\Discord\\Update.exe`
    ]);
    addCandidate('teams', [
      local && `${local}\\Microsoft\\Teams\\current\\Teams.exe`
    ]);
    addCandidate('node', [
      `${pf}\\nodejs\\node.exe`,
      `${pf86}\\nodejs\\node.exe`
    ]);
    addCandidate('explorer', [
      `${windir}\\explorer.exe`
    ]);
  } else if (platform === 'darwin') {
    addCandidate('chrome', ['/Applications/Google Chrome.app']);
    addCandidate('firefox', ['/Applications/Firefox.app']);
    addCandidate('safari', ['/Applications/Safari.app']);
    addCandidate('vscode', ['/Applications/Visual Studio Code.app']);
    addCandidate('iterm', ['/Applications/iTerm.app']);
    addCandidate('terminal', ['/System/Applications/Utilities/Terminal.app']);
    addCandidate('slack', ['/Applications/Slack.app']);
    addCandidate('discord', ['/Applications/Discord.app']);
    addCandidate('node', ['/usr/local/bin/node', '/opt/homebrew/bin/node']);
  } else { // linux
    addCandidate('chrome', ['/usr/bin/google-chrome', '/usr/bin/chromium']);
    addCandidate('firefox', ['/usr/bin/firefox']);
    addCandidate('vscode', ['/usr/bin/code']);
    addCandidate('gnome-terminal', ['/usr/bin/gnome-terminal']);
    addCandidate('xterm', ['/usr/bin/xterm']);
    addCandidate('slack', ['/usr/bin/slack']);
    addCandidate('discord', ['/usr/bin/discord']);
    addCandidate('node', ['/usr/bin/node']);
    addCandidate('python', ['/usr/bin/python3', '/usr/bin/python']);
  }

  return results;
}

module.exports = {
  // File operations
  openFile,
  openFolder,
  showInFolder,
  moveToTrash,
  
  // External operations
  openExternal,
  openWith,
  getDefaultApp,
  
  // Terminal operations
  openTerminal,
  openPowerShell,
  
  // App operations
  showAppInFolder,
  openAppDataFolder,
  openLogsFolder,
  
  // Command execution
  executeCommand,
  commandExists,
  
  // System info
  getEnvironment,
  getSystemPath,
  
  // Misc
  beep,

  // Applications
  getAvailableApplications
};
