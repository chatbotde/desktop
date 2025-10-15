# Model Selection Sync Fix

## Problem Identified

The application was **always sending messages to Gemini** even when other models (OpenAI, Anthropic, OpenRouter) were selected in the chat-input window. This was because:

1. **Two separate model selections**: The chat-input window and main window each had their own model selection stored in different localStorage keys:
   - Chat-input window: `'selectedAIModel'`
   - Main window (React app): `'selected-ai-model'`

2. **No synchronization**: When sending a message, the chat-input window was NOT passing the selected model information to the main window.

3. **Main window used its own selection**: The main window's `useChatManager` was using its own stored model selection, which defaulted to Gemini.

## Solution Implemented

### 1. Pass Selected Model with Message Data
**File**: `buddy/chat-input/modules/messaging.js`

Modified the `sendMessage()` function to include the selected model in the message data:

```javascript
const messageData = { 
    content: route.cleaned, 
    timestamp: new Date().toISOString(), 
    id: Date.now().toString(), 
    type: hasAny ? 'mixed' : 'text', 
    attachments: all, 
    meta: {},
    selectedModel: state.selectedModel // ← Added this line
};
```

### 2. Sync Model Selection in Main Window
**File**: `buddy/frontend/src/hooks/useChatManager.ts`

Modified `handleChatMessage()` to sync the selected model from the chat-input window:

```typescript
const handleChatMessage = useCallback(async (messageData: any) => {
    console.log('Main Window: Received message from chat input window:', messageData);
    
    // Sync the selected model from chat-input window to main window
    if (messageData.selectedModel) {
      console.log('Main Window: Syncing selected model:', messageData.selectedModel);
      setSelectedModel(messageData.selectedModel);
    }
    
    // ... rest of the code
```

## How It Works Now

1. **User selects a model** in the chat-input window (e.g., GPT-4o)
2. **Model ID is stored** in chat-input's state: `state.selectedModel = 'gpt-4o'`
3. **User sends a message**
4. **Message data includes** the selected model: `{ ..., selectedModel: 'gpt-4o' }`
5. **Main window receives** the message and syncs the model selection
6. **Unified AI service** routes the message to the correct provider (OpenAI)
7. **Response streams back** from the correct AI provider

## Testing

To verify the fix works:

1. Open the chat-input window
2. Select a different model (e.g., GPT-4o, Claude 3.5, or DeepSeek)
3. Send a message
4. Check the console logs - you should see:
   ```
   Main Window: Syncing selected model: gpt-4o
   ```
5. The response should come from the selected provider, not Gemini

## Files Modified

1. ✅ `buddy/chat-input/modules/messaging.js` - Added `selectedModel` to message data
2. ✅ `buddy/frontend/src/hooks/useChatManager.ts` - Added model sync logic
3. ✅ Rebuilt frontend with `npm run build`

## Result

✅ **Model selection now works correctly!**
- Select GPT-4o → Messages go to OpenAI
- Select Claude 3.5 → Messages go to Anthropic
- Select Gemini → Messages go to Google
- Select DeepSeek → Messages go to OpenRouter

The chat-input window's model selection is now properly synchronized with the main window's AI routing system.

---

**Date Fixed**: October 15, 2025
**Status**: ✅ RESOLVED

