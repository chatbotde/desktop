const { createWebAppWindow } = require('./window-creator');

/**
 * Window Presets Module
 * Pre-configured window types for common use cases
 */

/**
 * Create a chat application window (ChatGPT, Claude, etc.)
 */
function createChatWindow(url = 'https://chat.openai.com', options = {}, windows, windowConfigs) {
  const chatOptions = {
    width: 1024,
    height: 768,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: true,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      ...options.webPreferences
    }
  };

  return createWebAppWindow(url, chatOptions, windows, windowConfigs);
}

/**
 * Create a development window (localhost apps)
 */
function createDevelopmentWindow(url = 'http://localhost:3000', options = {}, windows, windowConfigs) {
  const devOptions = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: true,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow localhost
      allowRunningInsecureContent: true, // Allow localhost
      ...options.webPreferences
    }
  };

  return createWebAppWindow(url, devOptions, windows, windowConfigs);
}

/**
 * Create a productivity window (Notion, Google Workspace, etc.)
 */
function createProductivityWindow(url, options = {}, windows, windowConfigs) {
  const productivityOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: true,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      ...options.webPreferences
    }
  };

  return createWebAppWindow(url, productivityOptions, windows, windowConfigs);
}

/**
 * Create a social media window (Twitter, LinkedIn, etc.)
 */
function createSocialWindow(url, options = {}, windows, windowConfigs) {
  const socialOptions = {
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: true,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      ...options.webPreferences
    }
  };

  return createWebAppWindow(url, socialOptions, windows, windowConfigs);
}

/**
 * Create a media window (YouTube, Netflix, Spotify, etc.)
 */
function createMediaWindow(url, options = {}, windows, windowConfigs) {
  const mediaOptions = {
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: true,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      plugins: true, // Allow media plugins
      ...options.webPreferences
    }
  };

  return createWebAppWindow(url, mediaOptions, windows, windowConfigs);
}

/**
 * Get preset configurations for popular websites
 */
function getPopularSitePresets() {
  return {
    // AI/Chat Services
    'chat.openai.com': {
      type: 'chat',
      title: 'ChatGPT',
      icon: '🤖',
      dimensions: { width: 1024, height: 768 }
    },
    'claude.ai': {
      type: 'chat',
      title: 'Claude',
      icon: '🧠',
      dimensions: { width: 1024, height: 768 }
    },
    'gemini.google.com': {
      type: 'chat',
      title: 'Gemini',
      icon: '✨',
      dimensions: { width: 1024, height: 768 }
    },
    
    // Development
    'localhost': {
      type: 'development',
      title: 'Local Development',
      icon: '🔧',
      dimensions: { width: 1400, height: 900 }
    },
    'github.com': {
      type: 'productivity',
      title: 'GitHub',
      icon: '🐙',
      dimensions: { width: 1200, height: 800 }
    },
    
    // Productivity
    'notion.so': {
      type: 'productivity',
      title: 'Notion',
      icon: '📝',
      dimensions: { width: 1200, height: 800 }
    },
    'docs.google.com': {
      type: 'productivity',
      title: 'Google Docs',
      icon: '📄',
      dimensions: { width: 1200, height: 800 }
    },
    'sheets.google.com': {
      type: 'productivity',
      title: 'Google Sheets',
      icon: '📊',
      dimensions: { width: 1200, height: 800 }
    },
    
    // Social Media
    'twitter.com': {
      type: 'social',
      title: 'Twitter',
      icon: '🐦',
      dimensions: { width: 900, height: 700 }
    },
    'x.com': {
      type: 'social',
      title: 'X',
      icon: '❌',
      dimensions: { width: 900, height: 700 }
    },
    'linkedin.com': {
      type: 'social',
      title: 'LinkedIn',
      icon: '💼',
      dimensions: { width: 900, height: 700 }
    },
    
    // Media
    'youtube.com': {
      type: 'media',
      title: 'YouTube',
      icon: '📺',
      dimensions: { width: 1280, height: 720 }
    },
    'netflix.com': {
      type: 'media',
      title: 'Netflix',
      icon: '🎬',
      dimensions: { width: 1280, height: 720 }
    },
    'spotify.com': {
      type: 'media',
      title: 'Spotify',
      icon: '🎵',
      dimensions: { width: 1000, height: 600 }
    }
  };
}

/**
 * Create a window using preset configuration
 */
function createPresetWindow(url, customOptions = {}, windows, windowConfigs) {
  const presets = getPopularSitePresets();
  
  // Find matching preset
  let presetConfig = null;
  for (const [domain, config] of Object.entries(presets)) {
    if (url.includes(domain)) {
      presetConfig = config;
      break;
    }
  }
  
  if (!presetConfig) {
    // Default to basic web app
    return createWebAppWindow(url, customOptions, windows, windowConfigs);
  }
  
  const presetOptions = {
    ...presetConfig.dimensions,
    ...customOptions
  };
  
  // Use appropriate preset creator
  switch (presetConfig.type) {
    case 'chat':
      return createChatWindow(url, presetOptions, windows, windowConfigs);
    case 'development':
      return createDevelopmentWindow(url, presetOptions, windows, windowConfigs);
    case 'productivity':
      return createProductivityWindow(url, presetOptions, windows, windowConfigs);
    case 'social':
      return createSocialWindow(url, presetOptions, windows, windowConfigs);
    case 'media':
      return createMediaWindow(url, presetOptions, windows, windowConfigs);
    default:
      return createWebAppWindow(url, presetOptions, windows, windowConfigs);
  }
}

module.exports = {
  createChatWindow,
  createDevelopmentWindow,
  createProductivityWindow,
  createSocialWindow,
  createMediaWindow,
  getPopularSitePresets,
  createPresetWindow
};