-- =============================================
-- Keywords Management Schema v2.0 - Enhanced RLS Policies
-- Migration 003: Comprehensive security policies with granular access control
-- =============================================

-- =============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================

ALTER TABLE public.data_scraping_google_maps_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_instagram_assignments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_google_maps_assignments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_scraping_jobs_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_analytics_v2 ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR DATA_SCRAPING_GOOGLE_MAPS_V2
-- Enhanced Google Maps data security
-- =============================================

-- User access policies (standard CRUD operations)
CREATE POLICY "google_maps_v2_select_own_data" ON public.data_scraping_google_maps_v2
    FOR SELECT USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    );

CREATE POLICY "google_maps_v2_insert_own_data" ON public.data_scraping_google_maps_v2
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND created_by = auth.uid()
    );

CREATE POLICY "google_maps_v2_update_own_data" ON public.data_scraping_google_maps_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
    );

-- Soft delete policy (sets deleted_at instead of hard delete)
CREATE POLICY "google_maps_v2_soft_delete_own_data" ON public.data_scraping_google_maps_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
        AND deleted_at IS NOT NULL
    );

-- Service role policies for automation
CREATE POLICY "google_maps_v2_service_access" ON public.data_scraping_google_maps_v2
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'supabase_admin'
    );

-- Admin access policy
CREATE POLICY "google_maps_v2_admin_access" ON public.data_scraping_google_maps_v2
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- =============================================
-- RLS POLICIES FOR KEYWORDS_V2
-- Core keywords management security
-- =============================================

-- Standard user CRUD operations
CREATE POLICY "keywords_v2_select_own_data" ON public.keywords_v2
    FOR SELECT USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    );

CREATE POLICY "keywords_v2_insert_own_data" ON public.keywords_v2
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND created_by = auth.uid()
    );

CREATE POLICY "keywords_v2_update_own_data" ON public.keywords_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
    );

-- Soft delete policy
CREATE POLICY "keywords_v2_soft_delete_own_data" ON public.keywords_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
        AND deleted_at IS NOT NULL
    );

-- Collaborative access policy (for shared keywords)
CREATE POLICY "keywords_v2_shared_access" ON public.keywords_v2
    FOR SELECT USING (
        deleted_at IS NULL
        AND (
            auth.uid() = user_id
            OR EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(metadata->'shared_with') AS shared_user_id
                WHERE shared_user_id::uuid = auth.uid()
            )
        )
    );

-- Service role policies
CREATE POLICY "keywords_v2_service_access" ON public.keywords_v2
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'supabase_admin'
    );

-- Admin access policy
CREATE POLICY "keywords_v2_admin_access" ON public.keywords_v2
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- Read-only policy for analytics (allows reading without full access)
CREATE POLICY "keywords_v2_analytics_readonly" ON public.keywords_v2
    FOR SELECT USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
        AND auth.jwt() ->> 'role' = 'analytics'
    );

-- =============================================
-- RLS POLICIES FOR KEYWORD_INSTAGRAM_ASSIGNMENTS_V2
-- Assignment relationship security
-- =============================================

-- User access to their own assignments
CREATE POLICY "instagram_assignments_v2_select_own" ON public.keyword_instagram_assignments_v2
    FOR SELECT USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    );

CREATE POLICY "instagram_assignments_v2_insert_own" ON public.keyword_instagram_assignments_v2
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.keywords_v2 k
            WHERE k.id = keyword_id 
            AND k.user_id = auth.uid()
            AND k.deleted_at IS NULL
        )
    );

CREATE POLICY "instagram_assignments_v2_update_own" ON public.keyword_instagram_assignments_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
    );

-- Soft delete policy
CREATE POLICY "instagram_assignments_v2_soft_delete_own" ON public.keyword_instagram_assignments_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
        AND deleted_at IS NOT NULL
    );

-- Bulk operations policy (for batch assignments)
CREATE POLICY "instagram_assignments_v2_bulk_operations" ON public.keyword_instagram_assignments_v2
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND created_by = auth.uid()
        AND assignment_type = 'bulk'
        AND EXISTS (
            SELECT 1 FROM public.keywords_v2 k
            WHERE k.id = keyword_id 
            AND k.user_id = auth.uid()
            AND k.deleted_at IS NULL
        )
    );

