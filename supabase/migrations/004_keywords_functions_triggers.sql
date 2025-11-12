-- =============================================
-- Keywords Management Schema v2.0 - Functions and Triggers
-- Migration 004: Database functions and automation
-- =============================================

-- =============================================
-- UTILITY FUNCTIONS
-- Core database utilities and helpers
-- =============================================

-- Enhanced function to update updated_at and updated_by columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    
    -- Only update updated_by if it's not already set in the UPDATE
    IF TG_OP = 'UPDATE' AND OLD.updated_by = NEW.updated_by THEN
        NEW.updated_by = COALESCE(auth.uid(), OLD.updated_by);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique scraping session IDs
CREATE OR REPLACE FUNCTION generate_scraping_session_id()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate keyword priority score based on metrics
CREATE OR REPLACE FUNCTION calculate_keyword_priority_score(
    search_volume INTEGER,
    competition_score DECIMAL,
    performance_metrics JSONB
)
RETURNS DECIMAL AS $$
DECLARE
    base_score DECIMAL := 0;
    volume_score DECIMAL := 0;
    competition_factor DECIMAL := 1;
    performance_factor DECIMAL := 1;
BEGIN
    -- Base score from search volume (normalized to 0-40)
    IF search_volume IS NOT NULL AND search_volume > 0 THEN
        volume_score := LEAST(40, search_volume / 1000.0);
    END IF;
    
    -- Competition factor (lower competition = higher score)
    IF competition_score IS NOT NULL THEN
        competition_factor := 2 - competition_score; -- Range: 1-2
    END IF;
    
    -- Performance factor from CTR and conversion metrics
    IF performance_metrics IS NOT NULL THEN
        performance_factor := 1 + COALESCE((performance_metrics->>'ctr')::DECIMAL, 0) / 100.0;
    END IF;
    
    base_score := volume_score * competition_factor * performance_factor;
    
    -- Cap at 100 and ensure minimum of 1
    RETURN GREATEST(1, LEAST(100, base_score));
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- KEYWORD MANAGEMENT FUNCTIONS
-- Business logic for keyword operations
-- =============================================

-- Function to bulk insert keywords with validation
CREATE OR REPLACE FUNCTION bulk_insert_keywords(
    p_user_id UUID,
    p_keywords JSONB
)
RETURNS TABLE (
    inserted_count INTEGER,
    failed_count INTEGER,
    failed_keywords JSONB
) AS $$
DECLARE
    keyword_item JSONB;
    insert_count INTEGER := 0;
    fail_count INTEGER := 0;
    failed_list JSONB := '[]'::JSONB;
    existing_keyword TEXT;
BEGIN
    -- Validate user exists and is authenticated
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot insert keywords for another user';
    END IF;
    
    -- Process each keyword in the array
    FOR keyword_item IN SELECT * FROM jsonb_array_elements(p_keywords)
    LOOP
        BEGIN
            -- Check if keyword already exists for this user
            SELECT keyword INTO existing_keyword
            FROM public.keywords_v2
            WHERE user_id = p_user_id
            AND lower(keyword) = lower(keyword_item->>'keyword')
            AND deleted_at IS NULL;
            
            IF existing_keyword IS NOT NULL THEN
                -- Keyword already exists, add to failed list
                failed_list := failed_list || jsonb_build_object(
                    'keyword', keyword_item->>'keyword',
                    'error', 'Keyword already exists'
                );
                fail_count := fail_count + 1;
            ELSE
                -- Insert the keyword
                INSERT INTO public.keywords_v2 (
                    keyword,
                    description,
                    category,
                    priority,
                    user_id,
                    gmail,
                    tags,
                    search_volume,
                    competition_score,
                    created_by
                ) VALUES (
                    keyword_item->>'keyword',
                    keyword_item->>'description',
                    COALESCE(keyword_item->>'category', 'general'),
                    COALESCE((keyword_item->>'priority')::INTEGER, 1),
                    p_user_id,
                    keyword_item->>'gmail',
                    CASE WHEN keyword_item->'tags' IS NOT NULL 
                         THEN ARRAY(SELECT jsonb_array_elements_text(keyword_item->'tags'))
                         ELSE NULL END,
                    (keyword_item->>'search_volume')::INTEGER,
                    (keyword_item->>'competition_score')::DECIMAL,
                    p_user_id
                );
                
                insert_count := insert_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Add to failed list with error message
            failed_list := failed_list || jsonb_build_object(
                'keyword', keyword_item->>'keyword',
                'error', SQLERRM
            );
            fail_count := fail_count + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT insert_count, fail_count, failed_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old keywords (soft delete)
