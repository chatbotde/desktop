# Testing API Keys Configuration

## How to Test Your API Keys

### 1. Check if .env file exists
Location: `buddy/frontend/.env`

The file should contain:
```env
VITE_GOOGLE_API_KEY=your_actual_gemini_key
VITE_OPENAI_API_KEY=your_actual_openai_key
VITE_ANTHROPIC_API_KEY=your_actual_anthropic_key
VITE_OPENROUTER_API_KEY=your_actual_openrouter_key
```

### 2. Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab when:

1. **App loads** - Look for any API key warnings
2. **You send a message** - Look for the actual error

### 3. Common Issues

#### Issue: "API is configured" but chat doesn't work

**Possible causes:**

1. **API key is invalid** - The key exists but is wrong/expired
2. **API key has no credits** - OpenAI requires credits/billing setup
3. **Network error** - Firewall or network blocking the API
4. **CORS error** - Browser blocking the request

#### Issue: OpenAI shows "configured" but fails

Check in console for errors like:
- `401 Unauthorized` - Invalid API key
- `429 Too Many Requests` - Rate limit or no credits
- `Network error` - Connection issue

### 4. Test Each Provider

#### Test OpenAI:
1. Select "GPT-4o" model
2. Send message: "Hello, can you respond?"
3. Check console for errors

Expected console logs:
```
Main Window: Syncing selected model: gpt-4o
Main Window: Received message from chat input window: ...
Main Window: Adding user message: ...
```

If you see errors, they'll show what's wrong.

### 5. Verify API Keys Are Loading

Add this to your browser console:
```javascript
console.log('OpenAI Key:', import.meta.env.VITE_OPENAI_API_KEY ? 'Present' : 'Missing');
console.log('Gemini Key:', import.meta.env.VITE_GOOGLE_API_KEY ? 'Present' : 'Missing');
```

### 6. Common OpenAI Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| `401 Unauthorized` | Invalid API key | Check your key at platform.openai.com |
| `429 Too Many Requests` | No credits or rate limit | Add billing at platform.openai.com/account/billing |
| `400 Bad Request` | Invalid request format | Check if model name is correct |
| `Network error` | Can't reach API | Check internet/firewall |

### 7. Quick Debug Steps

1. **Restart dev server** after adding .env file
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Hard refresh browser** (Ctrl+Shift+R or Cmd+Shift+R)

3. **Check Welcome Screen** - Should show green checkmark for configured providers

4. **Try Gemini first** - If Gemini works but OpenAI doesn't, it's an OpenAI-specific issue

### 8. Get Detailed Error

When you send a message and it fails, the error will appear in:
1. **Browser Console** (F12 → Console tab)
2. **Chat window** (as an error message)

Copy the full error message and we can diagnose the exact issue.

---

## What to Check Next

Please check:
1. ✅ Do you have a `.env` file in `buddy/frontend/`?
2. ✅ Does it have `VITE_OPENAI_API_KEY=sk-...` (your actual key)?
3. ✅ Did you restart the dev server after adding the key?
4. ✅ What error appears in the browser console when you try to send a message?

Share the console error and I can help fix the specific issue!

