import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

/**
 * File type categories
 */
export enum FileTypeCategory {
  CODE = 'code',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  ARCHIVE = 'archive',
  CONFIG = 'config',
  DATA = 'data',
  FONT = 'font',
  OTHER = 'other'
}

/**
 * File type information interface
 */
export interface FileTypeInfo {
  extension: string;
  category: FileTypeCategory;
  language?: string;
  mimeType?: string;
  description?: string;
}

/**
 * File System Utility
 * Provides a centralized interface for local file operations using Node.js fs module
 */
export class FileSystem {
  /**
   * Mapping of file extensions to file type information
   */
  private readonly fileTypeMap: Map<string, FileTypeInfo> = new Map(
    [
      // Code files - JavaScript/TypeScript
      { extension: '.js', category: FileTypeCategory.CODE, language: 'javascript', mimeType: 'text/javascript', description: 'JavaScript file' },
      { extension: '.jsx', category: FileTypeCategory.CODE, language: 'javascript', mimeType: 'text/javascript', description: 'JavaScript React file' },
      { extension: '.ts', category: FileTypeCategory.CODE, language: 'typescript', mimeType: 'text/typescript', description: 'TypeScript file' },
      { extension: '.tsx', category: FileTypeCategory.CODE, language: 'typescript', mimeType: 'text/typescript', description: 'TypeScript React file' },
      { extension: '.mjs', category: FileTypeCategory.CODE, language: 'javascript', mimeType: 'text/javascript', description: 'ES Module JavaScript file' },
      { extension: '.cjs', category: FileTypeCategory.CODE, language: 'javascript', mimeType: 'text/javascript', description: 'CommonJS JavaScript file' },

      // Code files - Web
      { extension: '.html', category: FileTypeCategory.CODE, language: 'html', mimeType: 'text/html', description: 'HTML file' },
      { extension: '.htm', category: FileTypeCategory.CODE, language: 'html', mimeType: 'text/html', description: 'HTML file' },
      { extension: '.css', category: FileTypeCategory.CODE, language: 'css', mimeType: 'text/css', description: 'CSS file' },
      { extension: '.scss', category: FileTypeCategory.CODE, language: 'scss', mimeType: 'text/x-scss', description: 'SCSS file' },
      { extension: '.sass', category: FileTypeCategory.CODE, language: 'sass', mimeType: 'text/x-sass', description: 'SASS file' },
      { extension: '.less', category: FileTypeCategory.CODE, language: 'less', mimeType: 'text/x-less', description: 'LESS file' },
      { extension: '.json', category: FileTypeCategory.CODE, language: 'json', mimeType: 'application/json', description: 'JSON file' },
      { extension: '.xml', category: FileTypeCategory.CODE, language: 'xml', mimeType: 'application/xml', description: 'XML file' },

      // Code files - Python
      { extension: '.py', category: FileTypeCategory.CODE, language: 'python', mimeType: 'text/x-python', description: 'Python file' },
      { extension: '.pyw', category: FileTypeCategory.CODE, language: 'python', mimeType: 'text/x-python', description: 'Python script file' },
      { extension: '.pyi', category: FileTypeCategory.CODE, language: 'python', mimeType: 'text/x-python', description: 'Python stub file' },

      // Code files - Java
      { extension: '.java', category: FileTypeCategory.CODE, language: 'java', mimeType: 'text/x-java-source', description: 'Java file' },
      { extension: '.class', category: FileTypeCategory.CODE, language: 'java', mimeType: 'application/java-vm', description: 'Java class file' },
      { extension: '.jar', category: FileTypeCategory.ARCHIVE, language: 'java', mimeType: 'application/java-archive', description: 'Java archive' },

      // Code files - C/C++
      { extension: '.c', category: FileTypeCategory.CODE, language: 'c', mimeType: 'text/x-c', description: 'C file' },
      { extension: '.cpp', category: FileTypeCategory.CODE, language: 'cpp', mimeType: 'text/x-c++src', description: 'C++ file' },
      { extension: '.cc', category: FileTypeCategory.CODE, language: 'cpp', mimeType: 'text/x-c++src', description: 'C++ file' },
      { extension: '.cxx', category: FileTypeCategory.CODE, language: 'cpp', mimeType: 'text/x-c++src', description: 'C++ file' },
      { extension: '.h', category: FileTypeCategory.CODE, language: 'c', mimeType: 'text/x-c', description: 'C header file' },
      { extension: '.hpp', category: FileTypeCategory.CODE, language: 'cpp', mimeType: 'text/x-c++hdr', description: 'C++ header file' },

      // Code files - C#
      { extension: '.cs', category: FileTypeCategory.CODE, language: 'csharp', mimeType: 'text/x-csharp', description: 'C# file' },

      // Code files - Go
      { extension: '.go', category: FileTypeCategory.CODE, language: 'go', mimeType: 'text/x-go', description: 'Go file' },

      // Code files - Rust
      { extension: '.rs', category: FileTypeCategory.CODE, language: 'rust', mimeType: 'text/x-rust', description: 'Rust file' },

      // Code files - PHP
      { extension: '.php', category: FileTypeCategory.CODE, language: 'php', mimeType: 'text/x-php', description: 'PHP file' },
      { extension: '.phtml', category: FileTypeCategory.CODE, language: 'php', mimeType: 'text/x-php', description: 'PHP template file' },

      // Code files - Ruby
      { extension: '.rb', category: FileTypeCategory.CODE, language: 'ruby', mimeType: 'text/x-ruby', description: 'Ruby file' },

      // Code files - Swift
      { extension: '.swift', category: FileTypeCategory.CODE, language: 'swift', mimeType: 'text/x-swift', description: 'Swift file' },

      // Code files - Kotlin
      { extension: '.kt', category: FileTypeCategory.CODE, language: 'kotlin', mimeType: 'text/x-kotlin', description: 'Kotlin file' },
      { extension: '.kts', category: FileTypeCategory.CODE, language: 'kotlin', mimeType: 'text/x-kotlin', description: 'Kotlin script file' },

      // Code files - Shell
      { extension: '.sh', category: FileTypeCategory.CODE, language: 'bash', mimeType: 'text/x-sh', description: 'Shell script' },
      { extension: '.bash', category: FileTypeCategory.CODE, language: 'bash', mimeType: 'text/x-sh', description: 'Bash script' },
      { extension: '.zsh', category: FileTypeCategory.CODE, language: 'zsh', mimeType: 'text/x-sh', description: 'Zsh script' },
      { extension: '.ps1', category: FileTypeCategory.CODE, language: 'powershell', mimeType: 'text/x-powershell', description: 'PowerShell script' },
      { extension: '.bat', category: FileTypeCategory.CODE, language: 'batch', mimeType: 'application/x-msdos-program', description: 'Batch file' },
      { extension: '.cmd', category: FileTypeCategory.CODE, language: 'batch', mimeType: 'application/x-msdos-program', description: 'Command file' },

      // Code files - SQL
      { extension: '.sql', category: FileTypeCategory.CODE, language: 'sql', mimeType: 'application/sql', description: 'SQL file' },

      // Code files - Markdown
      { extension: '.md', category: FileTypeCategory.CODE, language: 'markdown', mimeType: 'text/markdown', description: 'Markdown file' },
      { extension: '.markdown', category: FileTypeCategory.CODE, language: 'markdown', mimeType: 'text/markdown', description: 'Markdown file' },

      // Code files - YAML/TOML
      { extension: '.yaml', category: FileTypeCategory.CODE, language: 'yaml', mimeType: 'application/x-yaml', description: 'YAML file' },
      { extension: '.yml', category: FileTypeCategory.CODE, language: 'yaml', mimeType: 'application/x-yaml', description: 'YAML file' },
      { extension: '.toml', category: FileTypeCategory.CODE, language: 'toml', mimeType: 'application/toml', description: 'TOML file' },

      // Code files - Other
      { extension: '.lua', category: FileTypeCategory.CODE, language: 'lua', mimeType: 'text/x-lua', description: 'Lua file' },
      { extension: '.r', category: FileTypeCategory.CODE, language: 'r', mimeType: 'text/x-r', description: 'R file' },
      { extension: '.dart', category: FileTypeCategory.CODE, language: 'dart', mimeType: 'application/dart', description: 'Dart file' },
      { extension: '.vue', category: FileTypeCategory.CODE, language: 'vue', mimeType: 'text/x-vue', description: 'Vue component file' },
      { extension: '.svelte', category: FileTypeCategory.CODE, language: 'svelte', mimeType: 'text/x-svelte', description: 'Svelte component file' },

      // Image files
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

      // Document files
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

      // Audio files
      { extension: '.mp3', category: FileTypeCategory.AUDIO, mimeType: 'audio/mpeg', description: 'MP3 audio' },
      { extension: '.wav', category: FileTypeCategory.AUDIO, mimeType: 'audio/wav', description: 'WAV audio' },
      { extension: '.flac', category: FileTypeCategory.AUDIO, mimeType: 'audio/flac', description: 'FLAC audio' },
      { extension: '.aac', category: FileTypeCategory.AUDIO, mimeType: 'audio/aac', description: 'AAC audio' },
      { extension: '.ogg', category: FileTypeCategory.AUDIO, mimeType: 'audio/ogg', description: 'OGG audio' },
      { extension: '.m4a', category: FileTypeCategory.AUDIO, mimeType: 'audio/mp4', description: 'M4A audio' },

      // Video files
      { extension: '.mp4', category: FileTypeCategory.VIDEO, mimeType: 'video/mp4', description: 'MP4 video' },
      { extension: '.avi', category: FileTypeCategory.VIDEO, mimeType: 'video/x-msvideo', description: 'AVI video' },
      { extension: '.mov', category: FileTypeCategory.VIDEO, mimeType: 'video/quicktime', description: 'QuickTime video' },
      { extension: '.wmv', category: FileTypeCategory.VIDEO, mimeType: 'video/x-ms-wmv', description: 'WMV video' },
      { extension: '.flv', category: FileTypeCategory.VIDEO, mimeType: 'video/x-flv', description: 'Flash video' },
      { extension: '.webm', category: FileTypeCategory.VIDEO, mimeType: 'video/webm', description: 'WebM video' },
      { extension: '.mkv', category: FileTypeCategory.VIDEO, mimeType: 'video/x-matroska', description: 'Matroska video' },

      // Archive files
      { extension: '.zip', category: FileTypeCategory.ARCHIVE, mimeType: 'application/zip', description: 'ZIP archive' },
      { extension: '.rar', category: FileTypeCategory.ARCHIVE, mimeType: 'application/x-rar-compressed', description: 'RAR archive' },
      { extension: '.7z', category: FileTypeCategory.ARCHIVE, mimeType: 'application/x-7z-compressed', description: '7z archive' },
      { extension: '.tar', category: FileTypeCategory.ARCHIVE, mimeType: 'application/x-tar', description: 'TAR archive' },
      { extension: '.gz', category: FileTypeCategory.ARCHIVE, mimeType: 'application/gzip', description: 'Gzip archive' },
      { extension: '.bz2', category: FileTypeCategory.ARCHIVE, mimeType: 'application/x-bzip2', description: 'Bzip2 archive' },

      // Config files
      { extension: '.ini', category: FileTypeCategory.CONFIG, mimeType: 'text/plain', description: 'INI configuration file' },
      { extension: '.conf', category: FileTypeCategory.CONFIG, mimeType: 'text/plain', description: 'Configuration file' },
      { extension: '.config', category: FileTypeCategory.CONFIG, mimeType: 'text/plain', description: 'Configuration file' },
      { extension: '.env', category: FileTypeCategory.CONFIG, mimeType: 'text/plain', description: 'Environment variables file' },

      // Data files
      { extension: '.csv', category: FileTypeCategory.DATA, mimeType: 'text/csv', description: 'CSV data file' },
      { extension: '.xlsx', category: FileTypeCategory.DATA, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Excel spreadsheet' },
      { extension: '.db', category: FileTypeCategory.DATA, mimeType: 'application/x-sqlite3', description: 'Database file' },
      { extension: '.sqlite', category: FileTypeCategory.DATA, mimeType: 'application/x-sqlite3', description: 'SQLite database' },
      { extension: '.sqlite3', category: FileTypeCategory.DATA, mimeType: 'application/x-sqlite3', description: 'SQLite database' },

      // Font files
      { extension: '.ttf', category: FileTypeCategory.FONT, mimeType: 'font/ttf', description: 'TrueType font' },
      { extension: '.otf', category: FileTypeCategory.FONT, mimeType: 'font/otf', description: 'OpenType font' },
      { extension: '.woff', category: FileTypeCategory.FONT, mimeType: 'font/woff', description: 'WOFF font' },
      { extension: '.woff2', category: FileTypeCategory.FONT, mimeType: 'font/woff2', description: 'WOFF2 font' },
      { extension: '.eot', category: FileTypeCategory.FONT, mimeType: 'application/vnd.ms-fontobject', description: 'Embedded OpenType font' }
    ].map(info => [info.extension.toLowerCase(), info] as [string, FileTypeInfo])
  );

  constructor() {
    // Initialize file type map
  }
  /**
   * Read file asynchronously
   * @param filePath - Path to the file
   * @param encoding - File encoding (default: 'utf8')
   * @returns Promise resolving to file content as string
   */
  async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    try {
      const content = await fsPromises.readFile(filePath, encoding);
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file "${filePath}": ${errorMessage}`);
    }
  }

  /**
   * Write file asynchronously
   * @param filePath - Path to the file
   * @param content - File content (string or Buffer)
   * @returns Promise resolving when done
   */
  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    try {
      // Ensure the directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await fsPromises.mkdir(dir, { recursive: true });
      }
      await fsPromises.writeFile(filePath, content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to write file "${filePath}": ${errorMessage}`);
    }
  }

  /**
   * Create directory asynchronously
   * @param dirPath - Path to the directory
   * @param recursive - Whether to create parent directories (default: true)
   * @returns Promise resolving when done
   */
  async mkdir(dirPath: string, recursive: boolean = true): Promise<void> {
    try {
      await fsPromises.mkdir(dirPath, { recursive });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create directory "${dirPath}": ${errorMessage}`);
    }
  }



  /**
   * Check if file or directory exists asynchronously
   * @param filePath - Path to check
   * @returns Promise resolving to true if exists, false otherwise
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fsPromises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }



  /**
   * Read directory contents asynchronously
   * @param dirPath - Path to the directory
   * @returns Promise resolving to array of file/directory names
   */
  async readdir(dirPath: string): Promise<string[]> {
    try {
      return await fsPromises.readdir(dirPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read directory "${dirPath}": ${errorMessage}`);
    }
  }


  /**
   * Get file or directory stats asynchronously
   * @param filePath - Path to the file or directory
   * @returns Promise resolving to file stats
   */
  async stat(filePath: string): Promise<fs.Stats> {
    try {
      return await fsPromises.stat(filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get stats for "${filePath}": ${errorMessage}`);
    }
  }


  /**
   * Check if path is a file
   * @param filePath - Path to check
   * @returns Promise resolving to true if path is a file
   */
  async isFile(filePath: string): Promise<boolean> {
    try {
      const stats = await this.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }


  /**
   * Check if path is a directory
   * @param dirPath - Path to check
   * @returns Promise resolving to true if path is a directory
   */
  async isDirectory(dirPath: string): Promise<boolean> {
    try {
      const stats = await this.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }


  /**
   * Get file name from path
   * @param filePath - Path to get file name from
   * @returns File name
   */
  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get file extension from path
   * @param filePath - Path to get extension from
   * @returns File extension
   */
  extname(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Get file type information from file path
   * @param filePath - Path to the file
   * @returns File type information or null if unknown
   */
  getFileType(filePath: string): FileTypeInfo | null {
    const extension = this.extname(filePath).toLowerCase();
    return this.fileTypeMap.get(extension) || null;
  }

  /**
   * Get file type category from file path
   * @param filePath - Path to the file
   * @returns File type category or OTHER if unknown
   */
  getFileCategory(filePath: string): FileTypeCategory {
    const fileType = this.getFileType(filePath);
    return fileType?.category || FileTypeCategory.OTHER;
  }

  /**
   * Get programming language from file path
   * @param filePath - Path to the file
   * @returns Programming language name or null if not a code file
   */
  getFileLanguage(filePath: string): string | null {
    const fileType = this.getFileType(filePath);
    return fileType?.language || null;
  }

  /**
   * Check if file is a code file (programming language file)
   * @param filePath - Path to the file
   * @returns True if file is a code file
   */
  isCodeFile(filePath: string): boolean {
    return this.getFileCategory(filePath) === FileTypeCategory.CODE;
  }

  /**
   * Check if file is an image file
   * @param filePath - Path to the file
   * @returns True if file is an image
   */
  isImageFile(filePath: string): boolean {
    return this.getFileCategory(filePath) === FileTypeCategory.IMAGE;
  }

  /**
   * Check if file is a document file
   * @param filePath - Path to the file
   * @returns True if file is a document
   */
  isDocumentFile(filePath: string): boolean {
    return this.getFileCategory(filePath) === FileTypeCategory.DOCUMENT;
  }

  /**
   * Get MIME type from file path
   * @param filePath - Path to the file
   * @returns MIME type or null if unknown
   */
  getMimeType(filePath: string): string | null {
    const fileType = this.getFileType(filePath);
    return fileType?.mimeType || null;
  }

}

// Create singleton instance
export const fileSystem = new FileSystem();

