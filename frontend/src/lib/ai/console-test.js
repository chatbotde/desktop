/**
 * Console Test Script for AI Integration
 * 
 * Run this in the browser console to test your AI integration:
 * 
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Run: testAIIntegration()
 */

// Import the AI module (this will work in the browser)
async function loadAIModule() {
  try {
    const module = await import('./index.js');
    return module;
  } catch (error) {
    console.error('Failed to load AI module:', error);
    return null;
  }
}

// Test function
async function testAIIntegration() {
  console.log('🚀 Starting AI Integration Test');
  console.log('================================');
  
  // Load the AI module
  const ai = await loadAIModule();
  if (!ai) {
    console.error('❌ Could not load AI module');
    return;
  }
  
  console.log('✅ AI module loaded successfully');
  
  // Test 1: Check provider status
  console.log('\n📋 Step 1: Checking Provider Status');
  console.log('-----------------------------------');
  
  try {
    const status = ai.getProviderStatus();
    console.log('Provider Status:', status);
    
    Object.entries(status).forEach(([name, provider]) => {
      const icon = provider.configured ? '✅' : '❌';
      console.log(`${icon} ${name.toUpperCase()}: ${provider.configured ? 'Configured' : 'Not configured'}`);
    });
  } catch (error) {
    console.error('❌ Error checking provider status:', error);
  }
  
  // Test 2: Check current provider
  console.log('\n🎯 Step 2: Current Provider');
  console.log('---------------------------');
  
  try {
    const currentProvider = ai.getCurrentProvider();
    console.log(`Current Provider: ${currentProvider.name}`);
    console.log(`Configured: ${currentProvider.isConfigured() ? '✅' : '❌'}`);
    console.log(`Capabilities:`, currentProvider.capabilities);
  } catch (error) {
    console.error('❌ Error getting current provider:', error);
  }
  
  // Test 3: Test available models
  console.log('\n🤖 Step 3: Available Models');
  console.log('---------------------------');
  
  try {
    const models = ai.getAllAvailableModels();
    console.log(`Found ${models.length} models:`);
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.displayName} (${model.provider})`);
    });
  } catch (error) {
    console.error('❌ Error getting models:', error);
  }
  
  // Test 4: Test a simple message
  console.log('\n💬 Step 4: Testing Message Sending');
  console.log('----------------------------------');
  
  try {
    const currentProvider = ai.getCurrentProvider();
    if (!currentProvider.isConfigured()) {
      console.log('⚠️ Current provider is not configured, skipping message test');
    } else {
      console.log('📤 Sending test message...');
      const response = await ai.sendMessageComplete('Hello! Please respond with "API test successful" to confirm the connection is working.');
      
      if (response.success) {
        console.log('✅ Message sent successfully!');
        console.log('Response:', response.content);
        console.log('Provider:', response.provider);
        console.log('Model:', response.model);
      } else {
        console.log('❌ Message failed:', response.error);
      }
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
  }
  
  // Test 5: Test provider switching
  console.log('\n🔄 Step 5: Testing Provider Switching');
  console.log('------------------------------------');
  
  const providers = ['gemini', 'openai', 'anthropic'];
  
  for (const providerName of providers) {
    try {
      console.log(`\nSwitching to ${providerName}...`);
      ai.switchProvider(providerName);
      const provider = ai.getCurrentProvider();
      console.log(`✅ Switched to ${provider.name}`);
      console.log(`   Configured: ${provider.isConfigured() ? '✅' : '❌'}`);
    } catch (error) {
      console.error(`❌ Error switching to ${providerName}:`, error);
    }
  }
  
  console.log('\n🎉 Test Complete!');
  console.log('================');
  console.log('If you see any ❌ errors above, check your .env file and API keys.');
  console.log('Make sure to restart the development server after updating .env');
}

// Quick test function for individual providers
async function testProvider(providerName) {
  console.log(`🧪 Testing ${providerName.toUpperCase()} provider`);
  console.log('=====================================');
  
  const ai = await loadAIModule();
  if (!ai) {
    console.error('❌ Could not load AI module');
    return;
  }
  
  try {
    // Switch to provider
    ai.switchProvider(providerName);
    const provider = ai.getCurrentProvider();
    
    console.log(`Provider: ${provider.name}`);
    console.log(`Configured: ${provider.isConfigured() ? '✅' : '❌'}`);
    
    if (!provider.isConfigured()) {
      console.log('❌ Provider not configured, cannot test');
      return;
    }
    
    // Test message
    console.log('📤 Sending test message...');
    const response = await ai.sendMessageComplete('Hello! Please respond with "API test successful"');
    
    if (response.success) {
      console.log('✅ Test successful!');
      console.log('Response:', response.content);
    } else {
      console.log('❌ Test failed:', response.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Export functions to global scope for easy console access
window.testAIIntegration = testAIIntegration;
window.testProvider = testProvider;
window.loadAIModule = loadAIModule;

console.log('🔧 AI Test Functions Loaded!');
console.log('Available functions:');
console.log('- testAIIntegration() - Run full test suite');
console.log('- testProvider("gemini") - Test specific provider');
console.log('- testProvider("openai") - Test specific provider');
console.log('- testProvider("anthropic") - Test specific provider');
console.log('');
console.log('Run testAIIntegration() to start testing!');


