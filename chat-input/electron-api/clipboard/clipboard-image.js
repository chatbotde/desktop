const { clipboard, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Clipboard Image Operations
 * Handles reading and writing image content to/from the system clipboard
 */
class ImageClipboard {
  /**
   * Read image from the clipboard
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {NativeImage|null} The image from the clipboard, or null if no image
   */
  readImage(type = 'clipboard') {
    try {
      return clipboard.readImage(type);
    } catch (error) {
      console.error('Error reading image from clipboard:', error);
      return null;
    }
  }

  /**
   * Write image to the clipboard
   * @param {NativeImage|Buffer|string} image - The image to write (NativeImage, Buffer, or file path)
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  writeImage(image, type = 'clipboard') {
    try {
      let nativeImg;

      if (nativeImage.isNativeImage(image)) {
        // Already a NativeImage
        nativeImg = image;
      } else if (Buffer.isBuffer(image)) {
        // Create NativeImage from Buffer
        nativeImg = nativeImage.createFromBuffer(image);
      } else if (typeof image === 'string') {
        // Assume it's a file path
        if (fs.existsSync(image)) {
          nativeImg = nativeImage.createFromPath(image);
        } else {
          // Assume it's base64 data URL
          nativeImg = nativeImage.createFromDataURL(image);
        }
      } else {
        throw new Error('Invalid image format. Expected NativeImage, Buffer, file path, or data URL.');
      }

      if (nativeImg && !nativeImg.isEmpty()) {
        clipboard.writeImage(nativeImg, type);
        return true;
      } else {
        console.error('Failed to create valid image from input');
        return false;
      }
    } catch (error) {
      console.error('Error writing image to clipboard:', error);
      return false;
    }
  }

  /**
   * Copy image to clipboard (alias for writeImage)
   * @param {NativeImage|Buffer|string} image - The image to copy
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   */
  copy(image, type = 'clipboard') {
    return this.writeImage(image, type);
  }

  /**
   * Paste image from clipboard (alias for readImage)
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {NativeImage|null} The image from the clipboard
   */
  paste(type = 'clipboard') {
    return this.readImage(type);
  }

  /**
   * Check if clipboard contains an image
   * @param {string} type - 'clipboard' or 'selection' (Linux only)
   * @returns {boolean} True if clipboard contains an image
   */
  hasImage(type = 'clipboard') {
    try {
      const formats = clipboard.availableFormats(type);
      return formats.some(format =>
        format.includes('image') ||
        format.includes('png') ||
        format.includes('jpeg') ||
        format.includes('jpg') ||
        format.includes('gif') ||
        format.includes('bmp') ||
        format.includes('tiff')
      );
    } catch (error) {
      console.error('Error checking for image in clipboard:', error);
      return false;
    }
  }

  /**
   * Get image as buffer in specified format
   * @param {NativeImage} image - The NativeImage to convert
   * @param {string} format - 'png', 'jpeg', 'bmp'
   * @param {object} options - Options for the conversion (quality for JPEG)
   * @returns {Buffer|null} The image as buffer, or null on error
   */
  imageToBuffer(image, format = 'png', options = {}) {
    try {
      if (!image || image.isEmpty()) {
        return null;
      }

      switch (format.toLowerCase()) {
        case 'png':
          return image.toPNG();
        case 'jpeg':
        case 'jpg':
          return image.toJPEG(options.quality || 90);
        case 'bmp':
          return image.toBitmap();
        default:
          return image.toPNG(); // Default to PNG
      }
    } catch (error) {
      console.error('Error converting image to buffer:', error);
      return null;
    }
  }

  /**
   * Get image as data URL
   * @param {NativeImage} image - The NativeImage to convert
   * @param {string} format - 'png', 'jpeg', 'bmp'
   * @param {object} options - Options for the conversion (quality for JPEG)
   * @returns {string|null} The image as data URL, or null on error
   */
  imageToDataURL(image, format = 'png', options = {}) {
    try {
      const buffer = this.imageToBuffer(image, format, options);
      if (!buffer) return null;

      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      return null;
    }
  }

  /**
   * Save image to file
   * @param {NativeImage} image - The NativeImage to save
   * @param {string} filePath - Path where to save the image
   * @param {string} format - 'png', 'jpeg', 'bmp'
   * @param {object} options - Options for the conversion (quality for JPEG)
   * @returns {boolean} True if saved successfully
   */
  saveImage(image, filePath, format = 'png', options = {}) {
    try {
      const buffer = this.imageToBuffer(image, format, options);
      if (!buffer) return false;

      fs.writeFileSync(filePath, buffer);
      return true;
    } catch (error) {
      console.error('Error saving image to file:', error);
      return false;
    }
  }

  /**
   * Get image dimensions
   * @param {NativeImage} image - The NativeImage to get dimensions for
   * @returns {object|null} Object with width and height, or null on error
   */
  getImageSize(image) {
    try {
      if (!image || image.isEmpty()) {
        return null;
      }

      const size = image.getSize();
      return {
        width: size.width,
        height: size.height
      };
    } catch (error) {
      console.error('Error getting image size:', error);
      return null;
    }
  }

  /**
   * Create NativeImage from file path
   * @param {string} filePath - Path to the image file
   * @returns {NativeImage|null} The created NativeImage, or null on error
   */
  createFromPath(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.error('Image file does not exist:', filePath);
        return null;
      }

      return nativeImage.createFromPath(filePath);
    } catch (error) {
      console.error('Error creating image from path:', error);
      return null;
    }
  }

  /**
   * Create NativeImage from buffer
   * @param {Buffer} buffer - Image buffer
   * @param {object} options - Options for buffer creation
   * @returns {NativeImage|null} The created NativeImage, or null on error
   */
  createFromBuffer(buffer, options = {}) {
    try {
      return nativeImage.createFromBuffer(buffer, options);
    } catch (error) {
      console.error('Error creating image from buffer:', error);
      return null;
    }
  }

  /**
   * Create NativeImage from data URL
   * @param {string} dataURL - Base64 data URL
   * @returns {NativeImage|null} The created NativeImage, or null on error
   */
  createFromDataURL(dataURL) {
    try {
      return nativeImage.createFromDataURL(dataURL);
    } catch (error) {
      console.error('Error creating image from data URL:', error);
      return null;
    }
  }
}

const imageClipboard = new ImageClipboard();

module.exports = {
  ImageClipboard,
  imageClipboard,

  // Direct exports
  readImage: imageClipboard.readImage.bind(imageClipboard),
  writeImage: imageClipboard.writeImage.bind(imageClipboard),
  copy: imageClipboard.copy.bind(imageClipboard),
  paste: imageClipboard.paste.bind(imageClipboard),
  hasImage: imageClipboard.hasImage.bind(imageClipboard),
  imageToBuffer: imageClipboard.imageToBuffer.bind(imageClipboard),
  imageToDataURL: imageClipboard.imageToDataURL.bind(imageClipboard),
  saveImage: imageClipboard.saveImage.bind(imageClipboard),
  getImageSize: imageClipboard.getImageSize.bind(imageClipboard),
  createFromPath: imageClipboard.createFromPath.bind(imageClipboard),
  createFromBuffer: imageClipboard.createFromBuffer.bind(imageClipboard),
  createFromDataURL: imageClipboard.createFromDataURL.bind(imageClipboard)
};