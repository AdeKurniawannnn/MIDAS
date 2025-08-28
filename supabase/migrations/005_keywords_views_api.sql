-- =============================================
-- Keywords Management Schema v2.0 - Views and API Optimization
-- Migration 005: API-optimized views and materialized views
-- =============================================

-- =============================================
-- BASIC VIEWS FOR API CONSUMPTION
-- Simplified views for common frontend queries
-- =============================================

-- Keywords list view with essential information
CREATE OR REPLACE VIEW public.keywords_list_view AS
SELECT 
    k.id,
    k.keyword,
    k.description,
    k.category,
    k.status,
    k.priority,
    k.user_id,
    k.tags,
    k.search_volume,
    k.competition_score,
    k.performance_metrics,
    k.created_at,
    k.updated_at,
    -- Computed fields
    CASE 
        WHEN k.performance_metrics->>'ctr' IS NOT NULL 
        THEN (k.performance_metrics->>'ctr')::DECIMAL 
        ELSE NULL 
    END as ctr,
    -- Assignment counts
    (SELECT COUNT(*) FROM public.keyword_instagram_assignments_v2 kia 
     WHERE kia.keyword_id = k.id AND kia.deleted_at IS NULL) as instagram_assignments_count,
    (SELECT COUNT(*) FROM public.keyword_google_maps_assignments_v2 kgma 
     WHERE kgma.keyword_id = k.id AND kgma.deleted_at IS NULL) as google_maps_assignments_count,
    -- Job statistics
    (SELECT COUNT(*) FROM public.keyword_scraping_jobs_v2 ksj 
     WHERE ksj.keyword_id = k.id AND ksj.deleted_at IS NULL) as total_jobs,
    (SELECT COUNT(*) FROM public.keyword_scraping_jobs_v2 ksj 
     WHERE ksj.keyword_id = k.id AND ksj.status = 'completed' AND ksj.deleted_at IS NULL) as completed_jobs
FROM public.keywords_v2 k
WHERE k.deleted_at IS NULL;

-- Keyword details view with comprehensive information
CREATE OR REPLACE VIEW public.keyword_details_view AS
SELECT 
    k.*,
    -- Latest analytics (most recent period)
    ka.instagram_total_engagement as latest_instagram_engagement,
    ka.google_maps_places_count as latest_google_maps_count,
    ka.google_maps_avg_rating as latest_avg_rating,
    ka.total_jobs_run as latest_total_jobs,
    ka.period_start as latest_analytics_date,
    -- Creator and updater information
    cu.email as created_by_email,
    uu.email as updated_by_email
FROM public.keywords_v2 k
LEFT JOIN public.keyword_analytics_v2 ka ON ka.keyword_id = k.id 
    AND ka.period_start = (
        SELECT MAX(period_start) 
        FROM public.keyword_analytics_v2 ka2 
        WHERE ka2.keyword_id = k.id AND ka2.deleted_at IS NULL
    )
    AND ka.deleted_at IS NULL
LEFT JOIN auth.users cu ON cu.id = k.created_by
LEFT JOIN auth.users uu ON uu.id = k.updated_by
WHERE k.deleted_at IS NULL;

-- =============================================
-- ASSIGNMENT VIEWS
-- Comprehensive assignment information
-- =============================================

-- Instagram assignments with keyword details
CREATE OR REPLACE VIEW public.instagram_assignments_view AS
SELECT 
    kia.id,
    kia.keyword_id,
    kia.instagram_id,
    kia.assignment_type,
    kia.confidence_score,
    kia.user_id,
    kia.assigned_at,
    kia.assignment_notes,
    -- Keyword information
    k.keyword,
    k.category as keyword_category,
    k.priority as keyword_priority,
    -- Assignment metadata
    kia.metadata as assignment_metadata
FROM public.keyword_instagram_assignments_v2 kia
JOIN public.keywords_v2 k ON k.id = kia.keyword_id
WHERE kia.deleted_at IS NULL 
AND k.deleted_at IS NULL;

