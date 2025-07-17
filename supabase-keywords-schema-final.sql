-- Keywords Management Schema for Orion App (FINAL VERSION)
-- Based on actual database structure from Supabase

-- First, create the missing Google Maps table
CREATE TABLE IF NOT EXISTS data_scraping_google_maps (
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
    User_Id TEXT,
    gmail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Keywords table for storing user keywords
CREATE TABLE IF NOT EXISTS keywords (
    id BIGSERIAL PRIMARY KEY,
    keyword TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    user_id TEXT NOT NULL,
    gmail TEXT NOT NULL
);

-- Keyword assignments to Instagram data
CREATE TABLE IF NOT EXISTS keyword_instagram_assignments (
    id BIGSERIAL PRIMARY KEY,
    keyword_id BIGINT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    instagram_id BIGINT NOT NULL REFERENCES data_scraping_instagram(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    user_id TEXT NOT NULL,
    gmail TEXT NOT NULL,
    UNIQUE(keyword_id, instagram_id)
);

-- Keyword assignments to Google Maps data
CREATE TABLE IF NOT EXISTS keyword_google_maps_assignments (
    id BIGSERIAL PRIMARY KEY,
    keyword_id BIGINT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    google_maps_id BIGINT NOT NULL REFERENCES data_scraping_google_maps(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    user_id TEXT NOT NULL,
    gmail TEXT NOT NULL,
    UNIQUE(keyword_id, google_maps_id)
);

-- Keyword scraping jobs for tracking automation
CREATE TABLE IF NOT EXISTS keyword_scraping_jobs (
    id BIGSERIAL PRIMARY KEY,
    keyword_id BIGINT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('instagram', 'google_maps')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    results_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    user_id TEXT NOT NULL,
    gmail TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_keywords_user_gmail ON keywords(user_id, gmail);
CREATE INDEX IF NOT EXISTS idx_keywords_status ON keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category);
CREATE INDEX IF NOT EXISTS idx_keywords_created_at ON keywords(created_at);

CREATE INDEX IF NOT EXISTS idx_keyword_instagram_assignments_user ON keyword_instagram_assignments(user_id, gmail);
CREATE INDEX IF NOT EXISTS idx_keyword_instagram_assignments_keyword ON keyword_instagram_assignments(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_instagram_assignments_instagram ON keyword_instagram_assignments(instagram_id);

CREATE INDEX IF NOT EXISTS idx_keyword_google_maps_assignments_user ON keyword_google_maps_assignments(user_id, gmail);
CREATE INDEX IF NOT EXISTS idx_keyword_google_maps_assignments_keyword ON keyword_google_maps_assignments(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_google_maps_assignments_google_maps ON keyword_google_maps_assignments(google_maps_id);

CREATE INDEX IF NOT EXISTS idx_keyword_scraping_jobs_user ON keyword_scraping_jobs(user_id, gmail);
CREATE INDEX IF NOT EXISTS idx_keyword_scraping_jobs_status ON keyword_scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_keyword_scraping_jobs_keyword ON keyword_scraping_jobs(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_scraping_jobs_created_at ON keyword_scraping_jobs(created_at);

-- Indexes for existing tables (if needed)
CREATE INDEX IF NOT EXISTS idx_data_scraping_instagram_gmail ON data_scraping_instagram(gmail);
CREATE INDEX IF NOT EXISTS idx_data_scraping_google_maps_gmail ON data_scraping_google_maps(gmail);

-- Enable Row Level Security (RLS)
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_instagram_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_google_maps_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_scraping_google_maps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for keywords table
CREATE POLICY "Users can view their own keywords" ON keywords
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own keywords" ON keywords
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own keywords" ON keywords
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own keywords" ON keywords
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for keyword_instagram_assignments table
CREATE POLICY "Users can view their own keyword instagram assignments" ON keyword_instagram_assignments
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own keyword instagram assignments" ON keyword_instagram_assignments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own keyword instagram assignments" ON keyword_instagram_assignments
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for keyword_google_maps_assignments table
CREATE POLICY "Users can view their own keyword google maps assignments" ON keyword_google_maps_assignments
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own keyword google maps assignments" ON keyword_google_maps_assignments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own keyword google maps assignments" ON keyword_google_maps_assignments
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for keyword_scraping_jobs table
CREATE POLICY "Users can view their own keyword scraping jobs" ON keyword_scraping_jobs
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own keyword scraping jobs" ON keyword_scraping_jobs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own keyword scraping jobs" ON keyword_scraping_jobs
    FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for data_scraping_google_maps table
CREATE POLICY "Users can view their own google maps data" ON data_scraping_google_maps
    FOR SELECT USING (auth.uid()::text = "User_Id");

CREATE POLICY "Users can insert their own google maps data" ON data_scraping_google_maps
    FOR INSERT WITH CHECK (auth.uid()::text = "User_Id");

CREATE POLICY "Users can update their own google maps data" ON data_scraping_google_maps
    FOR UPDATE USING (auth.uid()::text = "User_Id");

CREATE POLICY "Users can delete their own google maps data" ON data_scraping_google_maps
    FOR DELETE USING (auth.uid()::text = "User_Id");

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updating updated_at on keywords table
DROP TRIGGER IF EXISTS update_keywords_updated_at ON keywords;
CREATE TRIGGER update_keywords_updated_at 
    BEFORE UPDATE ON keywords
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Sample data for testing
-- INSERT INTO keywords (keyword, description, category, user_id, gmail) VALUES
-- ('fitness influencer', 'Fitness and wellness content creators', 'fitness', 'sample-user-id', 'test@gmail.com'),
-- ('food blogger', 'Food and recipe content creators', 'food', 'sample-user-id', 'test@gmail.com'),
-- ('travel vlogger', 'Travel and adventure content creators', 'travel', 'sample-user-id', 'test@gmail.com');

-- Success message
SELECT 'Keywords management schema created successfully!' as message;