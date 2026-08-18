/**
 * File System IPC Handlers
 * Exposes file system operations to the renderer process
 */

import { ipcMain, app } from 'electron';
import { promises as fsp } from 'fs';
import * as nodePath from 'path';

type FileTypeCategoryValue =
    | 'code'
    | 'image'
    | 'document'
    | 'audio'
    | 'video'
    | 'archive'
    | 'config'
    | 'data'
    | 'font'
    | 'other';

const { fileSystem, FileTypeCategory } = require('../../../../utils/dist/file-system') as {
    fileSystem: any;
    FileTypeCategory: Record<string, FileTypeCategoryValue>;
};

/**
 * File info returned to renderer
 */
export interface FileInfo {
    path: string;
    name: string;
    extension: string;
    size: number;
    category: FileTypeCategoryValue;
    language?: string;
    mimeType?: string;
    description?: string;
    isCodeFile: boolean;
    isImageFile: boolean;
    isDocumentFile: boolean;
}

/**
 * A single entry returned when listing a directory.
 */
export interface DirEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    extension: string;
    modified: number;
}

/**
 * A quick-access location (Home, Desktop, Downloads, etc.).
 */
export interface QuickPath {
    id: string;
    label: string;
    path: string;
}

/**
 * File content result
 */
export interface FileContentResult {
    success: boolean;
    content?: string;
    error?: string;
    fileInfo?: FileInfo;
}

/**
 * Register all file system IPC handlers
 */
