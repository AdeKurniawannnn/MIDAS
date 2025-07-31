#!/usr/bin/env node
/**
 * Add Foreign Keys and Indexes to Clean V2 Tables
 * Adds relationships and performance optimizations
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔗 Adding Foreign Keys and Indexes to Clean V2 Tables')
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
  console.log('🔗 ADDING FOREIGN KEY CONSTRAINTS')
  console.log('='.repeat(60))

  const foreignKeys = [
    {
      name: 'keywords_v2_user_id_fkey',
      sql: 'ALTER TABLE public.keywords_v2 ADD CONSTRAINT keywords_v2_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;',
      description: 'Add user foreign key to keywords_v2'
    },
    {
      name: 'keywords_v2_created_by_fkey',
      sql: 'ALTER TABLE public.keywords_v2 ADD CONSTRAINT keywords_v2_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;',
      description: 'Add created_by foreign key to keywords_v2'
    },
    {
      name: 'keywords_v2_updated_by_fkey',
      sql: 'ALTER TABLE public.keywords_v2 ADD CONSTRAINT keywords_v2_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;',
      description: 'Add updated_by foreign key to keywords_v2'
    },
    {
      name: 'google_maps_v2_user_id_fkey',
      sql: 'ALTER TABLE public.data_scraping_google_maps_v2 ADD CONSTRAINT google_maps_v2_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;',
      description: 'Add user foreign key to data_scraping_google_maps_v2'
    },
    {
      name: 'google_maps_v2_created_by_fkey',
      sql: 'ALTER TABLE public.data_scraping_google_maps_v2 ADD CONSTRAINT google_maps_v2_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;',
      description: 'Add created_by foreign key to data_scraping_google_maps_v2'
    },
    {
      name: 'google_maps_v2_updated_by_fkey',
      sql: 'ALTER TABLE public.data_scraping_google_maps_v2 ADD CONSTRAINT google_maps_v2_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;',
      description: 'Add updated_by foreign key to data_scraping_google_maps_v2'
    },
    {
      name: 'maps_assignments_keyword_fkey',
      sql: 'ALTER TABLE public.keyword_google_maps_assignments_v2 ADD CONSTRAINT maps_assignments_keyword_fkey FOREIGN KEY (keyword_id) REFERENCES public.keywords_v2(id) ON DELETE CASCADE;',
      description: 'Add keyword foreign key to google maps assignments'
    },
    {
      name: 'maps_assignments_google_maps_fkey',
      sql: 'ALTER TABLE public.keyword_google_maps_assignments_v2 ADD CONSTRAINT maps_assignments_google_maps_fkey FOREIGN KEY (google_maps_id) REFERENCES public.data_scraping_google_maps_v2(id) ON DELETE CASCADE;',
      description: 'Add google maps foreign key to assignments'
    },
    {
      name: 'maps_assignments_user_id_fkey',
      sql: 'ALTER TABLE public.keyword_google_maps_assignments_v2 ADD CONSTRAINT maps_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;',
      description: 'Add user foreign key to assignments'
    },
    {
      name: 'scraping_jobs_keyword_fkey',
      sql: 'ALTER TABLE public.keyword_scraping_jobs_v2 ADD CONSTRAINT scraping_jobs_keyword_fkey FOREIGN KEY (keyword_id) REFERENCES public.keywords_v2(id) ON DELETE CASCADE;',
      description: 'Add keyword foreign key to scraping jobs'
    },
    {
      name: 'scraping_jobs_user_id_fkey',
      sql: 'ALTER TABLE public.keyword_scraping_jobs_v2 ADD CONSTRAINT scraping_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;',
      description: 'Add user foreign key to scraping jobs'
    }
  ]

  const foreignKeyResults = []
  for (const fk of foreignKeys) {
    const result = await executeSQL(fk.sql, fk.description)
    foreignKeyResults.push({ name: fk.name, success: result.success })
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 ADDING PERFORMANCE INDEXES')
  console.log('='.repeat(60))

  const indexes = [
    {
      name: 'idx_keywords_v2_user_status',
      sql: 'CREATE INDEX IF NOT EXISTS idx_keywords_v2_user_status ON public.keywords_v2(user_id, status) WHERE deleted_at IS NULL;',
      description: 'Add user + status index on keywords_v2'
    },
    {
      name: 'idx_keywords_v2_category_priority',
      sql: 'CREATE INDEX IF NOT EXISTS idx_keywords_v2_category_priority ON public.keywords_v2(category, priority DESC) WHERE deleted_at IS NULL;',
      description: 'Add category + priority index on keywords_v2'
    },
    {
      name: 'idx_keywords_v2_search',
      sql: `CREATE INDEX IF NOT EXISTS idx_keywords_v2_search ON public.keywords_v2 USING GIN(to_tsvector('english', keyword || ' ' || COALESCE(description, ''))) WHERE deleted_at IS NULL;`,
      description: 'Add full-text search index on keywords_v2'
    },
    {
      name: 'idx_google_maps_v2_user_location',
      sql: 'CREATE INDEX IF NOT EXISTS idx_google_maps_v2_user_location ON public.data_scraping_google_maps_v2(user_id, place_name) WHERE deleted_at IS NULL;',
      description: 'Add user + location index on google_maps_v2'
    },
    {
      name: 'idx_google_maps_v2_rating',
      sql: 'CREATE INDEX IF NOT EXISTS idx_google_maps_v2_rating ON public.data_scraping_google_maps_v2(rating DESC, review_count DESC) WHERE deleted_at IS NULL AND rating IS NOT NULL;',
      description: 'Add rating index on google_maps_v2'
    },
    {
      name: 'idx_assignments_keyword_maps',
      sql: 'CREATE INDEX IF NOT EXISTS idx_assignments_keyword_maps ON public.keyword_google_maps_assignments_v2(keyword_id, google_maps_id) WHERE deleted_at IS NULL;',
      description: 'Add keyword + maps index on assignments'
    },
    {
      name: 'idx_assignments_confidence',
      sql: 'CREATE INDEX IF NOT EXISTS idx_assignments_confidence ON public.keyword_google_maps_assignments_v2(confidence_score DESC, relevance_score DESC) WHERE deleted_at IS NULL;',
      description: 'Add confidence scoring index on assignments'
    },
    {
      name: 'idx_scraping_jobs_status_priority',
      sql: 'CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status_priority ON public.keyword_scraping_jobs_v2(status, job_priority DESC, created_at ASC) WHERE deleted_at IS NULL;',
      description: 'Add job queue index on scraping_jobs_v2'
    },
    {
      name: 'idx_scraping_jobs_keyword_status',
      sql: 'CREATE INDEX IF NOT EXISTS idx_scraping_jobs_keyword_status ON public.keyword_scraping_jobs_v2(keyword_id, status, completed_at DESC) WHERE deleted_at IS NULL;',
      description: 'Add keyword job history index on scraping_jobs_v2'
    }
  ]

  const indexResults = []
  for (const idx of indexes) {
    const result = await executeSQL(idx.sql, idx.description)
    indexResults.push({ name: idx.name, success: result.success })
  }

  console.log('\n' + '='.repeat(60))
  console.log('⚡ ADDING TRIGGERS FOR AUTOMATION')
  console.log('='.repeat(60))

  // Add updated_at trigger function
  const triggerFunctionSQL = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `

  const triggerFunctionResult = await executeSQL(triggerFunctionSQL, 'Create updated_at trigger function')

  // Add triggers to all tables
  const triggers = [
    {
      sql: 'CREATE TRIGGER update_keywords_v2_updated_at BEFORE UPDATE ON public.keywords_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      description: 'Add updated_at trigger to keywords_v2'
    },
    {
      sql: 'CREATE TRIGGER update_google_maps_v2_updated_at BEFORE UPDATE ON public.data_scraping_google_maps_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      description: 'Add updated_at trigger to data_scraping_google_maps_v2'
    },
    {
      sql: 'CREATE TRIGGER update_assignments_v2_updated_at BEFORE UPDATE ON public.keyword_google_maps_assignments_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      description: 'Add updated_at trigger to assignments_v2'
    },
    {
      sql: 'CREATE TRIGGER update_jobs_v2_updated_at BEFORE UPDATE ON public.keyword_scraping_jobs_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      description: 'Add updated_at trigger to jobs_v2'
    }
  ]

  const triggerResults = []
  for (const trigger of triggers) {
    const result = await executeSQL(trigger.sql, trigger.description)
    triggerResults.push({ success: result.success })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SCHEMA ENHANCEMENT SUMMARY')
  console.log('='.repeat(60))
  
  const allResults = [...foreignKeyResults, ...indexResults, triggerResults]
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
  
  console.log('\n⚡ Triggers:')
  console.log(`${triggerFunctionResult.success ? '✅' : '❌'} update_updated_at_column function`)
  triggerResults.forEach((result, index) => {
    const triggerName = ['keywords_v2', 'google_maps_v2', 'assignments_v2', 'jobs_v2'][index]
    console.log(`${result.success ? '✅' : '❌'} ${triggerName} updated_at trigger`)
  })
  
  if (failed === 0) {
    console.log('\n🎉 ALL SCHEMA ENHANCEMENTS COMPLETED SUCCESSFULLY!')
    console.log('✅ Foreign keys ensure referential integrity')
    console.log('✅ Indexes provide optimal query performance') 
    console.log('✅ Triggers automate timestamp updates')
    console.log('✅ Database schema is production-ready')
  } else {
    console.log(`\n⚠️ ${failed} operation(s) failed`)
    console.log('🔍 Check the errors above for details')
  }
  
  console.log('='.repeat(60))
  
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(console.error)