import { useState, useRef, useCallback } from 'react'
import type { ChatMessage } from '@/components/Messages'
import { windowResizeManager } from '@/lib/window-resize'
import { sendToGemini } from '@/lib/ai/gemini'

export function useChatManager() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showChat, setShowChat] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messageCounterRef = useRef(0)
  const processedMessageIds = useRef(new Set<string>())

  const handleChatMessage = useCallback(async (messageData: any) => {
    console.log('Main Window: Received message from chat input window:', messageData);
    
    // Generate a unique message ID
    const messageId = messageData.id || `msg_${Date.now()}_${++messageCounterRef.current}`;
    
    // Prevent duplicate messages by checking if message with same ID already exists
    if (processedMessageIds.current.has(messageId)) {
      console.log('Main Window: Duplicate message detected, ignoring:', messageId);
      return;
    }
    
    // Mark this message ID as processed
    processedMessageIds.current.add(messageId);
    
    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: messageData.content,
      timestamp: new Date(messageData.timestamp || Date.now())
    }

    console.log('Main Window: Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage])
    setShowChat(true)
    setIsTyping(true)

    // Trigger window resize after content change
    setTimeout(() => {
      if (windowResizeManager) {
        windowResizeManager.forceResize();
      }
    }, 100)

    try {
      // Send message to Gemini and handle streaming response
      const responseStream = await sendToGemini(messageData.content);
      
      setIsTyping(false);
      
      // Create assistant message with empty content initially
      const assistantMessageId = `assistant_${Date.now()}_${++messageCounterRef.current}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      console.log('Main Window: Adding assistant message:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      
      // Stream the response content
      let fullResponse = '';
      for await (const chunk of responseStream) {
        fullResponse += chunk;
        
        // Update the assistant message with accumulated content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullResponse }
            : msg
        ));
      }
      
      // Trigger window resize after content change
      setTimeout(() => {
        if (windowResizeManager) {
          windowResizeManager.forceResize();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error getting response from Gemini:', error);
      setIsTyping(false);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}_${++messageCounterRef.current}`,
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your message. Please make sure your Gemini API key is configured correctly. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Trigger window resize after content change
      setTimeout(() => {
        if (windowResizeManager) {
          windowResizeManager.forceResize();
        }
      }, 100);
    }
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('Text copied to clipboard')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowChat(false)
    setIsTyping(false)
    
    // Clear processed message IDs to allow new messages
    processedMessageIds.current.clear()
    messageCounterRef.current = 0
    
    // Trigger window resize after content change
    setTimeout(() => {
      if (windowResizeManager) {
        windowResizeManager.forceResize();
      }
    }, 100)
  }

  return {
    messages,
    showChat,
    isTyping,
    handleChatMessage,
    copyToClipboard,
    clearChat
  }
}
