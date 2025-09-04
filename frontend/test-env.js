// Simple test to check if environment variables are loaded
console.log('Environment variables test:');
console.log('VITE_GOOGLE_API_KEY:', import.meta.env.VITE_GOOGLE_API_KEY ? 'Found' : 'Not found');
console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? 'Found' : 'Not found');
console.log('VITE_ASSEMBLYAI_API_KEY:', import.meta.env.VITE_ASSEMBLYAI_API_KEY ? 'Found' : 'Not found');

// If API key is available, test initialization
if (import.meta.env.VITE_GOOGLE_API_KEY) {
  console.log('✅ Google/Gemini API key is available for initialization');
} else {
  console.error('❌ Google/Gemini API key is missing - Gemini service will fail');
}
