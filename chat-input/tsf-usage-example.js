/**
 * TSF Usage Example for Chat Input Renderer
 * 
 * This demonstrates how to use the TSF API in your chat input window
 * to insert AI responses or any text into external applications.
 */

// Example 1: Simple text insertion
async function insertSimpleText() {
    const text = 'Hello from SonicPlane! 🚀';
    const success = await window.tsfAPI.insertText(text);
    
    if (success) {
        console.log('✅ Text inserted successfully');
    } else {
        console.error('❌ Failed to insert text');
    }
}

// Example 2: Insert AI response into focused application
async function insertAIResponse(responseText) {
    // Get focus info first
    const focusInfo = await window.tsfAPI.getFocusInfo();
    console.log(`Inserting into: ${focusInfo.processName} - ${focusInfo.windowTitle}`);
    
    // Check if window is editable
    const isEditable = await window.tsfAPI.isEditableWindow();
    if (!isEditable) {
        console.warn('⚠️ Warning: Target window may not accept text input');
        // You can show a warning to the user here
    }
    
    // Insert the text
    const success = await window.tsfAPI.insertText(responseText);
    
    if (success) {
        // Show success notification
        showNotification(`✅ Response inserted into ${focusInfo.processName}`, 'success');
    } else {
        // Show error notification
        showNotification('❌ Failed to insert text', 'error');
    }
    
    return success;
}

// Example 3: Smart insertion with TSF availability check
async function smartInsertText(text) {
    // Check if TSF is available for the current window
    const tsfAvailable = await window.tsfAPI.isTsfAvailable();
    
    if (tsfAvailable) {
        console.log('Using TSF method');
        return await window.tsfAPI.insertText(text);
    } else {
        console.log('Using clipboard fallback method');
        return await window.tsfAPI.insertTextFallback(text);
    }
}

// Example 4: Integration with send button
function setupTsfSendButton() {
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    
    sendButton?.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Send to AI and get response
        const response = await sendToAI(message);
        
        // Insert response into focused application
        const success = await insertAIResponse(response);
        
        if (success) {
            messageInput.value = '';
        }
    });
}

// Example 5: Auto-insert toggle functionality
let autoInsertEnabled = true;

async function toggleAutoInsert() {
    autoInsertEnabled = !autoInsertEnabled;
    await window.tsfAPI.setEnabled(autoInsertEnabled);
    
    const button = document.getElementById('autoPasteToggleButton');
    if (button) {
        button.classList.toggle('active', autoInsertEnabled);
        button.title = autoInsertEnabled ? 'Auto-insert enabled' : 'Auto-insert disabled';
    }
    
    console.log(`Auto-insert ${autoInsertEnabled ? 'enabled' : 'disabled'}`);
}

// Example 6: Monitor focus changes
window.tsfAPI.onFocusChanged((focusInfo) => {
    console.log('Focus changed:', focusInfo);
    updateFocusDisplay(focusInfo);
});

// Example 7: Listen for text insertion events
window.tsfAPI.onTextInserted((data) => {
    console.log('✅ Text inserted:', data);
    showNotification(`Inserted into ${data.focusInfo.processName}`, 'success');
});

window.tsfAPI.onInsertFailed((data) => {
    console.error('❌ Insert failed:', data);
    showNotification('Failed to insert text', 'error');
});

window.tsfAPI.onWarning((data) => {
    console.warn('⚠️ TSF warning:', data);
    showNotification(data.message, 'warning');
});

// Example 8: Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing TSF API...');
    
    try {
        const initialized = await window.tsfAPI.initialize();
        if (initialized) {
            console.log('✅ TSF API ready');
            
            // Show TSF status in UI
            const statusElement = document.getElementById('tsfStatus');
            if (statusElement) {
                statusElement.textContent = '✅ Text insertion ready';
                statusElement.classList.add('active');
            }
        } else {
            console.error('❌ TSF initialization failed');
        }
    } catch (err) {
        console.error('TSF initialization error:', err);
    }
});

// Helper functions
function showNotification(message, type = 'info') {
    // Implement your notification system here
    console.log(`[${type}] ${message}`);
    
    // Example: Create a toast notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateFocusDisplay(focusInfo) {
    const display = document.getElementById('focusDisplay');
    if (display) {
        display.innerHTML = `
            <div class="focus-info">
                <span class="focus-label">Focused:</span>
                <span class="focus-app">${focusInfo.processName || 'Unknown'}</span>
                ${focusInfo.isEditable ? '<span class="focus-editable">✓</span>' : ''}
            </div>
        `;
    }
}

async function sendToAI(message) {
    // Your AI sending logic here
    // This is just a placeholder
    return 'AI response to: ' + message;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        insertSimpleText,
        insertAIResponse,
        smartInsertText,
        setupTsfSendButton,
        toggleAutoInsert
    };
}