export function registerFileSystemHandlers(): void {
    console.log('[FileSystem] Registering IPC handlers...');

    /**
     * Read file content
     */
    ipcMain.handle('fs:read-file', async (_event, filePath: string): Promise<FileContentResult> => {
        try {
            const content = await fileSystem.readFile(filePath);
            const fileType = fileSystem.getFileType(filePath);

            return {
                success: true,
                content,
                fileInfo: {
                    path: filePath,
                    name: fileSystem.basename(filePath),
                    extension: fileSystem.extname(filePath),
                    size: (await fileSystem.stat(filePath)).size,
                    category: fileType?.category || FileTypeCategory.OTHER,
                    language: fileType?.language,
                    mimeType: fileType?.mimeType,
                    description: fileType?.description,
                    isCodeFile: fileSystem.isCodeFile(filePath),
                    isImageFile: fileSystem.isImageFile(filePath),
                    isDocumentFile: fileSystem.isDocumentFile(filePath),
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });

    /**
     * Read file as binary (returns base64)
     */
    ipcMain.handle('fs:read-file-binary', async (_event, filePath: string): Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }> => {
        try {
            const buffer = await require('fs/promises').readFile(filePath);
            const base64 = buffer.toString('base64');
            const fileType = fileSystem.getFileType(filePath);
            const mimeType = fileType?.mimeType || 'application/octet-stream';

            return {
                success: true,
                data: `data:${mimeType};base64,${base64}`,
                mimeType
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });

    /**
     * Get file info without reading content
     */
    ipcMain.handle('fs:get-file-info', async (_event, filePath: string): Promise<{ success: boolean; fileInfo?: FileInfo; error?: string }> => {
        try {
            const stats = await fileSystem.stat(filePath);
            const fileType = fileSystem.getFileType(filePath);

            return {
                success: true,
                fileInfo: {
                    path: filePath,
                    name: fileSystem.basename(filePath),
                    extension: fileSystem.extname(filePath),
                    size: stats.size,
                    category: fileType?.category || FileTypeCategory.OTHER,
                    language: fileType?.language,
                    mimeType: fileType?.mimeType,
                    description: fileType?.description,
                    isCodeFile: fileSystem.isCodeFile(filePath),
                    isImageFile: fileSystem.isImageFile(filePath),
                    isDocumentFile: fileSystem.isDocumentFile(filePath),
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });

    /**
     * Check if file exists
     */
    ipcMain.handle('fs:exists', async (_event, filePath: string): Promise<boolean> => {
        return fileSystem.exists(filePath);
    });

    /**
     * Check if path is a file
     */
    ipcMain.handle('fs:is-file', async (_event, filePath: string): Promise<boolean> => {
        return fileSystem.isFile(filePath);
    });

    /**
     * Check if path is a directory
     */
    ipcMain.handle('fs:is-directory', async (_event, dirPath: string): Promise<boolean> => {
        return fileSystem.isDirectory(dirPath);
    });

    /**
     * Read directory contents
     */
    ipcMain.handle('fs:read-dir', async (_event, dirPath: string): Promise<{ success: boolean; files?: string[]; error?: string }> => {
        try {
            const files = await fileSystem.readdir(dirPath);
            return { success: true, files };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });

    /**
     * List directory contents with rich metadata (used by the in-app file picker).
     * Returns directories first, then files, both sorted alphabetically.
     */
    ipcMain.handle('fs:list-dir', async (_event, dirPath: string): Promise<{ success: boolean; path?: string; parent?: string | null; entries?: DirEntry[]; error?: string }> => {
        try {
            const dirents = await fsp.readdir(dirPath, { withFileTypes: true });
            const entries: DirEntry[] = [];

            for (const dirent of dirents) {
                // Skip hidden / system files (those beginning with a dot).
                if (dirent.name.startsWith('.')) continue;

                const fullPath = nodePath.join(dirPath, dirent.name);
                let isDirectory = dirent.isDirectory();
                let size = 0;
                let modified = 0;

                try {
                    const stats = await fsp.stat(fullPath);
                    isDirectory = stats.isDirectory();
                    size = stats.size;
                    modified = stats.mtimeMs;
                } catch {
                    // Unreadable entry (permissions, broken symlink) — keep best-effort defaults.
                }

                entries.push({
                    name: dirent.name,
                    path: fullPath,
                    isDirectory,
                    size,
                    extension: isDirectory ? '' : nodePath.extname(dirent.name).toLowerCase(),
                    modified,
                });
            }

            entries.sort((a, b) => {
                if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            });

            const parent = nodePath.dirname(dirPath);
            return {
                success: true,
                path: dirPath,
                parent: parent === dirPath ? null : parent,
                entries,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    });

    /**
     * Return quick-access locations for the in-app file picker.
     */
    ipcMain.handle('fs:quick-paths', async (): Promise<{ success: boolean; paths?: QuickPath[]; error?: string }> => {
        try {
            const candidates: Array<{ id: string; label: string; key: Parameters<typeof app.getPath>[0] }> = [
                { id: 'home', label: 'Home', key: 'home' },
                { id: 'desktop', label: 'Desktop', key: 'desktop' },
                { id: 'downloads', label: 'Downloads', key: 'downloads' },
                { id: 'documents', label: 'Documents', key: 'documents' },
                { id: 'pictures', label: 'Pictures', key: 'pictures' },
                { id: 'music', label: 'Music', key: 'music' },
                { id: 'videos', label: 'Videos', key: 'videos' },
            ];

            const paths: QuickPath[] = [];
            for (const candidate of candidates) {
                try {
                    const resolved = app.getPath(candidate.key);
                    if (resolved) {
                        paths.push({ id: candidate.id, label: candidate.label, path: resolved });
                    }
                } catch {
                    // Some platforms don't define every well-known path — skip those.
                }
            }

            return { success: true, paths };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    });

    /**
     * Get file type category
     */
    ipcMain.handle('fs:get-file-category', (_event, filePath: string): FileTypeCategoryValue => {
        return fileSystem.getFileCategory(filePath);
    });

    /**
     * Get programming language from file
     */
    ipcMain.handle('fs:get-file-language', (_event, filePath: string): string | null => {
        return fileSystem.getFileLanguage(filePath);
    });

    /**
     * Get MIME type from file
     */
    ipcMain.handle('fs:get-mime-type', (_event, filePath: string): string | null => {
        return fileSystem.getMimeType(filePath);
    });

    /**
     * Write file content
     */
    ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string): Promise<{ success: boolean; error?: string }> => {
        try {
            await fileSystem.writeFile(filePath, content);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });

    /**
     * Write file as binary (from base64)
     */
    ipcMain.handle('fs:write-file-binary', async (_event, filePath: string, base64: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const data = base64.replace(/^data:.*?;base64,/, '');
            const buffer = Buffer.from(data, 'base64');
            await fileSystem.writeFile(filePath, buffer);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });

    /**
     * Create directory
     */
    ipcMain.handle('fs:mkdir', async (_event, dirPath: string, recursive: boolean = true): Promise<{ success: boolean; error?: string }> => {
        try {
            await fileSystem.mkdir(dirPath, recursive);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });


    console.log('[FileSystem] IPC handlers registered successfully');
}
