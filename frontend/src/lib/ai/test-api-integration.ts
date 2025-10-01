/**
 * API Integration Test Suite
 * 
 * This file provides comprehensive testing for all AI providers to verify
 * that API keys are properly configured and working.
 */

import {
  getProviderStatus,
  getCurrentProvider,
  switchProvider,
  sendMessageComplete,
  getAllAvailableModels,
  type ProviderName,
} from './index';

// Test results interface
interface TestResult {
  provider: string;
  configured: boolean;
  initialized: boolean;
  testMessage: string;
  response?: string;
  error?: string;
  success: boolean;
  responseTime: number;
}

interface TestSuite {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  summary: string;
}

/**
 * Test a single provider
 */
async function testProvider(providerName: ProviderName): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    provider: providerName,
    configured: false,
    initialized: false,
    testMessage: 'Hello! Please respond with "API test successful" to confirm the connection is working.',
    success: false,
    responseTime: 0,
  };

  try {
    console.log(`\n🧪 Testing ${providerName.toUpperCase()} provider...`);
    
    // Switch to the provider
    switchProvider(providerName);
    const provider = getCurrentProvider();
    
    // Check if configured
    result.configured = provider.isConfigured();
    console.log(`   📋 Configured: ${result.configured ? '✅' : '❌'}`);
    
    if (!result.configured) {
      result.error = `API key not configured for ${providerName}`;
      result.responseTime = Date.now() - startTime;
      return result;
    }
    
    // Check if initialized
    result.initialized = provider.isConfigured();
    console.log(`   🔧 Initialized: ${result.initialized ? '✅' : '❌'}`);
    
    // Test with a simple message
    console.log(`   📤 Sending test message...`);
    const response = await sendMessageComplete(result.testMessage);
    
    if (response.success && response.content) {
      result.response = response.content;
      result.success = true;
      console.log(`   ✅ Response received: ${response.content.substring(0, 100)}...`);
    } else {
      result.error = response.error || 'Unknown error';
      result.success = false;
      console.log(`   ❌ Error: ${result.error}`);
    }
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.success = false;
    console.log(`   ❌ Exception: ${result.error}`);
  }
  
  result.responseTime = Date.now() - startTime;
  console.log(`   ⏱️  Response time: ${result.responseTime}ms`);
  
  return result;
}

/**
 * Test all available providers
 */
export async function testAllProviders(): Promise<TestSuite> {
  console.log('🚀 Starting AI Provider Integration Tests');
  console.log('=' .repeat(60));
  
  const providers: ProviderName[] = ['gemini', 'openai', 'anthropic'];
  const results: TestResult[] = [];
  
  for (const provider of providers) {
    const result = await testProvider(provider);
    results.push(result);
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const passedTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success).length;
  
  const summary = `
📊 Test Summary:
   Total Tests: ${results.length}
   ✅ Passed: ${passedTests}
   ❌ Failed: ${failedTests}
   Success Rate: ${Math.round((passedTests / results.length) * 100)}%
  `;
  
  console.log(summary);
  
  return {
    totalTests: results.length,
    passedTests,
    failedTests,
    results,
    summary,
  };
}

/**
 * Test a specific provider
 */
export async function testSingleProvider(providerName: ProviderName): Promise<TestResult> {
  console.log(`🎯 Testing ${providerName.toUpperCase()} provider only`);
  console.log('=' .repeat(40));
  
  return await testProvider(providerName);
}

/**
 * Check configuration status for all providers
 */
export function checkConfigurationStatus() {
  console.log('🔍 Checking API Key Configuration Status');
  console.log('=' .repeat(50));
  
  const providers: ProviderName[] = ['gemini', 'openai', 'anthropic'];
  
  providers.forEach(providerName => {
    switchProvider(providerName);
    const provider = getCurrentProvider();
    const configured = provider.isConfigured();
    
    console.log(`${providerName.toUpperCase()}: ${configured ? '✅ Configured' : '❌ Not configured'}`);
    
    if (configured) {
      console.log(`   📋 Provider: ${provider.name}`);
      console.log(`   🔧 Capabilities: ${Object.keys(provider.capabilities).join(', ')}`);
    }
  });
  
  // Show current provider
  const currentProvider = getCurrentProvider();
  console.log(`\n🎯 Current Provider: ${currentProvider.name}`);
  console.log(`   Configured: ${currentProvider.isConfigured() ? '✅' : '❌'}`);
}

/**
 * Test model availability
 */
export function testModelAvailability() {
  console.log('🤖 Testing Model Availability');
  console.log('=' .repeat(40));
  
  const models = getAllAvailableModels();
  
  console.log(`\n📋 Available Models (${models.length} total):`);
  models.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model.displayName}`);
    console.log(`      Provider: ${model.provider}`);
    console.log(`      Category: ${model.category}`);
    console.log(`      Images: ${model.supportsImages ? '✅' : '❌'}`);
    console.log(`      Audio: ${model.supportsAudio ? '✅' : '❌'}`);
    console.log(`      Video: ${model.supportsVideo ? '✅' : '❌'}`);
    console.log('');
  });
}

/**
 * Quick health check
 */
export async function quickHealthCheck(): Promise<boolean> {
  console.log('⚡ Quick Health Check');
  console.log('=' .repeat(30));
  
  try {
    const status = getProviderStatus();
    const hasConfiguredProvider = Object.values(status).some(provider => provider.configured);
    
    if (!hasConfiguredProvider) {
      console.log('❌ No providers are configured');
      return false;
    }
    
    // Test with the first configured provider
    const configuredProviders = Object.entries(status)
      .filter(([_, provider]) => provider.configured)
      .map(([name]) => name as ProviderName);
    
    if (configuredProviders.length > 0) {
      const testResult = await testProvider(configuredProviders[0]);
      console.log(`✅ Health check ${testResult.success ? 'passed' : 'failed'}`);
      return testResult.success;
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Health check failed: ${error}`);
    return false;
  }
}

/**
 * Run comprehensive test suite
 */
export async function runComprehensiveTest(): Promise<TestSuite> {
  console.log('🧪 Running Comprehensive AI Integration Test Suite');
  console.log('=' .repeat(60));
  
  // 1. Check configuration
  checkConfigurationStatus();
  console.log('\n');
  
  // 2. Test model availability
  testModelAvailability();
  console.log('\n');
  
  // 3. Test all providers
  const testResults = await testAllProviders();
  
  // 4. Show detailed results
  console.log('\n📋 Detailed Results:');
  console.log('=' .repeat(40));
  
  testResults.results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.provider.toUpperCase()}:`);
    console.log(`   Configured: ${result.configured ? '✅' : '❌'}`);
    console.log(`   Initialized: ${result.initialized ? '✅' : '❌'}`);
    console.log(`   Test Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.response) {
      console.log(`   Response: ${result.response.substring(0, 150)}...`);
    }
  });
  
  return testResults;
}

// Export individual test functions for easy use
export {
  testProvider,
};

// Auto-run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTest().catch(console.error);
}


