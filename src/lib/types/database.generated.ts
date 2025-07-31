// Generated Database Types for MIDAS Marketing Agency
// Auto-generated from Supabase schema migration

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          name: string
          email: string
          company: string | null
          message: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          company?: string | null
          message: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          company?: string | null
          message?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_scraping_google_maps: {
        Row: {
          id: number
          inputUrl: string
          placeName: string | null
          address: string | null
          phoneNumber: string | null
          website: string | null
          rating: string | null
          reviewCount: string | null
          category: string | null
          hours: string | null
          description: string | null
          coordinates: string | null
          imageUrl: string | null
          priceRange: string | null
          user_id: string | null
          gmail: string | null
          created_at: string
        }
        Insert: {
          id?: number
          inputUrl: string
          placeName?: string | null
          address?: string | null
          phoneNumber?: string | null
          website?: string | null
          rating?: string | null
          reviewCount?: string | null
          category?: string | null
          hours?: string | null
          description?: string | null
          coordinates?: string | null
          imageUrl?: string | null
          priceRange?: string | null
          user_id?: string | null
          gmail?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          inputUrl?: string
          placeName?: string | null
          address?: string | null
          phoneNumber?: string | null
          website?: string | null
          rating?: string | null
          reviewCount?: string | null
          category?: string | null
          hours?: string | null
          description?: string | null
          coordinates?: string | null
          imageUrl?: string | null
          priceRange?: string | null
          user_id?: string | null
          gmail?: string | null
          created_at?: string
        }
        Relationships: []
      }
      data_scraping_instagram: {
        Row: {
          id: number
          username: string
          full_name: string | null
          bio: string | null
          followers_count: number
          following_count: number
          posts_count: number
          is_verified: boolean
          is_private: boolean
          profile_pic_url: string | null
          external_url: string | null
          category: string | null
          user_id: string | null
          gmail: string | null
          tags: string[] | null
          engagement_rate: number
          avg_likes: number
          avg_comments: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          username: string
          full_name?: string | null
          bio?: string | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          is_verified?: boolean
          is_private?: boolean
          profile_pic_url?: string | null
          external_url?: string | null
          category?: string | null
          user_id?: string | null
          gmail?: string | null
          tags?: string[] | null
          engagement_rate?: number
          avg_likes?: number
          avg_comments?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          username?: string
          full_name?: string | null
          bio?: string | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          is_verified?: boolean
          is_private?: boolean
          profile_pic_url?: string | null
          external_url?: string | null
          category?: string | null
          user_id?: string | null
          gmail?: string | null
          tags?: string[] | null
          engagement_rate?: number
          avg_likes?: number
          avg_comments?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      keyword_assignments: {
        Row: {
          id: number
          keyword_id: number | null
          assigned_to: string | null
          assigned_by: string | null
          status: string
          notes: string | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          keyword_id?: number | null
          assigned_to?: string | null
          assigned_by?: string | null
          status?: string
          notes?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          keyword_id?: number | null
          assigned_to?: string | null
          assigned_by?: string | null
          status?: string
          notes?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_assignments_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          }
        ]
      }
      keywords: {
        Row: {
          id: number
          keyword: string
          description: string | null
          category: string
          priority: number
          status: string
          user_id: string | null
          assigned_to: string | null
          tags: string[] | null
          search_volume: number
          difficulty: number
          cpc: number
          competition: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          keyword: string
          description?: string | null
          category?: string
          priority?: number
          status?: string
          user_id?: string | null
          assigned_to?: string | null
          tags?: string[] | null
          search_volume?: number
          difficulty?: number
          cpc?: number
          competition?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          keyword?: string
          description?: string | null
          category?: string
          priority?: number
          status?: string
          user_id?: string | null
          assigned_to?: string | null
          tags?: string[] | null
          search_volume?: number
          difficulty?: number
          cpc?: number
          competition?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keywords_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keywords_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      kol_data: {
        Row: {
          id: number
          name: string
          platform: string
          username: string
          followers_count: number
          engagement_rate: number
          category: string | null
          location: string | null
          contact_info: Json | null
          rates: Json | null
          collaboration_history: Json | null
          status: string
          notes: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          platform: string
          username: string
          followers_count?: number
          engagement_rate?: number
          category?: string | null
          location?: string | null
          contact_info?: Json | null
          rates?: Json | null
          collaboration_history?: Json | null
          status?: string
          notes?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          platform?: string
          username?: string
          followers_count?: number
          engagement_rate?: number
          category?: string | null
          location?: string | null
          contact_info?: Json | null
          rates?: Json | null
          collaboration_history?: Json | null
          status?: string
          notes?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kol_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      statistics: {
        Row: {
          id: number
          table_name: string
          metric_name: string
          metric_value: number
          period_start: string | null
          period_end: string | null
          user_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          table_name: string
          metric_name: string
          metric_value: number
          period_start?: string | null
          period_end?: string | null
          user_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          table_name?: string
          metric_name?: string
          metric_value?: number
          period_start?: string | null
          period_end?: string | null
          user_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for convenience
export type Contact = Tables<'contacts'>
export type GoogleMapsData = Tables<'data_scraping_google_maps'>
export type InstagramData = Tables<'data_scraping_instagram'>
export type Keyword = Tables<'keywords'>
export type KeywordAssignment = Tables<'keyword_assignments'>
export type KolData = Tables<'kol_data'>
export type Statistic = Tables<'statistics'>

// Insert types
export type ContactInsert = TablesInsert<'contacts'>
export type GoogleMapsDataInsert = TablesInsert<'data_scraping_google_maps'>
export type InstagramDataInsert = TablesInsert<'data_scraping_instagram'>
export type KeywordInsert = TablesInsert<'keywords'>
export type KeywordAssignmentInsert = TablesInsert<'keyword_assignments'>
export type KolDataInsert = TablesInsert<'kol_data'>
export type StatisticInsert = TablesInsert<'statistics'>

// Update types
export type ContactUpdate = TablesUpdate<'contacts'>
export type GoogleMapsDataUpdate = TablesUpdate<'data_scraping_google_maps'>
export type InstagramDataUpdate = TablesUpdate<'data_scraping_instagram'>
export type KeywordUpdate = TablesUpdate<'keywords'>
export type KeywordAssignmentUpdate = TablesUpdate<'keyword_assignments'>
export type KolDataUpdate = TablesUpdate<'kol_data'>
export type StatisticUpdate = TablesUpdate<'statistics'>

// Enum types for better type safety
export type KeywordStatus = 'active' | 'inactive' | 'pending'
export type KeywordPriority = 1 | 2 | 3 | 4 | 5
export type KeywordCompetition = 'low' | 'medium' | 'high' | 'unknown'
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type KolPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook'
export type KolStatus = 'active' | 'inactive' | 'blacklisted'
export type ContactStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'