-- =============================================
-- Keywords Management Schema v2.0 - Core Tables
-- Migration 001: Modernized table structures with consistent naming
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update updated_at timestamp (improved version)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    NEW.updated_by = COALESCE(NEW.updated_by, auth.uid()::text);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 1. ENHANCED GOOGLE MAPS DATA TABLE
-- Store Google Maps scraping results with modern structure
-- =============================================
CREATE TABLE IF NOT EXISTS public.data_scraping_google_maps_v2 (
    id BIGSERIAL PRIMARY KEY,
    
    -- Input and identification
    input_url TEXT NOT NULL,
    place_name TEXT,
    address TEXT,
    phone_number TEXT,
    website TEXT,
    
    -- Rating and engagement metrics
    rating DECIMAL(3,2), -- Changed from TEXT to proper numeric type
    review_count INTEGER, -- Changed from TEXT to proper numeric type
    category TEXT,
    hours JSONB, -- Store hours as structured JSON
    description TEXT,
    coordinates JSONB, -- Store lat/lng as structured JSON
    image_url TEXT,
    price_range TEXT,
    
    -- User context (standardized naming)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail TEXT NOT NULL,
    
    -- Audit trail columns
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    updated_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Enhanced metadata
    metadata JSONB DEFAULT '{}',
    search_query TEXT, -- Original search query that found this place
    scraping_session_id UUID, -- Link multiple results from same session
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    CONSTRAINT valid_review_count CHECK (review_count IS NULL OR review_count >= 0)
);

-- Comment for documentation
COMMENT ON TABLE public.data_scraping_google_maps_v2 IS 'Enhanced Google Maps scraping data with structured fields and audit trail';
COMMENT ON COLUMN public.data_scraping_google_maps_v2.coordinates IS 'Structured JSON: {"lat": number, "lng": number}';
COMMENT ON COLUMN public.data_scraping_google_maps_v2.hours IS 'Structured JSON: {"monday": "9:00-17:00", ...}';
COMMENT ON COLUMN public.data_scraping_google_maps_v2.quality_score IS 'Data quality assessment: 1=poor, 5=excellent';

-- =============================================
-- 2. ENHANCED KEYWORDS TABLE
-- Core keywords management with modern features
-- =============================================
CREATE TABLE IF NOT EXISTS public.keywords_v2 (
    id BIGSERIAL PRIMARY KEY,
    
    -- Core keyword data
    keyword TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    
    -- Status and priority (enhanced constraints)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'pending')),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    
    -- User context (standardized naming)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail TEXT NOT NULL,
    
    -- Audit trail columns
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    updated_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Enhanced metadata and tracking
    metadata JSONB DEFAULT '{}',
    tags TEXT[], -- Array of tags for flexible categorization
    search_volume INTEGER, -- Monthly search volume if available
    competition_score DECIMAL(3,2), -- Competition analysis score (0-1)
    performance_metrics JSONB DEFAULT '{}', -- Store performance data
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Constraints
    CONSTRAINT keywords_v2_keyword_not_empty CHECK (length(trim(keyword)) > 0),
    CONSTRAINT keywords_v2_valid_competition CHECK (competition_score IS NULL OR (competition_score >= 0 AND competition_score <= 1)),
    CONSTRAINT keywords_v2_user_keyword_unique UNIQUE (user_id, keyword, deleted_at)
);

-- Comments for documentation
COMMENT ON TABLE public.keywords_v2 IS 'Enhanced keywords management with audit trail and performance tracking';
COMMENT ON COLUMN public.keywords_v2.tags IS 'Flexible tag system for keyword organization';
COMMENT ON COLUMN public.keywords_v2.performance_metrics IS 'JSON object storing performance data like CTR, conversions, etc.';
COMMENT ON COLUMN public.keywords_v2.competition_score IS 'Keyword competition analysis (0=low competition, 1=high competition)';

