# AI Provider API Keys Setup

This application supports multiple AI providers. You need to configure API keys for the providers you want to use.

## Required API Keys

Create a `.env` file in the `buddy/frontend` directory with the following keys:

### Google Gemini (Default)
```env
VITE_GOOGLE_API_KEY=your_google_api_key_here
# or
VITE_GEMINI_API_KEY=your_google_api_key_here
```
**Get your key from:** https://ai.google.dev/

### OpenAI (GPT-4o, GPT-4 Turbo)
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```
**Get your key from:** https://platform.openai.com/api-keys

### Anthropic (Claude 3.5 Sonnet)
```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
**Get your key from:** https://console.anthropic.com/settings/keys

### OpenRouter (DeepSeek and other models)
```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```
**Get your key from:** https://openrouter.ai/keys

## Example .env File

```env
# Google Gemini
VITE_GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# OpenAI
VITE_OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# OpenRouter
VITE_OPENROUTER_API_KEY=sk-or-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Important Notes

1. **You only need to configure the API keys for the providers you want to use.**
2. The application will automatically route messages to the selected provider based on the model you choose.
3. If you try to use a model without configuring its API key, you'll see a clear error message.
4. Never commit your `.env` file to version control. It's already in `.gitignore`.
5. After adding or changing API keys, restart the development server.

## How It Works

1. Select a model from the model selector in the UI
2. The application automatically detects the provider (Google, OpenAI, Anthropic, or OpenRouter)
3. Messages are routed to the correct API based on the selected model
4. All providers support streaming responses for real-time interaction

## Supported Models

### Google Gemini
- Gemini 2.5 Flash (Default)
- Gemini 2.0 Flash (Experimental)
- Gemini 1.5 Flash
- Gemini 1.5 Pro

### OpenAI
- GPT-4o (Multimodal)
- GPT-4 Turbo

### Anthropic
- Claude 3.5 Sonnet

### OpenRouter
- DeepSeek Chat
- DeepSeek Reasoner

## Troubleshooting

If you see an error like "API key not configured":
1. Check that your `.env` file exists in `buddy/frontend/`
2. Verify the API key variable name matches exactly (including `VITE_` prefix)
3. Make sure there are no extra spaces or quotes around the key
4. Restart the development server after adding keys