-- Google Maps assignments with place details
CREATE OR REPLACE VIEW public.google_maps_assignments_view AS
SELECT 
    kgma.id,
    kgma.keyword_id,
    kgma.google_maps_id,
    kgma.assignment_type,
    kgma.confidence_score,
    kgma.relevance_score,
    kgma.user_id,
    kgma.assigned_at,
    kgma.assignment_notes,
    -- Keyword information
    k.keyword,
    k.category as keyword_category,
    k.priority as keyword_priority,
    -- Google Maps place information
    gm.place_name,
    gm.address,
    gm.rating,
    gm.review_count,
    gm.category as place_category,
    gm.coordinates,
    gm.quality_score
FROM public.keyword_google_maps_assignments_v2 kgma
JOIN public.keywords_v2 k ON k.id = kgma.keyword_id
JOIN public.data_scraping_google_maps_v2 gm ON gm.id = kgma.google_maps_id
WHERE kgma.deleted_at IS NULL 
AND k.deleted_at IS NULL 
AND gm.deleted_at IS NULL;

-- =============================================
-- JOB MONITORING VIEWS
-- Scraping job status and performance
-- =============================================

-- Job queue view for monitoring
CREATE OR REPLACE VIEW public.job_queue_view AS
SELECT 
    ksj.id,
    ksj.keyword_id,
    ksj.job_type,
    ksj.status,
    ksj.job_priority,
    ksj.created_at,
    ksj.started_at,
    ksj.estimated_duration,
    ksj.user_id,
    -- Keyword information
    k.keyword,
    k.category as keyword_category,
    -- Queue position (for pending jobs)
    CASE 
        WHEN ksj.status = 'pending' THEN
            ROW_NUMBER() OVER (ORDER BY ksj.job_priority DESC, ksj.created_at ASC)
        ELSE NULL
    END as queue_position,
    -- Runtime information
    CASE 
        WHEN ksj.status = 'running' AND ksj.started_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - ksj.started_at))::INTEGER
        ELSE NULL
    END as current_runtime_seconds
FROM public.keyword_scraping_jobs_v2 ksj
JOIN public.keywords_v2 k ON k.id = ksj.keyword_id
WHERE ksj.deleted_at IS NULL 
AND k.deleted_at IS NULL
ORDER BY 
    CASE ksj.status 
        WHEN 'running' THEN 1
        WHEN 'queued' THEN 2
        WHEN 'pending' THEN 3
        ELSE 4
    END,
    ksj.job_priority DESC,
    ksj.created_at ASC;

-- Job history view with performance metrics
CREATE OR REPLACE VIEW public.job_history_view AS
SELECT 
    ksj.id,
    ksj.keyword_id,
    ksj.job_type,
    ksj.status,
    ksj.results_count,
    ksj.actual_duration,
    ksj.error_message,
    ksj.created_at,
    ksj.completed_at,
    ksj.user_id,
    -- Keyword information
    k.keyword,
    k.category as keyword_category,
    -- Performance metrics
    CASE 
        WHEN ksj.actual_duration IS NOT NULL AND ksj.results_count > 0 THEN
            ksj.results_count::DECIMAL / (ksj.actual_duration / 60.0) -- Results per minute
        ELSE NULL
    END as results_per_minute,
    -- Success indicator
    CASE 
        WHEN ksj.status = 'completed' AND ksj.results_count > 0 THEN true
        ELSE false
    END as is_successful
FROM public.keyword_scraping_jobs_v2 ksj
JOIN public.keywords_v2 k ON k.id = ksj.keyword_id
WHERE ksj.deleted_at IS NULL 
AND k.deleted_at IS NULL
AND ksj.status IN ('completed', 'failed', 'cancelled')
ORDER BY ksj.completed_at DESC;

-- =============================================
-- ANALYTICS VIEWS
-- Performance and reporting views
-- =============================================

