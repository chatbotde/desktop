import { shell } from 'electron';
import { IShellService } from './IShellService';

export class ElectronShellService implements IShellService {
    public async openExternal(url: string): Promise<void> {
        // Validate URL to prevent security issues
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL provided');
        }

        // Only allow http, https, and mailto protocols
        const allowedProtocols = ['http:', 'https:', 'mailto:'];
        try {
            const parsedUrl = new URL(url);
            if (!allowedProtocols.includes(parsedUrl.protocol)) {
                throw new Error(`Protocol ${parsedUrl.protocol} is not allowed`);
            }
        } catch (e) {
            throw new Error(`Invalid URL: ${url}`);
        }

        return shell.openExternal(url);
    }

    public async openPath(fullPath: string): Promise<string> {
        if (!fullPath || typeof fullPath !== 'string') {
            throw new Error('Invalid path provided');
        }
        return shell.openPath(fullPath);
    }

    public showItemInFolder(fullPath: string): void {
        if (!fullPath || typeof fullPath !== 'string') {
            throw new Error('Invalid path provided');
        }
        shell.showItemInFolder(fullPath);
    }
}
