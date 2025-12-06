import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Проверка подключения к Supabase
export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 10
}

// Создаем клиент только если Supabase настроен
let supabase: SupabaseClient | null = null

if (isSupabaseConfigured()) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  )
}

export { supabase }

// Типы для нашей базы данных
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      servers: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          icon_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          icon_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          icon_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          server_id: string
          type: 'text' | 'voice'
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          server_id: string
          type?: 'text' | 'voice'
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          server_id?: string
          type?: 'text' | 'voice'
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          user_id: string
          channel_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          channel_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          channel_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          updated_at?: string
        }
      }
      server_members: {
        Row: {
          id: string
          server_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          server_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
    }
  }
}