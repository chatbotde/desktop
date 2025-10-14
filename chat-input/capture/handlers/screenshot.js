/**
 * Screenshot Capture Handler
 * Handles desktop and window screenshot capture using Electron's desktopCapturer
 */

const { desktopCapturer } = require('electron');
const CaptureBase = require('../utils/capture-base');

class ScreenshotCapture extends CaptureBase {
    constructor() {
        super();
        this.captureOptions = {
            format: 'png',
            quality: 1.0,
            thumbnailSize: { width: 1920, height: 1080 }
        };
    }

    /**
     * Capture screenshot of primary display
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot data
     */
    async captureScreen(options = {}) {
        const { 
            sourceId = null,
            format = 'png',
            quality = 1.0,
            name = null
        } = options;

        try {
            let source;
            
            if (sourceId) {
                // Use specific source
                const sources = await this.getDesktopSources({
                    types: ['screen', 'window'],
                    thumbnailSize: this.captureOptions.thumbnailSize
                });
                source = sources.find(s => s.id === sourceId);
                if (!source) {
                    throw new Error('Specified source not found');
                }
            } else {
                // Use primary screen
                source = await this.getPrimaryScreenSource();
            }

            // Get high-resolution thumbnail for screenshot
            const highResSources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width: 2560, height: 1440 }
            });

            const highResSource = highResSources.find(s => s.id === source.id) || source;
            
            if (!highResSource.thumbnail) {
                throw new Error('Failed to capture screenshot: no thumbnail available');
            }

            // Convert thumbnail to PNG buffer (Electron's NativeImage)
            const screenshotBuffer = highResSource.thumbnail.toPNG();
            
            // Create screenshot file object
            const fileName = name || `screenshot-${Date.now()}.png`;
            const base64Data = screenshotBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Data}`;

            return {
                success: true,
                screenshot: {
                    name: fileName,
                    type: 'image/png',
                    size: screenshotBuffer.length,
                    data: dataUrl,
                    source: 'screenshot',
                    dimensions: {
                        width: highResSource.thumbnail.getSize().width,
                        height: highResSource.thumbnail.getSize().height
                    },
                    timestamp: Date.now(),
                    sourceInfo: {
                        id: source.id,
                        name: source.name,
                        displayId: source.display_id
                    }
                }
            };

        } catch (error) {
            console.error('Screenshot capture error:', error);
            return {
                success: false,
                error: error.message || 'Failed to capture screenshot'
            };
        }
    }

    /**
     * Capture screenshot of specific window
     * @param {string} windowId - Window source ID
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot data
     */
    async captureWindow(windowId, options = {}) {
        return this.captureScreen({ 
            sourceId: windowId, 
            ...options 
        });
    }

    /**
     * Capture screenshot of all screens
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Multiple screenshots data
     */
    async captureAllScreens(options = {}) {
        try {
            const sources = await this.getDesktopSources({
                types: ['screen'],
                thumbnailSize: { width: 1920, height: 1080 }
            });

            if (sources.length === 0) {
                throw new Error('No screen sources available');
            }

            const screenshots = [];
            
            for (const source of sources) {
                const result = await this.captureScreen({ 
                    sourceId: source.id, 
                    ...options 
                });
                
                if (result.success) {
                    screenshots.push(result.screenshot);
                }
            }

            return {
                success: true,
                screenshots,
                count: screenshots.length
            };

        } catch (error) {
            console.error('Multi-screen capture error:', error);
            return {
                success: false,
                error: error.message || 'Failed to capture all screens'
            };
        }
    }

    /**
     * Get available sources for screenshot capture
     * @param {boolean} includeWindows - Whether to include window sources
     * @returns {Promise<Object>} Available sources
     */
    async getAvailableSources(includeWindows = true) {
        try {
            const types = includeWindows ? ['screen', 'window'] : ['screen'];
            const sources = await this.getDesktopSources({
                types,
                thumbnailSize: { width: 150, height: 150 },
                fetchWindowIcons: includeWindows
            });

            return {
                success: true,
                sources: sources.map(source => ({
                    id: source.id,
                    name: source.name,
                    type: source.id.startsWith('screen:') ? 'screen' : 'window',
                    displayId: source.display_id,
                    thumbnail: source.thumbnail,
                    icon: source.appIcon
                }))
            };

        } catch (error) {
            console.error('Get sources error:', error);
            return {
                success: false,
                error: error.message || 'Failed to get available sources'
            };
        }
    }

    /**
     * Capture screenshot with selection area (future enhancement)
     * @param {Object} area - Selection area coordinates
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot data
     */
    async captureArea(area, options = {}) {
        // This would require additional implementation for area selection
        // For now, capture full screen and note the intended area
        const result = await this.captureScreen(options);
        
        if (result.success) {
            result.screenshot.selectionArea = area;
            result.screenshot.name = result.screenshot.name.replace('screenshot', 'area-screenshot');
        }
        
        return result;
    }

    /**
     * Quick screenshot capture (convenience method) - optimized for speed
     * @returns {Promise<Object>} Screenshot data
     */
    async quickCapture() {
        try {
            // Get primary screen source with reasonable thumbnail size for quick capture
            const sources = await this.getDesktopSources({
                types: ['screen'],
                thumbnailSize: { width: 1920, height: 1080 }
            });

            if (sources.length === 0) {
                throw new Error('No screen sources available');
            }

            const source = sources[0]; // Primary screen
            if (!source.thumbnail) {
                throw new Error('Failed to capture screenshot: no thumbnail available');
            }

            // Convert thumbnail to PNG buffer (Electron's NativeImage)
            const screenshotBuffer = source.thumbnail.toPNG();

            // Create screenshot file object
            const fileName = `quick-screenshot-${Date.now()}.png`;
            const base64Data = screenshotBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Data}`;

            return {
                success: true,
                screenshot: {
                    name: fileName,
                    type: 'image/png',
                    size: screenshotBuffer.length,
                    data: dataUrl,
                    source: 'screenshot',
                    dimensions: {
                        width: source.thumbnail.getSize().width,
                        height: source.thumbnail.getSize().height
                    },
                    timestamp: Date.now(),
                    sourceInfo: {
                        id: source.id,
                        name: source.name,
                        displayId: source.display_id
                    }
                }
            };

        } catch (error) {
            console.error('Quick screenshot capture error:', error);
            return {
                success: false,
                error: error.message || 'Failed to capture screenshot'
            };
        }
    }

    /**
     * Validate screenshot options
     * @param {Object} options - Options to validate
     * @returns {Object} Validation result
     */
    validateOptions(options) {
        const errors = [];
        
        if (options.quality && (options.quality < 0 || options.quality > 1)) {
            errors.push('Quality must be between 0 and 1');
        }
        
        if (options.format && !['png', 'jpg', 'jpeg'].includes(options.format.toLowerCase())) {
            errors.push('Format must be png, jpg, or jpeg');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get screenshot metadata
     * @param {Object} screenshot - Screenshot object
     * @returns {Object} Metadata
     */
    getMetadata(screenshot) {
        return {
            name: screenshot.name,
            size: screenshot.size,
            dimensions: screenshot.dimensions,
            format: screenshot.type,
            timestamp: screenshot.timestamp,
            source: screenshot.sourceInfo
        };
    }

    /**
     * Check if screenshot capture is supported
     * @returns {boolean} Support status
     */
    static isSupported() {
        return !!(
            typeof require !== 'undefined' &&
            require('electron') &&
            require('electron').desktopCapturer
        );
    }
}

module.exports = ScreenshotCapture;