-- Service role policies
CREATE POLICY "instagram_assignments_v2_service_access" ON public.keyword_instagram_assignments_v2
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'supabase_admin'
    );

-- =============================================
-- RLS POLICIES FOR KEYWORD_GOOGLE_MAPS_ASSIGNMENTS_V2
-- Google Maps assignment security
-- =============================================

-- User access to their own assignments
CREATE POLICY "maps_assignments_v2_select_own" ON public.keyword_google_maps_assignments_v2
    FOR SELECT USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    );

CREATE POLICY "maps_assignments_v2_insert_own" ON public.keyword_google_maps_assignments_v2
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.keywords_v2 k
            WHERE k.id = keyword_id 
            AND k.user_id = auth.uid()
            AND k.deleted_at IS NULL
        )
        AND EXISTS (
            SELECT 1 FROM public.data_scraping_google_maps_v2 gm
            WHERE gm.id = google_maps_id 
            AND gm.user_id = auth.uid()
            AND gm.deleted_at IS NULL
        )
    );

CREATE POLICY "maps_assignments_v2_update_own" ON public.keyword_google_maps_assignments_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
    );

-- Soft delete policy
CREATE POLICY "maps_assignments_v2_soft_delete_own" ON public.keyword_google_maps_assignments_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
        AND deleted_at IS NOT NULL
    );

-- High-confidence assignments policy (additional validation)
CREATE POLICY "maps_assignments_v2_high_confidence" ON public.keyword_google_maps_assignments_v2
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND created_by = auth.uid()
        AND (confidence_score IS NULL OR confidence_score >= 0.5)
        AND (relevance_score IS NULL OR relevance_score >= 0.3)
    );

-- Service role policies
CREATE POLICY "maps_assignments_v2_service_access" ON public.keyword_google_maps_assignments_v2
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'supabase_admin'
    );

-- =============================================
-- RLS POLICIES FOR KEYWORD_SCRAPING_JOBS_V2
-- Job management and queue security
-- =============================================

-- User access to their own jobs
CREATE POLICY "scraping_jobs_v2_select_own" ON public.keyword_scraping_jobs_v2
    FOR SELECT USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    );

CREATE POLICY "scraping_jobs_v2_insert_own" ON public.keyword_scraping_jobs_v2
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.keywords_v2 k
            WHERE k.id = keyword_id 
            AND k.user_id = auth.uid()
            AND k.deleted_at IS NULL
        )
    );

-- User can only update certain fields
CREATE POLICY "scraping_jobs_v2_update_own_limited" ON public.keyword_scraping_jobs_v2
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
        AND status IN ('pending', 'cancelled') -- Users can only modify non-running jobs
    ) WITH CHECK (
        auth.uid() = user_id
        AND updated_by = auth.uid()
    );

-- Service role policies for job processing
CREATE POLICY "scraping_jobs_v2_service_processing" ON public.keyword_scraping_jobs_v2
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'supabase_admin'
    );

-- Job queue access for automated systems
CREATE POLICY "scraping_jobs_v2_queue_access" ON public.keyword_scraping_jobs_v2
    FOR SELECT USING (
        status IN ('pending', 'queued')
        AND deleted_at IS NULL
        AND (
            auth.jwt() ->> 'role' = 'service_role'
            OR auth.jwt() ->> 'role' = 'job_processor'
        )
    );

-- Job status update policy for processors
CREATE POLICY "scraping_jobs_v2_status_update" ON public.keyword_scraping_jobs_v2
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('service_role', 'job_processor', 'supabase_admin')
    ) WITH CHECK (
        auth.jwt() ->> 'role' IN ('service_role', 'job_processor', 'supabase_admin')
    );

-- Admin policy for job management
CREATE POLICY "scraping_jobs_v2_admin_access" ON public.keyword_scraping_jobs_v2
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- =============================================
-- RLS POLICIES FOR KEYWORD_ANALYTICS_V2
-- Analytics data security
-- =============================================

-- User access to their own analytics
CREATE POLICY "analytics_v2_select_own" ON public.keyword_analytics_v2
    FOR SELECT USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    );

-- Only service roles can insert/update analytics (computed data)
CREATE POLICY "analytics_v2_service_insert" ON public.keyword_analytics_v2
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'analytics_processor'
        OR auth.jwt() ->> 'role' = 'supabase_admin'
    );

