
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Using VITE_ prefix for Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing. Check your .env file.')
}

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null
