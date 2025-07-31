import { createClient } from '@supabase/supabase-js'

// Validasi environment variables dengan error handling yang lebih baik
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging untuk production
if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
  console.log('🔍 Debug Supabase Config:')
  console.log('📍 Original URL:', supabaseUrl)
  console.log('🔑 Has Key:', !!supabaseAnonKey)
  console.log('🌍 Environment:', process.env.NODE_ENV)
}

// FIX: Handle URL yang mungkin menyebabkan masalah
if (supabaseUrl) {
  // Remove trailing slashes
  supabaseUrl = supabaseUrl.replace(/\/+$/, '')
  
  // Jika URL menggunakan sslip.io, gunakan HTTPS
  if (supabaseUrl.includes('sslip.io')) {
    supabaseUrl = supabaseUrl.replace('http://', 'https://')
  }
  
  if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
    console.log('🔧 Fixed URL:', supabaseUrl)
    console.log('🔍 URL Analysis:')
    console.log('  - Using HTTPS:', supabaseUrl.startsWith('https://'))
    console.log('  - Final URL:', supabaseUrl)
  }
}

// Flag untuk mengetahui apakah Supabase tersedia
export const isSupabaseAvailable = !!(supabaseUrl && supabaseAnonKey)

let supabaseClient: any = null

if (isSupabaseAvailable) {
  if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
    console.log('✅ Supabase configuration loaded successfully')
    console.log('📍 Supabase URL:', supabaseUrl)
  }
  
  // Konfigurasi Supabase dengan opsi yang lebih baik
  const supabaseConfig = {
    auth: {
      persistSession: true, // Ubah ke true agar session tersimpan
      autoRefreshToken: true, // Aktifkan auto refresh token
      detectSessionInUrl: true // Aktifkan deteksi session di URL
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web/latest'
      }
    }
  }
  
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, supabaseConfig)
} else {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Supabase environment variables not found. Running in fallback mode.')
    console.warn('📝 This is normal during build process without environment variables.')
  }
  
  // Create a more comprehensive mock client untuk development/build
  supabaseClient = {
    auth: {
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: (table: string) => ({
      insert: (data: any) => ({
        select: (fields?: string) => ({
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Supabase not configured - please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY' } 
          }),
          limit: (count: number) => Promise.resolve({ 
            data: [], 
            error: { message: 'Supabase not configured - please set environment variables' } 
          })
        }),
        limit: (count: number) => Promise.resolve({ 
          data: [], 
          error: { message: 'Supabase not configured - please set environment variables' } 
        })
      }),
      select: (fields?: string) => ({
        eq: (column: string, value: any) => ({
          eq: (column2: string, value2: any) => ({
            single: () => Promise.resolve({ 
              data: null, 
              error: { message: 'Supabase not configured - please set environment variables' } 
            }),
            limit: (count: number) => Promise.resolve({ 
              data: [], 
              error: { message: 'Supabase not configured - please set environment variables' } 
            })
          }),
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Supabase not configured - please set environment variables' } 
          }),
          limit: (count: number) => Promise.resolve({ 
            data: [], 
            error: { message: 'Supabase not configured - please set environment variables' } 
          })
        }),
        single: () => Promise.resolve({ 
          data: null, 
          error: { message: 'Supabase not configured - please set environment variables' } 
        }),
        limit: (count: number) => Promise.resolve({ 
          data: [], 
          error: { message: 'Supabase not configured - please set environment variables' } 
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          eq: (column2: string, value2: any) => ({
            select: (fields?: string) => ({
              single: () => Promise.resolve({ 
                data: null, 
                error: { message: 'Supabase not configured - please set environment variables' } 
              })
            })
          }),
          select: (fields?: string) => ({
            single: () => Promise.resolve({ 
              data: null, 
              error: { message: 'Supabase not configured - please set environment variables' } 
            })
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          eq: (column2: string, value2: any) => ({
            select: (fields?: string) => Promise.resolve({ 
              data: [{ id: value, keyword: 'mock-keyword', status: 'deleted' }],
              error: null
            })
          })
        })
      })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  }
}

export const supabase = supabaseClient