CREATE OR REPLACE FUNCTION archive_old_keywords(
    p_user_id UUID,
    p_days_old INTEGER DEFAULT 365
)
RETURNS TABLE (
    archived_count INTEGER,
    archived_keywords JSONB
) AS $$
DECLARE
    archive_count INTEGER := 0;
    archived_list JSONB := '[]'::JSONB;
    keyword_record RECORD;
BEGIN
    -- Update old keywords to archived status
    FOR keyword_record IN
        SELECT id, keyword
        FROM public.keywords_v2
        WHERE user_id = p_user_id
        AND status = 'active'
        AND created_at < (CURRENT_DATE - INTERVAL '1 day' * p_days_old)
        AND deleted_at IS NULL
    LOOP
        UPDATE public.keywords_v2
        SET status = 'archived',
            updated_at = timezone('utc'::text, now()),
            updated_by = p_user_id
        WHERE id = keyword_record.id;
        
        archived_list := archived_list || jsonb_build_object(
            'id', keyword_record.id,
            'keyword', keyword_record.keyword
        );
        archive_count := archive_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT archive_count, archived_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SCRAPING JOB MANAGEMENT FUNCTIONS
-- Job queue and processing automation
-- =============================================

-- Function to create a scraping job with validation
CREATE OR REPLACE FUNCTION create_scraping_job(
    p_keyword_id BIGINT,
    p_job_type TEXT,
    p_job_priority INTEGER DEFAULT 5,
    p_job_config JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
    job_id BIGINT;
    keyword_owner UUID;
    current_user UUID := auth.uid();
BEGIN
    -- Verify keyword ownership
    SELECT user_id INTO keyword_owner
    FROM public.keywords_v2
    WHERE id = p_keyword_id AND deleted_at IS NULL;
    
    IF keyword_owner IS NULL THEN
        RAISE EXCEPTION 'Keyword not found or has been deleted';
    END IF;
    
    IF keyword_owner != current_user THEN
        RAISE EXCEPTION 'Unauthorized: Cannot create job for keyword owned by another user';
    END IF;
    
    -- Check rate limits
    IF NOT check_user_rate_limit(current_user, 'scraping_job') THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many scraping jobs created recently';
    END IF;
    
    -- Insert the job
    INSERT INTO public.keyword_scraping_jobs_v2 (
        keyword_id,
        job_type,
        job_priority,
        job_config,
        user_id,
        gmail,
        created_by
    ) VALUES (
        p_keyword_id,
        p_job_type,
        p_job_priority,
        p_job_config,
        keyword_owner,
        (SELECT gmail FROM public.keywords_v2 WHERE id = p_keyword_id),
        current_user
    ) RETURNING id INTO job_id;
    
    -- Log the job creation
    PERFORM log_security_event(
        'scraping_job_created',
        current_user,
        'keyword_scraping_jobs_v2',
        job_id,
        jsonb_build_object('keyword_id', p_keyword_id, 'job_type', p_job_type)
    );
    
    RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next job from queue
CREATE OR REPLACE FUNCTION get_next_scraping_job()
RETURNS TABLE (
    job_id BIGINT,
    keyword_id BIGINT,
    job_type TEXT,
    job_config JSONB,
    user_id UUID
) AS $$
DECLARE
    selected_job RECORD;
BEGIN
    -- Select the highest priority pending job
    SELECT id, keyword_scraping_jobs_v2.keyword_id, keyword_scraping_jobs_v2.job_type, 
           keyword_scraping_jobs_v2.job_config, keyword_scraping_jobs_v2.user_id
    INTO selected_job
    FROM public.keyword_scraping_jobs_v2
    WHERE status = 'pending'
    AND deleted_at IS NULL
    ORDER BY job_priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF selected_job.id IS NOT NULL THEN
        -- Mark job as queued
        UPDATE public.keyword_scraping_jobs_v2
        SET status = 'queued',
            updated_at = timezone('utc'::text, now())
        WHERE id = selected_job.id;
        
        -- Return job details
        RETURN QUERY SELECT 
            selected_job.id,
            selected_job.keyword_id,
            selected_job.job_type,
            selected_job.job_config,
            selected_job.user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update job status with error handling
CREATE OR REPLACE FUNCTION update_job_status(
    p_job_id BIGINT,
    p_status TEXT,
    p_results_count INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_job_results JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    job_exists BOOLEAN := FALSE;
    start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if job exists and get start time
    SELECT EXISTS(SELECT 1 FROM public.keyword_scraping_jobs_v2 WHERE id = p_job_id AND deleted_at IS NULL),
           started_at
    INTO job_exists, start_time
    FROM public.keyword_scraping_jobs_v2
    WHERE id = p_job_id;
    
    IF NOT job_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update job status
    UPDATE public.keyword_scraping_jobs_v2
    SET 
        status = p_status,
        results_count = COALESCE(p_results_count, results_count),
        error_message = p_error_message,
        job_results = COALESCE(p_job_results, job_results),
        completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') 
                           THEN timezone('utc'::text, now()) 
                           ELSE completed_at END,
        started_at = CASE WHEN p_status = 'running' AND started_at IS NULL
                         THEN timezone('utc'::text, now())
                         ELSE started_at END,
        actual_duration = CASE 
            WHEN p_status IN ('completed', 'failed') AND start_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - start_time))::INTEGER
            ELSE actual_duration
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_job_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ANALYTICS COMPUTATION FUNCTIONS
-- Automated analytics calculation
-- =============================================

