const { contextBridge, ipcRenderer } = require('electron');

/**
 * Drag & Drop Preload Script
 * Provides drag-drop functionality to renderer process
 */

// Expose drag-drop API to renderer
contextBridge.exposeInMainWorld('dragDrop', {
  /**
   * Called when files are dropped
   */
  onFilesDropped: (callback) => {
    const listener = (event, files) => callback(files);
    ipcRenderer.on('drag-drop:files-processed', listener);
    
    return () => {
      ipcRenderer.removeListener('drag-drop:files-processed', listener);
    };
  }
});

// Setup drag-drop event listeners when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  setupDragDropListeners();
});

/**
 * Setup drag and drop event listeners
 */
function setupDragDropListeners() {
  const body = document.body;

  // Prevent default drag behaviors on the whole page
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Visual feedback
  ['dragenter', 'dragover'].forEach(eventName => {
    body.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    body.addEventListener(eventName, unhighlight, false);
  });

  function highlight(e) {
    body.classList.add('drag-over');
  }

  function unhighlight(e) {
    body.classList.remove('drag-over');
  }

  // Handle drop event
  body.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    
    // Get drop zone target
    const dropZone = e.target.closest('[data-drop-zone]')?.dataset.dropZone || 'default';

    // Handle files
    if (dt.files && dt.files.length > 0) {
      const files = Array.from(dt.files).map(file => ({
        path: file.path,
        name: file.name,
        type: file.type,
        size: file.size
      }));

      ipcRenderer.send('drag-drop:files-dropped', {
        files,
        dropZone
      });
    }
    
    // Handle text
    else if (dt.types.includes('text/plain')) {
      const text = dt.getData('text/plain');
      ipcRenderer.send('drag-drop:text-dropped', {
        text,
        dropZone
      });
    }
    
    // Handle URLs
    else if (dt.types.includes('text/uri-list')) {
      const url = dt.getData('text/uri-list');
      ipcRenderer.send('drag-drop:url-dropped', {
        url,
        dropZone
      });
    }
  }
}

/**
 * Add custom drop zone programmatically
 * @param {HTMLElement} element - Element to make a drop zone
 * @param {string} zoneName - Name of the drop zone
 */
function addDropZone(element, zoneName) {
  if (!element) return;

  element.setAttribute('data-drop-zone', zoneName);
  element.classList.add('drop-zone');

  // Custom styling for drop zone
  element.addEventListener('dragenter', (e) => {
    if (e.target === element) {
      element.classList.add('drop-zone-active');
    }
  });

  element.addEventListener('dragleave', (e) => {
    if (e.target === element) {
      element.classList.remove('drop-zone-active');
    }
  });

  element.addEventListener('drop', (e) => {
    element.classList.remove('drop-zone-active');
  });
}

// Expose helper function
if (typeof window !== 'undefined') {
  window.addDropZone = addDropZone;
}
