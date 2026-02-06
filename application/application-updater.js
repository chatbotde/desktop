/**
 * Application Updater
 * Handle application updates using electron-updater
 */

const { autoUpdater } = require('electron-updater');
const { dialog, app } = require('electron');

class ApplicationUpdater {
    constructor() {
        // Configure logger using console for now
        autoUpdater.logger = console;

        // Automatically download updates
        autoUpdater.autoDownload = true;

        // Auto install on app quit
        autoUpdater.autoInstallOnAppQuit = true;
    }

    initialize() {
        console.log('ApplicationUpdater: Initializing...');

        this.setupListeners();
        // Check for updates immediately on startup
        this.checkForUpdates();
    }

    setupListeners() {
        autoUpdater.on('checking-for-update', () => {
            console.log('ApplicationUpdater: Checking for update...');
        });

        autoUpdater.on('update-available', (info) => {
            console.log('ApplicationUpdater: Update available.', info);
        });

        autoUpdater.on('update-not-available', (info) => {
            console.log('ApplicationUpdater: Update not available.', info);
        });

        autoUpdater.on('error', (err) => {
            console.error('ApplicationUpdater: Error in auto-updater.', err);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = "Download speed: " + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
            console.log('ApplicationUpdater:', log_message);
        });

        autoUpdater.on('update-downloaded', (info) => {
            console.log('ApplicationUpdater: Update downloaded');
        });

        // Additional generic handling if needed
    }

    async checkForUpdates() {
        // Skip in development unless explicitly forced
        if (!app.isPackaged && process.env.FORCE_UPDATE_CHECK !== 'true') {
            console.log('ApplicationUpdater: Skipping update check in development mode (app not packaged)');
            return;
        }

        try {
            // checks for updates and notifies the user if an update is available
            // It will download the update automatically because autoDownload is true
            // And then notify the user to restart
            await autoUpdater.checkForUpdatesAndNotify();
        } catch (error) {
            console.error('ApplicationUpdater: Failed to check for updates:', error);
        }
    }
}

module.exports = { ApplicationUpdater };