-- Keyword performance summary view
CREATE OR REPLACE VIEW public.keyword_performance_view AS
SELECT 
    k.id,
    k.keyword,
    k.category,
    k.priority,
    k.search_volume,
    k.competition_score,
    k.user_id,
    -- Latest period analytics
    ka.instagram_total_engagement,
    ka.google_maps_places_count,
    ka.google_maps_avg_rating,
    ka.successful_jobs,
    ka.total_jobs_run,
    CASE 
        WHEN ka.total_jobs_run > 0 THEN 
            (ka.successful_jobs::DECIMAL / ka.total_jobs_run * 100)
        ELSE NULL
    END as job_success_rate,
    ka.period_start as analytics_date,
    -- Performance score calculation
    COALESCE(
        (COALESCE(ka.instagram_total_engagement, 0) * 0.4) +
        (COALESCE(ka.google_maps_places_count, 0) * 0.3) +
        ((CASE WHEN ka.total_jobs_run > 0 THEN ka.successful_jobs::DECIMAL / ka.total_jobs_run * 100 ELSE 0 END) * 0.3),
        0
    ) as performance_score
FROM public.keywords_v2 k
LEFT JOIN public.keyword_analytics_v2 ka ON ka.keyword_id = k.id 
    AND ka.period_start = (
        SELECT MAX(period_start) 
        FROM public.keyword_analytics_v2 ka2 
        WHERE ka2.keyword_id = k.id AND ka2.deleted_at IS NULL
    )
    AND ka.deleted_at IS NULL
WHERE k.deleted_at IS NULL;

-- User dashboard summary view
CREATE OR REPLACE VIEW public.user_dashboard_view AS
SELECT 
    u.id as user_id,
    u.email,
    -- Keyword statistics
    COUNT(k.id) as total_keywords,
    COUNT(CASE WHEN k.status = 'active' THEN 1 END) as active_keywords,
    COUNT(CASE WHEN k.status = 'archived' THEN 1 END) as archived_keywords,
    -- Assignment statistics
    COUNT(kia.id) as total_instagram_assignments,
    COUNT(kgma.id) as total_google_maps_assignments,
    -- Job statistics
    COUNT(ksj.id) as total_jobs,
    COUNT(CASE WHEN ksj.status = 'completed' THEN 1 END) as completed_jobs,
    COUNT(CASE WHEN ksj.status = 'failed' THEN 1 END) as failed_jobs,
    COUNT(CASE WHEN ksj.status IN ('pending', 'queued', 'running') THEN 1 END) as active_jobs,
    -- Performance metrics
    AVG(CASE WHEN ka.total_jobs_run > 0 THEN ka.successful_jobs::DECIMAL / ka.total_jobs_run ELSE NULL END) as avg_job_success_rate,
    SUM(ka.instagram_total_engagement) as total_instagram_engagement,
    SUM(ka.google_maps_places_count) as total_google_maps_places
FROM auth.users u
LEFT JOIN public.keywords_v2 k ON k.user_id = u.id AND k.deleted_at IS NULL
LEFT JOIN public.keyword_instagram_assignments_v2 kia ON kia.user_id = u.id AND kia.deleted_at IS NULL
LEFT JOIN public.keyword_google_maps_assignments_v2 kgma ON kgma.user_id = u.id AND kgma.deleted_at IS NULL
LEFT JOIN public.keyword_scraping_jobs_v2 ksj ON ksj.user_id = u.id AND ksj.deleted_at IS NULL
LEFT JOIN public.keyword_analytics_v2 ka ON ka.user_id = u.id AND ka.deleted_at IS NULL
    AND ka.period_start >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.email;

-- =============================================
-- MATERIALIZED VIEWS FOR HIGH PERFORMANCE
-- Pre-computed views for intensive queries
-- =============================================

