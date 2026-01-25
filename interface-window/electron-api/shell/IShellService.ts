/**
 * Shell Service Interface
 * Provides shell-related functionality for opening external URLs, files, etc.
 */
export interface IShellService {
    /**
     * Open the given external URL in the desktop's default manner.
     * @param url - The URL to open
     * @returns A promise that resolves when the URL has been opened
     */
    openExternal(url: string): Promise<void>;

    /**
     * Open the given file in the desktop's default manner.
     * @param fullPath - The full path to the file
     * @returns A promise that resolves with an error message if failed
     */
    openPath(fullPath: string): Promise<string>;

    /**
     * Show the given file in a file manager. If possible, select the file.
     * @param fullPath - The full path to the file
     * @returns A promise that resolves when the file manager opens
     */
    showItemInFolder(fullPath: string): void;
}
