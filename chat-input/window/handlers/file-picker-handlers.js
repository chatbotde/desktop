const { ipcMain, dialog, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");
const { getMimeType } = require("../utils/mime-types");

/**
 * File picker and desktop capture IPC handlers
 */
class FilePickerHandlers {
  static registerHandlers() {
    // Handle image file picker
    ipcMain.handle("open-image-picker", async () => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            {
              name: 'Images',
              extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff']
            }
          ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          const fileName = path.basename(filePath);
          const fileSize = fs.statSync(filePath).size;
          
          // Read file as base64
          const fileBuffer = fs.readFileSync(filePath);
          const base64Data = fileBuffer.toString('base64');
          const mimeType = getMimeType(path.extname(filePath));
          
          return {
            success: true,
            file: {
              name: fileName,
              size: fileSize,
              type: mimeType,
              data: `data:${mimeType};base64,${base64Data}`,
              path: filePath
            }
          };
        }
        
        return { success: false, canceled: true };
      } catch (error) {
        console.error('Error opening image picker:', error);
        return { success: false, error: error.message };
      }
    });

    // Handle desktop capture
    ipcMain.handle("capture-desktop", async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 }
        });

        if (sources.length > 0) {
          // Get the primary screen
          const primarySource = sources[0];
          const thumbnail = primarySource.thumbnail;
          
          // Convert to PNG buffer
          const buffer = thumbnail.toPNG();
          const base64Data = buffer.toString('base64');
          
          return {
            success: true,
            image: {
              name: `screenshot-${Date.now()}.png`,
              type: 'image/png',
              data: `data:image/png;base64,${base64Data}`,
              size: buffer.length,
              source: 'desktop-capture'
            }
          };
        }
        
        return { success: false, error: 'No screen sources available' };
      } catch (error) {
        console.error('Error capturing desktop:', error);
        return { success: false, error: error.message };
      }
    });

    // Handle generic file picker
    ipcMain.handle("open-file-picker", async (event, options = {}) => {
      try {
        const { extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'] } = options;
        
        // Determine filter name based on file types
        let filterName = 'Files';
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'ico'];
        const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv', '3gp', 'm4v'];
        const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'opus'];
        
        const isImageOnly = extensions.every(ext => imageExts.includes(ext.toLowerCase()));
        const isVideoOnly = extensions.every(ext => videoExts.includes(ext.toLowerCase()));
        const isAudioOnly = extensions.every(ext => audioExts.includes(ext.toLowerCase()));
        
        if (isImageOnly) {
          filterName = 'Images';
        } else if (isVideoOnly) {
          filterName = 'Videos';
        } else if (isAudioOnly) {
          filterName = 'Audio Files';
        } else {
          filterName = 'Media Files';
        }
        
        const result = await dialog.showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          filters: [
            {
              name: filterName,
              extensions: extensions
            }
          ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const files = [];
          
          for (const filePath of result.filePaths) {
            try {
              const fileName = path.basename(filePath);
              const fileSize = fs.statSync(filePath).size;
              const ext = path.extname(filePath).toLowerCase();
              
              // Dynamic file size limits based on file type
              let maxSize = 10 * 1024 * 1024; // 10MB default for images
              if (videoExts.includes(ext.substring(1))) {
                maxSize = 100 * 1024 * 1024; // 100MB for videos
              } else if (audioExts.includes(ext.substring(1))) {
                maxSize = 50 * 1024 * 1024; // 50MB for audio
              }
              
              if (fileSize > maxSize) {
                console.warn(`File ${fileName} is too large (${fileSize} bytes, max: ${maxSize})`);
                continue;
              }
              
              const fileBuffer = fs.readFileSync(filePath);
              const base64Data = fileBuffer.toString('base64');
              const mimeType = getMimeType(ext);
              
              files.push({
                name: fileName,
                size: fileSize,
                type: mimeType,
                data: `data:${mimeType};base64,${base64Data}`,
                path: filePath
              });
            } catch (fileError) {
              console.error(`Error processing file ${filePath}:`, fileError);
            }
          }
          
          return { success: true, files };
        }
        
        return { success: false, canceled: true };
      } catch (error) {
        console.error('Error opening file picker:', error);
        return { success: false, error: error.message };
      }
    });
  }
}

module.exports = { FilePickerHandlers };