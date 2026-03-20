import * as fs from 'fs';
export declare enum FileTypeCategory {
    CODE = "code",
    IMAGE = "image",
    DOCUMENT = "document",
    AUDIO = "audio",
    VIDEO = "video",
    ARCHIVE = "archive",
    CONFIG = "config",
    DATA = "data",
    FONT = "font",
    OTHER = "other"
}
export interface FileTypeInfo {
    extension: string;
    category: FileTypeCategory;
    language?: string;
    mimeType?: string;
    description?: string;
}
export declare class FileSystem {
    private readonly fileTypeMap;
    constructor();
    readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
    writeFile(filePath: string, content: string | Buffer): Promise<void>;
    mkdir(dirPath: string, recursive?: boolean): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    readdir(dirPath: string): Promise<string[]>;
    stat(filePath: string): Promise<fs.Stats>;
    isFile(filePath: string): Promise<boolean>;
    isDirectory(dirPath: string): Promise<boolean>;
    basename(filePath: string, ext?: string): string;
    extname(filePath: string): string;
    getFileType(filePath: string): FileTypeInfo | null;
    getFileCategory(filePath: string): FileTypeCategory;
    getFileLanguage(filePath: string): string | null;
    isCodeFile(filePath: string): boolean;
    isImageFile(filePath: string): boolean;
    isDocumentFile(filePath: string): boolean;
    getMimeType(filePath: string): string | null;
}
export declare const fileSystem: FileSystem;
