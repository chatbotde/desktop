import { clipboard, NativeImage } from 'electron';
import { IClipboardService, ClipboardData } from './IClipboardService';

export class ElectronClipboardService implements IClipboardService {
    public readText(type?: 'selection' | 'clipboard'): string {
        return clipboard.readText(type);
    }

    public readHTML(type?: 'selection' | 'clipboard'): string {
        return clipboard.readHTML(type);
    }

    public readImage(type?: 'selection' | 'clipboard'): NativeImage {
        return clipboard.readImage(type);
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

    public writeImage(image: NativeImage, type?: 'selection' | 'clipboard'): void {
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
