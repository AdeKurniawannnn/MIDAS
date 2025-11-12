-- =============================================
-- Instagram Scraper Data Storage Schema
-- Clean migration for production Supabase
-- =============================================

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

-- =============================================
-- 1. INSTAGRAM HASHTAGS TABLE
-- Store hashtag metadata and performance metrics
-- =============================================
CREATE TABLE IF NOT EXISTS public.instagram_hashtags (
    id BIGSERIAL PRIMARY KEY,
    hashtag_name TEXT NOT NULL UNIQUE,
    posts_count BIGINT DEFAULT 0,
    hashtag_url TEXT NOT NULL,
    search_query TEXT, -- Original search query that found this hashtag
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}', -- Additional hashtag metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for hashtags
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON public.instagram_hashtags(hashtag_name);
CREATE INDEX IF NOT EXISTS idx_hashtags_user_id ON public.instagram_hashtags(user_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_posts_count ON public.instagram_hashtags(posts_count);
CREATE INDEX IF NOT EXISTS idx_hashtags_created_at ON public.instagram_hashtags(created_at);

-- Enable RLS
ALTER TABLE public.instagram_hashtags ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. INSTAGRAM LOCATIONS TABLE
-- Store location data for geo-tagged posts
-- =============================================
CREATE TABLE IF NOT EXISTS public.instagram_locations (
    id BIGSERIAL PRIMARY KEY,
    location_id TEXT UNIQUE, -- Instagram location ID
    location_name TEXT NOT NULL,
    address TEXT,
    coordinates JSONB, -- Store lat/lng as JSON
    city TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for locations
CREATE INDEX IF NOT EXISTS idx_locations_location_id ON public.instagram_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.instagram_locations(location_name);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.instagram_locations(city);

-- =============================================
-- 3. INSTAGRAM MUSIC INFO TABLE
-- Store music/audio information for video posts
-- =============================================
CREATE TABLE IF NOT EXISTS public.instagram_music_info (
    id BIGSERIAL PRIMARY KEY,
    audio_id TEXT UNIQUE, -- Instagram audio ID
    artist_name TEXT,
    song_name TEXT,
    uses_original_audio BOOLEAN DEFAULT false,
    should_mute_audio BOOLEAN DEFAULT false,
    should_mute_audio_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for music info
CREATE INDEX IF NOT EXISTS idx_music_audio_id ON public.instagram_music_info(audio_id);
CREATE INDEX IF NOT EXISTS idx_music_artist ON public.instagram_music_info(artist_name);
CREATE INDEX IF NOT EXISTS idx_music_song ON public.instagram_music_info(song_name);

-- =============================================
-- 4. INSTAGRAM POSTS TABLE
-- Store individual post data with comprehensive metadata
-- =============================================
CREATE TABLE IF NOT EXISTS public.instagram_posts (
    id BIGSERIAL PRIMARY KEY,
    
    -- Instagram identifiers
    instagram_id TEXT NOT NULL UNIQUE, -- Instagram post ID
    short_code TEXT NOT NULL UNIQUE, -- Instagram short code (URL slug)
    post_url TEXT NOT NULL,
    input_url TEXT, -- Original input URL that found this post
    
    -- Content metadata
    post_type TEXT NOT NULL CHECK (post_type IN ('Image', 'Video', 'Sidecar', 'Reel')),
    caption TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Media information
    display_url TEXT, -- Main image/video thumbnail
    video_url TEXT, -- Video file URL (for videos)
    video_duration DECIMAL(10,3), -- Video duration in seconds
    dimensions_height INTEGER,
    dimensions_width INTEGER,
    images TEXT[], -- Array of image URLs for multi-image posts
    
    -- Engagement metrics
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    video_play_count INTEGER DEFAULT 0,
    ig_play_count INTEGER DEFAULT 0,
    reshare_count INTEGER DEFAULT 0,
    
    -- Owner information
    owner_id TEXT, -- Instagram user ID
    owner_username TEXT,
    owner_full_name TEXT,
    
    -- Location and music references
    location_id BIGINT REFERENCES public.instagram_locations(id) ON DELETE SET NULL,
    music_info_id BIGINT REFERENCES public.instagram_music_info(id) ON DELETE SET NULL,
    
    -- Business information
    is_sponsored BOOLEAN DEFAULT false,
    product_type TEXT, -- clips, posts, etc.
    
    -- Comments data
    first_comment TEXT,
    latest_comments JSONB DEFAULT '[]', -- Store latest comments as JSON array
    
    -- Search and user context
    hashtag_id BIGINT REFERENCES public.instagram_hashtags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Child posts for carousels
    child_posts JSONB DEFAULT '[]', -- Store child post data as JSON
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add comprehensive indexes for posts
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

-- Enable RLS
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. INSTAGRAM POST HASHTAGS TABLE
-- Junction table linking posts to hashtags (many-to-many)
-- =============================================
CREATE TABLE IF NOT EXISTS public.instagram_post_hashtags (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
    hashtag_name TEXT NOT NULL, -- Store hashtag name directly for performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for post hashtags junction
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON public.instagram_post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_name ON public.instagram_post_hashtags(hashtag_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_hashtags_unique ON public.instagram_post_hashtags(post_id, hashtag_name);

-- =============================================
-- 6. INSTAGRAM POST MENTIONS TABLE
-- Junction table linking posts to mentioned accounts
-- =============================================
CREATE TABLE IF NOT EXISTS public.instagram_post_mentions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
    mentioned_username TEXT NOT NULL, -- Instagram username mentioned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for post mentions junction
CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON public.instagram_post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_username ON public.instagram_post_mentions(mentioned_username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_mentions_unique ON public.instagram_post_mentions(post_id, mentioned_username);

-- =============================================
-- 7. INSTAGRAM SEARCH QUERIES TABLE
-- Track search queries and their results
-- =============================================
CREATE TABLE IF NOT EXISTS public.instagram_search_queries (
    id BIGSERIAL PRIMARY KEY,
    search_term TEXT NOT NULL,
    search_type TEXT NOT NULL CHECK (search_type IN ('hashtag', 'user', 'location')),
    results_count INTEGER DEFAULT 0,
    results_limit INTEGER DEFAULT 1,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    apify_run_id TEXT, -- Store Apify run ID for tracking
    search_metadata JSONB DEFAULT '{}', -- Store search parameters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for search queries
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON public.instagram_search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_search_term ON public.instagram_search_queries(search_term);
CREATE INDEX IF NOT EXISTS idx_search_queries_search_type ON public.instagram_search_queries(search_type);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON public.instagram_search_queries(created_at);

-- Enable RLS
ALTER TABLE public.instagram_search_queries ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

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

-- Location and music info are shared resources (no RLS needed)
-- Post hashtags and mentions inherit security from parent post

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Add updated_at triggers for tables that need them
CREATE TRIGGER update_instagram_hashtags_updated_at BEFORE UPDATE ON public.instagram_hashtags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_posts_updated_at BEFORE UPDATE ON public.instagram_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR ANALYTICS
-- =============================================

-- View for hashtag analytics
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

-- View for user post analytics
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

-- =============================================
-- FUNCTIONS FOR DATA INSERTION
-- =============================================

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