import { createContext, useContext, type ReactNode, useState, useRef, useEffect } from 'react'
import { useUIState } from '@/hooks/useUIState'
import { useMessageManager } from '@/hooks/useMessageManager'
import { useChatHistory } from '@/hooks/useChatHistory'
import { useAutoScreenshot } from '@/hooks/useAutoScreenshot'
import { useAutoInsert } from '@/hooks/useAutoInsert'
import { useGlobalWindowAPI } from '@/hooks/useGlobalWindowAPI'
import { useTextSelectionActions } from '@/hooks/useTextSelectionActions'
import { useFeature } from '@/contexts/FeatureContext'
import type { MediaAttachment } from '@/features/output-window'
import { getSelectedModel } from '@/lib/ai/model-config'
import { unifiedAIService } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'

// Define the type for our context
interface AppContextType {
    uiState: ReturnType<typeof useUIState>
    messageManager: ReturnType<typeof useMessageManager>
    textSelectionActions: ReturnType<typeof useTextSelectionActions>
    currentChatId: string | null
    setCurrentChatId: (id: string | null) => void
    handleLoadHistory: (messages: any[], chatId?: string) => void
    handleClearMessages: () => void
    /** Clears saved chats, on-screen messages, and cloud/local model conversation memory. */
    handleClearAllHistory: () => Promise<void>
    handleSendMessage: (message: string, attachments?: MediaAttachment[]) => Promise<void>
    outputWindowEnabled: boolean
}

const AppContext = createContext<AppContextType | null>(null)

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
    const { isFeatureEnabled } = useFeature()
    const outputWindowEnabled = isFeatureEnabled('output-window')

    const uiState = useUIState(outputWindowEnabled)
    const messageManager = useMessageManager(outputWindowEnabled, {
        setGeneratedImages: uiState.setGeneratedImages,
        setIsImageWindowVisible: uiState.setIsImageWindowVisible,
        setIsGeneratingImages: uiState.setIsGeneratingImages,
    })

    // Chat History
    const { saveChat, updateChat, clearAllChats } = useChatHistory()
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const isAutoSavingRef = useRef(false)
    const messagesLengthRef = useRef(0)

    // Autosave when messages change
    useEffect(() => {
        // Skip if messages haven't changed length (avoid redundant saves on re-renders)
        // or if empty
        if (messageManager.outputMessages.length === 0) {
            if (messagesLengthRef.current > 0) {
                // Just cleared
                messagesLengthRef.current = 0
            }
            return
        }

        if (messageManager.outputMessages.length === messagesLengthRef.current) {
            return
        }

        // Debounce save
        const timeoutId = setTimeout(async () => {
            if (isAutoSavingRef.current) return
            isAutoSavingRef.current = true

            try {
                if (currentChatId) {
                    await updateChat(currentChatId, messageManager.outputMessages)
                } else if (messageManager.outputMessages.length > 0) {
                    // Create new chat if not exists
                    const firstUserMessage = messageManager.outputMessages.find(m => m.role === 'user')
                    const title = firstUserMessage ? firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '') : 'New Chat'
                    const newId = await saveChat(title, messageManager.outputMessages)
                    if (newId) setCurrentChatId(newId)
                }
                messagesLengthRef.current = messageManager.outputMessages.length
            } catch (e) {
                console.error('Autosave failed:', e)
            } finally {
                isAutoSavingRef.current = false
            }
        }, 2000) // 2 second debounce

        return () => clearTimeout(timeoutId)
    }, [messageManager.outputMessages, currentChatId, saveChat, updateChat])

    const handleLoadHistory = (messages: any[], chatId?: string) => {
        // Parse dates if necessary
        const parsedMessages = messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
        }))
        messageManager.setOutputMessages(parsedMessages)
        if (chatId) setCurrentChatId(chatId) // Set current ID to allow updates
        else setCurrentChatId(null) // Should not happen usually

        messagesLengthRef.current = parsedMessages.length // Sync ref to avoid immediate resave
        uiState.setIsOutputVisible(true)
    }

    const handleClearMessages = () => {
        messageManager.clearMessages()
        setCurrentChatId(null)
        messagesLengthRef.current = 0
        uiState.clearExplanation()
    }

    const handleClearAllHistory = async () => {
        await clearAllChats()
        handleClearMessages()
        unifiedAIService.clearAllHistory()
        unifiedLocalLLMService.clearHistory()
    }

    // Auto-screenshot feature - automatically takes screenshots when user starts typing
    useAutoScreenshot({
        onScreenshot: (file, isAutoScreenshot) => {
            console.log('[App] Auto-screenshot captured, adding to prompt:', file.name, 'isAuto:', isAutoScreenshot)
            // Dispatch custom event to add file to prompt input
            window.dispatchEvent(new CustomEvent('prompt-add-files', { detail: { files: [file] } }))
            uiState.setIsInputVisible(true)
        },
    })

    // Auto-insert feature - automatically inserts assistant messages into external applications
    useAutoInsert({ messages: messageManager.outputMessages })

    // Global window API setup
    useGlobalWindowAPI({
        outputWindowEnabled,
        addMessage: messageManager.addMessage,
        setIsInputVisible: uiState.setIsInputVisible,
        setIsOutputVisible: uiState.setIsOutputVisible,
        setAreaScreenshotCallback: uiState.setAreaScreenshotCallback,
        setShowAreaScreenshot: uiState.setShowAreaScreenshot,
        setRectangleScreenshotCallback: uiState.setRectangleScreenshotCallback,
        setShowRectangleScreenshot: uiState.setShowRectangleScreenshot
    })


    // Wrapper for handleSendMessage that also manages output window visibility
    const handleSendMessage = async (message: string, attachments?: MediaAttachment[]) => {
        // Check if it's an image generation model - don't open output window for images
        const selectedModel = getSelectedModel()
        const isImageModel = selectedModel?.category === 'image-generation' || selectedModel?.provider === 'replicate'

        // Show image window immediately for image models (before generation starts)
        if (isImageModel) {
            uiState.setIsImageWindowVisible(true)
            uiState.setIsGeneratingImages(true)
        }

        // Only open output window for non-image models
        if (outputWindowEnabled && !isImageModel) {
            uiState.setIsOutputVisible(true)
        }
        await messageManager.handleSendMessage(message, attachments)
    }

    // Text selection actions
    const textSelectionActions = useTextSelectionActions({
        onSendMessage: handleSendMessage,
        outputWindowEnabled,
        setExplanation: uiState.setExplanation,
        setExplanationPosition: uiState.setExplanationPosition,
        setIsInputVisible: uiState.setIsInputVisible,
        setIsOutputVisible: uiState.setIsOutputVisible
    })

    const value = {
        uiState,
        messageManager,
        textSelectionActions,
        currentChatId,
        setCurrentChatId,
        handleLoadHistory,
        handleClearMessages,
        handleClearAllHistory,
        handleSendMessage,
        outputWindowEnabled
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppState = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider')
    }
    return context
}
