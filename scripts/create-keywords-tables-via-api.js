#!/usr/bin/env node
/**
 * Create Keywords Tables via postgres-meta API
 * Step-by-step table creation using direct API calls
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Creating Keywords Tables via postgres-meta API')
console.log('URL:', SUPABASE_URL)

// Utility function for postgres-meta API calls
const postgresMetaAPI = async (endpoint, method = 'GET', body = null) => {
  const url = `${SUPABASE_URL}/pg/${endpoint}`
  const options = {
    method,
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    }
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText}`)
    }
    
    const result = await response.json()
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Create keywords_v2 table
const createKeywordsTable = async () => {
  console.log('\n📋 Creating keywords_v2 table...')
  
  const tableDefinition = {
    name: 'keywords_v2',
    schema: 'public',
    comment: 'Enhanced keywords management with audit trail and performance tracking',
    rls_enabled: true,
    columns: [
      {
        name: 'id',
        type: 'bigserial',
        is_primary_key: true,
        is_nullable: false
      },
      {
        name: 'keyword',
        type: 'text',
        is_nullable: false
      },
      {
        name: 'description',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'category',
        type: 'text',
        is_nullable: true,
        default_value: "'general'"
      },
      {
        name: 'status',
        type: 'text',
        is_nullable: true,
        default_value: "'active'"
      },
      {
        name: 'priority',
        type: 'integer',
        is_nullable: true,
        default_value: '1'
      },
      {
        name: 'user_id',
        type: 'uuid',
        is_nullable: false
      },
      {
        name: 'gmail',
        type: 'text',
        is_nullable: false
      },
      {
        name: 'created_by',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'updated_by',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'deleted_at',
        type: 'timestamptz',
        is_nullable: true
      },
      {
        name: 'metadata',
        type: 'jsonb',
        is_nullable: true,
        default_value: "'{}'"
      },
      {
        name: 'tags',
        type: 'text[]',
        is_nullable: true
      },
      {
        name: 'search_volume',
        type: 'integer',
        is_nullable: true
      },
      {
        name: 'competition_score',
        type: 'decimal(3,2)',
        is_nullable: true
      },
      {
        name: 'performance_metrics',
        type: 'jsonb',
        is_nullable: true,
        default_value: "'{}'"
      },
      {
        name: 'created_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      },
      {
        name: 'updated_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      }
    ]
  }
  
  const result = await postgresMetaAPI('tables', 'POST', tableDefinition)
  
  if (result.success) {
    console.log('   ✅ keywords_v2 table created successfully')
    return true
  } else {
    console.log('   ❌ Failed to create keywords_v2 table:', result.error)
    return false
  }
}

// Create data_scraping_google_maps_v2 table
const createGoogleMapsTable = async () => {
  console.log('\n📋 Creating data_scraping_google_maps_v2 table...')
  
  const tableDefinition = {
    name: 'data_scraping_google_maps_v2',
    schema: 'public',
    comment: 'Enhanced Google Maps scraping data with structured fields and audit trail',
    rls_enabled: true,
    columns: [
      {
        name: 'id',
        type: 'bigserial',
        is_primary_key: true,
        is_nullable: false
      },
      {
        name: 'input_url',
        type: 'text',
        is_nullable: false
      },
      {
        name: 'place_name',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'address',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'phone_number',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'website',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'rating',
        type: 'decimal(3,2)',
        is_nullable: true
      },
      {
        name: 'review_count',
        type: 'integer',
        is_nullable: true
      },
      {
        name: 'category',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'hours',
        type: 'jsonb',
        is_nullable: true
      },
      {
        name: 'description',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'coordinates',
        type: 'jsonb',
        is_nullable: true
      },
      {
        name: 'image_url',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'price_range',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'user_id',
        type: 'uuid',
        is_nullable: false
      },
      {
        name: 'gmail',
        type: 'text',
        is_nullable: false
      },
      {
        name: 'created_by',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'updated_by',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'deleted_at',
        type: 'timestamptz',
        is_nullable: true
      },
      {
        name: 'metadata',
        type: 'jsonb',
        is_nullable: true,
        default_value: "'{}'"
      },
      {
        name: 'search_query',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'scraping_session_id',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'quality_score',
        type: 'integer',
        is_nullable: true
      },
      {
        name: 'created_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      },
      {
        name: 'updated_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      }
    ]
  }
  
  const result = await postgresMetaAPI('tables', 'POST', tableDefinition)
  
  if (result.success) {
    console.log('   ✅ data_scraping_google_maps_v2 table created successfully')
    return true
  } else {
    console.log('   ❌ Failed to create data_scraping_google_maps_v2 table:', result.error)
    return false
  }
}

// Create keyword_google_maps_assignments_v2 table
const createGoogleMapsAssignmentsTable = async () => {
  console.log('\n📋 Creating keyword_google_maps_assignments_v2 table...')
  
  const tableDefinition = {
    name: 'keyword_google_maps_assignments_v2',
    schema: 'public',
    comment: 'Enhanced keyword-Google Maps assignments with relevance scoring',
    rls_enabled: true,
    columns: [
      {
        name: 'id',
        type: 'bigserial',
        is_primary_key: true,
        is_nullable: false
      },
      {
        name: 'keyword_id',
        type: 'bigint',
        is_nullable: false
      },
      {
        name: 'google_maps_id',
        type: 'bigint',
        is_nullable: false
      },
      {
        name: 'assignment_type',
        type: 'text',
        is_nullable: true,
        default_value: "'manual'"
      },
      {
        name: 'confidence_score',
        type: 'decimal(3,2)',
        is_nullable: true
      },
      {
        name: 'relevance_score',
        type: 'decimal(3,2)',
        is_nullable: true
      },
      {
        name: 'user_id',
        type: 'uuid',
        is_nullable: false
      },
      {
        name: 'gmail',
        type: 'text',
        is_nullable: false
      },
      {
        name: 'created_by',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'updated_by',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'deleted_at',
        type: 'timestamptz',
        is_nullable: true
      },
      {
        name: 'metadata',
        type: 'jsonb',
        is_nullable: true,
        default_value: "'{}'"
      },
      {
        name: 'assignment_notes',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'assigned_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      },
      {
        name: 'created_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      },
      {
        name: 'updated_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      }
    ]
  }
  
  const result = await postgresMetaAPI('tables', 'POST', tableDefinition)
  
  if (result.success) {
    console.log('   ✅ keyword_google_maps_assignments_v2 table created successfully')
    return true
  } else {
    console.log('   ❌ Failed to create keyword_google_maps_assignments_v2 table:', result.error)
    return false
  }
}

// Create keyword_scraping_jobs_v2 table
const createScrapingJobsTable = async () => {
  console.log('\n📋 Creating keyword_scraping_jobs_v2 table...')
  
  const tableDefinition = {
    name: 'keyword_scraping_jobs_v2',
    schema: 'public',
    comment: 'Enhanced scraping job tracking with detailed status and error handling',
    rls_enabled: true,
    columns: [
      {
        name: 'id',
        type: 'bigserial',
        is_primary_key: true,
        is_nullable: false
      },
      {
        name: 'keyword_id',
        type: 'bigint',
        is_nullable: false
      },
      {
        name: 'job_type',
        type: 'text',
        is_nullable: false
      },
      {
        name: 'job_priority',
        type: 'integer',
        is_nullable: true,
        default_value: '5'
      },
      {
        name: 'status',
        type: 'text',
        is_nullable: true,
        default_value: "'pending'"
      },
      {
        name: 'results_count',
        type: 'integer',
        is_nullable: true,
        default_value: '0'
      },
      {
        name: 'expected_results',
        type: 'integer',
        is_nullable: true
      },
      {
        name: 'started_at',
        type: 'timestamptz',
        is_nullable: true
      },
      {
        name: 'completed_at',
        type: 'timestamptz',
        is_nullable: true
      },
      {
        name: 'estimated_duration',
        type: 'integer',
        is_nullable: true
      },
      {
        name: 'actual_duration',
        type: 'integer',
        is_nullable: true
      },
      {
        name: 'error_message',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'error_code',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'retry_count',
        type: 'integer',
        is_nullable: true,
        default_value: '0'
      },
      {
        name: 'max_retries',
        type: 'integer',
        is_nullable: true,
        default_value: '3'
      },
      {
        name: 'job_config',
        type: 'jsonb',
        is_nullable: true,
        default_value: "'{}'"
      },
      {
        name: 'job_results',
        type: 'jsonb',
        is_nullable: true,
        default_value: "'{}'"
      },
      {
        name: 'user_id',
        type: 'uuid',
        is_nullable: false
      },
      {
        name: 'gmail',
        type: 'text',
        is_nullable: false
      },
      {
        name: 'created_by',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'updated_by',
        type: 'uuid',
        is_nullable: true
      },
      {
        name: 'deleted_at',
        type: 'timestamptz',
        is_nullable: true
      },
      {
        name: 'metadata',
        type: 'jsonb',
        is_nullable: true,
        default_value: "'{}'"
      },
      {
        name: 'external_job_id',
        type: 'text',
        is_nullable: true
      },
      {
        name: 'created_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      },
      {
        name: 'updated_at',
        type: 'timestamptz',
        is_nullable: false,
        default_value: "timezone('utc'::text, now())"
      }
    ]
  }
  
  const result = await postgresMetaAPI('tables', 'POST', tableDefinition)
  
  if (result.success) {
    console.log('   ✅ keyword_scraping_jobs_v2 table created successfully')
    return true
  } else {
    console.log('   ❌ Failed to create keyword_scraping_jobs_v2 table:', result.error)
    return false
  }
}

// Main execution
const main = async () => {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 CREATING KEYWORDS TABLES VIA POSTGRES-META API')
  console.log('='.repeat(60))

  const results = []
  
  // Create tables in dependency order
  results.push({ name: 'keywords_v2', success: await createKeywordsTable() })
  results.push({ name: 'data_scraping_google_maps_v2', success: await createGoogleMapsTable() })
  results.push({ name: 'keyword_google_maps_assignments_v2', success: await createGoogleMapsAssignmentsTable() })
  results.push({ name: 'keyword_scraping_jobs_v2', success: await createScrapingJobsTable() })
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TABLE CREATION SUMMARY')
  console.log('='.repeat(60))
  
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`)
  })
  
  if (failed === 0) {
    console.log('\n🎉 ALL TABLES CREATED SUCCESSFULLY!')
    console.log('✅ Ready for next steps: indexes, RLS policies, and functions')
  } else {
    console.log(`\n⚠️  ${failed} table(s) failed to create`)
    console.log('🔍 Check the errors above for details')
  }
  
  console.log('='.repeat(60))
  
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(console.error)