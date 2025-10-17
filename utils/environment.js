const { app } = require('electron');
const path = require('path');

/**
 * Utility to detect if app is running in development or production mode
 * and provide appropriate URLs and paths
 */
class EnvironmentConfig {
  constructor() {
    // Check if running in development mode
    this.isDevelopment = !app.isPackaged && process.env.NODE_ENV !== 'production';
    
    console.log(`Environment: Running in ${this.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
    console.log(`Environment: app.isPackaged = ${app.isPackaged}`);
    console.log(`Environment: NODE_ENV = ${process.env.NODE_ENV}`);
  }

  /**
   * Get the frontend URL (React app)
   * @returns {string} URL to load the frontend from
   */
  getFrontendURL() {
    if (this.isDevelopment) {
      return 'http://localhost:5173';
    } else {
      // In production, load from the bundled app-frontend folder
      const frontendPath = path.join(__dirname, '..', 'app-frontend', 'index.html');
      console.log(`Environment: Loading production frontend from: ${frontendPath}`);
      return `file://${frontendPath}`;
    }
  }

  /**
   * Get the base URL for frontend assets
   * @returns {string} Base URL for frontend
   */
  getFrontendBaseURL() {
    if (this.isDevelopment) {
      return 'http://localhost:5173';
    } else {
      const frontendDir = path.join(__dirname, '..', 'app-frontend');
      return `file://${frontendDir}`;
    }
  }

  /**
   * Check if a given URL is the main frontend window
   * @param {string} url - The URL to check
   * @returns {boolean} True if this is the main frontend window
   */
  isMainFrontendWindow(url) {
    if (!url) return false;

    if (this.isDevelopment) {
      // In development, check for Vite dev server
      return url.includes('localhost:5173') || url.includes('localhost:3000');
    } else {
      // In production, check for app-frontend or frontend/dist
      return (url.includes('app-frontend') || url.includes('frontend/dist')) && 
             url.includes('index.html');
    }
  }

  /**
   * Get the path to a static file
   * @param {string} relativePath - Path relative to project root
   * @returns {string} Absolute path to the file
   */
  getStaticPath(relativePath) {
    return path.join(__dirname, '..', relativePath);
  }

  /**
   * Check if app is in development mode
   * @returns {boolean}
   */
  isDev() {
    return this.isDevelopment;
  }

  /**
   * Check if app is in production mode
   * @returns {boolean}
   */
  isProd() {
    return !this.isDevelopment;
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

module.exports = {
  EnvironmentConfig,
  environmentConfig
};
