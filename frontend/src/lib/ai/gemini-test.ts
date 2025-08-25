/**
 * Test script for Gemini integration
 * Run this in the browser console to test the Gemini API
 */

import { sendToGemini, sendToGeminiComplete, geminiChat } from './gemini';
import { testGeminiConnection, isGeminiConfigured } from './gemini-utils';

// Test basic configuration
export async function testConfiguration() {
  console.log('🔧 Testing Gemini Configuration...');
  console.log('Is configured:', isGeminiConfigured());
  
  if (!isGeminiConfigured()) {
    console.log('❌ API key not configured. Please add your API key to .env file');
    return false;
  }
  
  console.log('✅ Configuration looks good');
  return true;
}

// Test connection
export async function testConnection() {
  console.log('🌐 Testing Gemini Connection...');
  
  try {
    const result = await testGeminiConnection();
    if (result.success) {
      console.log('✅ Connection successful:', result.message);
      return true;
    } else {
      console.log('❌ Connection failed:', result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection test failed:', error);
    return false;
  }
}

// Test streaming response
export async function testStreaming() {
  console.log('🔄 Testing Streaming Response...');
  
  try {
    const stream = await sendToGemini('Say hello and count from 1 to 5');
    console.log('✅ Stream started');
    
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
      console.log('📝 Chunk:', chunk);
    }
    
    console.log('✅ Full response:', fullResponse);
    return true;
  } catch (error) {
    console.log('❌ Streaming test failed:', error);
    return false;
  }
}

// Test complete response
export async function testComplete() {
  console.log('📝 Testing Complete Response...');
  
  try {
    const response = await sendToGeminiComplete('What is the capital of France?');
    console.log('✅ Complete response:', response);
    return true;
  } catch (error) {
    console.log('❌ Complete response test failed:', error);
    return false;
  }
}

// Test chat history
export async function testChatHistory() {
  console.log('💬 Testing Chat History...');
  
  try {
    // Send a few messages to build history
    await sendToGeminiComplete('My name is John');
    await sendToGeminiComplete('What is my name?');
    
    const history = geminiChat.getHistory();
    console.log('✅ Chat history:', history);
    console.log('History length:', history.length);
    return true;
  } catch (error) {
    console.log('❌ Chat history test failed:', error);
    return false;
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Running All Gemini Tests...');
  console.log('================================');
  
  const results = {
    configuration: await testConfiguration(),
    connection: false,
    streaming: false,
    complete: false,
    chatHistory: false
  };
  
  // Only run other tests if configuration is good
  if (results.configuration) {
    results.connection = await testConnection();
    
    if (results.connection) {
      results.streaming = await testStreaming();
      results.complete = await testComplete();
      results.chatHistory = await testChatHistory();
    }
  }
  
  console.log('================================');
  console.log('🏁 Test Results Summary:');
  console.log('Configuration:', results.configuration ? '✅' : '❌');
  console.log('Connection:', results.connection ? '✅' : '❌');
  console.log('Streaming:', results.streaming ? '✅' : '❌');
  console.log('Complete Response:', results.complete ? '✅' : '❌');
  console.log('Chat History:', results.chatHistory ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('Overall:', allPassed ? '✅ All tests passed!' : '❌ Some tests failed');
  
  return results;
}

// Example usage:
// import { runAllTests } from '@/lib/ai/gemini-test';
// runAllTests().then(results => console.log('Tests completed:', results));
