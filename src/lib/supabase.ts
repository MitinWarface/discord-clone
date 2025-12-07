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
          username_base: string | null
          discriminator: number | null
          display_name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          username_base?: string | null
          discriminator?: number | null
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          username_base?: string | null
          discriminator?: number | null
          display_name?: string | null
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
      categories: {
        Row: {
          id: string
          name: string
          server_id: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          server_id: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          server_id?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          server_id: string
          category_id: string | null
          type: 'text' | 'voice'
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          server_id: string
          category_id?: string | null
          type?: 'text' | 'voice'
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          server_id?: string
          category_id?: string | null
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
          message_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          channel_id: string
          message_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          channel_id?: string
          message_type?: string
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
          role_id: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          server_id: string
          user_id: string
          role_id?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          user_id?: string
          role_id?: string | null
          joined_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          server_id: string
          name: string
          color: string
          position: number
          permissions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          server_id: string
          name: string
          color?: string
          position?: number
          permissions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          name?: string
          color?: string
          position?: number
          permissions?: number
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          category: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          granted: boolean
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          granted?: boolean
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          granted?: boolean
        }
      }
      reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      pinned_messages: {
        Row: {
          id: string
          message_id: string
          channel_id: string
          pinned_by: string
          pinned_at: string
        }
        Insert: {
          id?: string
          message_id: string
          channel_id: string
          pinned_by: string
          pinned_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          channel_id?: string
          pinned_by?: string
          pinned_at?: string
        }
      }
      file_attachments: {
        Row: {
          id: string
          message_id: string
          filename: string
          original_name: string
          file_size: number
          mime_type: string
          file_path: string
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          message_id: string
          filename: string
          original_name: string
          file_size: number
          mime_type: string
          file_path: string
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          filename?: string
          original_name?: string
          file_size?: number
          mime_type?: string
          file_path?: string
          uploaded_by?: string
          uploaded_at?: string
        }
      }
      mentions: {
        Row: {
          id: string
          message_id: string
          mentioned_user_id: string
          mentioned_by: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          mentioned_user_id: string
          mentioned_by: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          mentioned_user_id?: string
          mentioned_by?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'mention' | 'message' | 'friend_request' | 'server_invite' | 'system'
          title: string
          content: string | null
          data: any
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'mention' | 'message' | 'friend_request' | 'server_invite' | 'system'
          title: string
          content?: string | null
          data?: any
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'mention' | 'message' | 'friend_request' | 'server_invite' | 'system'
          title?: string
          content?: string | null
          data?: any
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          mentions: boolean
          messages: boolean
          friend_requests: boolean
          server_invites: boolean
          system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mentions?: boolean
          messages?: boolean
          friend_requests?: boolean
          server_invites?: boolean
          system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mentions?: boolean
          messages?: boolean
          friend_requests?: boolean
          server_invites?: boolean
          system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dm_channels: {
        Row: {
          id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      dm_channel_members: {
        Row: {
          id: string
          dm_channel_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          dm_channel_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          dm_channel_id?: string
          user_id?: string
          joined_at?: string
        }
      }
    }
  }
}