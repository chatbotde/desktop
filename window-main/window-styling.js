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
      overflow: hidden;
    }
    
    body {
      border: 2px solid ${isBlackTheme ? "#333333" : "#00a8ff"};
      border-radius: 15px;
      box-shadow: 
        0 0 20px ${isBlackTheme ? "rgba(51, 51, 51, 0.4)" : "rgba(0, 168, 255, 0.4)"},
        0 0 40px ${isBlackTheme ? "rgba(51, 51, 51, 0.2)" : "rgba(0, 168, 255, 0.2)"};
      overflow: hidden;
      margin: 0;
      padding: 0;
      background: ${isBlackTheme ? "#000000" : "rgba(255, 255, 255, 0.05)"};
      ${!isBlackTheme ? "backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);" : ""}
      width: 100vw;
      height: 100vh;
      position: relative;
      opacity: ${opacity};
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