-- Function to compute keyword analytics for a specific period
CREATE OR REPLACE FUNCTION compute_keyword_analytics(
    p_keyword_id BIGINT,
    p_period_start DATE,
    p_period_end DATE,
    p_period_type TEXT
)
RETURNS VOID AS $$
DECLARE
    keyword_user UUID;
    instagram_metrics RECORD;
    maps_metrics RECORD;
    job_metrics RECORD;
BEGIN
    -- Get keyword owner
    SELECT user_id INTO keyword_user
    FROM public.keywords_v2
    WHERE id = p_keyword_id AND deleted_at IS NULL;
    
    IF keyword_user IS NULL THEN
        RAISE EXCEPTION 'Keyword not found';
    END IF;
    
    -- Calculate Instagram metrics (placeholder - would join with actual Instagram data)
    SELECT 
        0 as posts_count,
        0::DECIMAL as avg_likes,
        0::DECIMAL as avg_comments,
        0 as total_engagement
    INTO instagram_metrics;
    
    -- Calculate Google Maps metrics
    SELECT 
        COUNT(gm.id)::INTEGER as places_count,
        AVG(gm.rating) as avg_rating,
        SUM(gm.review_count)::INTEGER as total_reviews
    INTO maps_metrics
    FROM public.keyword_google_maps_assignments_v2 kgma
    JOIN public.data_scraping_google_maps_v2 gm ON gm.id = kgma.google_maps_id
    WHERE kgma.keyword_id = p_keyword_id
    AND kgma.deleted_at IS NULL
    AND gm.deleted_at IS NULL
    AND gm.created_at::DATE BETWEEN p_period_start AND p_period_end;
    
    -- Calculate job metrics
    SELECT 
        COUNT(*)::INTEGER as total_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as successful_jobs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER as failed_jobs,
        AVG(actual_duration) as avg_duration
    INTO job_metrics
    FROM public.keyword_scraping_jobs_v2
    WHERE keyword_id = p_keyword_id
    AND deleted_at IS NULL
    AND created_at::DATE BETWEEN p_period_start AND p_period_end;
    
    -- Insert or update analytics record
    INSERT INTO public.keyword_analytics_v2 (
        keyword_id,
        period_start,
        period_end,
        period_type,
        instagram_posts_count,
        instagram_avg_likes,
        instagram_avg_comments,
        instagram_total_engagement,
        google_maps_places_count,
        google_maps_avg_rating,
        google_maps_total_reviews,
        total_jobs_run,
        successful_jobs,
        failed_jobs,
        avg_job_duration,
        user_id,
        created_by
    ) VALUES (
        p_keyword_id,
        p_period_start,
        p_period_end,
        p_period_type,
        instagram_metrics.posts_count,
        instagram_metrics.avg_likes,
        instagram_metrics.avg_comments,
        instagram_metrics.total_engagement,
        maps_metrics.places_count,
        maps_metrics.avg_rating,
        maps_metrics.total_reviews,
        job_metrics.total_jobs,
        job_metrics.successful_jobs,
        job_metrics.failed_jobs,
        job_metrics.avg_duration,
        keyword_user,
        keyword_user
    ) ON CONFLICT (keyword_id, period_start, period_end, period_type, deleted_at)
    DO UPDATE SET
        instagram_posts_count = EXCLUDED.instagram_posts_count,
        instagram_avg_likes = EXCLUDED.instagram_avg_likes,
        instagram_avg_comments = EXCLUDED.instagram_avg_comments,
        instagram_total_engagement = EXCLUDED.instagram_total_engagement,
        google_maps_places_count = EXCLUDED.google_maps_places_count,
        google_maps_avg_rating = EXCLUDED.google_maps_avg_rating,
        google_maps_total_reviews = EXCLUDED.google_maps_total_reviews,
        total_jobs_run = EXCLUDED.total_jobs_run,
        successful_jobs = EXCLUDED.successful_jobs,
        failed_jobs = EXCLUDED.failed_jobs,
        avg_job_duration = EXCLUDED.avg_job_duration,
        updated_at = timezone('utc'::text, now()),
        updated_by = keyword_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to batch compute analytics for all active keywords
