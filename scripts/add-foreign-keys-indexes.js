#!/usr/bin/env node
/**
 * Add Foreign Key Constraints and Indexes
 * Adds relationships and performance optimizations to the created tables
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔗 Adding Foreign Keys, Indexes, and Constraints')
console.log('URL:', SUPABASE_URL)

// Utility function for executing SQL via postgres-meta query endpoint
const executeSQL = async (sql, description = '') => {
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

// Add foreign key constraints
const addForeignKeys = async () => {
  console.log('\n🔗 Adding Foreign Key Constraints...')
  
  const foreignKeys = [
    {
      name: 'keywords_v2_user_id_fkey',
      sql: `ALTER TABLE public.keywords_v2 
            ADD CONSTRAINT keywords_v2_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;`,
      description: 'Add user foreign key to keywords_v2'
    },
    {
      name: 'keywords_v2_created_by_fkey',
      sql: `ALTER TABLE public.keywords_v2 
            ADD CONSTRAINT keywords_v2_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;`,
      description: 'Add created_by foreign key to keywords_v2'
    },
    {
      name: 'keywords_v2_updated_by_fkey',
      sql: `ALTER TABLE public.keywords_v2 
            ADD CONSTRAINT keywords_v2_updated_by_fkey 
            FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;`,
      description: 'Add updated_by foreign key to keywords_v2'
    },
    {
      name: 'google_maps_v2_user_id_fkey',
      sql: `ALTER TABLE public.data_scraping_google_maps_v2 
            ADD CONSTRAINT google_maps_v2_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;`,
      description: 'Add user foreign key to data_scraping_google_maps_v2'
    },
    {
      name: 'google_maps_v2_created_by_fkey',
      sql: `ALTER TABLE public.data_scraping_google_maps_v2 
            ADD CONSTRAINT google_maps_v2_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;`,
      description: 'Add created_by foreign key to data_scraping_google_maps_v2'
    },
    {
      name: 'maps_assignments_keyword_fkey',
      sql: `ALTER TABLE public.keyword_google_maps_assignments_v2 
            ADD CONSTRAINT maps_assignments_keyword_fkey 
            FOREIGN KEY (keyword_id) REFERENCES public.keywords_v2(id) ON DELETE CASCADE;`,
      description: 'Add keyword foreign key to google maps assignments'
    },
    {
      name: 'maps_assignments_google_maps_fkey',
      sql: `ALTER TABLE public.keyword_google_maps_assignments_v2 
            ADD CONSTRAINT maps_assignments_google_maps_fkey 
            FOREIGN KEY (google_maps_id) REFERENCES public.data_scraping_google_maps_v2(id) ON DELETE CASCADE;`,
      description: 'Add google maps foreign key to assignments'
    },
    {
      name: 'scraping_jobs_keyword_fkey',
      sql: `ALTER TABLE public.keyword_scraping_jobs_v2 
            ADD CONSTRAINT scraping_jobs_keyword_fkey 
            FOREIGN KEY (keyword_id) REFERENCES public.keywords_v2(id) ON DELETE CASCADE;`,
      description: 'Add keyword foreign key to scraping jobs'
    },
    {
      name: 'scraping_jobs_user_id_fkey',
      sql: `ALTER TABLE public.keyword_scraping_jobs_v2 
            ADD CONSTRAINT scraping_jobs_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;`,
      description: 'Add user foreign key to scraping jobs'
    }
  ]

  const results = []
  for (const fk of foreignKeys) {
    const result = await executeSQL(fk.sql, fk.description)
    results.push({ name: fk.name, success: result.success })
  }
  
  return results
}

// Add performance indexes
const addIndexes = async () => {
  console.log('\n📊 Adding Performance Indexes...')
  
  const indexes = [
    {
      name: 'idx_keywords_v2_user_status',
      sql: `CREATE INDEX IF NOT EXISTS idx_keywords_v2_user_status 
            ON public.keywords_v2(user_id, status) 
            WHERE deleted_at IS NULL;`,
      description: 'Add user + status index on keywords_v2'
    },
    {
      name: 'idx_keywords_v2_category_priority',
      sql: `CREATE INDEX IF NOT EXISTS idx_keywords_v2_category_priority 
            ON public.keywords_v2(category, priority DESC) 
            WHERE deleted_at IS NULL;`,
      description: 'Add category + priority index on keywords_v2'
    },
    {
      name: 'idx_keywords_v2_search',
      sql: `CREATE INDEX IF NOT EXISTS idx_keywords_v2_search 
            ON public.keywords_v2 USING GIN(to_tsvector('english', keyword || ' ' || COALESCE(description, ''))) 
            WHERE deleted_at IS NULL;`,
      description: 'Add full-text search index on keywords_v2'
    },
    {
      name: 'idx_google_maps_v2_user_location',
      sql: `CREATE INDEX IF NOT EXISTS idx_google_maps_v2_user_location 
            ON public.data_scraping_google_maps_v2(user_id, place_name) 
            WHERE deleted_at IS NULL;`,
      description: 'Add user + location index on google_maps_v2'
    },
    {
      name: 'idx_google_maps_v2_rating',
      sql: `CREATE INDEX IF NOT EXISTS idx_google_maps_v2_rating 
            ON public.data_scraping_google_maps_v2(rating DESC, review_count DESC) 
            WHERE deleted_at IS NULL AND rating IS NOT NULL;`,
      description: 'Add rating index on google_maps_v2'
    },
    {
      name: 'idx_assignments_keyword_maps',
      sql: `CREATE INDEX IF NOT EXISTS idx_assignments_keyword_maps 
            ON public.keyword_google_maps_assignments_v2(keyword_id, google_maps_id) 
            WHERE deleted_at IS NULL;`,
      description: 'Add keyword + maps index on assignments'
    },
    {
      name: 'idx_assignments_confidence',
      sql: `CREATE INDEX IF NOT EXISTS idx_assignments_confidence 
            ON public.keyword_google_maps_assignments_v2(confidence_score DESC, relevance_score DESC) 
            WHERE deleted_at IS NULL;`,
      description: 'Add confidence scoring index on assignments'
    },
    {
      name: 'idx_scraping_jobs_status_priority',
      sql: `CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status_priority 
            ON public.keyword_scraping_jobs_v2(status, job_priority DESC, created_at ASC) 
            WHERE deleted_at IS NULL;`,
      description: 'Add job queue index on scraping_jobs_v2'
    },
    {
      name: 'idx_scraping_jobs_keyword_status',
      sql: `CREATE INDEX IF NOT EXISTS idx_scraping_jobs_keyword_status 
            ON public.keyword_scraping_jobs_v2(keyword_id, status, completed_at DESC) 
            WHERE deleted_at IS NULL;`,
      description: 'Add keyword job history index on scraping_jobs_v2'
    }
  ]

  const results = []
  for (const idx of indexes) {
    const result = await executeSQL(idx.sql, idx.description)
    results.push({ name: idx.name, success: result.success })
  }
  
  return results
}

// Add check constraints for data validation
const addCheckConstraints = async () => {
  console.log('\n✅ Adding Check Constraints...')
  
  const constraints = [
    {
      name: 'keywords_v2_priority_check',
      sql: `ALTER TABLE public.keywords_v2 
            ADD CONSTRAINT keywords_v2_priority_check 
            CHECK (priority >= 1 AND priority <= 5);`,
      description: 'Add priority range check (1-5) on keywords_v2'
    },
    {
      name: 'keywords_v2_status_check',
      sql: `ALTER TABLE public.keywords_v2 
            ADD CONSTRAINT keywords_v2_status_check 
            CHECK (status IN ('active', 'inactive', 'archived', 'pending'));`,
      description: 'Add status enum check on keywords_v2'
    },
    {
      name: 'google_maps_v2_rating_check',
      sql: `ALTER TABLE public.data_scraping_google_maps_v2 
            ADD CONSTRAINT google_maps_v2_rating_check 
            CHECK (rating >= 0 AND rating <= 5);`,
      description: 'Add rating range check (0-5) on google_maps_v2'
    },
    {
      name: 'assignments_confidence_check',
      sql: `ALTER TABLE public.keyword_google_maps_assignments_v2 
            ADD CONSTRAINT assignments_confidence_check 
            CHECK (confidence_score >= 0 AND confidence_score <= 1);`,
      description: 'Add confidence score range check (0-1) on assignments'
    },
    {
      name: 'scraping_jobs_priority_check',
      sql: `ALTER TABLE public.keyword_scraping_jobs_v2 
            ADD CONSTRAINT scraping_jobs_priority_check 
            CHECK (job_priority >= 1 AND job_priority <= 10);`,
      description: 'Add job priority range check (1-10) on scraping_jobs_v2'
    },
    {
      name: 'scraping_jobs_status_check',
      sql: `ALTER TABLE public.keyword_scraping_jobs_v2 
            ADD CONSTRAINT scraping_jobs_status_check 
            CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled'));`,
      description: 'Add status enum check on scraping_jobs_v2'
    }
  ]

  const results = []
  for (const constraint of constraints) {
    const result = await executeSQL(constraint.sql, constraint.description)
    results.push({ name: constraint.name, success: result.success })
  }
  
  return results
}

// Main execution
const main = async () => {
  console.log('\n' + '='.repeat(60))
  console.log('🔗 ADDING FOREIGN KEYS, INDEXES, AND CONSTRAINTS')
  console.log('='.repeat(60))

  try {
    const foreignKeyResults = await addForeignKeys()
    const indexResults = await addIndexes()
    const constraintResults = await addCheckConstraints()

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SCHEMA ENHANCEMENT SUMMARY')
    console.log('='.repeat(60))
    
    const allResults = [...foreignKeyResults, ...indexResults, ...constraintResults]
    const successful = allResults.filter(r => r.success).length
    const failed = allResults.filter(r => !r.success).length
    
    console.log(`Total Operations: ${allResults.length}`)
    console.log(`Successful: ${successful}`)
    console.log(`Failed: ${failed}`)
    
    console.log('\n🔗 Foreign Keys:')
    foreignKeyResults.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.name}`)
    })
    
    console.log('\n📊 Indexes:')
    indexResults.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.name}`)
    })
    
    console.log('\n✅ Check Constraints:')
    constraintResults.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.name}`)
    })
    
    if (failed === 0) {
      console.log('\n🎉 ALL SCHEMA ENHANCEMENTS COMPLETED SUCCESSFULLY!')
      console.log('✅ Database schema is fully optimized and ready for use')
    } else {
      console.log(`\n⚠️  ${failed} operation(s) failed`)
      console.log('🔍 Check the errors above for details')
    }
    
    console.log('='.repeat(60))
    
    process.exit(failed === 0 ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ Schema enhancement failed with unexpected error:', error)
    process.exit(1)
  }
}

main().catch(console.error)