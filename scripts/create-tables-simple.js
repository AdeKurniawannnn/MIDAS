#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

// Simple table creation statements
const tableStatements = [
  {
    name: 'migration_history',
    sql: `CREATE TABLE IF NOT EXISTS public.migration_history (
      id BIGSERIAL PRIMARY KEY,
      migration_name TEXT NOT NULL,
      chunk_id TEXT NOT NULL,
      chunk_name TEXT NOT NULL,
      executed_by TEXT,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
      success BOOLEAN DEFAULT true,
      error_message TEXT,
      execution_time_ms INTEGER
    )`
  },
  {
    name: 'instagram_hashtags',
    sql: `CREATE TABLE IF NOT EXISTS public.instagram_hashtags (
      id BIGSERIAL PRIMARY KEY,
      hashtag_name TEXT NOT NULL UNIQUE,
      posts_count BIGINT DEFAULT 0,
      hashtag_url TEXT NOT NULL,
      search_query TEXT,
      user_id UUID,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    )`
  },
  {
    name: 'instagram_locations',
    sql: `CREATE TABLE IF NOT EXISTS public.instagram_locations (
      id BIGSERIAL PRIMARY KEY,
      location_id TEXT UNIQUE,
      location_name TEXT NOT NULL,
      address TEXT,
      coordinates JSONB,
      city TEXT,
      country TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    )`
  },
  {
    name: 'instagram_music_info',
    sql: `CREATE TABLE IF NOT EXISTS public.instagram_music_info (
      id BIGSERIAL PRIMARY KEY,
      audio_id TEXT UNIQUE,
      artist_name TEXT,
      song_name TEXT,
      uses_original_audio BOOLEAN DEFAULT false,
      should_mute_audio BOOLEAN DEFAULT false,
      should_mute_audio_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    )`
  },
  {
    name: 'instagram_posts',
    sql: `CREATE TABLE IF NOT EXISTS public.instagram_posts (
      id BIGSERIAL PRIMARY KEY,
      instagram_id TEXT NOT NULL UNIQUE,
      short_code TEXT NOT NULL UNIQUE,
      post_url TEXT NOT NULL,
      input_url TEXT,
      post_type TEXT NOT NULL CHECK (post_type IN ('Image', 'Video', 'Sidecar', 'Reel')),
      caption TEXT,
      timestamp TIMESTAMP WITH TIME ZONE,
      display_url TEXT,
      video_url TEXT,
      video_duration DECIMAL(10,3),
      dimensions_height INTEGER,
      dimensions_width INTEGER,
      images TEXT[],
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      video_play_count INTEGER DEFAULT 0,
      ig_play_count INTEGER DEFAULT 0,
      reshare_count INTEGER DEFAULT 0,
      owner_id TEXT,
      owner_username TEXT,
      owner_full_name TEXT,
      location_id BIGINT REFERENCES public.instagram_locations(id) ON DELETE SET NULL,
      music_info_id BIGINT REFERENCES public.instagram_music_info(id) ON DELETE SET NULL,
      is_sponsored BOOLEAN DEFAULT false,
      product_type TEXT,
      first_comment TEXT,
      latest_comments JSONB DEFAULT '[]',
      hashtag_id BIGINT REFERENCES public.instagram_hashtags(id) ON DELETE CASCADE,
      user_id UUID,
      child_posts JSONB DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    )`
  },
  {
    name: 'instagram_post_hashtags',
    sql: `CREATE TABLE IF NOT EXISTS public.instagram_post_hashtags (
      id BIGSERIAL PRIMARY KEY,
      post_id BIGINT REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
      hashtag_name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    )`
  },
  {
    name: 'instagram_post_mentions',
    sql: `CREATE TABLE IF NOT EXISTS public.instagram_post_mentions (
      id BIGSERIAL PRIMARY KEY,
      post_id BIGINT REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
      mentioned_username TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    )`
  },
  {
    name: 'instagram_search_queries',
    sql: `CREATE TABLE IF NOT EXISTS public.instagram_search_queries (
      id BIGSERIAL PRIMARY KEY,
      search_term TEXT NOT NULL,
      search_type TEXT NOT NULL CHECK (search_type IN ('hashtag', 'user', 'location')),
      results_count INTEGER DEFAULT 0,
      results_limit INTEGER DEFAULT 1,
      user_id UUID,
      apify_run_id TEXT,
      search_metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    )`
  }
]

async function createTable(tableInfo) {
  console.log(`📋 Creating table: ${tableInfo.name}`)
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: tableInfo.sql
      })
    })

    if (response.ok) {
      console.log(`✅ Created: ${tableInfo.name}`)
      return true
    } else {
      // Try direct PostgREST approach
      const directResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/vnd.pgrst.object+json',
        },
        body: tableInfo.sql
      })

      if (directResponse.ok) {
        console.log(`✅ Created via direct: ${tableInfo.name}`)
        return true
      } else {
        const errorText = await response.text()
        console.log(`❌ Failed: ${tableInfo.name} - ${errorText}`)
        return false
      }
    }
  } catch (error) {
    console.log(`❌ Error creating ${tableInfo.name}: ${error.message}`)
    return false
  }
}

async function verifyTable(tableName) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${tableName}?select=count`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      }
    })

    if (response.ok) {
      console.log(`✅ Verified: ${tableName} exists`)
      return true
    } else {
      console.log(`❌ Missing: ${tableName}`)
      return false
    }
  } catch (error) {
    console.log(`❓ Could not verify: ${tableName}`)
    return false
  }
}

async function main() {
  console.log('🚀 Creating Instagram schema tables...')
  console.log(`📍 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  
  let successCount = 0
  
  for (const table of tableStatements) {
    const success = await createTable(table)
    if (success) successCount++
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`📊 Tables created: ${successCount}/${tableStatements.length}`)
  
  console.log('\n🔍 Verifying tables...')
  for (const table of tableStatements) {
    await verifyTable(table.name)
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error.message)
    process.exit(1)
  })
}