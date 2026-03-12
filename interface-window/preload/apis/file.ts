/**
 * File API
 * Provides file system operations
 */

import { ipcRenderer } from 'electron';
import { FileAPI } from '../types';

export function createFileAPI(): FileAPI {
    return {
        /**
         * Read file content
         * @param filePath - Path to the file
         * @returns File content result
         */
        readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),

        /**
         * Read file as binary (returns base64 data URL)
         * @param filePath - Path to the file
         * @returns Binary file result with data URL
         */
        readFileBinary: (filePath: string) => ipcRenderer.invoke('fs:read-file-binary', filePath),

        /**
         * Get file info without reading content
         * @param filePath - Path to the file
         * @returns File info result
         */
        getFileInfo: (filePath: string) => ipcRenderer.invoke('fs:get-file-info', filePath),

        /**
         * Check if file or directory exists
         * @param filePath - Path to check
         * @returns True if exists
         */
        exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),

        /**
         * Check if path is a file
         * @param filePath - Path to check
         * @returns True if is a file
         */
        isFile: (filePath: string) => ipcRenderer.invoke('fs:is-file', filePath),

        /**
         * Check if path is a directory
         * @param dirPath - Path to check
         * @returns True if is a directory
         */
        isDirectory: (dirPath: string) => ipcRenderer.invoke('fs:is-directory', dirPath),

        /**
         * Read directory contents
         * @param dirPath - Path to directory
         * @returns Directory contents
         */
        readDir: (dirPath: string) => ipcRenderer.invoke('fs:read-dir', dirPath),

        /**
         * Get file type category
         * @param filePath - Path to file
         * @returns Category string
         */
        getFileCategory: (filePath: string) => ipcRenderer.invoke('fs:get-file-category', filePath),

        /**
         * Get programming language from file
         * @param filePath - Path to file
         * @returns Language name or null
         */
        getFileLanguage: (filePath: string) => ipcRenderer.invoke('fs:get-file-language', filePath),

        /**
         * Get MIME type from file
         * @param filePath - Path to file
         * @returns MIME type or null
         */
        getMimeType: (filePath: string) => ipcRenderer.invoke('fs:get-mime-type', filePath),

        writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', filePath, content),
        writeFileBinary: (filePath: string, base64: string) => ipcRenderer.invoke('fs:write-file-binary', filePath, base64),
        mkdir: (dirPath: string, recursive: boolean = true) => ipcRenderer.invoke('fs:mkdir', dirPath, recursive),
    };
}

