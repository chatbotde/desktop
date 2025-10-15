# Gemini Lazy Initialization Fix

## Problem

The Gemini service was **initializing in the constructor** and trying to create a chat with whatever model was currently selected (including non-Gemini models like GPT-4o). This caused:

1. **Error when non-Gemini model selected**: If GPT-4o was selected, Gemini tried to initialize with `model: "gpt-4o"`, which doesn't exist in Gemini's API
2. **404 Error**: `models/gpt-4o is not found for API version v1beta`
3. **Broken service**: Once the error occurred, even switching back to Gemini models didn't work

## Root Cause

```typescript
// OLD CODE - BROKEN
export class GeminiChatService {
  constructor() {
    this.initializeChat(); // ❌ Initializes immediately with any selected model
  }

  private initializeChat() {
    const selectedModel = getSelectedModel();
    const modelName = selectedModel?.name || 'gemini-2.5-flash';
    // This would fail if selectedModel was GPT-4o!
    this.chat = ai.chats.create({
      model: modelName,
      history: this.chatHistory,
    });
  }
}
```

## Solution

Implemented **lazy initialization** - only initialize the Gemini chat when it's actually being used, not at startup.

### Changes Made

**File**: `buddy/frontend/src/lib/ai/gemini.ts`

1. **Removed initialization from constructor**:
```typescript
constructor() {
  // Don't initialize chat in constructor - do it lazily when needed
}
```

2. **Added provider check in initializeChat**:
```typescript
private initializeChat() {
  const selectedModel = getSelectedModel();
  // Only use Gemini models, fallback to default if non-Gemini model is selected
  let modelName = 'gemini-2.5-flash';
  if (selectedModel && selectedModel.provider === 'google') {
    modelName = selectedModel.name;
  }
  
  this.chat = ai.chats.create({
    model: modelName,
    history: this.chatHistory,
  });
}
```

3. **Added ensureChatInitialized helper**:
```typescript
private ensureChatInitialized() {
  if (!this.chat) {
    this.initializeChat();
  }
}
```

4. **Call before using chat**:
```typescript
async sendMessageWithMedia(message: string, attachments?: MediaAttachment[]) {
  this.ensureChatInitialized(); // ✅ Initialize only when needed
  if (!this.chat) throw new Error('Chat not initialized');
  // ... rest of code
}
```

## How It Works Now

### Before (Broken):
```
App starts → Gemini service created
           ↓
Constructor runs → initializeChat()
           ↓
Gets selected model (GPT-4o) → Tries to create Gemini chat with "gpt-4o"
           ↓
ERROR: 404 models/gpt-4o not found ❌
```

### After (Fixed):
```
App starts → Gemini service created
           ↓
Constructor runs → Does nothing ✅
           ↓
User sends message with Gemini model selected
           ↓
sendMessageWithMedia() → ensureChatInitialized()
           ↓
Checks provider === 'google' → Uses correct Gemini model
           ↓
SUCCESS: Chat initialized and message sent ✅
```

## Benefits

1. **No startup errors**: Service doesn't crash when non-Gemini models are selected
2. **Provider-aware**: Only initializes with Gemini models
3. **Lazy loading**: Chat is created only when needed
4. **Fallback safety**: Defaults to `gemini-2.5-flash` if something goes wrong

## Testing

To verify the fix:

1. **Restart your application** completely
2. **Select GPT-4o** (OpenAI model) - should show as ready
3. **Send a message** - should work with OpenAI ✅
4. **Switch to Gemini 2.5 Flash**
5. **Send a message** - should work with Gemini ✅
6. **No 404 errors** in console ✅

## Files Modified

- ✅ `buddy/frontend/src/lib/ai/gemini.ts` - Lazy initialization
- ✅ Frontend rebuilt successfully

---

**Date Fixed**: October 15, 2025
**Status**: ✅ RESOLVED

