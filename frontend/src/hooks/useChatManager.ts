import { useState, useRef, useCallback } from 'react'
import type { ChatMessage, MediaAttachment } from '@/components/Messages'
import { sendMessage } from '@/lib/ai'
import { setSelectedModel } from '@/lib/ai/model-config'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'

export function useChatManager() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showChat, setShowChat] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messageCounterRef = useRef(0)
  const processedMessageIds = useRef(new Set<string>())
  const abortControllerRef = useRef<AbortController | null>(null)
  const messageQueueRef = useRef<any[]>([])
  const isProcessingRef = useRef(false)

  // Helper function to determine media type from MIME type
  const getMediaTypeFromMime = (mimeType: string): 'image' | 'video' | 'audio' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'image'; // fallback
  };

  // Process messages from queue sequentially
  const processMessageQueue = useCallback(async () => {
    // If already processing or queue is empty, return
    if (isProcessingRef.current || messageQueueRef.current.length === 0) {
      return
    }

    // Mark as processing
    isProcessingRef.current = true

    // Get the next message from queue
    const messageData = messageQueueRef.current.shift()
    if (!messageData) {
      isProcessingRef.current = false
      return
    }

    // Sync the selected model from chat-input window to main window
    if (messageData.selectedModel) {
      setSelectedModel(messageData.selectedModel);
    }
    
    // Generate a unique message ID
    const messageId = messageData.id || `msg_${Date.now()}_${++messageCounterRef.current}`;
    
    // Prevent duplicate messages by checking if message with same ID already exists
    if (processedMessageIds.current.has(messageId)) {
      // Continue processing next message
      isProcessingRef.current = false
      processMessageQueue()
      return
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

    try {
      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      
      // Check if a local LLM model is selected
      // First ensure local LLM service is initialized
      let localLLMInitialized = false;
      try {
        const initResult = await unifiedLocalLLMService.initialize();
        localLLMInitialized = initResult.success;
        console.log('Local LLM initialization:', initResult.message);
      } catch (error) {
        console.warn('Failed to initialize local LLM service:', error);
      }
      
      // Check if a local model is currently set in the service
      const currentLocalModel = unifiedLocalLLMService.getCurrentModel();
      console.log('Current local model check:', currentLocalModel);
      console.log('Ollama service current model:', unifiedLocalLLMService.getCurrentModel()?.name || 'none');
      
      const isLocalModelSelected = currentLocalModel !== null;
      
      let responseStream: AsyncGenerator<string, void, unknown>;
      
      if (isLocalModelSelected && currentLocalModel) {
        // Use local LLM service
        console.log('✅ Using local LLM model:', currentLocalModel.displayName, '(', currentLocalModel.name, ')');
        try {
          // Ensure Ollama is running
          const isConfigured = await unifiedLocalLLMService.isConfigured();
          if (!isConfigured) {
            throw new Error('Ollama is not running. Please start Ollama service.');
          }
          
          responseStream = await unifiedLocalLLMService.sendMessage(
            messageData.content || '', 
            mediaAttachments,
            currentLocalModel.name
          );
        } catch (localError) {
          console.error('❌ Local LLM error:', localError);
          throw localError;
        }
      } else {
        // Use cloud AI service (automatically routed)
        console.log('⚠️ Using cloud AI service (no local model selected)');
        console.log('   - Local model check result:', isLocalModelSelected);
        console.log('   - Current local model:', currentLocalModel);
        responseStream = await sendMessage(messageData.content || '', mediaAttachments);
      }
      
      setIsTyping(false);
      setIsStreaming(true);
      
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
      try {
        for await (const chunk of responseStream) {
          // Check if streaming was aborted
          if (abortControllerRef.current?.signal.aborted) {
            console.log('Streaming aborted by user');
            break;
          }
          
          fullResponse += chunk;
          
          // Update the assistant message with accumulated content
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          ));
        }
      } catch (streamError) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('Stream interrupted by abort');
        } else {
          throw streamError;
        }
      } finally {
        setIsStreaming(false);
        setIsTyping(false);
        abortControllerRef.current = null;
      }
      
    } catch (error) {
      console.error('Error getting response from AI provider:', error);
      setIsTyping(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}_${++messageCounterRef.current}`,
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your message. ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Mark processing as complete and process next message in queue
      isProcessingRef.current = false
      // Process next message if any
      if (messageQueueRef.current.length > 0) {
        processMessageQueue()
      }
    }
  }, [])

  const handleChatMessage = useCallback(async (messageData: any) => {
    console.log('Main Window: Received message from chat input window:', messageData);
    
    // Add message to queue
    messageQueueRef.current.push(messageData)
    console.log('Main Window: Message queued. Queue length:', messageQueueRef.current.length);
    
    // If not currently processing, start processing the queue
    if (!isProcessingRef.current) {
      processMessageQueue()
    }
  }, [processMessageQueue])

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

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('Stopping stream...');
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsTyping(false);
      // After stopping, process next message in queue if any
      // The finally block in processMessageQueue will handle this, but we can also trigger it here
      setTimeout(() => {
        if (messageQueueRef.current.length > 0 && !isProcessingRef.current) {
          processMessageQueue()
        }
      }, 100)
    }
  }, [processMessageQueue])

  const clearChat = () => {
    setMessages([])
    setShowChat(false)
    setIsTyping(false)
    setIsStreaming(false)
    processedMessageIds.current.clear()
    messageCounterRef.current = 0
    messageQueueRef.current = []
    isProcessingRef.current = false
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Clear local LLM history if a local model is selected
    const currentLocalModel = unifiedLocalLLMService.getCurrentModel();
    if (currentLocalModel) {
      unifiedLocalLLMService.clearHistory();
    }
  }

  const handleModelChange = () => {
    // Model change handling - the new simplified system auto-handles this
    // No need for manual service reinitialization
    console.log('Chat manager: AI model changed')
  }

  return {
    messages,
    showChat,
    isTyping,
    isStreaming,
    handleChatMessage,
    copyToClipboard,
    clearChat,
    handleModelChange,
    stopStreaming
  }
}
