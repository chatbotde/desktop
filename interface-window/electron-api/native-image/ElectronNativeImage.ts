
import { nativeImage, NativeImage } from 'electron';
import { INativeImage, INativeImageService } from './INativeImage';

export class ElectronNativeImage implements INativeImage {
    private image: NativeImage;

    constructor(image: Electron.NativeImage) {
        this.image = image;
    }

    toPNG(options?: { scaleFactor?: number }): Buffer { return this.image.toPNG(options); }
    toJPEG(quality: number): Buffer { return this.image.toJPEG(quality); }
    toBitmap(options?: { scaleFactor?: number }): Buffer { return this.image.toBitmap(options); }
    toDataURL(options?: { scaleFactor?: number }): string { return this.image.toDataURL(options); }
    getBitmap(options?: { scaleFactor?: number }): Buffer { return this.image.toBitmap(options); }
    getNativeHandle(): Buffer { return this.image.getNativeHandle(); }
    isEmpty(): boolean { return this.image.isEmpty(); }
    getSize(scaleFactor?: number): Electron.Size { return this.image.getSize(scaleFactor); }
    setTemplateImage(option: boolean): void { this.image.setTemplateImage(option); }
    isTemplateImage(): boolean { return this.image.isTemplateImage(); }

    crop(rect: Electron.Rectangle): INativeImage {
        return new ElectronNativeImage(this.image.crop(rect));
    }

    resize(options: Electron.ResizeOptions): INativeImage {
        return new ElectronNativeImage(this.image.resize(options));
    }

    getAspectRatio(scaleFactor?: number): number { return this.image.getAspectRatio(scaleFactor); }
    getScaleFactors(): number[] { return this.image.getScaleFactors(); }
    addRepresentation(options: Electron.AddRepresentationOptions): void { this.image.addRepresentation(options); }

    get isMacTemplateImage(): boolean { return this.image.isMacTemplateImage; }

    // Internal getter
    public get nativeImage(): Electron.NativeImage { return this.image; }
}

export class ElectronNativeImageService implements INativeImageService {
    createEmpty(): INativeImage {
        return new ElectronNativeImage(nativeImage.createEmpty());
    }

    async createThumbnailFromPath(path: string, size: Electron.Size): Promise<INativeImage> {
        const img = await nativeImage.createThumbnailFromPath(path, size);
        return new ElectronNativeImage(img);
    }

    createFromPath(path: string): INativeImage {
        return new ElectronNativeImage(nativeImage.createFromPath(path));
    }

    createFromBitmap(buffer: Buffer, options: Electron.CreateFromBitmapOptions): INativeImage {
        return new ElectronNativeImage(nativeImage.createFromBitmap(buffer, options));
    }

    createFromBuffer(buffer: Buffer, options?: Electron.CreateFromBufferOptions): INativeImage {
        return new ElectronNativeImage(nativeImage.createFromBuffer(buffer, options));
    }

    createFromDataURL(dataURL: string): INativeImage {
        return new ElectronNativeImage(nativeImage.createFromDataURL(dataURL));
    }

    createFromNamedImage(imageName: string, hslShift?: number[]): INativeImage {
        return new ElectronNativeImage(nativeImage.createFromNamedImage(imageName, hslShift));
    }
}