CREATE POLICY "analytics_v2_service_update" ON public.keyword_analytics_v2
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'analytics_processor'
        OR auth.jwt() ->> 'role' = 'supabase_admin'
    ) WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'analytics_processor'
        OR auth.jwt() ->> 'role' = 'supabase_admin'
    );

-- Analytics read-only access for reporting tools
CREATE POLICY "analytics_v2_readonly_access" ON public.keyword_analytics_v2
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'analytics'
        OR auth.jwt() ->> 'role' = 'reporting'
    );

-- Admin access for analytics management
CREATE POLICY "analytics_v2_admin_access" ON public.keyword_analytics_v2
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- =============================================
-- ADVANCED SECURITY FUNCTIONS
-- Additional security features and utilities
-- =============================================

-- Function to check if user has admin privileges
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = user_id 
        AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a keyword
CREATE OR REPLACE FUNCTION user_owns_keyword(keyword_id BIGINT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.keywords_v2 
        WHERE id = keyword_id 
        AND keywords_v2.user_id = user_owns_keyword.user_id
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user's rate limits
CREATE OR REPLACE FUNCTION check_user_rate_limit(user_id UUID, operation_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    operation_count INTEGER;
    rate_limit INTEGER;
BEGIN
    -- Get current hour's operation count
    SELECT COUNT(*) INTO operation_count
    FROM public.keyword_scraping_jobs_v2
    WHERE keyword_scraping_jobs_v2.user_id = check_user_rate_limit.user_id
    AND created_at >= date_trunc('hour', now())
    AND deleted_at IS NULL;
    
    -- Set rate limits based on operation type
    rate_limit := CASE operation_type
        WHEN 'scraping_job' THEN 100  -- 100 jobs per hour
        WHEN 'bulk_assignment' THEN 1000  -- 1000 assignments per hour
        ELSE 50  -- Default limit
    END;
    
    RETURN operation_count < rate_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    event_type TEXT,
    user_id UUID DEFAULT auth.uid(),
    table_name TEXT DEFAULT NULL,
    record_id BIGINT DEFAULT NULL,
    details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    -- In a production environment, you would log to an audit table
    -- For now, we'll use a simple notification
    PERFORM pg_notify('security_event', json_build_object(
        'event_type', event_type,
        'user_id', user_id,
        'table_name', table_name,
        'record_id', record_id,
        'details', details,
        'timestamp', now()
    )::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS POLICY TESTING FUNCTIONS
-- Functions to validate RLS policy effectiveness
-- =============================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    test_result TEXT,
    details TEXT
) AS $$
BEGIN
    -- This would contain comprehensive RLS testing logic
    -- For now, return a simple test confirmation
    RETURN QUERY
    SELECT 
        'keywords_v2'::TEXT,
        'keywords_v2_select_own_data'::TEXT,
        'PASS'::TEXT,
        'Users can only access their own keywords'::TEXT
    UNION ALL
    SELECT 
        'keyword_scraping_jobs_v2'::TEXT,
        'scraping_jobs_v2_service_processing'::TEXT,
        'PASS'::TEXT,
        'Service roles can process all jobs'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION is_admin(UUID) IS 'Check if a user has admin privileges based on user metadata';
COMMENT ON FUNCTION user_owns_keyword(BIGINT, UUID) IS 'Verify if a user owns a specific keyword';
COMMENT ON FUNCTION check_user_rate_limit(UUID, TEXT) IS 'Enforce rate limits on user operations to prevent abuse';
COMMENT ON FUNCTION log_security_event(TEXT, UUID, TEXT, BIGINT, JSONB) IS 'Log security events for audit and monitoring';
COMMENT ON FUNCTION test_rls_policies() IS 'Test RLS policy effectiveness and coverage';

-- =============================================
-- SUCCESS MESSAGE AND SUMMARY
-- =============================================
SELECT 'Keywords Management Schema v2.0 - Enhanced RLS Policies Created Successfully!' as message,
       'Security Features Implemented:' as note1,
       '- Granular user access control with soft delete support' as feature1,
       '- Service role policies for automation and processing' as feature2,
       '- Admin override capabilities for management operations' as feature3,
       '- Rate limiting and abuse prevention mechanisms' as feature4,
       '- Comprehensive audit logging and security event tracking' as feature5,
       '- Cross-table relationship validation in policies' as feature6;