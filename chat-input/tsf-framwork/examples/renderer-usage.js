/**
 * Example: Using TSF in renderer process
 * This code runs in the renderer (browser) context
 */

// Example 1: Simple text insertion
async function insertSimpleText() {
    const text = 'Hello from Renderer!';
    const success = await window.tsf.insertText(text);
    
    if (success) {
        console.log('✅ Text inserted successfully');
    } else {
        console.error('❌ Failed to insert text');
    }
}

// Example 2: Insert with focus checking
async function insertWithFocusCheck() {
    // Get current focus info
    const focusInfo = await window.tsf.getFocusInfo();
    console.log('Focused application:', focusInfo);
    
    // Check if window is editable
    const isEditable = await window.tsf.isEditableWindow();
    
    if (!isEditable) {
        alert('Please focus a text editor first!');
        return;
    }
    
    // Insert text
    const text = 'Smart insertion with focus checking';
    const success = await window.tsf.insertText(text);
    
    return success;
}

// Example 3: Auto-paste response from AI
async function insertAIResponse(response) {
    // Initialize if needed
    await window.tsf.initialize();
    
    // Get focus info to show notification
    const focusInfo = await window.tsf.getFocusInfo();
    console.log(`Inserting into: ${focusInfo.processName}`);
    
    // Check if TSF is available
    const tsfAvailable = await window.tsf.isTsfAvailable();
    console.log(`Using ${tsfAvailable ? 'TSF' : 'clipboard'} method`);
    
    // Insert the response
    return await window.tsf.insertText(response);
}

// Example 4: Button click handler
document.getElementById('insertButton')?.addEventListener('click', async () => {
    const textarea = document.getElementById('responseText');
    const text = textarea?.value;
    
    if (!text) {
        alert('No text to insert!');
        return;
    }
    
    try {
        const success = await window.tsf.insertText(text);
        
        if (success) {
            // Show success notification
            showNotification('Text inserted successfully! ✅');
        } else {
            showNotification('Failed to insert text ❌', 'error');
        }
    } catch (err) {
        console.error('Insert error:', err);
        showNotification('Error: ' + err.message, 'error');
    }
});

// Example 5: Monitor focus changes
async function monitorFocusChanges() {
    setInterval(async () => {
        const focusInfo = await window.tsf.getFocusInfo();
        updateFocusDisplay(focusInfo);
    }, 1000);
}

function updateFocusDisplay(focusInfo) {
    const display = document.getElementById('focusDisplay');
    if (display) {
        display.innerHTML = `
            <div>
                <strong>Window:</strong> ${focusInfo.windowTitle || 'Unknown'}
            </div>
            <div>
                <strong>Process:</strong> ${focusInfo.processName || 'Unknown'}
            </div>
            <div>
                <strong>Editable:</strong> ${focusInfo.isEditable ? '✅ Yes' : '❌ No'}
            </div>
        `;
    }
}

function showNotification(message, type = 'success') {
    // Your notification implementation
    console.log(`[${type}] ${message}`);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing TSF...');
    const initialized = await window.tsf.initialize();
    console.log('TSF initialized:', initialized);
    
    // Start monitoring focus changes
    monitorFocusChanges();
});

// Cleanup on unload
window.addEventListener('beforeunload', async () => {
    await window.tsf.cleanup();
});
