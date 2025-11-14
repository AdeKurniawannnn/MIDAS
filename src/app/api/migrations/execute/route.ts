import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create service role client for migration operations
const supabaseServiceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Migration chunks for the Instagram schema
const INSTAGRAM_MIGRATION_CHUNKS = [
  {
    id: 'extensions_and_functions',
    name: 'Extensions and Utility Functions',
    sql: `
      -- Enable necessary extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `
  },
  {
    id: 'migration_tracking',
    name: 'Migration Tracking Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.migration_history (
        id BIGSERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL,
        chunk_id TEXT NOT NULL,
        chunk_name TEXT NOT NULL,
        executed_by TEXT,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        execution_time_ms INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_migration_history_name ON public.migration_history(migration_name);
      CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at ON public.migration_history(executed_at);
    `
  },
  {
    id: 'core_tables',
    name: 'Core Tables (Hashtags, Locations, Music)',
    sql: `
      -- Instagram hashtags table
      CREATE TABLE IF NOT EXISTS public.instagram_hashtags (
          id BIGSERIAL PRIMARY KEY,
          hashtag_name TEXT NOT NULL UNIQUE,
          posts_count BIGINT DEFAULT 0,
          hashtag_url TEXT NOT NULL,
          search_query TEXT,
          user_id UUID,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
      
      -- Instagram locations table
      CREATE TABLE IF NOT EXISTS public.instagram_locations (
          id BIGSERIAL PRIMARY KEY,
          location_id TEXT UNIQUE,
          location_name TEXT NOT NULL,
          address TEXT,
          coordinates JSONB,
          city TEXT,
          country TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
      
      -- Instagram music info table
      CREATE TABLE IF NOT EXISTS public.instagram_music_info (
          id BIGSERIAL PRIMARY KEY,
          audio_id TEXT UNIQUE,
          artist_name TEXT,
          song_name TEXT,
          uses_original_audio BOOLEAN DEFAULT false,
          should_mute_audio BOOLEAN DEFAULT false,
          should_mute_audio_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `
  },
  {
    id: 'posts_table',
    name: 'Instagram Posts Table',
    sql: `
      -- Instagram posts table
      CREATE TABLE IF NOT EXISTS public.instagram_posts (
          id BIGSERIAL PRIMARY KEY,
          
          -- Instagram identifiers
          instagram_id TEXT NOT NULL UNIQUE,
          short_code TEXT NOT NULL UNIQUE,
          post_url TEXT NOT NULL,
          input_url TEXT,
          
          -- Content metadata
          post_type TEXT NOT NULL CHECK (post_type IN ('Image', 'Video', 'Sidecar', 'Reel')),
          caption TEXT,
          timestamp TIMESTAMP WITH TIME ZONE,
          
          -- Media information
          display_url TEXT,
          video_url TEXT,
          video_duration DECIMAL(10,3),
          dimensions_height INTEGER,
          dimensions_width INTEGER,
          images TEXT[],
          
          -- Engagement metrics
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          video_play_count INTEGER DEFAULT 0,
          ig_play_count INTEGER DEFAULT 0,
          reshare_count INTEGER DEFAULT 0,
          
          -- Owner information
          owner_id TEXT,
          owner_username TEXT,
          owner_full_name TEXT,
          
          -- Location and music references
          location_id BIGINT REFERENCES public.instagram_locations(id) ON DELETE SET NULL,
          music_info_id BIGINT REFERENCES public.instagram_music_info(id) ON DELETE SET NULL,
          
          -- Business information
          is_sponsored BOOLEAN DEFAULT false,
          product_type TEXT,
          
          -- Comments data
          first_comment TEXT,
          latest_comments JSONB DEFAULT '[]',
          
          -- Search and user context
          hashtag_id BIGINT REFERENCES public.instagram_hashtags(id) ON DELETE CASCADE,
          user_id UUID,
          
          -- Child posts for carousels
          child_posts JSONB DEFAULT '[]',
          
          -- Additional metadata
          metadata JSONB DEFAULT '{}',
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `
  },
  {
    id: 'indexes',
    name: 'Database Indexes',
    sql: `
      -- Hashtags indexes
      CREATE INDEX IF NOT EXISTS idx_hashtags_name ON public.instagram_hashtags(hashtag_name);
      CREATE INDEX IF NOT EXISTS idx_hashtags_user_id ON public.instagram_hashtags(user_id);
      CREATE INDEX IF NOT EXISTS idx_hashtags_posts_count ON public.instagram_hashtags(posts_count);
      CREATE INDEX IF NOT EXISTS idx_hashtags_created_at ON public.instagram_hashtags(created_at);
      
      -- Locations indexes
      CREATE INDEX IF NOT EXISTS idx_locations_location_id ON public.instagram_locations(location_id);
      CREATE INDEX IF NOT EXISTS idx_locations_name ON public.instagram_locations(location_name);
      CREATE INDEX IF NOT EXISTS idx_locations_city ON public.instagram_locations(city);
      
      -- Music info indexes
      CREATE INDEX IF NOT EXISTS idx_music_audio_id ON public.instagram_music_info(audio_id);
      CREATE INDEX IF NOT EXISTS idx_music_artist ON public.instagram_music_info(artist_name);
      CREATE INDEX IF NOT EXISTS idx_music_song ON public.instagram_music_info(song_name);
      
      -- Posts indexes
      CREATE INDEX IF NOT EXISTS idx_posts_instagram_id ON public.instagram_posts(instagram_id);
      CREATE INDEX IF NOT EXISTS idx_posts_short_code ON public.instagram_posts(short_code);
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.instagram_posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_hashtag_id ON public.instagram_posts(hashtag_id);
      CREATE INDEX IF NOT EXISTS idx_posts_owner_username ON public.instagram_posts(owner_username);
      CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.instagram_posts(post_type);
      CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON public.instagram_posts(timestamp);
      CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON public.instagram_posts(likes_count);
      CREATE INDEX IF NOT EXISTS idx_posts_is_sponsored ON public.instagram_posts(is_sponsored);
      CREATE INDEX IF NOT EXISTS idx_posts_location_id ON public.instagram_posts(location_id);
      CREATE INDEX IF NOT EXISTS idx_posts_music_info_id ON public.instagram_posts(music_info_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.instagram_posts(created_at);
    `
  },
  {
    id: 'junction_tables',
    name: 'Junction Tables (Hashtags, Mentions)',
    sql: `
      -- Instagram post hashtags junction table
      CREATE TABLE IF NOT EXISTS public.instagram_post_hashtags (
          id BIGSERIAL PRIMARY KEY,
          post_id BIGINT REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
          hashtag_name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
      
      -- Instagram post mentions junction table
      CREATE TABLE IF NOT EXISTS public.instagram_post_mentions (
          id BIGSERIAL PRIMARY KEY,
          post_id BIGINT REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
          mentioned_username TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
      
      -- Junction table indexes
      CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON public.instagram_post_hashtags(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_name ON public.instagram_post_hashtags(hashtag_name);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_post_hashtags_unique ON public.instagram_post_hashtags(post_id, hashtag_name);
      
      CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON public.instagram_post_mentions(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_mentions_username ON public.instagram_post_mentions(mentioned_username);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_post_mentions_unique ON public.instagram_post_mentions(post_id, mentioned_username);
    `
  },
  {
    id: 'search_queries',
    name: 'Search Queries Table',
    sql: `
      -- Instagram search queries table
      CREATE TABLE IF NOT EXISTS public.instagram_search_queries (
          id BIGSERIAL PRIMARY KEY,
          search_term TEXT NOT NULL,
          search_type TEXT NOT NULL CHECK (search_type IN ('hashtag', 'user', 'location')),
          results_count INTEGER DEFAULT 0,
          results_limit INTEGER DEFAULT 1,
          user_id UUID,
          apify_run_id TEXT,
          search_metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
      
      -- Search queries indexes
      CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON public.instagram_search_queries(user_id);
      CREATE INDEX IF NOT EXISTS idx_search_queries_search_term ON public.instagram_search_queries(search_term);
      CREATE INDEX IF NOT EXISTS idx_search_queries_search_type ON public.instagram_search_queries(search_type);
      CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON public.instagram_search_queries(created_at);
    `
  },
  {
    id: 'security_policies',
    name: 'Row Level Security Policies',
    sql: `
      -- Enable RLS
      ALTER TABLE public.instagram_hashtags ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.instagram_search_queries ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    id: 'triggers_and_views',
    name: 'Triggers and Analytics Views',
    sql: `
      -- Add updated_at triggers
      CREATE TRIGGER update_instagram_hashtags_updated_at BEFORE UPDATE ON public.instagram_hashtags
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_instagram_posts_updated_at BEFORE UPDATE ON public.instagram_posts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      -- Analytics views
      CREATE OR REPLACE VIEW public.hashtag_analytics AS
      SELECT 
          h.hashtag_name,
          h.posts_count as official_posts_count,
          COUNT(p.id) as scraped_posts_count,
          AVG(p.likes_count) as avg_likes,
          AVG(p.comments_count) as avg_comments,
          AVG(p.video_play_count) as avg_video_plays,
          COUNT(CASE WHEN p.is_sponsored THEN 1 END) as sponsored_posts_count,
          MAX(p.timestamp) as latest_post_date,
          h.user_id
      FROM public.instagram_hashtags h
      LEFT JOIN public.instagram_posts p ON h.id = p.hashtag_id
      GROUP BY h.id, h.hashtag_name, h.posts_count, h.user_id;
      
      CREATE OR REPLACE VIEW public.user_post_analytics AS
      SELECT 
          p.owner_username,
          COUNT(p.id) as total_posts,
          AVG(p.likes_count) as avg_likes,
          AVG(p.comments_count) as avg_comments,
          SUM(p.likes_count) as total_likes,
          SUM(p.comments_count) as total_comments,
          COUNT(CASE WHEN p.is_sponsored THEN 1 END) as sponsored_posts,
          COUNT(CASE WHEN p.post_type = 'Video' THEN 1 END) as video_posts,
          MAX(p.timestamp) as latest_post_date,
          p.user_id
      FROM public.instagram_posts p
      WHERE p.owner_username IS NOT NULL
      GROUP BY p.owner_username, p.user_id;
    `
  }
]

async function executeSQL(sql: string): Promise<{ success: boolean, error?: string }> {
  try {
    // Use direct REST API call to execute SQL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql
      })
    })

    if (!response.ok) {
      // Try alternative method - direct SQL execution via PostgREST
      const alternativeResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/vnd.pgrst.object+json',
          'Accept': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: sql
      })

      if (!alternativeResponse.ok) {
        const errorText = await response.text()
        console.error('SQL execution failed:', errorText)
        return { success: false, error: `HTTP ${response.status}: ${errorText}` }
      }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Execution Error:', error.message)
    return { success: false, error: error.message }
  }
}

async function logMigration(chunk: any, success: boolean, executionTime: number, errorMessage?: string) {
  try {
    await supabaseServiceClient
      .from('migration_history')
      .insert({
        migration_name: 'instagram_scraper_schema',
        chunk_id: chunk.id,
        chunk_name: chunk.name,
        executed_by: 'system',
        success,
        error_message: errorMessage,
        execution_time_ms: executionTime
      })
  } catch (error) {
    console.error('Failed to log migration:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, chunk_id } = await request.json()

    if (action === 'run_full_migration') {
      const results = []
      let totalTime = 0

      for (const chunk of INSTAGRAM_MIGRATION_CHUNKS) {
        const startTime = Date.now()
        
        console.log(`Executing chunk: ${chunk.name}`)
        const result = await executeSQL(chunk.sql)
        
        const executionTime = Date.now() - startTime
        totalTime += executionTime

        if (!result.success) {
          await logMigration(chunk, false, executionTime, result.error)
          return NextResponse.json({
            error: `Migration failed at chunk: ${chunk.name}`,
            details: result.error,
            chunk: chunk.id
          }, { status: 500 })
        }

        await logMigration(chunk, true, executionTime)
        results.push({
          chunk: chunk.id,
          name: chunk.name,
          success: true,
          execution_time_ms: executionTime
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Instagram schema migration completed successfully',
        results,
        total_execution_time_ms: totalTime,
        chunks_executed: results.length
      })
    }

    if (action === 'run_single_chunk' && chunk_id) {
      const chunk = INSTAGRAM_MIGRATION_CHUNKS.find(c => c.id === chunk_id)
      if (!chunk) {
        return NextResponse.json({
          error: 'Chunk not found'
        }, { status: 404 })
      }

      const startTime = Date.now()
      const result = await executeSQL(chunk.sql)
      const executionTime = Date.now() - startTime

      await logMigration(chunk, result.success, executionTime, result.error)

      if (!result.success) {
        return NextResponse.json({
          error: `Migration failed at chunk: ${chunk.name}`,
          details: result.error
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Chunk ${chunk.name} executed successfully`,
        execution_time_ms: executionTime
      })
    }

    return NextResponse.json({
      error: 'Invalid action',
      available_actions: ['run_full_migration', 'run_single_chunk']
    }, { status: 400 })

  } catch (error: any) {
    console.error('Migration execution error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data: history, error } = await supabaseServiceClient
      .from('migration_history')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      history: history || [],
      available_chunks: INSTAGRAM_MIGRATION_CHUNKS.map(chunk => ({
        id: chunk.id,
        name: chunk.name
      }))
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}