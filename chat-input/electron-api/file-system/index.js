const { dialog, shell, app } = require('electron');
const fs = require('fs').promises;
const path = require('path');

/**
 * File System API Module
 * Provides file operations, dialogs, and path management
 */

/**
 * Open file dialog and read selected file
 * @param {Object} options - Dialog options
 * @returns {Promise<Object|null>} File info with path and content
 */
async function selectFile(options = {}) {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options.filters || [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ],
      defaultPath: options.defaultPath || app.getPath('documents')
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const stats = await fs.stat(filePath);
      
      return {
        filePath,
        fileName: path.basename(filePath),
        size: stats.size,
        extension: path.extname(filePath),
        directory: path.dirname(filePath)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error selecting file:', error);
    throw error;
  }
}

/**
 * Open multiple files dialog
 * @param {Object} options - Dialog options
 * @returns {Promise<Array|null>} Array of file info objects
 */
async function selectMultipleFiles(options = {}) {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: options.filters || [
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: options.defaultPath || app.getPath('documents')
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const files = await Promise.all(
        result.filePaths.map(async (filePath) => {
          const stats = await fs.stat(filePath);
          return {
            filePath,
            fileName: path.basename(filePath),
            size: stats.size,
            extension: path.extname(filePath),
            directory: path.dirname(filePath)
          };
        })
      );
      
      return files;
    }
    
    return null;
  } catch (error) {
    console.error('Error selecting multiple files:', error);
    throw error;
  }
}

/**
 * Open folder dialog
 * @param {Object} options - Dialog options
 * @returns {Promise<Object|null>} Folder info
 */
async function selectFolder(options = {}) {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: options.defaultPath || app.getPath('documents')
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      const stats = await fs.stat(folderPath);
      
      return {
        folderPath,
        folderName: path.basename(folderPath),
        size: stats.size,
        parent: path.dirname(folderPath)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error selecting folder:', error);
    throw error;
  }
}

/**
 * Save file dialog
 * @param {Object} options - Dialog options
 * @returns {Promise<string|null>} File path to save to
 */
async function saveFileDialog(options = {}) {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: options.defaultPath || path.join(app.getPath('documents'), 'untitled.txt'),
      filters: options.filters || [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      return result.filePath;
    }
    
    return null;
  } catch (error) {
    console.error('Error showing save dialog:', error);
    throw error;
  }
}

/**
 * Read file content
 * @param {string} filePath - Path to file
 * @param {string} encoding - File encoding (default: utf-8)
 * @returns {Promise<string>} File content
 */
async function readFile(filePath, encoding = 'utf-8') {
  try {
    const content = await fs.readFile(filePath, encoding);
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

/**
 * Read file as buffer (for binary files)
 * @param {string} filePath - Path to file
 * @returns {Promise<Buffer>} File buffer
 */
async function readFileBuffer(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error('Error reading file buffer:', error);
    throw error;
  }
}

/**
 * Write content to file
 * @param {string} filePath - Path to file
 * @param {string|Buffer} content - Content to write
 * @param {string} encoding - File encoding (default: utf-8)
 * @returns {Promise<boolean>} Success status
 */
async function writeFile(filePath, content, encoding = 'utf-8') {
  try {
    await fs.writeFile(filePath, content, encoding);
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
}

/**
 * Check if file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} Exists status
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} File stats
 */
async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    throw error;
  }
}

/**
 * List files in directory
 * @param {string} dirPath - Directory path
 * @returns {Promise<Array>} List of files
 */
async function listFiles(dirPath) {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      isFile: file.isFile(),
      isDirectory: file.isDirectory(),
      path: path.join(dirPath, file.name)
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

/**
 * Delete file
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} Success status
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Copy file
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {Promise<boolean>} Success status
 */
async function copyFile(sourcePath, destPath) {
  try {
    await fs.copyFile(sourcePath, destPath);
    return true;
  } catch (error) {
    console.error('Error copying file:', error);
    throw error;
  }
}

/**
 * Move/rename file
 * @param {string} oldPath - Old file path
 * @param {string} newPath - New file path
 * @returns {Promise<boolean>} Success status
 */
async function moveFile(oldPath, newPath) {
  try {
    await fs.rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    throw error;
  }
}

/**
 * Open file with default application
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Error message if failed, empty string if success
 */
async function openWithDefaultApp(filePath) {
  try {
    const error = await shell.openPath(filePath);
    if (error) {
      console.error('Error opening file:', error);
      return error;
    }
    return '';
  } catch (error) {
    console.error('Error opening file with default app:', error);
    throw error;
  }
}

/**
 * Show file in folder
 * @param {string} filePath - Path to file
 */
function showInFolder(filePath) {
  shell.showItemInFolder(filePath);
}

/**
 * Get common paths
 * @returns {Object} Common system paths
 */
function getCommonPaths() {
  return {
    home: app.getPath('home'),
    desktop: app.getPath('desktop'),
    documents: app.getPath('documents'),
    downloads: app.getPath('downloads'),
    pictures: app.getPath('pictures'),
    videos: app.getPath('videos'),
    music: app.getPath('music'),
    temp: app.getPath('temp'),
    appData: app.getPath('appData'),
    userData: app.getPath('userData')
  };
}

module.exports = {
  selectFile,
  selectMultipleFiles,
  selectFolder,
  saveFileDialog,
  readFile,
  readFileBuffer,
  writeFile,
  fileExists,
  getFileStats,
  listFiles,
  deleteFile,
  copyFile,
  moveFile,
  openWithDefaultApp,
  showInFolder,
  getCommonPaths
};