// Type untuk database schema (disesuaikan dengan tabel users yang ada)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          updated_at: string
          avatar_url?: string
          phone?: string
          company?: string
          role?: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          updated_at?: string
          avatar_url?: string
          phone?: string
          company?: string
          role?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
          avatar_url?: string
          phone?: string
          company?: string
          role?: string
        }
      }
      contacts: {
        Row: {
          id: string
          name: string
          email: string
          company?: string
          message: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          company?: string
          message: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          company?: string
          message?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Instagram schema tables
      instagram_hashtags: {
        Row: {
          id: number
          hashtag_name: string
          posts_count: number
          hashtag_url: string
          search_query?: string
          user_id?: string
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          hashtag_name: string
          posts_count?: number
          hashtag_url: string
          search_query?: string
          user_id?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          hashtag_name?: string
          posts_count?: number
          hashtag_url?: string
          search_query?: string
          user_id?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      instagram_locations: {
        Row: {
          id: number
          location_id?: string
          location_name: string
          address?: string
          coordinates?: Record<string, any>
          city?: string
          country?: string
          created_at: string
        }
        Insert: {
          id?: number
          location_id?: string
          location_name: string
          address?: string
          coordinates?: Record<string, any>
          city?: string
          country?: string
          created_at?: string
        }
        Update: {
          id?: number
          location_id?: string
          location_name?: string
          address?: string
          coordinates?: Record<string, any>
          city?: string
          country?: string
          created_at?: string
        }
      }
      instagram_music_info: {
        Row: {
          id: number
          audio_id?: string
          artist_name?: string
          song_name?: string
          uses_original_audio: boolean
          should_mute_audio: boolean
          should_mute_audio_reason?: string
          created_at: string
        }
        Insert: {
          id?: number
          audio_id?: string
          artist_name?: string
          song_name?: string
          uses_original_audio?: boolean
          should_mute_audio?: boolean
          should_mute_audio_reason?: string
          created_at?: string
        }
        Update: {
          id?: number
          audio_id?: string
          artist_name?: string
          song_name?: string
          uses_original_audio?: boolean
          should_mute_audio?: boolean
          should_mute_audio_reason?: string
          created_at?: string
        }
      }
      instagram_posts: {
        Row: {
          id: number
          instagram_id: string
          short_code: string
          post_url: string
          input_url?: string
          post_type: 'Image' | 'Video' | 'Sidecar' | 'Reel'
          caption?: string
          timestamp?: string
          display_url?: string
          video_url?: string
          video_duration?: number
          dimensions_height?: number
          dimensions_width?: number
          images?: string[]
          likes_count: number
          comments_count: number
          video_play_count: number
          ig_play_count: number
          reshare_count: number
          owner_id?: string
          owner_username?: string
          owner_full_name?: string
          location_id?: number
          music_info_id?: number
          is_sponsored: boolean
          product_type?: string
          first_comment?: string
          latest_comments: Record<string, any>[]
          hashtag_id?: number
          user_id?: string
          child_posts: Record<string, any>[]
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          instagram_id: string
          short_code: string
          post_url: string
          input_url?: string
          post_type: 'Image' | 'Video' | 'Sidecar' | 'Reel'
          caption?: string
          timestamp?: string
          display_url?: string
          video_url?: string
          video_duration?: number
          dimensions_height?: number
          dimensions_width?: number
          images?: string[]
          likes_count?: number
          comments_count?: number
          video_play_count?: number
          ig_play_count?: number
          reshare_count?: number
          owner_id?: string
          owner_username?: string
          owner_full_name?: string
          location_id?: number
          music_info_id?: number
          is_sponsored?: boolean
          product_type?: string
          first_comment?: string
          latest_comments?: Record<string, any>[]
          hashtag_id?: number
          user_id?: string
          child_posts?: Record<string, any>[]
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          instagram_id?: string
          short_code?: string
          post_url?: string
          input_url?: string
          post_type?: 'Image' | 'Video' | 'Sidecar' | 'Reel'
          caption?: string
          timestamp?: string
          display_url?: string
          video_url?: string
          video_duration?: number
          dimensions_height?: number
          dimensions_width?: number
          images?: string[]
          likes_count?: number
          comments_count?: number
          video_play_count?: number
          ig_play_count?: number
          reshare_count?: number
          owner_id?: string
          owner_username?: string
          owner_full_name?: string
          location_id?: number
          music_info_id?: number
          is_sponsored?: boolean
          product_type?: string
          first_comment?: string
          latest_comments?: Record<string, any>[]
          hashtag_id?: number
          user_id?: string
          child_posts?: Record<string, any>[]
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      instagram_post_hashtags: {
        Row: {
          id: number
          post_id?: number
          hashtag_name: string
          created_at: string
        }
        Insert: {
          id?: number
          post_id?: number
          hashtag_name: string
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          hashtag_name?: string
          created_at?: string
        }
      }
      instagram_post_mentions: {
        Row: {
          id: number
          post_id?: number
          mentioned_username: string
          created_at: string
        }
        Insert: {
          id?: number
          post_id?: number
          mentioned_username: string
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          mentioned_username?: string
          created_at?: string
        }
      }
      instagram_search_queries: {
        Row: {
          id: number
          search_term: string
          search_type: 'hashtag' | 'user' | 'location'
          results_count: number
          results_limit: number
          user_id?: string
          apify_run_id?: string
          search_metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: number
          search_term: string
          search_type: 'hashtag' | 'user' | 'location'
          results_count?: number
          results_limit?: number
          user_id?: string
          apify_run_id?: string
          search_metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: number
          search_term?: string
          search_type?: 'hashtag' | 'user' | 'location'
          results_count?: number
          results_limit?: number
          user_id?: string
          apify_run_id?: string
          search_metadata?: Record<string, any>
          created_at?: string
        }
      }
      migration_history: {
        Row: {
          id: number
          migration_name: string
          chunk_id: string
          chunk_name: string
          executed_by?: string
          executed_at: string
          success: boolean
          error_message?: string
          execution_time_ms?: number
        }
        Insert: {
          id?: number
          migration_name: string
          chunk_id: string
          chunk_name: string
          executed_by?: string
          executed_at?: string
          success?: boolean
          error_message?: string
          execution_time_ms?: number
        }
        Update: {
          id?: number
          migration_name?: string
          chunk_id?: string
          chunk_name?: string
          executed_by?: string
          executed_at?: string
          success?: boolean
          error_message?: string
          execution_time_ms?: number
        }
      }
    }
    Views: {
      hashtag_analytics: {
        Row: {
          hashtag_name: string
          official_posts_count: number
          scraped_posts_count: number
          avg_likes: number
          avg_comments: number
          avg_video_plays: number
          sponsored_posts_count: number
          latest_post_date?: string
          user_id?: string
        }
      }
      user_post_analytics: {
        Row: {
          owner_username: string
          total_posts: number
          avg_likes: number
          avg_comments: number
          total_likes: number
          total_comments: number
          sponsored_posts: number
          video_posts: number
          latest_post_date?: string
          user_id?: string
        }
      }
    }
    Functions: {
      insert_instagram_hashtag_data: {
        Args: {
          p_user_id: string
          p_search_term: string
          p_hashtag_data: Record<string, any>
          p_apify_run_id?: string
        }
        Returns: number
      }
      execute_sql: {
        Args: {
          sql: string
        }
        Returns: any
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper functions untuk operasi database umum
export const supabaseHelpers = {
  // Auth helpers
  auth: {
    signUp: async (email: string, password: string) => {
      return await supabase.auth.signUp({ email, password })
    },
    signIn: async (email: string, password: string) => {
      return await supabase.auth.signInWithPassword({ email, password })
    },
    signOut: async () => {
      return await supabase.auth.signOut()
    },
    getUser: async () => {
      return await supabase.auth.getUser()
    },
    getSession: async () => {
      return await supabase.auth.getSession()
    }
  },

  // Users helpers
  users: {
    create: async (userData: Database['public']['Tables']['users']['Insert']) => {
      return await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()
    },
    getById: async (id: string) => {
      return await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
    },
    getByEmail: async (email: string) => {
      return await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
    },
    update: async (id: string, userData: Database['public']['Tables']['users']['Update']) => {
      return await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single()
    }
  },

  // Storage helpers
  storage: {
    uploadFile: async (bucket: string, path: string, file: File) => {
      return await supabase.storage.from(bucket).upload(path, file)
    },
    downloadFile: async (bucket: string, path: string) => {
      return await supabase.storage.from(bucket).download(path)
    },
    getPublicUrl: (bucket: string, path: string) => {
      return supabase.storage.from(bucket).getPublicUrl(path)
    }
  }
}

export default supabase 