-- Materialized view for trending keywords (computationally expensive)
CREATE MATERIALIZED VIEW public.trending_keywords_mv AS
SELECT 
    k.id,
    k.keyword,
    k.category,
    k.search_volume,
    k.user_id,
    -- Trend calculation (comparing last 7 days vs previous 7 days)
    COALESCE(recent.total_engagement, 0) as recent_engagement,
    COALESCE(previous.total_engagement, 0) as previous_engagement,
    CASE 
        WHEN previous.total_engagement > 0 THEN
            ((recent.total_engagement - previous.total_engagement)::DECIMAL / previous.total_engagement * 100)
        WHEN recent.total_engagement > 0 THEN 100
        ELSE 0
    END as engagement_trend_percent,
    -- Job success trend
    COALESCE(recent.successful_jobs, 0) as recent_successful_jobs,
    COALESCE(previous.successful_jobs, 0) as previous_successful_jobs,
    -- Combined trend score
    CASE 
        WHEN previous.total_engagement > 0 AND previous.successful_jobs > 0 THEN
            (((recent.total_engagement - previous.total_engagement)::DECIMAL / previous.total_engagement) * 0.7) +
            (((recent.successful_jobs - previous.successful_jobs)::DECIMAL / previous.successful_jobs) * 0.3)
        ELSE 0
    END as trend_score,
    timezone('utc'::text, now()) as computed_at
FROM public.keywords_v2 k
LEFT JOIN (
    -- Recent period (last 7 days)
    SELECT 
        keyword_id,
        SUM(instagram_total_engagement) as total_engagement,
        SUM(successful_jobs) as successful_jobs
    FROM public.keyword_analytics_v2
    WHERE period_start >= CURRENT_DATE - INTERVAL '7 days'
    AND deleted_at IS NULL
    GROUP BY keyword_id
) recent ON recent.keyword_id = k.id
LEFT JOIN (
    -- Previous period (8-14 days ago)
    SELECT 
        keyword_id,
        SUM(instagram_total_engagement) as total_engagement,
        SUM(successful_jobs) as successful_jobs
    FROM public.keyword_analytics_v2
    WHERE period_start >= CURRENT_DATE - INTERVAL '14 days'
    AND period_start < CURRENT_DATE - INTERVAL '7 days'
    AND deleted_at IS NULL
    GROUP BY keyword_id
) previous ON previous.keyword_id = k.id
WHERE k.deleted_at IS NULL
AND k.status = 'active'
ORDER BY trend_score DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_trending_keywords_mv_id ON public.trending_keywords_mv (id);

-- Materialized view for category performance analysis
CREATE MATERIALIZED VIEW public.category_performance_mv AS
SELECT 
    k.category,
    k.user_id,
    COUNT(k.id) as total_keywords,
    AVG(k.search_volume) as avg_search_volume,
    AVG(k.competition_score) as avg_competition,
    -- Analytics aggregation
    SUM(ka.instagram_total_engagement) as total_instagram_engagement,
    AVG(ka.google_maps_avg_rating) as avg_google_maps_rating,
    SUM(ka.google_maps_places_count) as total_google_maps_places,
    SUM(ka.total_jobs_run) as total_jobs,
    SUM(ka.successful_jobs) as successful_jobs,
    -- Performance metrics
    CASE 
        WHEN SUM(ka.total_jobs_run) > 0 THEN
            (SUM(ka.successful_jobs)::DECIMAL / SUM(ka.total_jobs_run) * 100)
        ELSE NULL
    END as success_rate,
    -- Category performance score
    (
        COALESCE(AVG(k.search_volume), 0) * 0.3 +
        (2 - COALESCE(AVG(k.competition_score), 1)) * 50 * 0.2 +
        COALESCE(SUM(ka.instagram_total_engagement), 0) * 0.001 * 0.3 +
        COALESCE(
            CASE WHEN SUM(ka.total_jobs_run) > 0 THEN SUM(ka.successful_jobs)::DECIMAL / SUM(ka.total_jobs_run) * 100 ELSE 0 END,
            0
        ) * 0.2
    ) as performance_score,
    timezone('utc'::text, now()) as computed_at
