import { geminiChat } from './gemini';

/**
 * Check if Gemini API is properly configured
 */
export function isGeminiConfigured(): boolean {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  return !!(apiKey && apiKey !== 'your_api_key_here' && apiKey.length > 0);
}

/**
 * Get configuration status and instructions
 */
export function getGeminiConfigStatus() {
  const isConfigured = isGeminiConfigured();
  
  return {
    isConfigured,
    message: isConfigured 
      ? 'Gemini API is configured and ready to use!'
      : 'Gemini API key not configured. Please add your API key to the .env file.',
    instructions: isConfigured ? null : [
      '1. Get your API key from https://ai.google.dev/',
      '2. Open the .env file in the frontend folder',
      '3. Replace "your_api_key_here" with your actual API key',
      '4. Restart the development server'
    ]
  };
}

/**
 * Initialize Gemini with custom system context
 */
export function initializeGeminiWithContext(context: string) {
  geminiChat.addSystemContext(context);
}

/**
 * Test Gemini connection
 */
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  if (!isGeminiConfigured()) {
    return {
      success: false,
      message: 'API key not configured'
    };
  }

  try {
    const response = await geminiChat.sendMessageComplete('Hello! Please respond with "Connection successful" to confirm you are working.');
    return {
      success: true,
      message: `Connection successful! Response: ${response.substring(0, 100)}...`
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
