"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileSystem = exports.FileSystem = exports.FileTypeCategory = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const fsPromises = tslib_1.__importStar(require("fs/promises"));
const path = tslib_1.__importStar(require("path"));
var FileTypeCategory;
(function (FileTypeCategory) {
    FileTypeCategory["CODE"] = "code";
    FileTypeCategory["IMAGE"] = "image";
    FileTypeCategory["DOCUMENT"] = "document";
    FileTypeCategory["AUDIO"] = "audio";
    FileTypeCategory["VIDEO"] = "video";
    FileTypeCategory["ARCHIVE"] = "archive";
    FileTypeCategory["CONFIG"] = "config";
    FileTypeCategory["DATA"] = "data";
    FileTypeCategory["FONT"] = "font";
    FileTypeCategory["OTHER"] = "other";
})(FileTypeCategory || (exports.FileTypeCategory = FileTypeCategory = {}));
class FileSystem {
    fileTypeMap = new Map([
        { extension: '.js', category: FileTypeCategory.CODE, language: 'javascript', mimeType: 'text/javascript', description: 'JavaScript file' },
        { extension: '.jsx', category: FileTypeCategory.CODE, language: 'javascript', mimeType: 'text/javascript', description: 'JavaScript React file' },
        { extension: '.ts', category: FileTypeCategory.CODE, language: 'typescript', mimeType: 'text/typescript', description: 'TypeScript file' },
        { extension: '.tsx', category: FileTypeCategory.CODE, language: 'typescript', mimeType: 'text/typescript', description: 'TypeScript React file' },
        { extension: '.mjs', category: FileTypeCategory.CODE, language: 'javascript', mimeType: 'text/javascript', description: 'ES Module JavaScript file' },
        { extension: '.cjs', category: FileTypeCategory.CODE, language: 'javascript', mimeType: 'text/javascript', description: 'CommonJS JavaScript file' },
        { extension: '.html', category: FileTypeCategory.CODE, language: 'html', mimeType: 'text/html', description: 'HTML file' },
        { extension: '.htm', category: FileTypeCategory.CODE, language: 'html', mimeType: 'text/html', description: 'HTML file' },
        { extension: '.css', category: FileTypeCategory.CODE, language: 'css', mimeType: 'text/css', description: 'CSS file' },
        { extension: '.scss', category: FileTypeCategory.CODE, language: 'scss', mimeType: 'text/x-scss', description: 'SCSS file' },
        { extension: '.sass', category: FileTypeCategory.CODE, language: 'sass', mimeType: 'text/x-sass', description: 'SASS file' },
        { extension: '.less', category: FileTypeCategory.CODE, language: 'less', mimeType: 'text/x-less', description: 'LESS file' },
        { extension: '.json', category: FileTypeCategory.CODE, language: 'json', mimeType: 'application/json', description: 'JSON file' },
        { extension: '.xml', category: FileTypeCategory.CODE, language: 'xml', mimeType: 'application/xml', description: 'XML file' },
        { extension: '.py', category: FileTypeCategory.CODE, language: 'python', mimeType: 'text/x-python', description: 'Python file' },
        { extension: '.pyw', category: FileTypeCategory.CODE, language: 'python', mimeType: 'text/x-python', description: 'Python script file' },
        { extension: '.pyi', category: FileTypeCategory.CODE, language: 'python', mimeType: 'text/x-python', description: 'Python stub file' },
        { extension: '.java', category: FileTypeCategory.CODE, language: 'java', mimeType: 'text/x-java-source', description: 'Java file' },
        { extension: '.class', category: FileTypeCategory.CODE, language: 'java', mimeType: 'application/java-vm', description: 'Java class file' },
        { extension: '.jar', category: FileTypeCategory.ARCHIVE, language: 'java', mimeType: 'application/java-archive', description: 'Java archive' },
        { extension: '.c', category: FileTypeCategory.CODE, language: 'c', mimeType: 'text/x-c', description: 'C file' },
        { extension: '.cpp', category: FileTypeCategory.CODE, language: 'cpp', mimeType: 'text/x-c++src', description: 'C++ file' },
        { extension: '.cc', category: FileTypeCategory.CODE, language: 'cpp', mimeType: 'text/x-c++src', description: 'C++ file' },
        { extension: '.cxx', category: FileTypeCategory.CODE, language: 'cpp', mimeType: 'text/x-c++src', description: 'C++ file' },
        { extension: '.h', category: FileTypeCategory.CODE, language: 'c', mimeType: 'text/x-c', description: 'C header file' },
        { extension: '.hpp', category: FileTypeCategory.CODE, language: 'cpp', mimeType: 'text/x-c++hdr', description: 'C++ header file' },
        { extension: '.cs', category: FileTypeCategory.CODE, language: 'csharp', mimeType: 'text/x-csharp', description: 'C# file' },
        { extension: '.go', category: FileTypeCategory.CODE, language: 'go', mimeType: 'text/x-go', description: 'Go file' },
        { extension: '.rs', category: FileTypeCategory.CODE, language: 'rust', mimeType: 'text/x-rust', description: 'Rust file' },
        { extension: '.php', category: FileTypeCategory.CODE, language: 'php', mimeType: 'text/x-php', description: 'PHP file' },
        { extension: '.phtml', category: FileTypeCategory.CODE, language: 'php', mimeType: 'text/x-php', description: 'PHP template file' },
        { extension: '.rb', category: FileTypeCategory.CODE, language: 'ruby', mimeType: 'text/x-ruby', description: 'Ruby file' },
        { extension: '.swift', category: FileTypeCategory.CODE, language: 'swift', mimeType: 'text/x-swift', description: 'Swift file' },
        { extension: '.kt', category: FileTypeCategory.CODE, language: 'kotlin', mimeType: 'text/x-kotlin', description: 'Kotlin file' },
        { extension: '.kts', category: FileTypeCategory.CODE, language: 'kotlin', mimeType: 'text/x-kotlin', description: 'Kotlin script file' },
        { extension: '.sh', category: FileTypeCategory.CODE, language: 'bash', mimeType: 'text/x-sh', description: 'Shell script' },
        { extension: '.bash', category: FileTypeCategory.CODE, language: 'bash', mimeType: 'text/x-sh', description: 'Bash script' },
        { extension: '.zsh', category: FileTypeCategory.CODE, language: 'zsh', mimeType: 'text/x-sh', description: 'Zsh script' },
        { extension: '.ps1', category: FileTypeCategory.CODE, language: 'powershell', mimeType: 'text/x-powershell', description: 'PowerShell script' },
        { extension: '.bat', category: FileTypeCategory.CODE, language: 'batch', mimeType: 'application/x-msdos-program', description: 'Batch file' },
        { extension: '.cmd', category: FileTypeCategory.CODE, language: 'batch', mimeType: 'application/x-msdos-program', description: 'Command file' },
        { extension: '.sql', category: FileTypeCategory.CODE, language: 'sql', mimeType: 'application/sql', description: 'SQL file' },
        { extension: '.md', category: FileTypeCategory.CODE, language: 'markdown', mimeType: 'text/markdown', description: 'Markdown file' },
        { extension: '.markdown', category: FileTypeCategory.CODE, language: 'markdown', mimeType: 'text/markdown', description: 'Markdown file' },
        { extension: '.yaml', category: FileTypeCategory.CODE, language: 'yaml', mimeType: 'application/x-yaml', description: 'YAML file' },
        { extension: '.yml', category: FileTypeCategory.CODE, language: 'yaml', mimeType: 'application/x-yaml', description: 'YAML file' },
        { extension: '.toml', category: FileTypeCategory.CODE, language: 'toml', mimeType: 'application/toml', description: 'TOML file' },
        { extension: '.lua', category: FileTypeCategory.CODE, language: 'lua', mimeType: 'text/x-lua', description: 'Lua file' },
        { extension: '.r', category: FileTypeCategory.CODE, language: 'r', mimeType: 'text/x-r', description: 'R file' },
        { extension: '.dart', category: FileTypeCategory.CODE, language: 'dart', mimeType: 'application/dart', description: 'Dart file' },
        { extension: '.vue', category: FileTypeCategory.CODE, language: 'vue', mimeType: 'text/x-vue', description: 'Vue component file' },
        { extension: '.svelte', category: FileTypeCategory.CODE, language: 'svelte', mimeType: 'text/x-svelte', description: 'Svelte component file' },
        { extension: '.jpg', category: FileTypeCategory.IMAGE, mimeType: 'image/jpeg', description: 'JPEG image' },
        { extension: '.jpeg', category: FileTypeCategory.IMAGE, mimeType: 'image/jpeg', description: 'JPEG image' },
        { extension: '.png', category: FileTypeCategory.IMAGE, mimeType: 'image/png', description: 'PNG image' },
        { extension: '.gif', category: FileTypeCategory.IMAGE, mimeType: 'image/gif', description: 'GIF image' },
        { extension: '.bmp', category: FileTypeCategory.IMAGE, mimeType: 'image/bmp', description: 'Bitmap image' },
        { extension: '.svg', category: FileTypeCategory.IMAGE, mimeType: 'image/svg+xml', description: 'SVG image' },
        { extension: '.webp', category: FileTypeCategory.IMAGE, mimeType: 'image/webp', description: 'WebP image' },
        { extension: '.ico', category: FileTypeCategory.IMAGE, mimeType: 'image/x-icon', description: 'Icon file' },
        { extension: '.tiff', category: FileTypeCategory.IMAGE, mimeType: 'image/tiff', description: 'TIFF image' },
        { extension: '.tif', category: FileTypeCategory.IMAGE, mimeType: 'image/tiff', description: 'TIFF image' },
        { extension: '.pdf', category: FileTypeCategory.DOCUMENT, mimeType: 'application/pdf', description: 'PDF document' },
        { extension: '.doc', category: FileTypeCategory.DOCUMENT, mimeType: 'application/msword', description: 'Word document' },
        { extension: '.docx', category: FileTypeCategory.DOCUMENT, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Word document' },
        { extension: '.xls', category: FileTypeCategory.DOCUMENT, mimeType: 'application/vnd.ms-excel', description: 'Excel spreadsheet' },
        { extension: '.xlsx', category: FileTypeCategory.DOCUMENT, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Excel spreadsheet' },
        { extension: '.ppt', category: FileTypeCategory.DOCUMENT, mimeType: 'application/vnd.ms-powerpoint', description: 'PowerPoint presentation' },
        { extension: '.pptx', category: FileTypeCategory.DOCUMENT, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', description: 'PowerPoint presentation' },
        { extension: '.txt', category: FileTypeCategory.DOCUMENT, mimeType: 'text/plain', description: 'Text file' },
        { extension: '.rtf', category: FileTypeCategory.DOCUMENT, mimeType: 'application/rtf', description: 'Rich text file' },
        { extension: '.odt', category: FileTypeCategory.DOCUMENT, mimeType: 'application/vnd.oasis.opendocument.text', description: 'OpenDocument text' },
        { extension: '.mp3', category: FileTypeCategory.AUDIO, mimeType: 'audio/mpeg', description: 'MP3 audio' },
        { extension: '.wav', category: FileTypeCategory.AUDIO, mimeType: 'audio/wav', description: 'WAV audio' },
        { extension: '.flac', category: FileTypeCategory.AUDIO, mimeType: 'audio/flac', description: 'FLAC audio' },
        { extension: '.aac', category: FileTypeCategory.AUDIO, mimeType: 'audio/aac', description: 'AAC audio' },
        { extension: '.ogg', category: FileTypeCategory.AUDIO, mimeType: 'audio/ogg', description: 'OGG audio' },
        { extension: '.m4a', category: FileTypeCategory.AUDIO, mimeType: 'audio/mp4', description: 'M4A audio' },
        { extension: '.mp4', category: FileTypeCategory.VIDEO, mimeType: 'video/mp4', description: 'MP4 video' },
        { extension: '.avi', category: FileTypeCategory.VIDEO, mimeType: 'video/x-msvideo', description: 'AVI video' },
        { extension: '.mov', category: FileTypeCategory.VIDEO, mimeType: 'video/quicktime', description: 'QuickTime video' },
        { extension: '.wmv', category: FileTypeCategory.VIDEO, mimeType: 'video/x-ms-wmv', description: 'WMV video' },
        { extension: '.flv', category: FileTypeCategory.VIDEO, mimeType: 'video/x-flv', description: 'Flash video' },
        { extension: '.webm', category: FileTypeCategory.VIDEO, mimeType: 'video/webm', description: 'WebM video' },
        { extension: '.mkv', category: FileTypeCategory.VIDEO, mimeType: 'video/x-matroska', description: 'Matroska video' },
        { extension: '.zip', category: FileTypeCategory.ARCHIVE, mimeType: 'application/zip', description: 'ZIP archive' },
        { extension: '.rar', category: FileTypeCategory.ARCHIVE, mimeType: 'application/x-rar-compressed', description: 'RAR archive' },
        { extension: '.7z', category: FileTypeCategory.ARCHIVE, mimeType: 'application/x-7z-compressed', description: '7z archive' },
        { extension: '.tar', category: FileTypeCategory.ARCHIVE, mimeType: 'application/x-tar', description: 'TAR archive' },
        { extension: '.gz', category: FileTypeCategory.ARCHIVE, mimeType: 'application/gzip', description: 'Gzip archive' },
        { extension: '.bz2', category: FileTypeCategory.ARCHIVE, mimeType: 'application/x-bzip2', description: 'Bzip2 archive' },
        { extension: '.ini', category: FileTypeCategory.CONFIG, mimeType: 'text/plain', description: 'INI configuration file' },
        { extension: '.conf', category: FileTypeCategory.CONFIG, mimeType: 'text/plain', description: 'Configuration file' },
        { extension: '.config', category: FileTypeCategory.CONFIG, mimeType: 'text/plain', description: 'Configuration file' },
        { extension: '.env', category: FileTypeCategory.CONFIG, mimeType: 'text/plain', description: 'Environment variables file' },
        { extension: '.csv', category: FileTypeCategory.DATA, mimeType: 'text/csv', description: 'CSV data file' },
        { extension: '.xlsx', category: FileTypeCategory.DATA, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Excel spreadsheet' },
        { extension: '.db', category: FileTypeCategory.DATA, mimeType: 'application/x-sqlite3', description: 'Database file' },
        { extension: '.sqlite', category: FileTypeCategory.DATA, mimeType: 'application/x-sqlite3', description: 'SQLite database' },
        { extension: '.sqlite3', category: FileTypeCategory.DATA, mimeType: 'application/x-sqlite3', description: 'SQLite database' },
        { extension: '.ttf', category: FileTypeCategory.FONT, mimeType: 'font/ttf', description: 'TrueType font' },
        { extension: '.otf', category: FileTypeCategory.FONT, mimeType: 'font/otf', description: 'OpenType font' },
        { extension: '.woff', category: FileTypeCategory.FONT, mimeType: 'font/woff', description: 'WOFF font' },
        { extension: '.woff2', category: FileTypeCategory.FONT, mimeType: 'font/woff2', description: 'WOFF2 font' },
        { extension: '.eot', category: FileTypeCategory.FONT, mimeType: 'application/vnd.ms-fontobject', description: 'Embedded OpenType font' }
    ].map(info => [info.extension.toLowerCase(), info]));
    constructor() {
    }
    async readFile(filePath, encoding = 'utf8') {
        try {
            const content = await fsPromises.readFile(filePath, encoding);
            return content;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read file "${filePath}": ${errorMessage}`);
        }
    }
    async writeFile(filePath, content) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                await fsPromises.mkdir(dir, { recursive: true });
            }
            await fsPromises.writeFile(filePath, content);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to write file "${filePath}": ${errorMessage}`);
        }
    }
    async mkdir(dirPath, recursive = true) {
        try {
            await fsPromises.mkdir(dirPath, { recursive });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to create directory "${dirPath}": ${errorMessage}`);
        }
    }
    async exists(filePath) {
        try {
            await fsPromises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async readdir(dirPath) {
        try {
            return await fsPromises.readdir(dirPath);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read directory "${dirPath}": ${errorMessage}`);
        }
    }
    async stat(filePath) {
        try {
            return await fsPromises.stat(filePath);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get stats for "${filePath}": ${errorMessage}`);
        }
    }
    async isFile(filePath) {
        try {
            const stats = await this.stat(filePath);
            return stats.isFile();
        }
        catch {
            return false;
        }
    }
    async isDirectory(dirPath) {
        try {
            const stats = await this.stat(dirPath);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
    basename(filePath, ext) {
        return path.basename(filePath, ext);
    }
    extname(filePath) {
        return path.extname(filePath);
    }
    getFileType(filePath) {
        const extension = this.extname(filePath).toLowerCase();
        return this.fileTypeMap.get(extension) || null;
    }
    getFileCategory(filePath) {
        const fileType = this.getFileType(filePath);
        return fileType?.category || FileTypeCategory.OTHER;
    }
    getFileLanguage(filePath) {
        const fileType = this.getFileType(filePath);
        return fileType?.language || null;
    }
    isCodeFile(filePath) {
        return this.getFileCategory(filePath) === FileTypeCategory.CODE;
    }
    isImageFile(filePath) {
        return this.getFileCategory(filePath) === FileTypeCategory.IMAGE;
    }
    isDocumentFile(filePath) {
        return this.getFileCategory(filePath) === FileTypeCategory.DOCUMENT;
    }
    getMimeType(filePath) {
        const fileType = this.getFileType(filePath);
        return fileType?.mimeType || null;
    }
}
exports.FileSystem = FileSystem;
exports.fileSystem = new FileSystem();
//# sourceMappingURL=file-system.js.map