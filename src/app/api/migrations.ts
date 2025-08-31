import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Create service role client for migration operations
const supabaseServiceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          
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
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
      
      -- Instagram hashtags policies
      CREATE POLICY "Users can view their own hashtag data" ON public.instagram_hashtags
          FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own hashtag data" ON public.instagram_hashtags
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own hashtag data" ON public.instagram_hashtags
          FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own hashtag data" ON public.instagram_hashtags
          FOR DELETE USING (auth.uid() = user_id);
      
      -- Instagram posts policies
      CREATE POLICY "Users can view their own post data" ON public.instagram_posts
          FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own post data" ON public.instagram_posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own post data" ON public.instagram_posts
          FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own post data" ON public.instagram_posts
          FOR DELETE USING (auth.uid() = user_id);
      
      -- Instagram search queries policies
      CREATE POLICY "Users can view their own search queries" ON public.instagram_search_queries
          FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own search queries" ON public.instagram_search_queries
          FOR INSERT WITH CHECK (auth.uid() = user_id);
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
  },
  {
    id: 'helper_functions',
    name: 'Helper Functions',
    sql: `
      -- Function to insert Instagram hashtag search results
      CREATE OR REPLACE FUNCTION insert_instagram_hashtag_data(
          p_user_id UUID,
          p_search_term TEXT,
          p_hashtag_data JSONB,
          p_apify_run_id TEXT DEFAULT NULL
      )
      RETURNS BIGINT AS $$
      DECLARE
          v_hashtag_id BIGINT;
          v_search_query_id BIGINT;
          v_post_data JSONB;
          v_post_id BIGINT;
          v_location_id BIGINT;
          v_music_id BIGINT;
          v_hashtag_item TEXT;
          v_mention_item TEXT;
      BEGIN
          -- Insert search query record
          INSERT INTO public.instagram_search_queries (
              search_term, search_type, user_id, apify_run_id, search_metadata
          ) VALUES (
              p_search_term, 'hashtag', p_user_id, p_apify_run_id, p_hashtag_data
          ) RETURNING id INTO v_search_query_id;
          
          -- Insert hashtag record
          INSERT INTO public.instagram_hashtags (
              hashtag_name, posts_count, hashtag_url, search_query, user_id
          ) VALUES (
              p_hashtag_data->>'name',
              COALESCE((p_hashtag_data->>'postsCount')::BIGINT, 0),
              p_hashtag_data->>'url',
              p_search_term,
              p_user_id
          ) ON CONFLICT (hashtag_name) DO UPDATE SET
              posts_count = EXCLUDED.posts_count,
              updated_at = NOW()
          RETURNING id INTO v_hashtag_id;
          
          -- Process top posts if they exist
          IF p_hashtag_data ? 'topPosts' THEN
              FOR v_post_data IN SELECT * FROM jsonb_array_elements(p_hashtag_data->'topPosts')
              LOOP
                  -- Insert location if exists
                  v_location_id := NULL;
                  IF v_post_data ? 'locationId' AND v_post_data ? 'locationName' THEN
                      INSERT INTO public.instagram_locations (location_id, location_name)
                      VALUES (v_post_data->>'locationId', v_post_data->>'locationName')
                      ON CONFLICT (location_id) DO NOTHING
                      RETURNING id INTO v_location_id;
                      
                      -- Get existing location if conflict occurred
                      IF v_location_id IS NULL THEN
                          SELECT id INTO v_location_id FROM public.instagram_locations 
                          WHERE location_id = v_post_data->>'locationId';
                      END IF;
                  END IF;
                  
                  -- Insert music info if exists
                  v_music_id := NULL;
                  IF v_post_data ? 'musicInfo' THEN
                      INSERT INTO public.instagram_music_info (
                          audio_id, artist_name, song_name, uses_original_audio, 
                          should_mute_audio, should_mute_audio_reason
                      ) VALUES (
                          v_post_data->'musicInfo'->>'audio_id',
                          v_post_data->'musicInfo'->>'artist_name',
                          v_post_data->'musicInfo'->>'song_name',
                          COALESCE((v_post_data->'musicInfo'->>'uses_original_audio')::BOOLEAN, false),
                          COALESCE((v_post_data->'musicInfo'->>'should_mute_audio')::BOOLEAN, false),
                          v_post_data->'musicInfo'->>'should_mute_audio_reason'
                      ) ON CONFLICT (audio_id) DO NOTHING
                      RETURNING id INTO v_music_id;
                      
                      -- Get existing music info if conflict occurred
                      IF v_music_id IS NULL THEN
                          SELECT id INTO v_music_id FROM public.instagram_music_info 
                          WHERE audio_id = v_post_data->'musicInfo'->>'audio_id';
                      END IF;
                  END IF;
                  
                  -- Insert post with comprehensive data handling
                  INSERT INTO public.instagram_posts (
                      instagram_id, short_code, post_url, input_url, post_type, caption,
                      timestamp, display_url, video_url, video_duration, dimensions_height,
                      dimensions_width, images, likes_count, comments_count, video_play_count,
                      ig_play_count, reshare_count, owner_id, owner_username, owner_full_name,
                      location_id, music_info_id, is_sponsored, product_type, first_comment,
                      latest_comments, hashtag_id, user_id, child_posts
                  ) VALUES (
                      v_post_data->>'id',
                      v_post_data->>'shortCode',
                      v_post_data->>'url',
                      v_post_data->>'inputUrl',
                      v_post_data->>'type',
                      v_post_data->>'caption',
                      CASE WHEN v_post_data->>'timestamp' IS NOT NULL 
                           THEN (v_post_data->>'timestamp')::TIMESTAMP WITH TIME ZONE 
                           ELSE NULL END,
                      v_post_data->>'displayUrl',
                      v_post_data->>'videoUrl',
                      CASE WHEN v_post_data->>'videoDuration' IS NOT NULL 
                           THEN (v_post_data->>'videoDuration')::DECIMAL(10,3) 
                           ELSE NULL END,
                      CASE WHEN v_post_data->>'dimensionsHeight' IS NOT NULL 
                           THEN (v_post_data->>'dimensionsHeight')::INTEGER 
                           ELSE NULL END,
                      CASE WHEN v_post_data->>'dimensionsWidth' IS NOT NULL 
                           THEN (v_post_data->>'dimensionsWidth')::INTEGER 
                           ELSE NULL END,
                      CASE WHEN v_post_data ? 'images' 
                           THEN ARRAY(SELECT jsonb_array_elements_text(v_post_data->'images'))
                           ELSE NULL END,
                      COALESCE((v_post_data->>'likesCount')::INTEGER, 0),
                      COALESCE((v_post_data->>'commentsCount')::INTEGER, 0),
                      COALESCE((v_post_data->>'videoPlayCount')::INTEGER, 0),
                      COALESCE((v_post_data->>'igPlayCount')::INTEGER, 0),
                      COALESCE((v_post_data->>'reshareCount')::INTEGER, 0),
                      v_post_data->>'ownerId',
                      v_post_data->>'ownerUsername',
                      v_post_data->>'ownerFullName',
                      v_location_id,
                      v_music_id,
                      COALESCE((v_post_data->>'isSponsored')::BOOLEAN, false),
                      v_post_data->>'productType',
                      v_post_data->>'firstComment',
                      COALESCE(v_post_data->'latestComments', '[]'::jsonb),
                      v_hashtag_id,
                      p_user_id,
                      COALESCE(v_post_data->'childPosts', '[]'::jsonb)
                  ) ON CONFLICT (instagram_id) DO UPDATE SET
                      likes_count = EXCLUDED.likes_count,
                      comments_count = EXCLUDED.comments_count,
                      video_play_count = EXCLUDED.video_play_count,
                      updated_at = NOW()
                  RETURNING id INTO v_post_id;
                  
                  -- Insert hashtags for this post
                  IF v_post_data ? 'hashtags' THEN
                      FOR v_hashtag_item IN SELECT * FROM jsonb_array_elements_text(v_post_data->'hashtags')
                      LOOP
                          INSERT INTO public.instagram_post_hashtags (post_id, hashtag_name)
                          VALUES (v_post_id, v_hashtag_item)
                          ON CONFLICT (post_id, hashtag_name) DO NOTHING;
                      END LOOP;
                  END IF;
                  
                  -- Insert mentions for this post
                  IF v_post_data ? 'mentions' THEN
                      FOR v_mention_item IN SELECT * FROM jsonb_array_elements_text(v_post_data->'mentions')
                      LOOP
                          INSERT INTO public.instagram_post_mentions (post_id, mentioned_username)
                          VALUES (v_post_id, v_mention_item)
                          ON CONFLICT (post_id, mentioned_username) DO NOTHING;
                      END LOOP;
                  END IF;
              END LOOP;
          END IF;
          
          RETURN v_hashtag_id;
      END;
      $$ LANGUAGE plpgsql;
    `
  }
]

