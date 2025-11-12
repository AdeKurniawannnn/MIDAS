-- =============================================
-- Instagram Scraper Schema - Completion Script
-- Run this SQL to complete the migration with features 
-- that postgres-meta couldn't handle automatically
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

-- Create execute_sql function for future use
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

-- =============================================
-- ADD MISSING INDEXES
-- =============================================

-- Indexes for instagram_locations
CREATE INDEX IF NOT EXISTS idx_locations_location_id ON public.instagram_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.instagram_locations(location_name);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.instagram_locations(city);

-- Indexes for instagram_music_info
CREATE INDEX IF NOT EXISTS idx_music_audio_id ON public.instagram_music_info(audio_id);
CREATE INDEX IF NOT EXISTS idx_music_artist ON public.instagram_music_info(artist_name);
CREATE INDEX IF NOT EXISTS idx_music_song ON public.instagram_music_info(song_name);

-- Indexes for instagram_hashtags
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON public.instagram_hashtags(hashtag_name);
CREATE INDEX IF NOT EXISTS idx_hashtags_user_id ON public.instagram_hashtags(user_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_posts_count ON public.instagram_hashtags(posts_count);
CREATE INDEX IF NOT EXISTS idx_hashtags_created_at ON public.instagram_hashtags(created_at);

-- Indexes for instagram_posts (comprehensive)
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

-- Indexes for instagram_post_hashtags
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON public.instagram_post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_name ON public.instagram_post_hashtags(hashtag_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_hashtags_unique ON public.instagram_post_hashtags(post_id, hashtag_name);

-- Indexes for instagram_post_mentions
CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON public.instagram_post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_username ON public.instagram_post_mentions(mentioned_username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_mentions_unique ON public.instagram_post_mentions(post_id, mentioned_username);

-- Indexes for instagram_search_queries
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON public.instagram_search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_search_term ON public.instagram_search_queries(search_term);
CREATE INDEX IF NOT EXISTS idx_search_queries_search_type ON public.instagram_search_queries(search_type);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON public.instagram_search_queries(created_at);

-- =============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- =============================================

-- Foreign keys for instagram_posts
ALTER TABLE public.instagram_posts 
ADD CONSTRAINT IF NOT EXISTS fk_posts_location 
FOREIGN KEY (location_id) REFERENCES public.instagram_locations(id) ON DELETE SET NULL;

ALTER TABLE public.instagram_posts 
ADD CONSTRAINT IF NOT EXISTS fk_posts_music 
FOREIGN KEY (music_info_id) REFERENCES public.instagram_music_info(id) ON DELETE SET NULL;

ALTER TABLE public.instagram_posts 
ADD CONSTRAINT IF NOT EXISTS fk_posts_hashtag 
FOREIGN KEY (hashtag_id) REFERENCES public.instagram_hashtags(id) ON DELETE CASCADE;

ALTER TABLE public.instagram_posts 
ADD CONSTRAINT IF NOT EXISTS fk_posts_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Foreign keys for instagram_hashtags
ALTER TABLE public.instagram_hashtags 
ADD CONSTRAINT IF NOT EXISTS fk_hashtags_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Foreign keys for instagram_post_hashtags
ALTER TABLE public.instagram_post_hashtags 
ADD CONSTRAINT IF NOT EXISTS fk_post_hashtags_post 
FOREIGN KEY (post_id) REFERENCES public.instagram_posts(id) ON DELETE CASCADE;

-- Foreign keys for instagram_post_mentions
ALTER TABLE public.instagram_post_mentions 
ADD CONSTRAINT IF NOT EXISTS fk_post_mentions_post 
FOREIGN KEY (post_id) REFERENCES public.instagram_posts(id) ON DELETE CASCADE;

-- Foreign keys for instagram_search_queries
ALTER TABLE public.instagram_search_queries 
ADD CONSTRAINT IF NOT EXISTS fk_search_queries_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =============================================
-- ADD CHECK CONSTRAINTS
-- =============================================

-- Check constraints for instagram_posts
ALTER TABLE public.instagram_posts 
ADD CONSTRAINT IF NOT EXISTS check_post_type 
CHECK (post_type IN ('Image', 'Video', 'Sidecar', 'Reel'));

-- Check constraints for instagram_search_queries
ALTER TABLE public.instagram_search_queries 
ADD CONSTRAINT IF NOT EXISTS check_search_type 
CHECK (search_type IN ('hashtag', 'user', 'location'));

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Instagram hashtags policies
DROP POLICY IF EXISTS "Users can view their own hashtag data" ON public.instagram_hashtags;
CREATE POLICY "Users can view their own hashtag data" ON public.instagram_hashtags
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own hashtag data" ON public.instagram_hashtags;
CREATE POLICY "Users can insert their own hashtag data" ON public.instagram_hashtags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own hashtag data" ON public.instagram_hashtags;
CREATE POLICY "Users can update their own hashtag data" ON public.instagram_hashtags
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own hashtag data" ON public.instagram_hashtags;
CREATE POLICY "Users can delete their own hashtag data" ON public.instagram_hashtags
    FOR DELETE USING (auth.uid() = user_id);

-- Instagram posts policies
DROP POLICY IF EXISTS "Users can view their own post data" ON public.instagram_posts;
CREATE POLICY "Users can view their own post data" ON public.instagram_posts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own post data" ON public.instagram_posts;
CREATE POLICY "Users can insert their own post data" ON public.instagram_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own post data" ON public.instagram_posts;
CREATE POLICY "Users can update their own post data" ON public.instagram_posts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own post data" ON public.instagram_posts;
CREATE POLICY "Users can delete their own post data" ON public.instagram_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Instagram search queries policies
DROP POLICY IF EXISTS "Users can view their own search queries" ON public.instagram_search_queries;
CREATE POLICY "Users can view their own search queries" ON public.instagram_search_queries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own search queries" ON public.instagram_search_queries;
CREATE POLICY "Users can insert their own search queries" ON public.instagram_search_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Add updated_at triggers for tables that need them
DROP TRIGGER IF EXISTS update_instagram_hashtags_updated_at ON public.instagram_hashtags;
CREATE TRIGGER update_instagram_hashtags_updated_at BEFORE UPDATE ON public.instagram_hashtags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_instagram_posts_updated_at ON public.instagram_posts;
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

-- =============================================
-- VALIDATION QUERIES
-- =============================================

-- Check that all tables exist
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE tablename LIKE 'instagram_%' 
ORDER BY tablename;

-- Check that all indexes exist
SELECT 
    indexname, 
    tablename 
FROM pg_indexes 
WHERE tablename LIKE 'instagram_%' 
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('instagram_hashtags', 'instagram_posts', 'instagram_search_queries');

-- Check functions exist
SELECT 
    routine_name, 
    routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('execute_sql', 'update_updated_at_column', 'insert_instagram_hashtag_data') 
    AND routine_schema = 'public';

-- Check views exist
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name IN ('hashtag_analytics', 'user_post_analytics') 
    AND table_schema = 'public';

-- Final success message
SELECT 'Instagram Scraper Schema Migration Completed Successfully!' as status;