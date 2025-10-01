/**
 * Quick AI Integration Test
 * 
 * Run this file to test your AI integration:
 * node test-ai-integration.js
 */

// This is a simple Node.js test script that can be run independently
// to verify your API keys are working

console.log('🚀 AI Integration Test');
console.log('=====================');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📝 Please create a .env file with your API keys:');
  console.log('');
  console.log('VITE_GOOGLE_API_KEY=your_gemini_api_key_here');
  console.log('VITE_OPENAI_API_KEY=your_openai_api_key_here');
  console.log('VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here');
  console.log('');
  console.log('💡 You can copy .env.example to .env as a starting point');
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

console.log('✅ .env file found');
console.log('');

// Check API keys
const keys = {
  gemini: process.env.VITE_GOOGLE_API_KEY,
  openai: process.env.VITE_OPENAI_API_KEY,
  anthropic: process.env.VITE_ANTHROPIC_API_KEY,
};

console.log('🔑 API Key Status:');
Object.entries(keys).forEach(([provider, key]) => {
  const status = key && key !== 'your_api_key_here' && key.length > 0 ? '✅' : '❌';
  const maskedKey = key ? `${key.substring(0, 8)}...` : 'Not set';
  console.log(`   ${provider.toUpperCase()}: ${status} ${maskedKey}`);
});

console.log('');
console.log('📋 Next Steps:');
console.log('1. Make sure your API keys are correctly set in the .env file');
console.log('2. Start the development server: npm run dev');
console.log('3. Open the app and test the AI integration in the browser');
console.log('4. Use the browser console to run: testAllProviders()');
console.log('');
console.log('🎯 For detailed testing, open the browser console and run:');
console.log('   import("./src/lib/ai/test-api-integration.js").then(m => m.runComprehensiveTest())');


