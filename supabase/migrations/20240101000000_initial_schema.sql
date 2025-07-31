-- =============================================
-- MIDAS Marketing Agency Database Schema
-- Initial Migration - Combining all existing schemas
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. CONTACTS TABLE
-- Untuk menyimpan data kontak dari form
-- =============================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. GOOGLE MAPS SCRAPING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.data_scraping_google_maps (
    id BIGSERIAL PRIMARY KEY,
    inputUrl TEXT NOT NULL,
    placeName TEXT,
    address TEXT,
    phoneNumber TEXT,
    website TEXT,
    rating TEXT,
    reviewCount TEXT,
    category TEXT,
    hours TEXT,
    description TEXT,
    coordinates TEXT,
    imageUrl TEXT,
    priceRange TEXT,
    user_id TEXT,
    gmail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for Google Maps data
CREATE INDEX IF NOT EXISTS idx_google_maps_user_id ON public.data_scraping_google_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_google_maps_category ON public.data_scraping_google_maps(category);
CREATE INDEX IF NOT EXISTS idx_google_maps_created_at ON public.data_scraping_google_maps(created_at);

-- Enable RLS
ALTER TABLE public.data_scraping_google_maps ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. KEYWORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.keywords (
    id BIGSERIAL PRIMARY KEY,
    keyword TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[],
    search_volume INTEGER DEFAULT 0,
    difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 100),
    cpc DECIMAL(10,2) DEFAULT 0.00,
    competition TEXT DEFAULT 'unknown' CHECK (competition IN ('low', 'medium', 'high', 'unknown')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for keywords
CREATE INDEX IF NOT EXISTS idx_keywords_user_id ON public.keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_status ON public.keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON public.keywords(category);
CREATE INDEX IF NOT EXISTS idx_keywords_priority ON public.keywords(priority);
CREATE INDEX IF NOT EXISTS idx_keywords_assigned_to ON public.keywords(assigned_to);
CREATE INDEX IF NOT EXISTS idx_keywords_created_at ON public.keywords(created_at);

-- Enable RLS
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. KEYWORD ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.keyword_assignments (
    id BIGSERIAL PRIMARY KEY,
    keyword_id BIGINT REFERENCES public.keywords(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for assignments
CREATE INDEX IF NOT EXISTS idx_assignments_keyword_id ON public.keyword_assignments(keyword_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON public.keyword_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.keyword_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.keyword_assignments(due_date);

-- Enable RLS
ALTER TABLE public.keyword_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. INSTAGRAM DATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.data_scraping_instagram (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    full_name TEXT,
    bio TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    profile_pic_url TEXT,
    external_url TEXT,
    category TEXT,
    user_id TEXT,
    gmail TEXT,
    tags TEXT[],
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_likes INTEGER DEFAULT 0,
    avg_comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for Instagram data
CREATE INDEX IF NOT EXISTS idx_instagram_user_id ON public.data_scraping_instagram(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_username ON public.data_scraping_instagram(username);
CREATE INDEX IF NOT EXISTS idx_instagram_category ON public.data_scraping_instagram(category);
CREATE INDEX IF NOT EXISTS idx_instagram_followers ON public.data_scraping_instagram(followers_count);
CREATE INDEX IF NOT EXISTS idx_instagram_created_at ON public.data_scraping_instagram(created_at);

-- Enable RLS
ALTER TABLE public.data_scraping_instagram ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. KOL DATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.kol_data (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'facebook')),
    username TEXT NOT NULL,
    followers_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    category TEXT,
    location TEXT,
    contact_info JSONB,
    rates JSONB,
    collaboration_history JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for KOL data
CREATE INDEX IF NOT EXISTS idx_kol_user_id ON public.kol_data(user_id);
CREATE INDEX IF NOT EXISTS idx_kol_platform ON public.kol_data(platform);
CREATE INDEX IF NOT EXISTS idx_kol_category ON public.kol_data(category);
CREATE INDEX IF NOT EXISTS idx_kol_status ON public.kol_data(status);
CREATE INDEX IF NOT EXISTS idx_kol_followers ON public.kol_data(followers_count);

-- Enable RLS
ALTER TABLE public.kol_data ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. STATISTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.statistics (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for statistics
CREATE INDEX IF NOT EXISTS idx_stats_table_name ON public.statistics(table_name);
CREATE INDEX IF NOT EXISTS idx_stats_metric_name ON public.statistics(metric_name);
CREATE INDEX IF NOT EXISTS idx_stats_user_id ON public.statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_stats_period ON public.statistics(period_start, period_end);

-- Enable RLS
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Contacts policies (admin only)
CREATE POLICY "Enable read access for authenticated users" ON public.contacts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.contacts
    FOR INSERT WITH CHECK (true);

-- Keywords policies (user-specific)
CREATE POLICY "Users can view their own keywords" ON public.keywords
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords" ON public.keywords
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords" ON public.keywords
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords" ON public.keywords
    FOR DELETE USING (auth.uid() = user_id);

-- Keyword assignments policies
CREATE POLICY "Users can view assignments assigned to them" ON public.keyword_assignments
    FOR SELECT USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

CREATE POLICY "Users can create assignments for their keywords" ON public.keyword_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.keywords 
            WHERE id = keyword_id AND user_id = auth.uid()
        )
    );

-- Google Maps data policies
CREATE POLICY "Users can view their own scraping data" ON public.data_scraping_google_maps
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own scraping data" ON public.data_scraping_google_maps
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Instagram data policies
CREATE POLICY "Users can view their own instagram data" ON public.data_scraping_instagram
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own instagram data" ON public.data_scraping_instagram
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- KOL data policies
CREATE POLICY "Users can manage their own KOL data" ON public.kol_data
    FOR ALL USING (auth.uid() = user_id);

-- Statistics policies
CREATE POLICY "Users can view their own statistics" ON public.statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statistics" ON public.statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON public.keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.keyword_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_updated_at BEFORE UPDATE ON public.data_scraping_instagram
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kol_updated_at BEFORE UPDATE ON public.kol_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();