FROM public.keywords_v2 k
LEFT JOIN public.keyword_analytics_v2 ka ON ka.keyword_id = k.id 
    AND ka.period_start >= CURRENT_DATE - INTERVAL '30 days'
    AND ka.deleted_at IS NULL
WHERE k.deleted_at IS NULL
GROUP BY k.category, k.user_id
ORDER BY performance_score DESC;

-- Create index on materialized view
CREATE INDEX idx_category_performance_mv_user_category ON public.category_performance_mv (user_id, category);

-- =============================================
-- MATERIALIZED VIEW REFRESH FUNCTIONS
-- Automated refresh management
-- =============================================

-- Function to refresh trending keywords materialized view
CREATE OR REPLACE FUNCTION refresh_trending_keywords()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.trending_keywords_mv;
    
    -- Log the refresh
    PERFORM log_security_event(
        'materialized_view_refreshed',
        NULL,
        'trending_keywords_mv',
        NULL,
        jsonb_build_object('refreshed_at', timezone('utc'::text, now()))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh category performance materialized view
CREATE OR REPLACE FUNCTION refresh_category_performance()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.category_performance_mv;
    
    -- Log the refresh
    PERFORM log_security_event(
        'materialized_view_refreshed',
        NULL,
        'category_performance_mv',
        NULL,
        jsonb_build_object('refreshed_at', timezone('utc'::text, now()))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TABLE (
    view_name TEXT,
    refresh_status TEXT,
    refresh_time INTERVAL
) AS $$
DECLARE
    start_time TIMESTAMP;
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT matviewname as name 
        FROM pg_matviews 
        WHERE schemaname = 'public'
        AND matviewname LIKE '%keywords%' OR matviewname LIKE '%category%'
    LOOP
        start_time := clock_timestamp();
        
        BEGIN
            EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.' || view_record.name;
            
            RETURN QUERY SELECT 
                view_record.name,
                'SUCCESS'::TEXT,
                clock_timestamp() - start_time;
                
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                view_record.name,
                'FAILED: ' || SQLERRM,
                clock_timestamp() - start_time;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- API OPTIMIZATION FUNCTIONS
-- Functions for frontend API performance
-- =============================================

-- Function to get paginated keywords with filtering
CREATE OR REPLACE FUNCTION get_keywords_paginated(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_status TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'created_at',
    p_sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
    id BIGINT,
    keyword TEXT,
    description TEXT,
    category TEXT,
    status TEXT,
    priority INTEGER,
    search_volume INTEGER,
    competition_score DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
) AS $$
DECLARE
    sort_clause TEXT;
    where_clause TEXT := 'WHERE k.user_id = $1 AND k.deleted_at IS NULL';
    query_text TEXT;
BEGIN
    -- Build WHERE clause
    IF p_status IS NOT NULL THEN
        where_clause := where_clause || ' AND k.status = $' || (array_length(regexp_split_to_array(where_clause, '\$'), 1) + 1);
    END IF;
    
    IF p_category IS NOT NULL THEN
        where_clause := where_clause || ' AND k.category = $' || (array_length(regexp_split_to_array(where_clause, '\$'), 1) + 1);
    END IF;
    
    IF p_search IS NOT NULL THEN
        where_clause := where_clause || ' AND (k.keyword ILIKE $' || (array_length(regexp_split_to_array(where_clause, '\$'), 1) + 1) || ' OR k.description ILIKE $' || (array_length(regexp_split_to_array(where_clause, '\$'), 1) + 1) || ')';
    END IF;
    
    -- Build ORDER BY clause
    sort_clause := 'ORDER BY k.' || p_sort_by || ' ' || p_sort_order;
    
    -- Execute query (simplified version - in production, use dynamic SQL properly)
    RETURN QUERY
    SELECT 
        k.id,
        k.keyword,
        k.description,
        k.category,
        k.status,
        k.priority,
        k.search_volume,
        k.competition_score,
        k.created_at,
        COUNT(*) OVER() as total_count
    FROM public.keywords_v2 k
    WHERE k.user_id = p_user_id 
    AND k.deleted_at IS NULL
    AND (p_status IS NULL OR k.status = p_status)
    AND (p_category IS NULL OR k.category = p_category)
    AND (p_search IS NULL OR k.keyword ILIKE '%' || p_search || '%' OR k.description ILIKE '%' || p_search || '%')
    ORDER BY 
        CASE WHEN p_sort_by = 'keyword' AND p_sort_order = 'ASC' THEN k.keyword END ASC,
        CASE WHEN p_sort_by = 'keyword' AND p_sort_order = 'DESC' THEN k.keyword END DESC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' THEN k.created_at END ASC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' THEN k.created_at END DESC,
        CASE WHEN p_sort_by = 'priority' AND p_sort_order = 'ASC' THEN k.priority END ASC,
        CASE WHEN p_sort_by = 'priority' AND p_sort_order = 'DESC' THEN k.priority END DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VIEW PERMISSIONS AND SECURITY
-- RLS policies for views
-- =============================================

-- Enable RLS on materialized views (they inherit from base tables but need explicit policies)
ALTER MATERIALIZED VIEW public.trending_keywords_mv ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW public.category_performance_mv ENABLE ROW LEVEL SECURITY;

-- RLS policies for materialized views
CREATE POLICY "trending_keywords_mv_user_access" ON public.trending_keywords_mv
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "category_performance_mv_user_access" ON public.category_performance_mv
    FOR SELECT USING (user_id = auth.uid());

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON VIEW public.keywords_list_view IS 'Optimized view for keywords list display with assignment counts';
COMMENT ON VIEW public.keyword_details_view IS 'Comprehensive keyword details with latest analytics';
COMMENT ON VIEW public.instagram_assignments_view IS 'Instagram assignments with keyword context';
COMMENT ON VIEW public.google_maps_assignments_view IS 'Google Maps assignments with place details';
COMMENT ON VIEW public.job_queue_view IS 'Real-time job queue monitoring with queue positions';
COMMENT ON VIEW public.job_history_view IS 'Job history with performance metrics';
COMMENT ON VIEW public.keyword_performance_view IS 'Keyword performance summary with calculated scores';
COMMENT ON VIEW public.user_dashboard_view IS 'User dashboard statistics and summaries';

COMMENT ON MATERIALIZED VIEW public.trending_keywords_mv IS 'Pre-computed trending keywords analysis - refresh every 4 hours';
COMMENT ON MATERIALIZED VIEW public.category_performance_mv IS 'Pre-computed category performance metrics - refresh daily';

COMMENT ON FUNCTION refresh_trending_keywords() IS 'Refresh trending keywords materialized view';
COMMENT ON FUNCTION refresh_category_performance() IS 'Refresh category performance materialized view';
COMMENT ON FUNCTION refresh_all_materialized_views() IS 'Refresh all keywords-related materialized views';
COMMENT ON FUNCTION get_keywords_paginated(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Get paginated keywords with filtering and sorting';

-- =============================================
-- SUCCESS MESSAGE AND REFRESH RECOMMENDATIONS
-- =============================================
SELECT 'Keywords Management Schema v2.0 - Views and API Optimization Created Successfully!' as message,
       'API Features Implemented:' as note1,
       '- Optimized views for all common frontend queries' as feature1,
       '- Materialized views for expensive analytics operations' as feature2,
       '- Paginated API functions with filtering and sorting' as feature3,
       '- Real-time job queue monitoring views' as feature4,
       '- Performance-optimized dashboard views' as feature5,
       '- Automated materialized view refresh functions' as feature6,
       'Recommended Refresh Schedule:' as note2,
       '- trending_keywords_mv: Every 4 hours' as schedule1,
       '- category_performance_mv: Daily at 3 AM' as schedule2;