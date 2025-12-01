/**
 * Utility to detect if app is running in development or production mode
 * and provide appropriate URLs and paths
 */
export class EnvironmentConfig {
    isDevelopment: boolean;
    /**
     * Get the frontend URL (React app)
     * @returns {string} URL to load the frontend from
     */
    getFrontendURL(): string;
    /**
     * Get the base URL for frontend assets
     * @returns {string} Base URL for frontend
     */
    getFrontendBaseURL(): string;
    /**
     * Check if a given URL is the main frontend window
     * @param {string} url - The URL to check
     * @returns {boolean} True if this is the main frontend window
     */
    isMainFrontendWindow(url: string): boolean;
    /**
     * Get the path to a static file
     * @param {string} relativePath - Path relative to project root
     * @returns {string} Absolute path to the file
     */
    getStaticPath(relativePath: string): string;
    /**
     * Check if app is in development mode
     * @returns {boolean}
     */
    isDev(): boolean;
    /**
     * Check if app is in production mode
     * @returns {boolean}
     */
    isProd(): boolean;
}
export const environmentConfig: EnvironmentConfig;
//# sourceMappingURL=environment.d.ts.map