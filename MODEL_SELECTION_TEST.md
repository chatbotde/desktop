# Model Selection Testing Guide

## Quick Test Steps

### 1. Check Console Logs

When you start the app, you should see these logs in the console:

```
Main: Retrieved 9 AI models from model-config
🚀 Initializing model selection...
📊 Fetching all AI models...
📊 Received models: [Array of 9 models]
✅ Found 9 models
✅ Models loaded into state: [array of model IDs]
📋 Current available models: 9
🎨 Rendering model dropdown...
📋 Available models to render: 9
📊 Models grouped by provider: [google, openai, anthropic, openrouter]
✅ Model selection initialized
```

### 2. Open Model Dropdown

Click the model selector button in the chat input and you should see:

```
Google
  • Gemini 2.0 Flash (Experimental)
    📷 Images 🎵 Audio 🎬 Video
    $0.075/1K in, $0.3/1K out
    
  • Gemini 1.5 Flash
    📷 Images 🎵 Audio 🎬 Video
    $0.075/1K in, $0.3/1K out
    
  • Gemini 1.5 Pro
    📷 Images 🎵 Audio 🎬 Video
    $3.5/1K in, $10.5/1K out
    
  • Gemini 2.5 Flash
    📷 Images 🎵 Audio 🎬 Video
    $0.075/1K in, $0.3/1K out

OpenAI
  • GPT-4o
    📷 Images 🎵 Audio
    $5/1K in, $15/1K out
    
  • GPT-4 Turbo
    📷 Images
    $10/1K in, $30/1K out

Anthropic
  • Claude 3.5 Sonnet
    📷 Images
    $3/1K in, $15/1K out

OpenRouter
  • DeepSeek Chat
    📷 Images
    $0.27/1K in, $1.1/1K out
    
  • DeepSeek Reasoner
    $0.55/1K in, $2.19/1K out
```

### 3. Select a Model

1. Click on any model (e.g., "DeepSeek Chat")
2. The dropdown should close
3. The model button should update to show the selected model
4. Console should show: `✅ Restored saved model: deepseek/deepseek-chat`

### 4. Send a Message

1. Type a message
2. Click send
3. You should get a response from the selected model

## Troubleshooting

### Issue: Only seeing 1 model

**Check:**
```javascript
// Open browser console (F12) and run:
window.chatInputAPI.getAllAIModels().then(models => {
  console.log('Models from API:', models);
});
```

**Expected:** Should return array of 9 models

**If empty or error:**
1. Check `buddy/frontend/src/lib/ai/model-config-export.cjs` exists
2. Restart the app
3. Check main process logs

### Issue: Dropdown not showing models

**Check:**
```javascript
// In browser console:
console.log('State models:', window.__state?.availableModels);
```

**Expected:** Should show object with 9 model IDs

**If empty:**
1. Check console for error messages during initialization
2. Make sure `await initializeModelSelection()` is being called
3. Check that the DOM element exists

### Issue: Models not grouped by provider

**Check the CSS:**
- Dropdown container should have proper styling
- Model items should have `dropdown-item` class
- Provider labels should have `dropdown-label` class

## File Locations

**Single Source of Truth:**
- `buddy/frontend/src/lib/ai/model-config-export.cjs` - All model definitions (9 models)

**Frontend:**
- `buddy/chat-input/modules/model-selection.js` - Fetches and renders models
- `buddy/chat-input/modules/state.js` - Stores available models

**Backend:**
- `buddy/main.js` - IPC handler that returns models from config file

**Preload:**
- `buddy/chat-input/chat-input-preload.js` - IPC bridge

## Expected Console Output

**On App Start:**
```
Main: IPC handlers registered
Main: Retrieved 9 AI models from model-config
🚀 Initializing model selection...
📊 Fetching all AI models...
📊 Received models: (9) [{…}, {…}, {…}, ...]
✅ Found 9 models
✅ Models loaded into state: (9) ['gemini-2.0-flash-exp', 'gemini-1.5-flash', ...]
📋 Current available models: 9
ℹ️ Using default model: gemini-2.5-flash
🎨 Rendering model dropdown...
📋 Available models to render: 9
📊 Models grouped by provider: (4) ['google', 'openai', 'anthropic', 'openrouter']
✅ Model selection initialized
```

**On Model Click:**
```
✅ Restored saved model: deepseek/deepseek-chat
```

## Debug Commands

Run these in the browser console (F12):

```javascript
// 1. Check if API is available
console.log('API available:', typeof window.chatInputAPI);

// 2. Fetch models manually
window.chatInputAPI.getAllAIModels().then(models => {
  console.log('Models:', models);
  console.log('Count:', models.length);
});

// 3. Check state
console.log('Available models in state:', Object.keys(state.availableModels));

// 4. Check selected model
console.log('Selected model:', state.selectedModel);

// 5. Check DOM element
console.log('Dropdown element:', document.getElementById('modelSelectDropdown'));
console.log('Dropdown content:', document.getElementById('modelSelectDropdown')?.querySelector('.dropdown-content'));
```

## Success Criteria

✅ **9 models** appear in dropdown
✅ Models **grouped by 4 providers** (Google, OpenAI, Anthropic, OpenRouter)
✅ Each model shows **name, description, features, cost**
✅ Can **select any model** from dropdown
✅ Selected model is **saved to localStorage**
✅ Can **send messages** and get responses from selected model

## Quick Fix Checklist

If models aren't showing:

- [ ] File `model-config-export.cjs` exists in `buddy/frontend/src/lib/ai/`
- [ ] Main.js has IPC handler for `get-all-ai-models`
- [ ] Preload has `getAllAIModels` method exposed
- [ ] Init.js awaits `initializeModelSelection()`
- [ ] Console shows "Retrieved 9 AI models from model-config"
- [ ] Console shows "✅ Found 9 models"
- [ ] Console shows "📋 Available models to render: 9"
- [ ] Restart app after file changes

## Need Help?

If still having issues:
1. Copy ALL console output (Ctrl+A in console, Ctrl+C)
2. Check main process terminal output
3. Look for any error messages in red
4. Check that `model-config-export.cjs` has all 9 models defined


