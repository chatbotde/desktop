const { ipcMain } = require("electron");

/**
 * Text Selection IPC handlers for chat input window
 */
class TextSelectionHandlers {
  static registerHandlers() {
    // Handle adding text to input from floating UI
    ipcMain.on("add-text-to-input", (event, text) => {
      console.log("IPC: Adding text to chat input from floating UI:", 
        typeof text === 'string' ? text.substring(0, 50) + '...' : text);
      
      // Validate input
      if (!text || typeof text !== 'string') {
        console.warn("IPC: Invalid text input received for add-text-to-input");
        return;
      }
      
      try {
        // Send the text to the chat input renderer process
        event.sender.send("add-text-to-input", text);
      } catch (error) {
        console.error("IPC: Error adding text to input:", error);
      }
    });
    
    // Handle text selection changes from main process
    ipcMain.on("text-selection-changed", (event, selectionData) => {
      console.log("IPC: Text selection changed:", 
        selectionData?.text ? selectionData.text.substring(0, 50) + '...' : selectionData);
      
      // Validate selection data
      if (!selectionData || typeof selectionData !== 'object') {
        console.warn("IPC: Invalid selection data received for text-selection-changed");
        return;
      }
      
      try {
        // Send the selection data to the chat input renderer process
        event.sender.send("text-selection-changed", selectionData);
      } catch (error) {
        console.error("IPC: Error handling text selection change:", error);
      }
    });
  }
}

module.exports = { TextSelectionHandlers };