/**
 * BrowserWindow policy for off-screen capture/render workers.
 *
 * Electron needs a renderer process for getDisplayMedia and WebRTC, but these
 * windows must never appear in the taskbar, Alt+Tab, or flash on screen.
 *
 * Do not hide, resize, or use Windows `type: 'toolbar'` until the HTML has
 * finished loading — those abort Chromium with ERR_FAILED (-2).
 */

const fs = require('fs');
const { pathToFileURL } = require('url');

/**
 * @param {import('electron').WebPreferences} webPreferences
 * @returns {import('electron').BrowserWindowConstructorOptions}
 */
function hiddenCaptureWindowOptions(webPreferences) {
  return {
    show: false,
    width: 8,
    height: 8,
    frame: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    autoHideMenuBar: true,
    enableLargerThanScreen: true,
    hiddenInMissionControl: true,
    webPreferences,
  };
}

/**
 * Keep the worker off-screen after it is ready. Must not run during loadFile.
 *
 * @param {import('electron').BrowserWindow} window
 */
function sealHiddenCaptureWindow(window) {
  window.setSkipTaskbar(true);
  window.setMenuBarVisibility(false);

  if (process.platform === 'darwin') {
    window.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: false });
  }

  let loadFinished = false;
  const parkOffscreen = () => {
    if (window.isDestroyed()) {
      return;
    }
    window.hide();
    window.setSkipTaskbar(true);
    window.setBounds({ x: -10000, y: -10000, width: 8, height: 8 });
  };

  window.webContents.once('did-finish-load', () => {
    loadFinished = true;
    parkOffscreen();
  });

  window.on('show', () => {
    if (!loadFinished || window.isDestroyed()) {
      return;
    }
    parkOffscreen();
  });

  window.on('focus', () => {
    if (!window.isDestroyed()) {
      window.blur();
    }
  });
}

/**
 * Load a local HTML file into a hidden window. Reads the file first so OneDrive
 * placeholders are hydrated, then falls back to a file:// URL if loadFile fails.
 *
 * @param {import('electron').BrowserWindow} window
 * @param {string} htmlPath
 */
async function loadHiddenHtml(window, htmlPath) {
  fs.readFileSync(htmlPath);

  try {
    await window.loadFile(htmlPath);
    return;
  } catch (error) {
    if (window.isDestroyed()) {
      throw error;
    }
    console.warn(
      `[RemotePad] loadFile failed for ${htmlPath}, retrying via file URL:`,
      error instanceof Error ? error.message : error
    );
    await window.loadURL(pathToFileURL(htmlPath).href);
  }
}

module.exports = {
  hiddenCaptureWindowOptions,
  sealHiddenCaptureWindow,
  loadHiddenHtml,
};
