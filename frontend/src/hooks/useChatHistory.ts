import { useState, useCallback, useRef, useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export interface ChatHistoryItem {
    id: string
    title: string
    createdAt: string
    messages: any[] // JSONB
    syncStatus?: 'synced' | 'pending' | 'failed' // Local only status
}

const USER_ID_KEY = 'buddy_device_user_id'
const CHAT_HISTORY_KEY = 'buddy_chat_history'
export const BUDDY_CHAT_HISTORY_CLEARED_EVENT = 'buddy-chat-history-cleared'

function getUserId() {
    let id = localStorage.getItem(USER_ID_KEY)
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem(USER_ID_KEY, id)
    }
    return id
}

export function useChatHistory() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    // Using a ref to keep track of history for sync functions to avoid dependency cycles
    const historyRef = useRef<ChatHistoryItem[]>([])

    // Load from local storage using useSyncExternalStore
    const storedHistory = useSyncExternalStore(
        () => () => {}, // no-op subscribe since localStorage doesn't have events for our key
        () => {
            if (typeof window === 'undefined') return '[]'
            return localStorage.getItem(CHAT_HISTORY_KEY) || '[]'
        },
        () => '[]'
    )

    // Initialize state from localStorage (once)
    const [history, setHistory] = useState<ChatHistoryItem[]>(() => {
        try {
            const parsed = JSON.parse(storedHistory)
            historyRef.current = parsed
            return parsed
        } catch {
            return []
        }
    })

    // Update ref whenever state changes - direct assignment instead of useEffect
    historyRef.current = history

    // Keep all hook instances in sync when history is cleared - using syncExternalStore
    useSyncExternalStore(
        useCallback((callback) => {
            const onCleared = () => {
                setHistory([])
                historyRef.current = []
            }
            window.addEventListener(BUDDY_CHAT_HISTORY_CLEARED_EVENT, onCleared)
            return () => window.removeEventListener(BUDDY_CHAT_HISTORY_CLEARED_EVENT, onCleared)
        }, []),
        () => null,
        () => null
    )

    // Save to local storage whenever history changes
    const saveToLocal = (items: ChatHistoryItem[]) => {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(items))
    }

    // Sync individual item to Supabase
    const syncItem = async (item: ChatHistoryItem) => {
        const userId = getUserId()
        try {
            // Check if it exists remotely to decide insert vs update
            // For simplicity, we'll try upsert behavior if possible, or just insert if we know it's new
            // But since we generate UUIDs locally, accurate matching is possible.

            // However, Supabase upsert requires primary key constraint. 
            // Assuming 'id' is PK.

            if (!supabase) return false

            const { error } = await supabase
                .from('chat_history')
                .upsert({
                    id: item.id,
                    userId,
                    title: item.title,
                    messages: item.messages,
                    updatedAt: new Date().toISOString(),
                    createdAt: item.createdAt
                }, { onConflict: 'id' as any }) // Type assertion for safety if needed

            if (error) throw error

            return true
        } catch (err) {
            console.error('Sync failed for item:', item.id, err)
            return false
        }
    }

    // Sync all pending items
    const syncPendingChanges = useCallback(async () => {
        if (isSyncing) return
        setIsSyncing(true)

        const currentHistory = historyRef.current
        const pendingItems = currentHistory.filter(item => item.syncStatus === 'pending')

        if (pendingItems.length === 0) {
            setIsSyncing(false)
            return
        }

        let updatedHistory = [...currentHistory]
        let hasChanges = false

        for (const item of pendingItems) {
            const success = await syncItem(item)
            if (success) {
                updatedHistory = updatedHistory.map(h =>
                    h.id === item.id ? { ...h, syncStatus: 'synced' as const } : h
                )
                hasChanges = true
            }
        }

        if (hasChanges) {
            setHistory(updatedHistory)
            saveToLocal(updatedHistory)
        }

        setIsSyncing(false)
    }, []) // Removing direct history dependency to avoid loops, relying on historyRef via sync logic if needed but here we load fresh.

    // Fetch from Supabase and merge
    const fetchHistory = useCallback(async () => {
        setIsLoading(true)
        const userId = getUserId()

        try {
            if (!supabase) {
                setIsLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('chat_history')
                .select('*')
                .eq('userId', userId)
                .order('createdAt', { ascending: false })

            if (error) {
                console.error('Error fetching history:', error)
            } else if (data) {
                // Merge strategy:
                // 1. Remote items overwrite local items unless local item is 'pending' (and timestamp is newer? For now just keep pending)
                // 2. Add new remote items
                // 3. Keep local-only items (pending)

                setHistory(prev => {
                    const localPending = prev.filter(p => p.syncStatus === 'pending')
                    const localPendingIds = new Set(localPending.map(p => p.id))

                    const remoteItems = data.map((item: any) => ({
                        ...item,
                        syncStatus: 'synced' as const
                    }))

                    // Filter out remote items that have a local pending version (local editing wins temporarily)
                    const remoteFiltered = remoteItems.filter((item: any) => !localPendingIds.has(item.id))

                    // Combine: Local Pending + Remote (non-conflicting)
                    // We also need to sort them
                    const merged = [...localPending, ...remoteFiltered].sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )

                    saveToLocal(merged)
                    return merged
                })
            }
        } catch (err) {
            console.error('Unexpected error fetching history:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const saveChat = useCallback(async (title: string, messages: any[]) => {
        const userId = getUserId()
        const newId = uuidv4()
        const newItem: ChatHistoryItem = {
            id: newId,
            title,
            messages,
            createdAt: new Date().toISOString(),
            syncStatus: 'pending'
        }

        // Optimistic update
        setHistory(prev => {
            const updated = [newItem, ...prev]
            saveToLocal(updated)
            return updated
        })

        // Try to sync immediately
        try {
            if (!supabase) throw new Error("Supabase not configured")

            const { error } = await supabase
                .from('chat_history')
                .insert([
                    {
                        id: newId,
                        userId,
                        title,
                        messages,
                        createdAt: newItem.createdAt
                    }
                ])
                .select()
                .single()

            if (error) throw error

            // Mark as synced if successful
            setHistory(prev => {
                const updated = prev.map(item =>
                    item.id === newId ? { ...item, syncStatus: 'synced' as const } : item
                )
                saveToLocal(updated)
                return updated
            })

            return newId
        } catch (err) {
            console.error('Error saving chat remote (saved locally):', err)
            // It remains 'pending' in state
            return newId
        }
    }, [])

    const updateChat = useCallback(async (id: string, messages: any[], title?: string) => {
        // Optimistic update
        setHistory(prev => {
            const updated = prev.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        messages,
                        title: title || item.title,
                        syncStatus: 'pending' as const // Mark pending until synced
                    }
                }
                return item
            })
            saveToLocal(updated)
            return updated
        })

        try {
            const updates: any = { messages, updatedAt: new Date().toISOString() }
            if (title) updates.title = title

            if (!supabase) throw new Error("Supabase not configured")

            const { error } = await supabase
                .from('chat_history')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            // Mark as synced if successful
            setHistory(prev => {
                const updated = prev.map(item =>
                    item.id === id ? { ...item, syncStatus: 'synced' as const } : item
                )
                saveToLocal(updated)
                return updated
            })

            // No need to fetch history as realtime subscription will handle it or we just updated it
        } catch (err) {
            console.error('Error updating chat remote (saved locally):', err)
        }
    }, [])

    const deleteChat = useCallback(async (id: string) => {
        // Optimistic delete
        setHistory(prev => {
            const updated = prev.filter(item => item.id !== id)
            saveToLocal(updated)
            return updated
        })

        try {
            if (!supabase) throw new Error("Supabase not configured")

            const { error } = await supabase
                .from('chat_history')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (err) {
            console.error('Error deleting chat remote:', err)
            // If delete fails, we might technically have a "zombie" item on remote. 
            // A more robust system would add a "deleted" tombstone to local syncing.
            // For now, we accept potential divergence in rare offline delete cases or user will see it again on refresh.
        }
    }, [])

    /** Remove every saved chat locally, on the server (for this device user), and notify other `useChatHistory` instances. */
    const clearAllChats = useCallback(async () => {
        const userId = getUserId()
        setHistory([])
        historyRef.current = []
        saveToLocal([])
        window.dispatchEvent(new CustomEvent(BUDDY_CHAT_HISTORY_CLEARED_EVENT))

        try {
            if (!supabase) return
            const { error } = await supabase.from('chat_history').delete().eq('userId', userId)
            if (error) throw error
        } catch (err) {
            console.error('Error clearing remote chat history:', err)
        }
    }, [])

    // Listen for online status to sync - using syncExternalStore
    useSyncExternalStore(
        useCallback((callback) => {
            const handleOnline = () => {
                console.log('App is online, syncing history...')
                syncPendingChanges()
                fetchHistory()
            }
            window.addEventListener('online', handleOnline)
            return () => window.removeEventListener('online', handleOnline)
        }, [syncPendingChanges, fetchHistory]),
        () => null,
        () => null
    )

    // Load initial history and subscribe to Supabase changes
    // Using syncExternalStore for lifecycle management
    useSyncExternalStore(
        useCallback((callback) => {
            // Initial fetch
            fetchHistory()
            syncPendingChanges()

            const userId = getUserId()
            if (!supabase) return () => {}

            const channel = supabase
                .channel('chat_history_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'chat_history',
                        filter: `userId=eq.${userId}`
                    },
                    (payload) => {
                        console.log('Realtime update received:', payload)
                        fetchHistory()
                    }
                )
                .subscribe()

            return () => {
                supabase?.removeChannel(channel)
            }
        }, [fetchHistory, syncPendingChanges]),
        () => null,
        () => null
    )

    return {
        history,
        isLoading,
        saveChat,
        updateChat,
        deleteChat,
        clearAllChats,
        refreshHistory: fetchHistory,
        isSyncing
    }
}