CREATE OR REPLACE FUNCTION batch_compute_daily_analytics()
RETURNS TABLE (
    processed_keywords INTEGER,
    computation_time INTERVAL
) AS $$
DECLARE
    start_time TIMESTAMP := clock_timestamp();
    keyword_count INTEGER := 0;
    keyword_record RECORD;
    yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    FOR keyword_record IN
        SELECT id
        FROM public.keywords_v2
        WHERE status = 'active'
        AND deleted_at IS NULL
    LOOP
        PERFORM compute_keyword_analytics(
            keyword_record.id,
            yesterday,
            yesterday,
            'daily'
        );
        keyword_count := keyword_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT 
        keyword_count,
        clock_timestamp() - start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER FUNCTIONS
-- Automated business logic triggers
-- =============================================

-- Trigger function to automatically update keyword priority score
CREATE OR REPLACE FUNCTION auto_update_keyword_priority()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if performance metrics changed
    IF TG_OP = 'UPDATE' AND OLD.performance_metrics IS DISTINCT FROM NEW.performance_metrics THEN
        NEW.priority := LEAST(5, GREATEST(1, 
            calculate_keyword_priority_score(
                NEW.search_volume,
                NEW.competition_score,
                NEW.performance_metrics
            )::INTEGER / 20 + 1
        ));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-populate scraping session ID
CREATE OR REPLACE FUNCTION auto_set_scraping_session()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.scraping_session_id IS NULL THEN
        NEW.scraping_session_id := generate_scraping_session_id();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to validate assignment relationships
