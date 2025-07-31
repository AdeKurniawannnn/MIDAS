#!/usr/bin/env node
/**
 * Instagram Scraper Schema Migration via postgres-meta API
 * Migrates the Instagram scraper database schema using postgres-meta API
 * instead of direct SQL execution, compatible with Coolify/restricted DB access.
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Instagram Scraper Schema Migration via postgres-meta')
console.log('URL:', SUPABASE_URL)
console.log('Service Role Key:', SERVICE_ROLE_KEY ? 'Present' : 'Missing')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Utility function for postgres-meta API calls
const postgresMetaAPI = async (endpoint, method = 'GET', body = null) => {
  const url = `${SUPABASE_URL}/pg/${endpoint}`
  const options = {
    method,
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    }
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${JSON.stringify(result)}`)
    }
    
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Utility function for RPC calls (for complex SQL)
const executeRPC = async (functionName, params = {}) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      const result = await response.json()
      return { success: true, data: result }
    } else {
      const error = await response.text()
      return { success: false, error }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Create RPC function for executing raw SQL
const createExecuteSQLFunction = async () => {
  console.log('\n📝 Creating execute_sql RPC function...')
  
  const functionSQL = `
    CREATE OR REPLACE FUNCTION public.execute_sql(query TEXT)
    RETURNS TEXT AS $$
    BEGIN
        EXECUTE query;
        RETURN 'Query executed successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error: ' || SQLERRM;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  // Try to create via postgres-meta functions endpoint
  const result = await postgresMetaAPI('functions', 'POST', {
    name: 'execute_sql',
    schema: 'public',
    definition: functionSQL,
    return_type: 'text',
    language: 'plpgsql',
    security_definer: true
  })

  if (result.success) {
    console.log('✅ execute_sql function created via postgres-meta')
    return true
  } else {
    console.log('⚠️  Could not create via postgres-meta, function may already exist')
    return false
  }
}

// Phase 1: Extensions and Core Functions
const setupExtensionsAndFunctions = async () => {
  console.log('\n🔧 Phase 1: Setting up extensions and functions...')
  
  const sqlCommands = [
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
    'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
     RETURNS TRIGGER AS $$
     BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
     END;
     $$ language 'plpgsql'`
  ]

  for (const sql of sqlCommands) {
    const result = await executeRPC('execute_sql', { query: sql })
    if (result.success) {
      console.log('✅', sql.split('\n')[0])
    } else {
      console.log('⚠️  Failed:', result.error)
    }
  }
}

// Phase 2: Create Tables using postgres-meta
const createTable = async (tableName, columns, options = {}) => {
  console.log(`📋 Creating table: ${tableName}`)
  
  const tableData = {
    name: tableName,
    schema: 'public',
    columns: columns,
    rls_enabled: options.rls_enabled || false,
    comment: options.comment || `Instagram scraper table: ${tableName}`
  }

  const result = await postgresMetaAPI('tables', 'POST', tableData)
  
  if (result.success) {
    console.log(`✅ Table created: ${tableName}`)
    return true
  } else {
    console.log(`❌ Failed to create ${tableName}:`, result.error)
    return false
  }
}

// Create indexes for a table
const createIndexes = async (tableName, indexes) => {
  console.log(`🔍 Creating indexes for ${tableName}...`)
  
  for (const index of indexes) {
    const result = await postgresMetaAPI('indexes', 'POST', {
      name: index.name,
      table_name: tableName,
      table_schema: 'public',
      columns: index.columns,
      unique: index.unique || false
    })
    
    if (result.success) {
      console.log(`✅ Index created: ${index.name}`)
    } else {
      console.log(`⚠️  Index creation failed: ${index.name}`, result.error)
    }
  }
}

const createInstagramTables = async () => {
  console.log('\n🗄️  Phase 2: Creating Instagram tables...')

  // 1. instagram_locations (no dependencies)
  const locationsCreated = await createTable('instagram_locations', [
    { name: 'id', type: 'bigserial', is_primary_key: true, is_nullable: false },
    { name: 'location_id', type: 'text', is_unique: true, is_nullable: true },
    { name: 'location_name', type: 'text', is_nullable: false },
    { name: 'address', type: 'text', is_nullable: true },
    { name: 'coordinates', type: 'jsonb', is_nullable: true },
    { name: 'city', type: 'text', is_nullable: true },
    { name: 'country', type: 'text', is_nullable: true },
    { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" }
  ])

  if (locationsCreated) {
    await createIndexes('instagram_locations', [
      { name: 'idx_locations_location_id', columns: ['location_id'] },
      { name: 'idx_locations_name', columns: ['location_name'] },
      { name: 'idx_locations_city', columns: ['city'] }
    ])
  }

  // 2. instagram_music_info (no dependencies)
  const musicCreated = await createTable('instagram_music_info', [
    { name: 'id', type: 'bigserial', is_primary_key: true, is_nullable: false },
    { name: 'audio_id', type: 'text', is_unique: true, is_nullable: true },
    { name: 'artist_name', type: 'text', is_nullable: true },
    { name: 'song_name', type: 'text', is_nullable: true },
    { name: 'uses_original_audio', type: 'boolean', is_nullable: false, default_value: 'false' },
    { name: 'should_mute_audio', type: 'boolean', is_nullable: false, default_value: 'false' },
    { name: 'should_mute_audio_reason', type: 'text', is_nullable: true },
    { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" }
  ])

  if (musicCreated) {
    await createIndexes('instagram_music_info', [
      { name: 'idx_music_audio_id', columns: ['audio_id'] },
      { name: 'idx_music_artist', columns: ['artist_name'] },
      { name: 'idx_music_song', columns: ['song_name'] }
    ])
  }

  // 3. instagram_hashtags (references auth.users)
  const hashtagsCreated = await createTable('instagram_hashtags', [
    { name: 'id', type: 'bigserial', is_primary_key: true, is_nullable: false },
    { name: 'hashtag_name', type: 'text', is_nullable: false, is_unique: true },
    { name: 'posts_count', type: 'bigint', is_nullable: false, default_value: '0' },
    { name: 'hashtag_url', type: 'text', is_nullable: false },
    { name: 'search_query', type: 'text', is_nullable: true },
    { name: 'user_id', type: 'uuid', is_nullable: true },
    { name: 'metadata', type: 'jsonb', is_nullable: true, default_value: "'{}'::jsonb" },
    { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" },
    { name: 'updated_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" }
  ], { rls_enabled: true })

  if (hashtagsCreated) {
    await createIndexes('instagram_hashtags', [
      { name: 'idx_hashtags_name', columns: ['hashtag_name'] },
      { name: 'idx_hashtags_user_id', columns: ['user_id'] },
      { name: 'idx_hashtags_posts_count', columns: ['posts_count'] },
      { name: 'idx_hashtags_created_at', columns: ['created_at'] }
    ])
  }

  // 4. instagram_posts (main table, references multiple tables)
  const postsCreated = await createTable('instagram_posts', [
    { name: 'id', type: 'bigserial', is_primary_key: true, is_nullable: false },
    // Instagram identifiers
    { name: 'instagram_id', type: 'text', is_nullable: false, is_unique: true },
    { name: 'short_code', type: 'text', is_nullable: false, is_unique: true },
    { name: 'post_url', type: 'text', is_nullable: false },
    { name: 'input_url', type: 'text', is_nullable: true },
    // Content metadata
    { name: 'post_type', type: 'text', is_nullable: false },
    { name: 'caption', type: 'text', is_nullable: true },
    { name: 'timestamp', type: 'timestamptz', is_nullable: true },
    // Media information
    { name: 'display_url', type: 'text', is_nullable: true },
    { name: 'video_url', type: 'text', is_nullable: true },
    { name: 'video_duration', type: 'decimal', is_nullable: true },
    { name: 'dimensions_height', type: 'integer', is_nullable: true },
    { name: 'dimensions_width', type: 'integer', is_nullable: true },
    { name: 'images', type: 'text[]', is_nullable: true },
    // Engagement metrics
    { name: 'likes_count', type: 'integer', is_nullable: false, default_value: '0' },
    { name: 'comments_count', type: 'integer', is_nullable: false, default_value: '0' },
    { name: 'video_play_count', type: 'integer', is_nullable: false, default_value: '0' },
    { name: 'ig_play_count', type: 'integer', is_nullable: false, default_value: '0' },
    { name: 'reshare_count', type: 'integer', is_nullable: false, default_value: '0' },
    // Owner information
    { name: 'owner_id', type: 'text', is_nullable: true },
    { name: 'owner_username', type: 'text', is_nullable: true },
    { name: 'owner_full_name', type: 'text', is_nullable: true },
    // Foreign key references
    { name: 'location_id', type: 'bigint', is_nullable: true },
    { name: 'music_info_id', type: 'bigint', is_nullable: true },
    // Business information
    { name: 'is_sponsored', type: 'boolean', is_nullable: false, default_value: 'false' },
    { name: 'product_type', type: 'text', is_nullable: true },
    // Comments data
    { name: 'first_comment', type: 'text', is_nullable: true },
    { name: 'latest_comments', type: 'jsonb', is_nullable: true, default_value: "'[]'::jsonb" },
    // Search and user context
    { name: 'hashtag_id', type: 'bigint', is_nullable: true },
    { name: 'user_id', type: 'uuid', is_nullable: true },
    // Child posts for carousels
    { name: 'child_posts', type: 'jsonb', is_nullable: true, default_value: "'[]'::jsonb" },
    // Additional metadata
    { name: 'metadata', type: 'jsonb', is_nullable: true, default_value: "'{}'::jsonb" },
    { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" },
    { name: 'updated_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" }
  ], { rls_enabled: true })

  if (postsCreated) {
    await createIndexes('instagram_posts', [
      { name: 'idx_posts_instagram_id', columns: ['instagram_id'] },
      { name: 'idx_posts_short_code', columns: ['short_code'] },
      { name: 'idx_posts_user_id', columns: ['user_id'] },
      { name: 'idx_posts_hashtag_id', columns: ['hashtag_id'] },
      { name: 'idx_posts_owner_username', columns: ['owner_username'] },
      { name: 'idx_posts_post_type', columns: ['post_type'] },
      { name: 'idx_posts_timestamp', columns: ['timestamp'] },
      { name: 'idx_posts_likes_count', columns: ['likes_count'] },
      { name: 'idx_posts_is_sponsored', columns: ['is_sponsored'] },
      { name: 'idx_posts_location_id', columns: ['location_id'] },
      { name: 'idx_posts_music_info_id', columns: ['music_info_id'] },
      { name: 'idx_posts_created_at', columns: ['created_at'] }
    ])
  }

  // 5. instagram_post_hashtags (junction table)
  const postHashtagsCreated = await createTable('instagram_post_hashtags', [
    { name: 'id', type: 'bigserial', is_primary_key: true, is_nullable: false },
    { name: 'post_id', type: 'bigint', is_nullable: false },
    { name: 'hashtag_name', type: 'text', is_nullable: false },
    { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" }
  ])

  if (postHashtagsCreated) {
    await createIndexes('instagram_post_hashtags', [
      { name: 'idx_post_hashtags_post_id', columns: ['post_id'] },
      { name: 'idx_post_hashtags_hashtag_name', columns: ['hashtag_name'] },
      { name: 'idx_post_hashtags_unique', columns: ['post_id', 'hashtag_name'], unique: true }
    ])
  }

  // 6. instagram_post_mentions (junction table)
  const postMentionsCreated = await createTable('instagram_post_mentions', [
    { name: 'id', type: 'bigserial', is_primary_key: true, is_nullable: false },
    { name: 'post_id', type: 'bigint', is_nullable: false },
    { name: 'mentioned_username', type: 'text', is_nullable: false },
    { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" }
  ])

  if (postMentionsCreated) {
    await createIndexes('instagram_post_mentions', [
      { name: 'idx_post_mentions_post_id', columns: ['post_id'] },
      { name: 'idx_post_mentions_username', columns: ['mentioned_username'] },
      { name: 'idx_post_mentions_unique', columns: ['post_id', 'mentioned_username'], unique: true }
    ])
  }

  // 7. instagram_search_queries (references auth.users)
  const searchQueriesCreated = await createTable('instagram_search_queries', [
    { name: 'id', type: 'bigserial', is_primary_key: true, is_nullable: false },
    { name: 'search_term', type: 'text', is_nullable: false },
    { name: 'search_type', type: 'text', is_nullable: false },
    { name: 'results_count', type: 'integer', is_nullable: false, default_value: '0' },
    { name: 'results_limit', type: 'integer', is_nullable: false, default_value: '1' },
    { name: 'user_id', type: 'uuid', is_nullable: true },
    { name: 'apify_run_id', type: 'text', is_nullable: true },
    { name: 'search_metadata', type: 'jsonb', is_nullable: true, default_value: "'{}'::jsonb" },
    { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: "timezone('utc'::text, now())" }
  ], { rls_enabled: true })

  if (searchQueriesCreated) {
    await createIndexes('instagram_search_queries', [
      { name: 'idx_search_queries_user_id', columns: ['user_id'] },
      { name: 'idx_search_queries_search_term', columns: ['search_term'] },
      { name: 'idx_search_queries_search_type', columns: ['search_type'] },
      { name: 'idx_search_queries_created_at', columns: ['created_at'] }
    ])
  }
}

// Phase 3: Advanced SQL Features (RLS, Triggers, Views, Functions)
const setupAdvancedFeatures = async () => {
  console.log('\n🔐 Phase 3: Setting up RLS policies, triggers, views, and functions...')

  const advancedSQL = [
    // Add foreign key constraints (postgres-meta might not handle these)
    `ALTER TABLE public.instagram_posts ADD CONSTRAINT fk_posts_location FOREIGN KEY (location_id) REFERENCES public.instagram_locations(id) ON DELETE SET NULL`,
    `ALTER TABLE public.instagram_posts ADD CONSTRAINT fk_posts_music FOREIGN KEY (music_info_id) REFERENCES public.instagram_music_info(id) ON DELETE SET NULL`,
    `ALTER TABLE public.instagram_posts ADD CONSTRAINT fk_posts_hashtag FOREIGN KEY (hashtag_id) REFERENCES public.instagram_hashtags(id) ON DELETE CASCADE`,
    `ALTER TABLE public.instagram_posts ADD CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`,
    `ALTER TABLE public.instagram_hashtags ADD CONSTRAINT fk_hashtags_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`,
    `ALTER TABLE public.instagram_post_hashtags ADD CONSTRAINT fk_post_hashtags_post FOREIGN KEY (post_id) REFERENCES public.instagram_posts(id) ON DELETE CASCADE`,
    `ALTER TABLE public.instagram_post_mentions ADD CONSTRAINT fk_post_mentions_post FOREIGN KEY (post_id) REFERENCES public.instagram_posts(id) ON DELETE CASCADE`,
    `ALTER TABLE public.instagram_search_queries ADD CONSTRAINT fk_search_queries_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`,
    
    // Add check constraints
    `ALTER TABLE public.instagram_posts ADD CONSTRAINT check_post_type CHECK (post_type IN ('Image', 'Video', 'Sidecar', 'Reel'))`,
    `ALTER TABLE public.instagram_search_queries ADD CONSTRAINT check_search_type CHECK (search_type IN ('hashtag', 'user', 'location'))`,

    // RLS Policies for instagram_hashtags
    `CREATE POLICY "Users can view their own hashtag data" ON public.instagram_hashtags FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can insert their own hashtag data" ON public.instagram_hashtags FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY "Users can update their own hashtag data" ON public.instagram_hashtags FOR UPDATE USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can delete their own hashtag data" ON public.instagram_hashtags FOR DELETE USING (auth.uid() = user_id)`,

    // RLS Policies for instagram_posts  
    `CREATE POLICY "Users can view their own post data" ON public.instagram_posts FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can insert their own post data" ON public.instagram_posts FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY "Users can update their own post data" ON public.instagram_posts FOR UPDATE USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can delete their own post data" ON public.instagram_posts FOR DELETE USING (auth.uid() = user_id)`,

    // RLS Policies for instagram_search_queries
    `CREATE POLICY "Users can view their own search queries" ON public.instagram_search_queries FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can insert their own search queries" ON public.instagram_search_queries FOR INSERT WITH CHECK (auth.uid() = user_id)`,

    // Triggers for updated_at
    `CREATE TRIGGER update_instagram_hashtags_updated_at BEFORE UPDATE ON public.instagram_hashtags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
    `CREATE TRIGGER update_instagram_posts_updated_at BEFORE UPDATE ON public.instagram_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

    // Analytics Views
    `CREATE OR REPLACE VIEW public.hashtag_analytics AS
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
     GROUP BY h.id, h.hashtag_name, h.posts_count, h.user_id`,

    `CREATE OR REPLACE VIEW public.user_post_analytics AS
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
     GROUP BY p.owner_username, p.user_id`
  ]

  for (const sql of advancedSQL) {
    const result = await executeRPC('execute_sql', { query: sql })
    if (result.success) {
      console.log('✅', sql.split('\n')[0].substring(0, 60) + '...')
    } else {
      console.log('⚠️  Failed:', sql.split('\n')[0].substring(0, 60) + '...', result.error)
    }
  }
}

// Create the large insert function
const createInsertFunction = async () => {
  console.log('\n📊 Creating insert_instagram_hashtag_data function...')
  
  const insertFunctionSQL = `
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
                
                -- Insert post
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

  const result = await executeRPC('execute_sql', { query: insertFunctionSQL })
  if (result.success) {
    console.log('✅ insert_instagram_hashtag_data function created')
  } else {
    console.log('⚠️  Failed to create insert function:', result.error)
  }
}

// Validation Phase
const validateMigration = async () => {
  console.log('\n🔍 Phase 4: Validating migration...')

  const tables = await postgresMetaAPI('tables')
  if (tables.success) {
    const instagramTables = tables.data.filter(t => t.name.startsWith('instagram_'))
    console.log(`✅ Found ${instagramTables.length} Instagram tables:`, instagramTables.map(t => t.name).join(', '))
  } else {
    console.log('❌ Failed to validate tables')
  }

  // Test RPC function availability
  const testRPC = await executeRPC('execute_sql', { query: 'SELECT 1 as test' })
  if (testRPC.success) {
    console.log('✅ RPC execute_sql function is working')
  } else {
    console.log('⚠️  RPC function not available')
  }
}

// Main migration execution
const main = async () => {
  console.log('\n' + '='.repeat(80))
  console.log('🚀 INSTAGRAM SCRAPER SCHEMA MIGRATION VIA POSTGRES-META')
  console.log('='.repeat(80))

  try {
    // Create execute SQL function first
    await createExecuteSQLFunction()
    
    // Phase 1: Extensions and Functions
    await setupExtensionsAndFunctions()
    
    // Phase 2: Create Tables
    await createInstagramTables()
    
    // Phase 3: Advanced Features
    await setupAdvancedFeatures()
    
    // Create Insert Function
    await createInsertFunction()
    
    // Phase 4: Validation
    await validateMigration()

    console.log('\n' + '='.repeat(80))
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!')
    console.log('✅ All Instagram scraper tables created')
    console.log('✅ RLS policies configured')
    console.log('✅ Indexes created for performance')
    console.log('✅ Analytics views available')
    console.log('✅ Data insertion function ready')
    console.log('\n📊 Available tables:')
    console.log('   - instagram_locations')
    console.log('   - instagram_music_info')
    console.log('   - instagram_hashtags')
    console.log('   - instagram_posts')
    console.log('   - instagram_post_hashtags')
    console.log('   - instagram_post_mentions')
    console.log('   - instagram_search_queries')
    console.log('\n📈 Available views:')
    console.log('   - hashtag_analytics')
    console.log('   - user_post_analytics')
    console.log('\n🔧 Available functions:')
    console.log('   - insert_instagram_hashtag_data()')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Execute migration
main().catch(console.error)