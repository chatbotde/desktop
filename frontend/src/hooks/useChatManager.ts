import { useState, useRef, useCallback } from 'react'
import type { ChatMessage, MediaAttachment } from '@/components/Messages'
import { windowResizeManager } from '@/lib/window-resize'
import { sendMediaToGemini } from '@/lib/ai/gemini'
import { handleModelChange as unifiedHandleModelChange } from '@/lib/ai/unified-ai-service'

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
    
    // Convert attachments to MediaAttachment format if present
    let mediaAttachments: MediaAttachment[] | undefined;
    if (messageData.attachments && messageData.attachments.length > 0) {
      mediaAttachments = messageData.attachments.map((att: any) => ({
        id: att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        data: att.data,
        source: att.source,
        mediaType: att.mediaType || getMediaTypeFromMime(att.type),
        dimensions: att.dimensions,
        duration: att.duration
      }));
    }
    
    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: messageData.content || '',
      timestamp: new Date(messageData.timestamp || Date.now()),
      attachments: mediaAttachments
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
      // Send message with media to Gemini and handle streaming response
      const responseStream = await sendMediaToGemini(messageData.content || '', mediaAttachments);
      
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

  // Helper function to determine media type from MIME type
  const getMediaTypeFromMime = (mimeType: string): 'image' | 'video' | 'audio' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'image'; // fallback
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        console.log('Text copied to clipboard using modern API')
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (!successful) {
          throw new Error('Copy command failed')
        }
        console.log('Text copied to clipboard using fallback method')
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowChat(false)
    setIsTyping(false)
    processedMessageIds.current.clear()
    messageCounterRef.current = 0
  }

  const handleModelChange = () => {
    // Use unified AI service to handle model changes
    unifiedHandleModelChange()
    console.log('Chat manager: AI model changed, services reinitialized')
  }

  return {
    messages,
    showChat,
    isTyping,
    handleChatMessage,
    copyToClipboard,
    clearChat,
    handleModelChange
  }
}
