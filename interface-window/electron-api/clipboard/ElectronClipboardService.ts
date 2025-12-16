import { clipboard, NativeImage, nativeImage } from 'electron';
import { IClipboardService, ClipboardData } from './IClipboardService';

export class ElectronClipboardService implements IClipboardService {
    public readText(type?: 'selection' | 'clipboard'): string {
        return clipboard.readText(type);
    }

    public readHTML(type?: 'selection' | 'clipboard'): string {
        return clipboard.readHTML(type);
    }

    /**
     * Read image from the OS clipboard.
     *
     * IMPORTANT:
     * - NativeImage objects cannot be sent over IPC / contextBridge (not structured-cloneable).
     * - We return a Data URL string instead so the renderer can preview + convert to File.
     */
    public readImage(type?: 'selection' | 'clipboard'): string | null {
        const img = clipboard.readImage(type);
        if (!img || img.isEmpty()) return null;
        return img.toDataURL();
    }

    public readRTF(type?: 'selection' | 'clipboard'): string {
        return clipboard.readRTF(type);
    }

    public readBookmark(): { title: string; url: string } {
        return clipboard.readBookmark();
    }

    public readFindText(): string {
        return clipboard.readFindText();
    }

    public readBuffer(format: string): Buffer {
        return clipboard.readBuffer(format);
    }

    public read(format: string): string {
        return clipboard.read(format) as string;
    }

    public availableFormats(type?: 'selection' | 'clipboard'): string[] {
        return clipboard.availableFormats(type);
    }

    public has(format: string, type?: 'selection' | 'clipboard'): boolean {
        return clipboard.has(format, type);
    }

    public writeText(text: string, type?: 'selection' | 'clipboard'): void {
        clipboard.writeText(text, type);
    }

    public writeHTML(markup: string, type?: 'selection' | 'clipboard'): void {
        clipboard.writeHTML(markup, type);
    }

    /**
     * Write an image to the OS clipboard.
     *
     * Accepts either a NativeImage (main-side) or a Data URL string (renderer-side).
     */
    public writeImage(image: NativeImage | string, type?: 'selection' | 'clipboard'): void {
        if (typeof image === 'string') {
            // Expect a data URL from the renderer (e.g. "data:image/png;base64,...")
            const img = nativeImage.createFromDataURL(image);
            clipboard.writeImage(img, type);
            return;
        }
        clipboard.writeImage(image, type);
    }

    public writeRTF(text: string, type?: 'selection' | 'clipboard'): void {
        clipboard.writeRTF(text, type);
    }

    public writeBookmark(title: string, url: string, type?: 'selection' | 'clipboard'): void {
        clipboard.writeBookmark(title, url, type);
    }

    public writeFindText(text: string): void {
        clipboard.writeFindText(text);
    }

    public writeBuffer(format: string, buffer: Buffer, type?: 'selection' | 'clipboard'): void {
        clipboard.writeBuffer(format, buffer, type);
    }

    public write(data: ClipboardData, type?: 'selection' | 'clipboard'): void {
        clipboard.write(data, type);
    }

    public clear(type?: 'selection' | 'clipboard'): void {
        clipboard.clear(type);
    }
}
