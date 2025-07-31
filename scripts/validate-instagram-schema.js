#!/usr/bin/env node
/**
 * Instagram Scraper Schema Validation Script
 * Validates that the Instagram scraper database schema was migrated correctly
 * via postgres-meta API and all components are functioning properly.
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Instagram Scraper Schema Validation')
console.log('URL:', SUPABASE_URL)
console.log('Service Role Key:', SERVICE_ROLE_KEY ? 'Present' : 'Missing')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

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
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${JSON.stringify(result)}`)
    }
    
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Utility function for RPC calls
const executeRPC = async (functionName, params = {}) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      const result = await response.json()
      return { success: true, data: result }
    } else {
      const error = await response.text()
      return { success: false, error }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test REST API access
const testRESTAccess = async (tableName) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Accept': 'application/json',
      }
    })

    if (response.ok) {
      return { success: true, status: response.status }
    } else {
      return { success: false, status: response.status, error: await response.text() }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Validate table structure
const validateTables = async () => {
  console.log('\n📋 Validating Instagram tables...')
  
  const expectedTables = [
    'instagram_locations',
    'instagram_music_info', 
    'instagram_hashtags',
    'instagram_posts',
    'instagram_post_hashtags',
    'instagram_post_mentions',
    'instagram_search_queries'
  ]

  const tablesResult = await postgresMetaAPI('tables')
  if (!tablesResult.success) {
    console.log('❌ Failed to fetch tables:', tablesResult.error)
    return false
  }

  const allTables = tablesResult.data.map(t => t.name)
  const instagramTables = allTables.filter(name => name.startsWith('instagram_'))
  
  console.log(`📊 Found ${instagramTables.length} Instagram tables:`)
  
  let allTablesPresent = true
  for (const expectedTable of expectedTables) {
    const isPresent = instagramTables.includes(expectedTable)
    console.log(`   ${isPresent ? '✅' : '❌'} ${expectedTable}`)
    if (!isPresent) allTablesPresent = false
  }

  // Test REST API access for each table
  console.log('\n🌐 Testing REST API access...')
  for (const table of expectedTables) {
    const restResult = await testRESTAccess(table)
    if (restResult.success) {
      console.log(`   ✅ ${table} - REST API accessible`)
    } else {
      console.log(`   ❌ ${table} - REST API failed (${restResult.status || 'unknown'})`)
    }
  }

  return allTablesPresent
}

// Validate indexes
const validateIndexes = async () => {
  console.log('\n🔍 Validating indexes...')
  
  const indexesResult = await postgresMetaAPI('indexes')
  if (!indexesResult.success) {
    console.log('❌ Failed to fetch indexes:', indexesResult.error)
    return false
  }

  const instagramIndexes = indexesResult.data.filter(idx => 
    idx.table_name && idx.table_name.startsWith('instagram_')
  )
  
  console.log(`📊 Found ${instagramIndexes.length} Instagram-related indexes`)
  
  // Group indexes by table
  const indexesByTable = {}
  instagramIndexes.forEach(idx => {
    if (!indexesByTable[idx.table_name]) {
      indexesByTable[idx.table_name] = []
    }
    indexesByTable[idx.table_name].push(idx.name)
  })

  for (const [tableName, indexes] of Object.entries(indexesByTable)) {
    console.log(`   📋 ${tableName}: ${indexes.length} indexes`)
    indexes.forEach(idxName => {
      console.log(`      - ${idxName}`)
    })
  }

  return instagramIndexes.length > 0
}

// Validate functions
const validateFunctions = async () => {
  console.log('\n⚙️  Validating functions...')
  
  const functionsResult = await postgresMetaAPI('functions')
  if (!functionsResult.success) {
    console.log('❌ Failed to fetch functions:', functionsResult.error)
    return false
  }

  const expectedFunctions = [
    'execute_sql',
    'update_updated_at_column',
    'insert_instagram_hashtag_data'
  ]

  const allFunctions = functionsResult.data.map(f => f.name)
  
  let allFunctionsPresent = true
  for (const expectedFunc of expectedFunctions) {
    const isPresent = allFunctions.includes(expectedFunc)
    console.log(`   ${isPresent ? '✅' : '❌'} ${expectedFunc}`)
    if (!isPresent) allFunctionsPresent = false
  }

  // Test execute_sql function
  console.log('\n🧪 Testing execute_sql function...')
  const testResult = await executeRPC('execute_sql', { query: 'SELECT 1 as test_result' })
  if (testResult.success) {
    console.log('   ✅ execute_sql function is working')
  } else {
    console.log('   ❌ execute_sql function failed:', testResult.error)
    allFunctionsPresent = false
  }

  return allFunctionsPresent
}

// Validate views
const validateViews = async () => {
  console.log('\n👁️  Validating views...')
  
  const expectedViews = ['hashtag_analytics', 'user_post_analytics']
  
  let allViewsPresent = true
  for (const viewName of expectedViews) {
    const viewResult = await testRESTAccess(viewName)
    if (viewResult.success) {
      console.log(`   ✅ ${viewName} - view accessible`)
    } else {
      console.log(`   ❌ ${viewName} - view not accessible`)
      allViewsPresent = false
    }
  }

  return allViewsPresent  
}

// Validate RLS policies
const validateRLS = async () => {
  console.log('\n🔐 Validating RLS policies...')
  
  const policiesResult = await postgresMetaAPI('policies')
  if (!policiesResult.success) {
    console.log('❌ Failed to fetch policies:', policiesResult.error)
    return false
  }

  const instagramPolicies = policiesResult.data.filter(policy => 
    policy.table && policy.table.startsWith('instagram_')
  )
  
  console.log(`📊 Found ${instagramPolicies.length} Instagram RLS policies`)
  
  // Group policies by table
  const policiesByTable = {}
  instagramPolicies.forEach(policy => {
    if (!policiesByTable[policy.table]) {
      policiesByTable[policy.table] = []
    }
    policiesByTable[policy.table].push(policy.name)
  })

  for (const [tableName, policies] of Object.entries(policiesByTable)) {
    console.log(`   🔒 ${tableName}: ${policies.length} policies`)
    policies.forEach(policyName => {
      console.log(`      - ${policyName}`)
    })
  }

  // Expected tables with RLS
  const expectedRLSTables = ['instagram_hashtags', 'instagram_posts', 'instagram_search_queries']
  let rlsConfigured = true
  
  for (const tableName of expectedRLSTables) {
    if (!policiesByTable[tableName] || policiesByTable[tableName].length === 0) {
      console.log(`   ⚠️  No RLS policies found for ${tableName}`)
      rlsConfigured = false
    }
  }

  return rlsConfigured
}

// Test data insertion
const testDataInsertion = async () => {
  console.log('\n📝 Testing data insertion...')
  
  // Test inserting a location
  try {
    const locationResult = await fetch(`${SUPABASE_URL}/rest/v1/instagram_locations`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        location_id: 'test_location_123',
        location_name: 'Test Location',
        city: 'Test City',
        country: 'Test Country'
      })
    })

    if (locationResult.ok) {
      const data = await locationResult.json()
      console.log('   ✅ Location insertion successful')
      
      // Clean up test data
      await fetch(`${SUPABASE_URL}/rest/v1/instagram_locations?location_id=eq.test_location_123`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
      })
      
      return true
    } else {
      console.log('   ❌ Location insertion failed:', await locationResult.text())
      return false
    }
  } catch (error) {
    console.log('   ❌ Data insertion test failed:', error.message)
    return false
  }
}

// Performance test
const performanceTest = async () => {
  console.log('\n⚡ Performance test...')
  
  const start = Date.now()
  const tablesResult = await postgresMetaAPI('tables')
  const end = Date.now()
  
  if (tablesResult.success) {
    console.log(`   ✅ postgres-meta API response time: ${end - start}ms`)
    return true
  } else {
    console.log('   ❌ Performance test failed')
    return false
  }
}

// Main validation execution
const main = async () => {
  console.log('\n' + '='.repeat(80))
  console.log('🔍 INSTAGRAM SCRAPER SCHEMA VALIDATION')
  console.log('='.repeat(80))

  const results = {
    tables: false,
    indexes: false,
    functions: false,
    views: false,
    rls: false,
    dataInsertion: false,
    performance: false
  }

  try {
    // Run all validations
    results.tables = await validateTables()
    results.indexes = await validateIndexes()
    results.functions = await validateFunctions()
    results.views = await validateViews()
    results.rls = await validateRLS()
    results.dataInsertion = await testDataInsertion()
    results.performance = await performanceTest()

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 VALIDATION SUMMARY')
    console.log('='.repeat(80))
    
    const allPassed = Object.values(results).every(result => result === true)
    
    for (const [test, passed] of Object.entries(results)) {
      console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`)
    }
    
    if (allPassed) {
      console.log('\n🎉 ALL VALIDATIONS PASSED!')
      console.log('✅ Instagram scraper schema is fully functional')
      console.log('✅ Ready for production use')
    } else {
      console.log('\n⚠️  SOME VALIDATIONS FAILED')
      console.log('Please review the failed components above')
    }
    
    console.log('='.repeat(80))
    
    process.exit(allPassed ? 0 : 1)

  } catch (error) {
    console.error('\n❌ Validation failed:', error)
    process.exit(1)
  }
}

// Execute validation
main().catch(console.error)