// Create migration tracking table
const MIGRATION_TRACKING_SQL = `
  CREATE TABLE IF NOT EXISTS public.migration_history (
    id BIGSERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    chunk_id TEXT NOT NULL,
    chunk_name TEXT NOT NULL,
    executed_by UUID REFERENCES auth.users(id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time_ms INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_migration_history_name ON public.migration_history(migration_name);
  CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at ON public.migration_history(executed_at);
`

// Helper function to execute SQL
async function executeSQL(sql: string): Promise<{ success: boolean, error?: string }> {
  try {
    // Use direct REST API call to execute SQL
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SQL execution failed:', errorText)
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Execution Error:', error.message)
    return { success: false, error: error.message }
  }
}

// Helper function to log migration
async function logMigration(chunk: any, success: boolean, executionTime: number, errorMessage?: string, userId?: string) {
  try {
    await supabaseServiceClient
      .from('migration_history')
      .insert({
        migration_name: 'instagram_scraper_schema',
        chunk_id: chunk.id,
        chunk_name: chunk.name,
        executed_by: userId || 'system',
        success,
        error_message: errorMessage,
        execution_time_ms: executionTime
      })
  } catch (error) {
    console.error('Failed to log migration:', error)
  }
}

// Helper function to check auth and admin role
async function checkAuthAndAdminRole(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Check authentication and admin role
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  if (authError || !session) {
    return { error: 'Unauthorized', status: 401 }
  }

  // Get user profile to check role
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profileError || !userProfile || userProfile.role !== 'admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { session, supabase }
}

