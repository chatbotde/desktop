# Focus and Insert Feature - Usage Guide

## What is This?

The **Focus and Insert** feature automatically tracks which application the user was in, then refocuses that application and inserts text at the caret position - all with one button click!

## How It Works

```
User types in Chrome → Opens your chat → Gets AI response → Clicks button → 
Text automatically appears back in Chrome! 🎉
```

## For Your Chat Input Window

### Step 1: The tracking happens automatically

When you initialize TSF with monitoring enabled, it automatically tracks external applications:

```javascript
// In your main process (chat-input-window.js)
const { setupTsfIpc, initializeTsf } = require('./chat-input/tsf-ipc-handlers');

app.whenReady().then(async () => {
    await initializeTsf();
    setupTsfIpc(chatInputWindow);
});
```

The TSF manager automatically:
- Monitors focus changes
- Tracks the last external (non-Electron) application
- Remembers the window handle and caret position

### Step 2: Add a button in your UI

In your HTML (`chat-input.html`), add a button:

```html
<button id="sendToAppButton" class="send-to-app-btn">
    🚀 Send to App
</button>
```

### Step 3: Wire up the button

In your renderer JavaScript:

```javascript
// Show which app is tracked
window.tsfAPI.onExternalFocusChanged((focusInfo) => {
    console.log(`📍 Tracking: ${focusInfo.processName}`);
    updateUIToShowTrackedApp(focusInfo);
});

// Send button click handler
document.getElementById('sendToAppButton').addEventListener('click', async () => {
    const responseText = getAIResponse(); // Your AI response
    
    // This ONE line does everything!
    const success = await window.tsfAPI.focusAndInsertText(responseText);
    
    if (success) {
        console.log('✅ Text sent!');
        showSuccessNotification();
    } else {
        console.log('❌ Failed - user needs to focus an app first');
        showWarning('Please click on a text editor first');
    }
});
```

## Complete Example

```javascript
// In your chat input renderer

let lastTrackedApp = null;

// Initialize TSF
async function initTsf() {
    await window.tsfAPI.initialize();
    
    // Listen for external app tracking
    window.tsfAPI.onExternalFocusChanged((focusInfo) => {
        lastTrackedApp = focusInfo;
        updateTrackedAppBadge(focusInfo);
    });
}

// When user clicks "Send" button
async function sendResponseToApp() {
    // Get the AI response
    const response = document.getElementById('aiResponse').textContent;
    
    if (!response) {
        alert('No response to send!');
        return;
    }
    
    // Check if we have a tracked app
    if (!lastTrackedApp) {
        const tracked = await window.tsfAPI.getLastExternalFocus();
        if (!tracked || !tracked.processName) {
            alert('Please click on a text editor first!');
            return;
        }
    }
    
    // Show sending state
    showSendingIndicator(`Sending to ${lastTrackedApp.processName}...`);
    
    // THE MAGIC HAPPENS HERE! 🎯
    const success = await window.tsfAPI.focusAndInsertText(response);
    
    if (success) {
        showSuccessMessage(`✅ Sent to ${lastTrackedApp.processName}!`);
    } else {
        showErrorMessage('Failed to send. Try clicking the app again.');
    }
}

// Update UI to show tracked app
function updateTrackedAppBadge(focusInfo) {
    const badge = document.getElementById('trackedAppBadge');
    if (badge) {
        badge.textContent = `📍 ${focusInfo.processName}`;
        badge.style.display = 'inline-block';
    }
}
```

## UI Suggestions

### Option 1: Button with App Name

```html
<button id="sendButton" class="primary-btn">
    <span id="buttonText">🚀 Send to App</span>
    <span id="appBadge" class="app-badge" style="display:none;"></span>
</button>
```

```javascript
// Update button when app is tracked
window.tsfAPI.onExternalFocusChanged((focusInfo) => {
    document.getElementById('appBadge').textContent = focusInfo.processName;
    document.getElementById('appBadge').style.display = 'inline';
    document.getElementById('buttonText').textContent = '🚀 Send to';
});
```

### Option 2: Status Bar

```html
<div class="status-bar">
    <span id="trackedAppStatus" class="no-app">
        Click on a text editor to enable auto-send
    </span>
</div>
```

```javascript
window.tsfAPI.onExternalFocusChanged((focusInfo) => {
    const status = document.getElementById('trackedAppStatus');
    status.className = 'tracked-app';
    status.innerHTML = `📍 Ready to send to <strong>${focusInfo.processName}</strong>`;
});
```

### Option 3: Toast Notification

```javascript
window.tsfAPI.onExternalFocusChanged((focusInfo) => {
    showToast(`Now tracking: ${focusInfo.processName}`, 'info');
});

window.tsfAPI.onTextInserted((data) => {
    showToast(`✅ Sent to ${data.focusInfo.processName}!`, 'success');
});
```

## Available API Methods

```javascript
// Get last external app that was focused
const app = await window.tsfAPI.getLastExternalFocus();
// Returns: { processName, windowTitle, processId, isEditable }

// Get from native tracker
const app = await window.tsfAPI.getLastFocusedWindow();

// Just focus the last window (without inserting)
await window.tsfAPI.focusLastWindow();

// Focus and insert text (THE MAIN METHOD!)
await window.tsfAPI.focusAndInsertText("Your text here");
```

## Event Listeners

```javascript
// When user focuses an external app
window.tsfAPI.onExternalFocusChanged((focusInfo) => {
    console.log('User switched to:', focusInfo.processName);
});

// When text is successfully inserted
window.tsfAPI.onTextInserted((data) => {
    console.log('✅ Inserted into:', data.focusInfo.processName);
});

// When insertion fails
window.tsfAPI.onInsertFailed((data) => {
    console.log('❌ Failed to insert');
});
```

## User Flow

1. **User is typing in Chrome/Word/etc.**
   - TSF automatically tracks this window

2. **User opens your chat window** (Alt+Space or however you trigger it)
   - Previous app is remembered
   - UI shows "Ready to send to Chrome"

3. **User types question and gets AI response**
   - Response appears in your chat window

4. **User clicks "Send to App" button**
   - Your app automatically:
     - Focuses back to Chrome/Word
     - Inserts the text at the caret
     - User sees text appear instantly!

5. **User can continue typing**
   - No manual switching
   - No Ctrl+V needed
   - Seamless experience! ✨

## Error Handling

```javascript
async function sendToApp(text) {
    try {
        const success = await window.tsfAPI.focusAndInsertText(text);
        
        if (!success) {
            // No app tracked or insertion failed
            const tracked = await window.tsfAPI.getLastExternalFocus();
            
            if (!tracked) {
                showNotification('Please click on a text editor first!', 'warning');
            } else {
                showNotification(`Could not insert into ${tracked.processName}`, 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        showNotification('Error sending text', 'error');
    }
}
```

## Best Practices

1. **Show visual feedback** - Let users know which app is tracked
2. **Handle "no app tracked"** - Show helpful message if user hasn't focused an external app yet
3. **Success confirmation** - Brief notification when text is sent
4. **Error recovery** - Clear instructions if something fails

## Testing

Open the demo HTML file to test interactively:
```powershell
# The demo is already in your chat-input folder
# Open: chat-input/tsf-focus-insert-demo.html
```

Or test programmatically:
```powershell
cd chat-input/tsf-framwork
node demo-focus-insert.js
```

## That's It!

With just `await window.tsfAPI.focusAndInsertText(text)`, you have Grammarly-style text insertion! 🎉
