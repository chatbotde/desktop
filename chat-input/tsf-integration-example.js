/**
 * Simple Integration Example for Your Chat Input
 * Add this to your existing chat input JavaScript
 */

// ============================================
// STEP 1: Initialize TSF when page loads
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.tsfAPI.initialize();
        console.log('✅ TSF Ready - Auto-send enabled!');
    } catch (err) {
        console.error('TSF init error:', err);
    }
    
    // Setup event listeners
    setupTsfListeners();
});

// ============================================
// STEP 2: Track external applications
// ============================================

let currentTrackedApp = null;

function setupTsfListeners() {
    // Listen for external app focus changes
    window.tsfAPI.onExternalFocusChanged((focusInfo) => {
        currentTrackedApp = focusInfo;
        console.log(`📍 Tracking: ${focusInfo.processName}`);
        
        // Update UI to show tracked app
        updateSendButtonState(focusInfo);
    });
    
    // Listen for successful insertions
    window.tsfAPI.onTextInserted((data) => {
        console.log(`✅ Text sent to ${data.focusInfo.processName}`);
        showSuccessToast(`Sent to ${data.focusInfo.processName}!`);
    });
    
    // Listen for failures
    window.tsfAPI.onInsertFailed(() => {
        showErrorToast('Failed to send text');
    });
}

// ============================================
// STEP 3: Update your send button
// ============================================

function updateSendButtonState(focusInfo) {
    const sendButton = document.getElementById('sendButton'); // Your existing button
    const sendIcon = document.getElementById('sendIcon');
    
    if (sendButton && focusInfo && focusInfo.processName) {
        // Update button to show it will send to an app
        sendButton.title = `Send to ${focusInfo.processName}`;
        
        // Optionally add a badge or indicator
        if (sendIcon) {
            sendIcon.classList.add('has-target');
        }
    }
}

// ============================================
// STEP 4: Modify your existing send function
// ============================================

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Your existing logic to send to AI
    const aiResponse = await sendToAI(message); // Your existing function
    
    // NEW: Auto-send to last focused app
    if (currentTrackedApp) {
        console.log(`Auto-sending to ${currentTrackedApp.processName}...`);
        
        const success = await window.tsfAPI.focusAndInsertText(aiResponse);
        
        if (success) {
            console.log('✅ Auto-sent!');
            // Clear input or do whatever you normally do
            messageInput.value = '';
        } else {
            console.log('⚠️ Auto-send failed, showing response in window');
            // Fall back to showing in your window
            displayResponseInWindow(aiResponse);
        }
    } else {
        // No app tracked, show in window as usual
        displayResponseInWindow(aiResponse);
    }
}

// ============================================
// STEP 5: Add manual send button (OPTIONAL)
// ============================================

// If you want a separate "Send to App" button:
async function sendToLastApp() {
    const response = getLastAIResponse(); // However you store the last response
    
    if (!response) {
        alert('No response to send!');
        return;
    }
    
    // Check if we have a tracked app
    const trackedApp = currentTrackedApp || await window.tsfAPI.getLastExternalFocus();
    
    if (!trackedApp || !trackedApp.processName) {
        alert('Please click on a text editor first!');
        return;
    }
    
    // Send!
    const success = await window.tsfAPI.focusAndInsertText(response);
    
    if (success) {
        showSuccessToast(`Sent to ${trackedApp.processName}!`);
    }
}

// ============================================
// STEP 6: Add UI indicators (OPTIONAL)
// ============================================

// Add a small indicator in your UI
function addTrackingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'tsfIndicator';
    indicator.className = 'tsf-indicator';
    indicator.innerHTML = `
        <span class="indicator-icon">📍</span>
        <span id="indicatorText">No app tracked</span>
    `;
    
    // Add to your UI wherever makes sense
    document.querySelector('.chat-input-container')?.appendChild(indicator);
    
    // Update when app changes
    window.tsfAPI.onExternalFocusChanged((focusInfo) => {
        const text = document.getElementById('indicatorText');
        if (text) {
            text.textContent = `Ready: ${focusInfo.processName}`;
            indicator.classList.add('active');
        }
    });
}

// Add some CSS
const style = document.createElement('style');
style.textContent = `
    .tsf-indicator {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        opacity: 0.5;
        transition: opacity 0.3s;
    }
    
    .tsf-indicator.active {
        opacity: 1;
    }
    
    .tsf-indicator .indicator-icon {
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// ============================================
// HELPER FUNCTIONS
// ============================================

function showSuccessToast(message) {
    // Your existing toast/notification system
    console.log('✅', message);
}

function showErrorToast(message) {
    // Your existing toast/notification system
    console.error('❌', message);
}

// ============================================
// THAT'S IT!
// ============================================

// Now when users:
// 1. Type in Chrome/Word/etc
// 2. Open your chat (Alt+Space)
// 3. Ask a question
// 4. Get AI response
// 
// The response automatically goes back to Chrome/Word! 🎉

console.log('TSF Integration loaded! 🚀');
