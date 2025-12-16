
import { NativeImage } from 'electron';

export interface ClipboardData {
    text?: string;
    html?: string;
    image?: NativeImage;
    rtf?: string;
    bookmark?: string; // The title of the URL at text.
}

export interface IClipboardReader {
    readText(type?: 'selection' | 'clipboard'): string;
    readHTML(type?: 'selection' | 'clipboard'): string;
    /**
     * Renderer-safe image read.
     * Returning NativeImage across IPC/contextBridge does not work, so we return a Data URL.
     */
    readImage(type?: 'selection' | 'clipboard'): string | null;
    readRTF(type?: 'selection' | 'clipboard'): string;
    readBookmark(): { title: string; url: string };
    readFindText(): string;
    readBuffer(format: string): Buffer;
    read(format: string): string;
    availableFormats(type?: 'selection' | 'clipboard'): string[];
    has(format: string, type?: 'selection' | 'clipboard'): boolean;
}

export interface IClipboardWriter {
    writeText(text: string, type?: 'selection' | 'clipboard'): void;
    writeHTML(markup: string, type?: 'selection' | 'clipboard'): void;
    /**
     * Accept a NativeImage (main) or a Data URL string (renderer).
     */
    writeImage(image: NativeImage | string, type?: 'selection' | 'clipboard'): void;
    writeRTF(text: string, type?: 'selection' | 'clipboard'): void;
    writeBookmark(title: string, url: string, type?: 'selection' | 'clipboard'): void;
    writeFindText(text: string): void;
    writeBuffer(format: string, buffer: Buffer, type?: 'selection' | 'clipboard'): void;
    write(data: ClipboardData, type?: 'selection' | 'clipboard'): void;
    clear(type?: 'selection' | 'clipboard'): void;
}

export interface IClipboardService extends IClipboardReader, IClipboardWriter { }
