# Multi-Model AI Support

This system provides support for multiple AI models with easy switching and configuration management.

## Features

- **Multiple AI Providers**: Google Gemini, OpenAI (planned), Anthropic (planned)
- **Dynamic Model Switching**: Change models on-the-fly without restarting
- **Capability Detection**: Models advertise their supported features (images, audio, video)
- **Persistent Selection**: User's model choice is saved to localStorage
- **UI Integration**: Ready-to-use components for model selection

## Quick Start

```tsx
import { ModelSelector } from '@/components/ModelSelector';
import { handleModelChange } from '@/lib/ai/unified-ai-service';
import { getSelectedModel } from '@/lib/ai/model-config';

function MyComponent() {
  const currentModel = getSelectedModel();
  
  return (
    <div>
      <p>Current: {currentModel?.displayName}</p>
      <ModelSelector onModelChange={handleModelChange} />
    </div>
  );
}
```

## Available Models

- **Gemini 2.0 Flash (Experimental)**: Latest with improved performance
- **Gemini 2.5 Flash**: Advanced with enhanced capabilities  
- **Gemini 1.5 Flash**: Fast and efficient multimodal
- **Gemini 1.5 Pro**: Most capable for complex reasoning

## Testing

Use the demo component: `<ModelSelectionDemo />`

# Gemini AI Integration

This document explains how to set up and use the Google Gemini AI integration in your Buddy application.

## Setup Instructions

### 1. Get Your API Key
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new API key for Gemini
4. Copy the API key

### 2. Configure Environment Variables
1. Open the `.env` file in the `frontend` folder
2. Replace `your_api_key_here` with your actual API key:
   ```
   VITE_GOOGLE_API_KEY=your_actual_api_key_here
   ```
3. Save the file

### 3. Restart Development Server
After updating the `.env` file, restart your development server:
```bash
npm run dev
```

## Features

### 🔄 Streaming Responses
The integration supports real-time streaming responses from Gemini, so you see the AI's response as it's being generated.

### 💬 Chat History
The system maintains chat history for context-aware conversations. The AI will remember previous messages in the same session.

### ⚡ Error Handling
Robust error handling with user-friendly error messages and fallbacks.

### 🎯 Configuration Status
The app displays the configuration status on the welcome screen, showing if the API key is properly set up.

## Usage

### Basic Chat
1. Click the chat button (💬) to open the floating chat input
2. Type your message and press Enter
3. The response will stream in real-time from Gemini

### Testing the Integration
You can test the integration using the browser console:

```javascript
// Import the test functions
import { runAllTests } from '@/lib/ai/gemini-test';

// Run all tests
runAllTests().then(results => {
  console.log('Test results:', results);
});
```

Or test individual functions:
```javascript
import { testConfiguration, testConnection } from '@/lib/ai/gemini-test';

// Test configuration
await testConfiguration();

// Test connection
await testConnection();
```

## API Reference

### Core Functions

#### `sendToGemini(message: string)`
Sends a message and returns a streaming response.
```javascript
import { sendToGemini } from '@/lib/ai/gemini';

const stream = await sendToGemini('Hello, how are you?');
for await (const chunk of stream) {
  console.log(chunk); // Each chunk of the response
}
```

#### `sendToGeminiComplete(message: string)`
Sends a message and returns the complete response.
```javascript
import { sendToGeminiComplete } from '@/lib/ai/gemini';

const response = await sendToGeminiComplete('What is the weather like?');
console.log(response); // Complete response
```

### Utility Functions

#### `isGeminiConfigured()`
Checks if the API key is properly configured.
```javascript
import { isGeminiConfigured } from '@/lib/ai/gemini-utils';

if (isGeminiConfigured()) {
  console.log('Gemini is ready to use!');
}
```

#### `getGeminiConfigStatus()`
Returns detailed configuration status and instructions.
```javascript
import { getGeminiConfigStatus } from '@/lib/ai/gemini-utils';

const status = getGeminiConfigStatus();
console.log(status.message);
console.log(status.instructions);
```

### Chat Service Class

#### `GeminiChatService`
The main chat service class with advanced features:
```javascript
import { geminiChat } from '@/lib/ai/gemini';

// Get chat history
const history = geminiChat.getChatHistory();

// Clear chat history
geminiChat.clearHistory();

// Add system context
geminiChat.addSystemContext('You are a helpful coding assistant.');
```

## Configuration Options

### Environment Variables
- `VITE_GOOGLE_API_KEY`: Your Google Gemini API key

### Model Configuration
The default model is `gemini-2.5-flash`. You can change this in `gemini.ts`:
```javascript
const chat = ai.chats.create({
  model: "gemini-2.5-flash", // Change this to use a different model
  history: this.chatHistory,
});
```

## Troubleshooting

### Common Issues

#### "API key not configured"
- Make sure you added your API key to the `.env` file
- Restart the development server after changing the `.env` file
- Check that the API key doesn't contain any extra spaces or quotes

#### "Failed to initialize Gemini chat"
- Verify your API key is valid at [Google AI Studio](https://ai.google.dev/)
- Check your internet connection
- Make sure you have credits available in your Google AI account

#### "Connection failed" or "Network error"
- Check your internet connection
- Verify the API key has the necessary permissions
- Check if there are any CORS issues in the browser console

### Debug Mode
You can enable detailed logging by opening the browser console and checking for Gemini-related log messages.

## Security Notes

- API keys are stored in environment variables and should never be committed to version control
- The `.env` file is gitignored by default
- API calls are made from the frontend, so the API key will be visible in the built application
- Consider implementing a backend proxy for production applications to keep API keys secure

## Rate Limits

Google Gemini has rate limits that vary by model and account type. If you encounter rate limit errors:
- Implement retry logic with exponential backoff
- Consider using a different model with higher limits
- Monitor your usage in the Google AI Studio

## Advanced Usage

### Custom System Context
You can set a custom system context for specialized behaviors:
```javascript
import { geminiChat } from '@/lib/ai/gemini';

geminiChat.addSystemContext(`
You are Buddy, a helpful desktop AI assistant. 
You help users with coding, productivity, and general questions.
Keep responses concise and practical.
`);
```

### Streaming with Custom Handling
```javascript
import { sendToGemini } from '@/lib/ai/gemini';

const stream = await sendToGemini('Explain React hooks');
let fullResponse = '';

for await (const chunk of stream) {
  fullResponse += chunk;
  
  // Custom handling for each chunk
  updateUI(fullResponse);
  
  // Add delay if needed
  await new Promise(resolve => setTimeout(resolve, 50));
}
```

## Contributing

When contributing to the Gemini integration:
1. Test all changes with the test suite
2. Update this README if adding new features
3. Follow the existing error handling patterns
4. Add proper TypeScript types for new functions