CREATE OR REPLACE FUNCTION validate_assignment_relationships()
RETURNS TRIGGER AS $$
BEGIN
    -- For Instagram assignments
    IF TG_TABLE_NAME = 'keyword_instagram_assignments_v2' THEN
        -- Ensure keyword exists and belongs to user
        IF NOT EXISTS (
            SELECT 1 FROM public.keywords_v2
            WHERE id = NEW.keyword_id
            AND user_id = NEW.user_id
            AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Invalid keyword or unauthorized access';
        END IF;
    END IF;
    
    -- For Google Maps assignments
    IF TG_TABLE_NAME = 'keyword_google_maps_assignments_v2' THEN
        -- Ensure both keyword and Google Maps record exist and belong to user
        IF NOT EXISTS (
            SELECT 1 FROM public.keywords_v2
            WHERE id = NEW.keyword_id
            AND user_id = NEW.user_id
            AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Invalid keyword or unauthorized access';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM public.data_scraping_google_maps_v2
            WHERE id = NEW.google_maps_id
            AND user_id = NEW.user_id
            AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Invalid Google Maps record or unauthorized access';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CREATE TRIGGERS
-- Apply triggers to appropriate tables
-- =============================================

-- Updated_at triggers (already exist from migration 001, but ensuring they're correct)
DROP TRIGGER IF EXISTS update_keywords_v2_updated_at ON public.keywords_v2;
CREATE TRIGGER update_keywords_v2_updated_at 
    BEFORE UPDATE ON public.keywords_v2
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Priority auto-update trigger
CREATE TRIGGER auto_update_keyword_priority_trigger
    BEFORE INSERT OR UPDATE ON public.keywords_v2
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_keyword_priority();

-- Scraping session ID trigger
CREATE TRIGGER auto_set_scraping_session_trigger
    BEFORE INSERT ON public.data_scraping_google_maps_v2
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_scraping_session();

-- Assignment validation triggers
CREATE TRIGGER validate_instagram_assignment_trigger
    BEFORE INSERT OR UPDATE ON public.keyword_instagram_assignments_v2
    FOR EACH ROW
    EXECUTE FUNCTION validate_assignment_relationships();

CREATE TRIGGER validate_maps_assignment_trigger
    BEFORE INSERT OR UPDATE ON public.keyword_google_maps_assignments_v2
    FOR EACH ROW
    EXECUTE FUNCTION validate_assignment_relationships();

-- =============================================
-- SCHEDULED FUNCTIONS SETUP
-- Functions that should be run on schedule
-- =============================================

-- Function to setup pg_cron jobs (if extension is available)
CREATE OR REPLACE FUNCTION setup_scheduled_jobs()
RETURNS TEXT AS $$
BEGIN
    -- This would set up cron jobs if pg_cron extension is available
    -- For now, return instructions for manual setup
    RETURN 'Scheduled jobs can be set up using pg_cron extension:
    
    -- Daily analytics computation (run at 2 AM daily)
    SELECT cron.schedule(''daily-analytics'', ''0 2 * * *'', ''SELECT batch_compute_daily_analytics();'');
    
    -- Archive old keywords (run weekly on Sunday at 3 AM)
    SELECT cron.schedule(''archive-keywords'', ''0 3 * * 0'', ''SELECT archive_old_keywords(user_id, 365) FROM auth.users;'');
    ';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION bulk_insert_keywords(UUID, JSONB) IS 'Safely insert multiple keywords with validation and error handling';
COMMENT ON FUNCTION archive_old_keywords(UUID, INTEGER) IS 'Archive keywords older than specified days';
COMMENT ON FUNCTION create_scraping_job(BIGINT, TEXT, INTEGER, JSONB) IS 'Create a new scraping job with validation and rate limiting';
COMMENT ON FUNCTION get_next_scraping_job() IS 'Get the next highest priority job from the queue';
COMMENT ON FUNCTION update_job_status(BIGINT, TEXT, INTEGER, TEXT, JSONB) IS 'Update job status with timing and results tracking';
COMMENT ON FUNCTION compute_keyword_analytics(BIGINT, DATE, DATE, TEXT) IS 'Compute analytics for a keyword over a specific period';
COMMENT ON FUNCTION batch_compute_daily_analytics() IS 'Compute daily analytics for all active keywords';
COMMENT ON FUNCTION calculate_keyword_priority_score(INTEGER, DECIMAL, JSONB) IS 'Calculate priority score based on keyword metrics';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Keywords Management Schema v2.0 - Functions and Triggers Created Successfully!' as message,
       'Automated Features Implemented:' as note1,
       '- Bulk keyword operations with validation' as feature1,
       '- Automated scraping job queue management' as feature2,
       '- Real-time analytics computation' as feature3,
       '- Automated priority scoring and updates' as feature4,
       '- Business rule validation via triggers' as feature5,
       '- Comprehensive error handling and logging' as feature6;