-- =============================================
-- 3. ENHANCED KEYWORD INSTAGRAM ASSIGNMENTS
-- Link keywords to Instagram data with tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.keyword_instagram_assignments_v2 (
    id BIGSERIAL PRIMARY KEY,
    
    -- Foreign key relationships
    keyword_id BIGINT NOT NULL REFERENCES public.keywords_v2(id) ON DELETE CASCADE,
    instagram_id BIGINT NOT NULL, -- References instagram data (to be created)
    
    -- Assignment metadata
    assignment_type TEXT DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'automatic', 'bulk')),
    confidence_score DECIMAL(3,2), -- How confident is this assignment (0-1)
    
    -- User context (standardized naming)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail TEXT NOT NULL,
    
    -- Audit trail columns
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    updated_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Enhanced metadata
    metadata JSONB DEFAULT '{}',
    assignment_notes TEXT, -- Optional notes about why this assignment was made
    
    -- Timestamps
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Constraints
    CONSTRAINT keyword_instagram_assignments_v2_unique UNIQUE (keyword_id, instagram_id, deleted_at),
    CONSTRAINT keyword_instagram_assignments_v2_valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

-- Comments for documentation
COMMENT ON TABLE public.keyword_instagram_assignments_v2 IS 'Enhanced keyword-Instagram assignments with confidence tracking';
COMMENT ON COLUMN public.keyword_instagram_assignments_v2.assignment_type IS 'How the assignment was created: manual, automatic, or bulk';
COMMENT ON COLUMN public.keyword_instagram_assignments_v2.confidence_score IS 'Confidence in assignment relevance (0=low, 1=high)';

-- =============================================
-- 4. ENHANCED KEYWORD GOOGLE MAPS ASSIGNMENTS
-- Link keywords to Google Maps data with tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.keyword_google_maps_assignments_v2 (
    id BIGSERIAL PRIMARY KEY,
    
    -- Foreign key relationships
    keyword_id BIGINT NOT NULL REFERENCES public.keywords_v2(id) ON DELETE CASCADE,
    google_maps_id BIGINT NOT NULL REFERENCES public.data_scraping_google_maps_v2(id) ON DELETE CASCADE,
    
    -- Assignment metadata
    assignment_type TEXT DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'automatic', 'bulk')),
    confidence_score DECIMAL(3,2), -- How confident is this assignment (0-1)
    relevance_score DECIMAL(3,2), -- How relevant is this place to the keyword (0-1)
    
    -- User context (standardized naming)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail TEXT NOT NULL,
    
    -- Audit trail columns
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    updated_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Enhanced metadata
    metadata JSONB DEFAULT '{}',
    assignment_notes TEXT,
    
    -- Timestamps
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Constraints
    CONSTRAINT keyword_google_maps_assignments_v2_unique UNIQUE (keyword_id, google_maps_id, deleted_at),
    CONSTRAINT keyword_google_maps_assignments_v2_valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
    CONSTRAINT keyword_google_maps_assignments_v2_valid_relevance CHECK (relevance_score IS NULL OR (relevance_score >= 0 AND relevance_score <= 1))
);

-- Comments for documentation
COMMENT ON TABLE public.keyword_google_maps_assignments_v2 IS 'Enhanced keyword-Google Maps assignments with relevance scoring';
COMMENT ON COLUMN public.keyword_google_maps_assignments_v2.relevance_score IS 'How relevant the place is to the keyword (0=not relevant, 1=highly relevant)';

-- =============================================
-- 5. ENHANCED KEYWORD SCRAPING JOBS
-- Track automation jobs with detailed status
-- =============================================
CREATE TABLE IF NOT EXISTS public.keyword_scraping_jobs_v2 (
    id BIGSERIAL PRIMARY KEY,
    
    -- Job configuration
    keyword_id BIGINT NOT NULL REFERENCES public.keywords_v2(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('instagram', 'google_maps', 'tiktok', 'youtube')),
    job_priority INTEGER DEFAULT 5 CHECK (job_priority >= 1 AND job_priority <= 10),
    
    -- Job status and tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'retry')),
    results_count INTEGER DEFAULT 0,
    expected_results INTEGER, -- How many results we expect to find
    
    -- Timing information
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- Estimated job duration in seconds
    actual_duration INTEGER, -- Actual job duration in seconds
    
    -- Error handling
    error_message TEXT,
    error_code TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Job configuration and results
    job_config JSONB DEFAULT '{}', -- Store job parameters
    job_results JSONB DEFAULT '{}', -- Store job results summary
    
    -- User context (standardized naming)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail TEXT NOT NULL,
    
    -- Audit trail columns
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    updated_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Enhanced metadata
    metadata JSONB DEFAULT '{}',
    external_job_id TEXT, -- ID from external scraping service
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Constraints
    CONSTRAINT keyword_scraping_jobs_v2_valid_duration CHECK (actual_duration IS NULL OR actual_duration >= 0),
    CONSTRAINT keyword_scraping_jobs_v2_valid_retry CHECK (retry_count <= max_retries)
);

