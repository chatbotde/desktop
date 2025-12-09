import 'electron';

export interface INativeImage {
    toPNG(options?: { scaleFactor?: number }): Buffer;
    toJPEG(quality: number): Buffer;
    toBitmap(options?: { scaleFactor?: number }): Buffer;
    toDataURL(options?: { scaleFactor?: number }): string;
    getBitmap(options?: { scaleFactor?: number }): Buffer;
    getNativeHandle(): Buffer;
    isEmpty(): boolean;
    getSize(scaleFactor?: number): Electron.Size;
    setTemplateImage(option: boolean): void;
    isTemplateImage(): boolean;
    crop(rect: Electron.Rectangle): INativeImage;
    resize(options: Electron.ResizeOptions): INativeImage;
    getAspectRatio(scaleFactor?: number): number;
    getScaleFactors(): number[];
    addRepresentation(options: Electron.AddRepresentationOptions): void;

    readonly isMacTemplateImage: boolean;
}

export interface INativeImageService {
    createEmpty(): INativeImage;
    createThumbnailFromPath(path: string, size: Electron.Size): Promise<INativeImage>;
    createFromPath(path: string): INativeImage;
    createFromBitmap(buffer: Buffer, options: Electron.CreateFromBitmapOptions): INativeImage;
    createFromBuffer(buffer: Buffer, options?: Electron.CreateFromBufferOptions): INativeImage;
    createFromDataURL(dataURL: string): INativeImage;
    createFromNamedImage(imageName: string, hslShift?: number[]): INativeImage;
}