// GET /api/migrations - Action-based routing for different GET operations
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAuthAndAdminRole(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { session, supabase } = authResult

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    
    switch (action) {
      case 'list':
        return await handleMigrationsList(supabase)
      case 'history':
        return await handleMigrationHistory(supabase)
      case 'tables':
        return await handleTablesStatus(supabase)
      case 'execute-status':
        return await handleExecuteStatus()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/migrations - Action-based routing for different POST operations
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAuthAndAdminRole(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { session, supabase } = authResult

    const body = await request.json()
    const action = body.action

    switch (action) {
      case 'init':
        return await handleMigrationInit()
      case 'run':
        return await handleMigrationRun(session, supabase)
      case 'status':
        return await handleMigrationStatus(supabase)
      case 'execute-chunk':
        return await handleExecuteChunk(body, session, supabase)
      case 'rollback':
        return await handleRollback(body, session, supabase)
      case 'check-status':
        return await handleCheckStatus(body, supabase)
      case 'run_full_migration':
        return await handleRunFullMigration()
      case 'run_single_chunk':
        return await handleRunSingleChunk(body)
      default:
        return NextResponse.json({
          error: 'Invalid action',
          available_actions: ['init', 'run', 'status', 'execute-chunk', 'rollback', 'check-status', 'run_full_migration', 'run_single_chunk']
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handler functions
async function handleMigrationsList(supabase: any) {
  // Get migration history
  const { data: history, error } = await supabase
    .from('migration_history')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({
      error: 'Failed to fetch migration history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    history,
    available_migrations: ['instagram_scraper_schema'],
    chunks: INSTAGRAM_MIGRATION_CHUNKS.map(chunk => ({
      id: chunk.id,
      name: chunk.name
    }))
  })
}

async function handleMigrationHistory(supabase: any) {
  const { data: history, error } = await supabase
    .from('migration_history')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({
      error: 'Failed to fetch migration history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    history
  })
}

async function handleTablesStatus(supabase: any) {
  // Check existing Instagram tables
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', 'instagram_%')

  return NextResponse.json({
    success: true,
    instagram_tables: tables || []
  })
}

async function handleExecuteStatus() {
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
}

async function handleMigrationInit() {
  try {
    // Execute SQL directly using service role client
    const { error } = await supabaseServiceClient.rpc('exec_sql', {
      sql_query: MIGRATION_TRACKING_SQL
    }).single()

    // If rpc doesn't work, let's use a different approach
    if (error && error instanceof Error ? error.message : 'Unknown error'.includes('function')) {
      // Execute the SQL by creating the table directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          sql_query: MIGRATION_TRACKING_SQL
        })
      })

      if (!response.ok) {
        // Fallback: execute each statement individually
        const statements = MIGRATION_TRACKING_SQL.split(';').filter(s => s.trim())
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await supabaseServiceClient.rpc('exec_sql', { sql_query: statement.trim() })
            } catch (err) {
              console.log('SQL execution attempt:', statement.trim().substring(0, 100))
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration tracking initialized'
    })
  } catch (trackingError: any) {
    return NextResponse.json({
      error: 'Failed to create migration tracking table',
      details: trackingError.message
    }, { status: 500 })
  }
}

async function handleMigrationRun(session: any, supabase: any) {
  const results = []
  const migrationName = 'instagram_scraper_schema'
  let totalTime = 0

  for (const chunk of INSTAGRAM_MIGRATION_CHUNKS) {
    const startTime = Date.now()
    
    try {
      // Execute the SQL chunk
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql: chunk.sql
      })

      const executionTime = Date.now() - startTime
      totalTime += executionTime

      if (sqlError) {
        // Log failed migration
        await supabase.from('migration_history').insert({
          migration_name: migrationName,
          chunk_id: chunk.id,
          chunk_name: chunk.name,
          executed_by: session.user.id,
          success: false,
          error_message: sqlError.message,
          execution_time_ms: executionTime
        })

        return NextResponse.json({
          error: `Migration failed at chunk: ${chunk.name}`,
          details: sqlError.message,
          chunk: chunk.id
        }, { status: 500 })
      }

      // Log successful migration
      await supabase.from('migration_history').insert({
        migration_name: migrationName,
        chunk_id: chunk.id,
        chunk_name: chunk.name,
        executed_by: session.user.id,
        success: true,
        execution_time_ms: executionTime
      })

      results.push({
        chunk: chunk.id,
        name: chunk.name,
        success: true,
        execution_time_ms: executionTime
      })

    } catch (error) {
      const executionTime = Date.now() - startTime
      
      // Log failed migration
      await supabase.from('migration_history').insert({
        migration_name: migrationName,
        chunk_id: chunk.id,
        chunk_name: chunk.name,
        executed_by: session.user.id,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: executionTime
      })

      return NextResponse.json({
        error: `Migration failed at chunk: ${chunk.name}`,
        details: error instanceof Error ? error.message : 'Unknown error',
        chunk: chunk.id
      }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Instagram schema migration completed successfully',
    results,
    total_execution_time_ms: totalTime,
    chunks_executed: results.length
  })
}

async function handleMigrationStatus(supabase: any) {
  const { data: history, error: historyError } = await supabase
    .from('migration_history')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(50)

  if (historyError) {
    return NextResponse.json({
      error: 'Failed to fetch migration history',
      details: historyError.message
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    history,
    available_migrations: ['instagram_scraper_schema']
  })
}

async function handleExecuteChunk(body: any, session: any, supabase: any) {
  const { chunk_id, sql, migration_name } = body
  
  if (!chunk_id || !sql || !migration_name) {
    return NextResponse.json({
      error: 'Missing required fields: chunk_id, sql, migration_name'
    }, { status: 400 })
  }

  const startTime = Date.now()
  
  try {
    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('execute_sql', {
      sql: sql
    })

    const executionTime = Date.now() - startTime

    if (sqlError) {
      // Log failed migration
      await supabase.from('migration_history').insert({
        migration_name,
        chunk_id,
        chunk_name: chunk_id,
        executed_by: session.user.id,
        success: false,
        error_message: sqlError.message,
        execution_time_ms: executionTime
      })

      return NextResponse.json({
        error: `Migration chunk failed: ${chunk_id}`,
        details: sqlError.message
      }, { status: 500 })
    }

    // Log successful migration
    await supabase.from('migration_history').insert({
      migration_name,
      chunk_id,
      chunk_name: chunk_id,
      executed_by: session.user.id,
      success: true,
      execution_time_ms: executionTime
    })

    return NextResponse.json({
      success: true,
      message: `Migration chunk ${chunk_id} executed successfully`,
      execution_time_ms: executionTime
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    
    // Log failed migration
    await supabase.from('migration_history').insert({
      migration_name,
      chunk_id,
      chunk_name: chunk_id,
      executed_by: session.user.id,
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      execution_time_ms: executionTime
    })

    return NextResponse.json({
      error: `Migration chunk failed: ${chunk_id}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleRollback(body: any, session: any, supabase: any) {
  const { migration_name } = body
  
  if (!migration_name) {
    return NextResponse.json({
      error: 'Missing migration_name'
    }, { status: 400 })
  }

  const rollbackSQL = `
    -- Drop Instagram schema tables in reverse dependency order
    DROP VIEW IF EXISTS public.user_post_analytics;
    DROP VIEW IF EXISTS public.hashtag_analytics;
    
    DROP TRIGGER IF EXISTS update_instagram_posts_updated_at ON public.instagram_posts;
    DROP TRIGGER IF EXISTS update_instagram_hashtags_updated_at ON public.instagram_hashtags;
    
    DROP TABLE IF EXISTS public.instagram_post_mentions CASCADE;
    DROP TABLE IF EXISTS public.instagram_post_hashtags CASCADE;
    DROP TABLE IF EXISTS public.instagram_search_queries CASCADE;
    DROP TABLE IF EXISTS public.instagram_posts CASCADE;
    DROP TABLE IF EXISTS public.instagram_music_info CASCADE;
    DROP TABLE IF EXISTS public.instagram_locations CASCADE;
    DROP TABLE IF EXISTS public.instagram_hashtags CASCADE;
    
    DROP FUNCTION IF EXISTS insert_instagram_hashtag_data(UUID, TEXT, JSONB, TEXT);
    DROP FUNCTION IF EXISTS update_updated_at_column();
  `

  const startTime = Date.now()
  
  try {
    const { error: rollbackError } = await supabase.rpc('execute_sql', {
      sql: rollbackSQL
    })

    const executionTime = Date.now() - startTime

    if (rollbackError) {
      return NextResponse.json({
        error: 'Rollback failed',
        details: rollbackError.message
      }, { status: 500 })
    }

    // Log rollback
    await supabase.from('migration_history').insert({
      migration_name: `${migration_name}_rollback`,
      chunk_id: 'rollback',
      chunk_name: 'Full Rollback',
      executed_by: session.user.id,
      success: true,
      execution_time_ms: executionTime
    })

    return NextResponse.json({
      success: true,
      message: 'Migration rolled back successfully',
      execution_time_ms: executionTime
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Rollback failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleCheckStatus(body: any, supabase: any) {
  const { migration_name } = body

  // Check if tables exist
  const tableCheckSQL = `
    SELECT 
      table_name,
      CASE 
        WHEN table_name IS NOT NULL THEN true 
        ELSE false 
      END as exists
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'instagram_hashtags',
      'instagram_locations', 
      'instagram_music_info',
      'instagram_posts',
      'instagram_post_hashtags',
      'instagram_post_mentions',
      'instagram_search_queries',
      'migration_history'
    );
  `

  const { data: tableStatus, error: tableError } = await supabase.rpc('execute_sql', {
    sql: tableCheckSQL
  })

  if (tableError) {
    return NextResponse.json({
      error: 'Failed to check table status',
      details: tableError.message
    }, { status: 500 })
  }

  // Get recent migration history
  const { data: history, error: historyError } = await supabase
    .from('migration_history')
    .select('*')
    .eq('migration_name', migration_name || 'instagram_scraper_schema')
    .order('executed_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    success: true,
    tables: tableStatus,
    recent_history: history || [],
    migration_name: migration_name || 'instagram_scraper_schema'
  })
}

async function handleRunFullMigration() {
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

async function handleRunSingleChunk(body: any) {
  const { chunk_id } = body
  
  if (!chunk_id) {
    return NextResponse.json({
      error: 'Missing chunk_id'
    }, { status: 400 })
  }
  
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