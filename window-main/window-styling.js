/**
 * Window styling management - handles CSS injection and theme styling
 */

function applyWindowStyling(win, opacity = 1.0, theme = "transparent") {
  // Add styling on window load
  win.webContents.on("did-finish-load", () => {
    applyStyling(win, opacity, theme);
  });
}

function applyStyling(win, opacity, theme) {
  const isBlackTheme = theme === "black";

  const css = `
    * {
      box-sizing: border-box;
    }
    
    html {
      background: ${isBlackTheme ? "#000000" : "rgba(0, 0, 0, 0.1)"};
      border-radius: 15px;
      overflow: auto;
    }
    
    body {
      border: 2px solid ${isBlackTheme ? "#333333" : "#00a8ff"};
      border-radius: 15px;
      box-shadow: 
        0 0 20px ${isBlackTheme ? "rgba(51, 51, 51, 0.4)" : "rgba(0, 168, 255, 0.4)"},
        0 0 40px ${isBlackTheme ? "rgba(51, 51, 51, 0.2)" : "rgba(0, 168, 255, 0.2)"};
      overflow: auto;
      margin: 0;
      padding: 0;
      background: ${isBlackTheme ? "#000000" : "rgba(255, 255, 255, 0.05)"};
      ${!isBlackTheme ? "backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);" : ""}
      width: 100vw;
      height: 100vh;
      position: relative;
      opacity: ${opacity};
    }
    
    /* Main content area scroll styling */
    .main-content-scroll {
      overflow-y: auto !important;
      overflow-x: hidden !important;
      scrollbar-width: thin;
      scrollbar-color: ${isBlackTheme ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.4)"} transparent;
      height: 100%;
      max-height: 100%;
    }
    
    .main-content-scroll::-webkit-scrollbar {
      width: 8px;
    }
    
    .main-content-scroll::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 4px;
    }
    
    .main-content-scroll::-webkit-scrollbar-thumb {
      background: ${isBlackTheme ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.4)"};
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    
    .main-content-scroll::-webkit-scrollbar-thumb:hover {
      background: ${isBlackTheme ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.6)"};
    }
    
    .main-content-scroll::-webkit-scrollbar-corner {
      background: transparent;
    }
    
    /* Chat messages scroll styling */
    .chat-messages-scroll {
      overflow-y: auto !important;
      overflow-x: hidden !important;
      scrollbar-width: thin;
      scrollbar-color: ${isBlackTheme ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.3)"} transparent;
      scroll-behavior: smooth;
      height: 100%;
      max-height: 100%;
    }
    
    .chat-messages-scroll::-webkit-scrollbar {
      width: 6px;
    }
    
    .chat-messages-scroll::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 3px;
    }
    
    .chat-messages-scroll::-webkit-scrollbar-thumb {
      background: ${isBlackTheme ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.3)"};
      border-radius: 3px;
      transition: background 0.2s ease;
    }
    
    .chat-messages-scroll::-webkit-scrollbar-thumb:hover {
      background: ${isBlackTheme ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.5)"};
    }
    
    /* Fixed header styling */
    .fixed-header {
      position: sticky;
      top: 0;
      z-index: 50;
      flex-shrink: 0;
    }
    
    /* Scrollable content area */
    .scrollable-content {
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: ${isBlackTheme ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.4)"} transparent;
      height: calc(100vh - 32px); /* Subtract header height */
      max-height: calc(100vh - 32px);
    }
    
    .scrollable-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .scrollable-content::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 4px;
    }
    
    .scrollable-content::-webkit-scrollbar-thumb {
      background: ${isBlackTheme ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.4)"};
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    
    .scrollable-content::-webkit-scrollbar-thumb:hover {
      background: ${isBlackTheme ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.6)"};
    }
    
    .scrollable-content::-webkit-scrollbar-corner {
      background: transparent;
    }
    
    /* Enhanced scroll behavior for all scrollable elements */
    * {
      scroll-behavior: smooth;
    }
    
    /* Custom scrollbar for webkit browsers */
    ::-webkit-scrollbar {
      width: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: ${isBlackTheme ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.3)"};
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: ${isBlackTheme ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.5)"};
    }
    
    ::-webkit-scrollbar-corner {
      background: transparent;
    }
    
    /* Mask to create rounded window effect */
    body::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 15px;
      background: transparent;
      pointer-events: none;
      z-index: 9999;
      box-shadow: inset 0 0 0 2000px rgba(0, 0, 0, 0);
      -webkit-mask: radial-gradient(circle at 15px 15px, transparent 14px, black 15px),
                    radial-gradient(circle at calc(100% - 15px) 15px, transparent 14px, black 15px),
                    radial-gradient(circle at 15px calc(100% - 15px), transparent 14px, black 15px),
                    radial-gradient(circle at calc(100% - 15px) calc(100% - 15px), transparent 14px, black 15px),
                    linear-gradient(to bottom, black, black);
      -webkit-mask-composite: intersect;
      mask: radial-gradient(circle at 15px 15px, transparent 14px, black 15px),
            radial-gradient(circle at calc(100% - 15px) 15px, transparent 14px, black 15px),
            radial-gradient(circle at 15px calc(100% - 15px), transparent 14px, black 15px),
            radial-gradient(circle at calc(100% - 15px) calc(100% - 15px), transparent 14px, black 15px),
            linear-gradient(to bottom, black, black);
      mask-composite: intersect;
    }
  `;

  win.webContents.insertCSS(css);
}

function updateWindowOpacity(win, windowManager, opacity) {
  windowManager.setCurrentOpacity(opacity);
  win.setOpacity(opacity);
  applyStyling(win, opacity, windowManager.getCurrentTheme());
}

module.exports = {
  applyWindowStyling,
  applyStyling,
  updateWindowOpacity
};
