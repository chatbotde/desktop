
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ChatHistoryItem {
    id: string
    title: string
    createdAt: string
    messages: any[] // JSONB
}

const USER_ID_KEY = 'buddy_device_user_id'

function getUserId() {
    let id = localStorage.getItem(USER_ID_KEY)
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem(USER_ID_KEY, id)
    }
    return id
}

export function useChatHistory() {
    const [history, setHistory] = useState<ChatHistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchHistory = useCallback(async () => {
        setIsLoading(true)
        const userId = getUserId()

        try {
            const { data, error } = await supabase
                .from('chat_history')
                .select('*')
                .eq('userId', userId)
                .order('createdAt', { ascending: false })

            if (error) {
                console.error('Error fetching history:', error)
            } else {
                setHistory(data || [])
            }
        } catch (err) {
            console.error('Unexpected error fetching history:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const saveChat = useCallback(async (title: string, messages: any[]) => {
        const userId = getUserId()
        try {
            const { data, error } = await supabase
                .from('chat_history')
                .insert([
                    { userId, title, messages }
                ])
                .select()
                .single()

            if (error) throw error

            // Refresh history
            fetchHistory()
            return data.id
        } catch (err) {
            console.error('Error saving chat:', err)
            return null
        }
    }, [fetchHistory])

    const updateChat = useCallback(async (id: string, messages: any[], title?: string) => {
        try {
            const updates: any = { messages, updatedAt: new Date().toISOString() }
            if (title) updates.title = title

            const { error } = await supabase
                .from('chat_history')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            // No need to fetch history as realtime subscription will handle it
        } catch (err) {
            console.error('Error updating chat:', err)
        }
    }, [])

    const deleteChat = useCallback(async (id: string) => {
        try {
            const { error } = await supabase
                .from('chat_history')
                .delete()
                .eq('id', id)

            if (error) throw error

            setHistory(prev => prev.filter(item => item.id !== id))
        } catch (err) {
            console.error('Error deleting chat:', err)
        }
    }, [])

    // Load initial history and subscribe to changes
    useEffect(() => {
        fetchHistory()

        const userId = getUserId()
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
                () => {
                    fetchHistory()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchHistory])

    return {
        history,
        isLoading,
        saveChat,
        updateChat,
        deleteChat,
        refreshHistory: fetchHistory
    }
}
