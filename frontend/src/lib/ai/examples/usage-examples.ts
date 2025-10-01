/**
 * Usage Examples for the AI Module
 * 
 * This file contains practical examples of how to use the AI module
 * in different scenarios.
 */

import {
  sendMessage,
  sendMessageWithMedia,
  sendMessageComplete,
  switchProvider,
  getCurrentProvider,
  getAllAvailableModels,
  handleModelChange,
  type MediaAttachment,
  type AIModel,
} from '../index';

// ============================================================================
// Example 1: Basic Text Message (Streaming)
// ============================================================================

export async function example1_BasicStreaming() {
  console.log('Example 1: Basic Streaming');
  
  try {
    const stream = await sendMessage('What is React?');
    
    console.log('Streaming response:');
    for await (const chunk of stream) {
      process.stdout.write(chunk); // Print as it streams
    }
    console.log('\n--- End of stream ---\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 2: Complete Response (Non-Streaming)
// ============================================================================

export async function example2_CompleteResponse() {
  console.log('Example 2: Complete Response');
  
  try {
    const response = await sendMessageComplete('Explain TypeScript in one sentence');
    
    console.log('Response:', response);
    console.log('Success:', response.success);
    console.log('Content:', response.content);
    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 3: Sending Image with Message
// ============================================================================

export async function example3_ImageMessage() {
  console.log('Example 3: Image Message');
  
  // Create a sample image attachment
  const imageAttachment: MediaAttachment = {
    id: '1',
    name: 'photo.jpg',
    type: 'image/jpeg',
    size: 102400,
    data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', // base64 data
    source: 'upload',
    mediaType: 'image',
    dimensions: { width: 800, height: 600 },
  };
  
  try {
    const stream = await sendMessageWithMedia(
      'What do you see in this image?',
      [imageAttachment]
    );
    
    console.log('Response:');
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 4: Switching Providers
// ============================================================================

export async function example4_SwitchingProviders() {
  console.log('Example 4: Switching Providers');
  
  try {
    // Check current provider
    console.log('Current provider:', getCurrentProvider().name);
    
    // Send message with Gemini
    console.log('\nUsing Gemini:');
    let stream = await sendMessage('Hello!');
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    
    // Switch to OpenAI
    console.log('\n\nSwitching to OpenAI...');
    switchProvider('openai');
    console.log('Current provider:', getCurrentProvider().name);
    
    // Send message with OpenAI
    console.log('\nUsing OpenAI:');
    stream = await sendMessage('Hello!');
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 5: Working with Models
// ============================================================================

export async function example5_WorkingWithModels() {
  console.log('Example 5: Working with Models');
  
  try {
    // Get all available models
    const models = getAllAvailableModels();
    
    console.log('\nAvailable Models:');
    models.forEach((model: AIModel) => {
      console.log(`- ${model.displayName} (${model.provider})`);
      console.log(`  Category: ${model.category}`);
      console.log(`  Supports: Images=${model.supportsImages}, Audio=${model.supportsAudio}, Video=${model.supportsVideo}`);
    });
    
    // Change to a specific model
    console.log('\nChanging to GPT-4o...');
    const success = handleModelChange('gpt-4o');
    console.log('Success:', success);
    console.log('Current provider:', getCurrentProvider().name);
    console.log('Current model:', getCurrentProvider().getCurrentModel());
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 6: Chat History
// ============================================================================

export async function example6_ChatHistory() {
  console.log('Example 6: Chat History');
  
  try {
    const provider = getCurrentProvider();
    
    // Clear history first
    provider.clearHistory();
    
    // Send first message
    await sendMessageComplete('My name is John');
    
    // Send second message
    await sendMessageComplete('What is my name?');
    
    // Get chat history
    const history = provider.getChatHistory();
    console.log('\nChat History:');
    history.forEach((msg, idx) => {
      console.log(`${idx + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 7: System Context
// ============================================================================

export async function example7_SystemContext() {
  console.log('Example 7: System Context');
  
  try {
    const provider = getCurrentProvider();
    
    // Set system context
    provider.setSystemContext(
      'You are a helpful coding assistant specializing in TypeScript and React. ' +
      'Always provide concise, practical answers with code examples.'
    );
    
    // Now all messages will use this context
    const response = await sendMessageComplete('How do I use useState?');
    console.log('Response:', response.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 8: Error Handling
// ============================================================================

export async function example8_ErrorHandling() {
  console.log('Example 8: Error Handling');
  
  try {
    const response = await sendMessageComplete('Test message');
    
    if (!response.success) {
      console.error('AI request failed:', response.error);
      // Handle error appropriately
      return;
    }
    
    console.log('Success! Response:', response.content);
  } catch (error) {
    console.error('Unexpected error:', error);
    // Handle exception
  }
}

// ============================================================================
// Example 9: Provider Capabilities
// ============================================================================

export async function example9_ProviderCapabilities() {
  console.log('Example 9: Provider Capabilities');
  
  try {
    const provider = getCurrentProvider();
    const capabilities = provider.capabilities;
    
    console.log('\nCurrent Provider:', provider.name);
    console.log('Capabilities:');
    console.log('- Streaming:', capabilities.streaming);
    console.log('- Images:', capabilities.images);
    console.log('- Audio:', capabilities.audio);
    console.log('- Video:', capabilities.video);
    console.log('- Function Calling:', capabilities.functionCalling);
    console.log('- System Prompts:', capabilities.systemPrompts);
    console.log('- Chat History:', capabilities.chatHistory);
    console.log('- Max Tokens:', capabilities.maxTokens);
    console.log('- Context Window:', capabilities.contextWindow);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 10: React Component Integration
// ============================================================================

export const Example10_ReactComponent = `
import { useState, useEffect } from 'react';
import { 
  sendMessage, 
  switchProvider, 
  getCurrentProvider, 
  getAllAvailableModels 
} from '@/lib/ai';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(getCurrentProvider().name);
  const models = getAllAvailableModels();

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const stream = await sendMessage(message);
      
      for await (const chunk of stream) {
        setResponse(prev => prev + chunk);
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (newProvider) => {
    switchProvider(newProvider);
    setProvider(newProvider);
  };

  return (
    <div className="chat-container">
      <div className="provider-selector">
        <select 
          value={provider} 
          onChange={(e) => handleProviderChange(e.target.value)}
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>
      
      <div className="chat-input">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      <div className="chat-response">
        {response && <pre>{response}</pre>}
      </div>
    </div>
  );
}

export default ChatComponent;
`;

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('AI Module Usage Examples');
  console.log('='.repeat(80));
  
  await example1_BasicStreaming();
  console.log('\n' + '='.repeat(80) + '\n');
  
  await example2_CompleteResponse();
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Uncomment other examples as needed
  // await example3_ImageMessage();
  // await example4_SwitchingProviders();
  // await example5_WorkingWithModels();
  // await example6_ChatHistory();
  // await example7_SystemContext();
  // await example8_ErrorHandling();
  // await example9_ProviderCapabilities();
  
  console.log('React Component Example:');
  console.log(Example10_ReactComponent);
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
