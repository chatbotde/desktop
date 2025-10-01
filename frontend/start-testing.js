#!/usr/bin/env node

/**
 * Quick Start Script for AI Testing
 * 
 * Run this script to get started with testing your AI integration:
 * node start-testing.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 AI Integration Test Setup');
console.log('============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Main function to handle async operations
async function main() {
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    
    if (fs.existsSync(envExamplePath)) {
      // Copy from .env.example
      const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
      fs.writeFileSync(envPath, exampleContent);
      console.log('✅ Created .env file from .env.example');
    } else {
      // Create basic .env file
      const envContent = `# AI Provider API Keys
# Replace the placeholder values with your actual API keys

# Google Gemini API Key
VITE_GOOGLE_API_KEY=your_gemini_api_key_here

# OpenAI API Key  
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Anthropic (Claude) API Key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
`;
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Created basic .env file');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Edit the .env file and add your actual API keys');
    console.log('2. Get API keys from:');
    console.log('   - Gemini: https://ai.google.dev/');
    console.log('   - OpenAI: https://platform.openai.com/');
    console.log('   - Anthropic: https://console.anthropic.com/');
    console.log('3. Run: npm run dev');
    console.log('4. Click the "🧪 Test AI" button in the app');
    
  } else {
    console.log('✅ .env file already exists');
    
    // Check if API keys are configured
    // Note: In ES modules, we need to use dynamic import for dotenv
    try {
      const dotenv = await import('dotenv');
      dotenv.config();
    } catch (error) {
      console.log('Note: dotenv not available, checking .env file manually');
    }
    
    const keys = {
      gemini: process.env.VITE_GOOGLE_API_KEY,
      openai: process.env.VITE_OPENAI_API_KEY,
      anthropic: process.env.VITE_ANTHROPIC_API_KEY,
    };
    
    console.log('\n🔑 API Key Status:');
    let configuredCount = 0;
    
    Object.entries(keys).forEach(([provider, key]) => {
      const isConfigured = key && key !== 'your_api_key_here' && key.length > 0;
      const status = isConfigured ? '✅' : '❌';
      const maskedKey = key ? `${key.substring(0, 8)}...` : 'Not set';
      
      console.log(`   ${provider.toUpperCase()}: ${status} ${maskedKey}`);
      
      if (isConfigured) configuredCount++;
    });
    
    if (configuredCount > 0) {
      console.log(`\n🎉 ${configuredCount} provider(s) configured!`);
      console.log('\n📋 Ready to test:');
      console.log('1. Run: npm run dev');
      console.log('2. Open the app in your browser');
      console.log('3. Click the "🧪 Test AI" button');
      console.log('4. Click "Test All Providers" to verify everything works');
    } else {
      console.log('\n⚠️  No API keys configured yet');
      console.log('\n📋 To configure:');
      console.log('1. Edit the .env file');
      console.log('2. Replace the placeholder values with your actual API keys');
      console.log('3. Restart the development server');
    }
  }

  console.log('\n📚 For detailed instructions, see: AI_TESTING_GUIDE.md');
  console.log('🔧 For troubleshooting, check the browser console');
}

// Run the main function
main().catch(console.error);