#!/usr/bin/env node
/**
 * Cleanup and Recreate Keywords Tables
 * Removes problematic v2 tables and creates clean ones
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧹 Cleanup and Recreate Keywords Tables')
console.log('URL:', SUPABASE_URL)

const executeSQL = async (sql, description) => {
  console.log(`🔧 ${description}`)
  
  try {
    const response = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },  
      body: JSON.stringify({ query: sql })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`   ✅ ${description}`)
      return { success: true, data: result }
    } else {
      const error = await response.text()
      console.log(`   ❌ Failed: ${error}`)
      return { success: false, error }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

const main = async () => {
  console.log('\n' + '='.repeat(60))
  console.log('🗑️ CLEANING UP EXISTING V2 TABLES')
  console.log('='.repeat(60))

  // Drop tables in dependency order
  const dropQueries = [
    'DROP TABLE IF EXISTS public.keyword_scraping_jobs_v2 CASCADE;',
    'DROP TABLE IF EXISTS public.keyword_google_maps_assignments_v2 CASCADE;',
    'DROP TABLE IF EXISTS public.data_scraping_google_maps_v2 CASCADE;',
    'DROP TABLE IF EXISTS public.keywords_v2 CASCADE;'
  ]
  
  for (const sql of dropQueries) {
    await executeSQL(sql, 'Drop existing table')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 CREATING FRESH V2 TABLES')
  console.log('='.repeat(60))
  
  // Create keywords_v2 table
  const keywordsSQL = `
    CREATE TABLE public.keywords_v2 (
        id BIGSERIAL PRIMARY KEY,
        keyword TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'general',
        status TEXT DEFAULT 'active',
        priority INTEGER DEFAULT 1,
        user_id UUID NOT NULL,
        gmail TEXT NOT NULL,
        created_by UUID,
        updated_by UUID,
        deleted_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        tags TEXT[],
        search_volume INTEGER,
        competition_score DECIMAL(3,2),
        performance_metrics JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        CONSTRAINT keywords_v2_priority_check CHECK (priority >= 1 AND priority <= 5),
        CONSTRAINT keywords_v2_status_check CHECK (status IN ('active', 'inactive', 'archived', 'pending'))
    );
  `
  
  const keywordsResult = await executeSQL(keywordsSQL, 'Create keywords_v2 table')
  
  // Create data_scraping_google_maps_v2 table
  const googleMapsSQL = `
    CREATE TABLE public.data_scraping_google_maps_v2 (
        id BIGSERIAL PRIMARY KEY,
        input_url TEXT NOT NULL,
        place_name TEXT,
        address TEXT,
        phone_number TEXT,
        website TEXT,
        rating DECIMAL(3,2),
        review_count INTEGER,
        category TEXT,
        hours JSONB,
        description TEXT,
        coordinates JSONB,
        image_url TEXT,
        price_range TEXT,
        user_id UUID NOT NULL,
        gmail TEXT NOT NULL,
        created_by UUID,
        updated_by UUID,
        deleted_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        search_query TEXT,
        scraping_session_id UUID DEFAULT gen_random_uuid(),
        quality_score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        CONSTRAINT google_maps_v2_rating_check CHECK (rating >= 0 AND rating <= 5)
    );
  `
  
  const googleMapsResult = await executeSQL(googleMapsSQL, 'Create data_scraping_google_maps_v2 table')
  
  // Create keyword_google_maps_assignments_v2 table
  const assignmentsSQL = `
    CREATE TABLE public.keyword_google_maps_assignments_v2 (
        id BIGSERIAL PRIMARY KEY,
        keyword_id BIGINT NOT NULL,
        google_maps_id BIGINT NOT NULL,
        assignment_type TEXT DEFAULT 'manual',
        confidence_score DECIMAL(3,2),
        relevance_score DECIMAL(3,2),
        user_id UUID NOT NULL,
        gmail TEXT NOT NULL,
        created_by UUID,
        updated_by UUID,
        deleted_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        assignment_notes TEXT,
        assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        CONSTRAINT assignments_confidence_check CHECK (confidence_score >= 0 AND confidence_score <= 1),
        CONSTRAINT assignments_relevance_check CHECK (relevance_score >= 0 AND relevance_score <= 1)
    );
  `
  
  const assignmentsResult = await executeSQL(assignmentsSQL, 'Create keyword_google_maps_assignments_v2 table')
  
  // Create keyword_scraping_jobs_v2 table
  const jobsSQL = `
    CREATE TABLE public.keyword_scraping_jobs_v2 (
        id BIGSERIAL PRIMARY KEY,
        keyword_id BIGINT NOT NULL,
        job_type TEXT NOT NULL,
        job_priority INTEGER DEFAULT 5,
        status TEXT DEFAULT 'pending',
        results_count INTEGER DEFAULT 0,
        expected_results INTEGER,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        estimated_duration INTEGER,
        actual_duration INTEGER,
        error_message TEXT,
        error_code TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        job_config JSONB DEFAULT '{}',
        job_results JSONB DEFAULT '{}',
        user_id UUID NOT NULL,
        gmail TEXT NOT NULL,
        created_by UUID,
        updated_by UUID,
        deleted_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        external_job_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        CONSTRAINT scraping_jobs_priority_check CHECK (job_priority >= 1 AND job_priority <= 10),
        CONSTRAINT scraping_jobs_status_check CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled'))
    );
  `
  
  const jobsResult = await executeSQL(jobsSQL, 'Create keyword_scraping_jobs_v2 table')
  
  // Summary
  const results = [keywordsResult, googleMapsResult, assignmentsResult, jobsResult]
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 CLEANUP AND RECREATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Successful: ${successful}/4`)
  console.log(`Failed: ${failed}/4`)
  
  const tableNames = ['keywords_v2', 'data_scraping_google_maps_v2', 'keyword_google_maps_assignments_v2', 'keyword_scraping_jobs_v2']
  
  results.forEach((result, index) => {
    console.log(`${result.success ? '✅' : '❌'} ${tableNames[index]}`)
  })
  
  if (failed === 0) {
    console.log('\n🎉 ALL TABLES RECREATED SUCCESSFULLY!')
    console.log('✅ Clean v2 schema with proper columns and constraints')
    console.log('✅ Ready for foreign keys, indexes, and RLS policies')
  } else {
    console.log(`\n⚠️ ${failed} table(s) failed to create`)
    console.log('🔍 Check the errors above for details')
  }
  
  console.log('='.repeat(60))
  
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(console.error)