-- Comments for documentation
COMMENT ON TABLE public.keyword_scraping_jobs_v2 IS 'Enhanced scraping job tracking with detailed status and error handling';
COMMENT ON COLUMN public.keyword_scraping_jobs_v2.job_priority IS 'Job priority: 1=highest, 10=lowest';
COMMENT ON COLUMN public.keyword_scraping_jobs_v2.job_config IS 'JSON configuration for the scraping job';
COMMENT ON COLUMN public.keyword_scraping_jobs_v2.job_results IS 'JSON summary of job results and statistics';

-- =============================================
-- 6. KEYWORD ANALYTICS SUMMARY TABLE
-- Pre-computed analytics for performance
-- =============================================
CREATE TABLE IF NOT EXISTS public.keyword_analytics_v2 (
    id BIGSERIAL PRIMARY KEY,
    
    -- Reference to keyword
    keyword_id BIGINT NOT NULL REFERENCES public.keywords_v2(id) ON DELETE CASCADE,
    
    -- Analytics period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    
    -- Instagram metrics
    instagram_posts_count INTEGER DEFAULT 0,
    instagram_avg_likes DECIMAL(10,2) DEFAULT 0,
    instagram_avg_comments DECIMAL(10,2) DEFAULT 0,
    instagram_total_engagement INTEGER DEFAULT 0,
    
    -- Google Maps metrics
    google_maps_places_count INTEGER DEFAULT 0,
    google_maps_avg_rating DECIMAL(3,2),
    google_maps_total_reviews INTEGER DEFAULT 0,
    
    -- Scraping job metrics
    total_jobs_run INTEGER DEFAULT 0,
    successful_jobs INTEGER DEFAULT 0,
    failed_jobs INTEGER DEFAULT 0,
    avg_job_duration DECIMAL(10,2), -- Average duration in seconds
    
    -- User context
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Audit trail
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    updated_by UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Constraints
    CONSTRAINT keyword_analytics_v2_valid_period CHECK (period_end >= period_start),
    CONSTRAINT keyword_analytics_v2_unique_period UNIQUE (keyword_id, period_start, period_end, period_type, deleted_at)
);

-- Comments for documentation
COMMENT ON TABLE public.keyword_analytics_v2 IS 'Pre-computed keyword analytics for dashboard performance';
COMMENT ON COLUMN public.keyword_analytics_v2.period_type IS 'Analytics aggregation period: daily, weekly, monthly, or quarterly';

-- =============================================
-- TRIGGERS FOR UPDATED_AT AUTOMATION
-- =============================================

-- Trigger for data_scraping_google_maps_v2
CREATE TRIGGER update_data_scraping_google_maps_v2_updated_at 
    BEFORE UPDATE ON public.data_scraping_google_maps_v2
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for keywords_v2
CREATE TRIGGER update_keywords_v2_updated_at 
    BEFORE UPDATE ON public.keywords_v2
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for keyword_instagram_assignments_v2
CREATE TRIGGER update_keyword_instagram_assignments_v2_updated_at 
    BEFORE UPDATE ON public.keyword_instagram_assignments_v2
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for keyword_google_maps_assignments_v2
CREATE TRIGGER update_keyword_google_maps_assignments_v2_updated_at 
    BEFORE UPDATE ON public.keyword_google_maps_assignments_v2
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for keyword_scraping_jobs_v2
CREATE TRIGGER update_keyword_scraping_jobs_v2_updated_at 
    BEFORE UPDATE ON public.keyword_scraping_jobs_v2
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for keyword_analytics_v2
CREATE TRIGGER update_keyword_analytics_v2_updated_at 
    BEFORE UPDATE ON public.keyword_analytics_v2
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Keywords Management Schema v2.0 - Core Tables Created Successfully!' as message;