#!/usr/bin/env node
/**
 * Keywords Management Schema Validation Script
 * Validates the current keywords management database schema via postgres-meta API
 * and identifies areas for modernization and improvement.
 * 
 * Based on the archived schema: supabase-keywords-schema-final.sql
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Keywords Management Schema Validation')
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

// Validate keywords table structure and identify naming issues
const validateTables = async () => {
  console.log('\n📋 Validating Keywords tables...')
  
  const expectedTables = [
    'keywords',
    'keyword_instagram_assignments',
    'keyword_google_maps_assignments', 
    'keyword_scraping_jobs',
    'data_scraping_google_maps'
  ]

  const tablesResult = await postgresMetaAPI('tables')
  if (!tablesResult.success) {
    console.log('❌ Failed to fetch tables:', tablesResult.error)
    return { success: false, issues: [] }
  }

  const allTables = tablesResult.data.map(t => t.name)
  const keywordsTables = allTables.filter(name => 
    name.includes('keyword') || name.includes('data_scraping')
  )
  
  console.log(`📊 Found ${keywordsTables.length} Keywords-related tables:`)
  
  let allTablesPresent = true
  const issues = []
  
  for (const expectedTable of expectedTables) {
    const isPresent = keywordsTables.includes(expectedTable)
    console.log(`   ${isPresent ? '✅' : '❌'} ${expectedTable}`)
    if (!isPresent) {
      allTablesPresent = false
      issues.push(`Missing table: ${expectedTable}`)
    }
  }

  // Detailed column inspection for naming consistency issues
  console.log('\n🔍 Inspecting table columns for naming issues...')
  
  for (const tableName of expectedTables) {
    if (keywordsTables.includes(tableName)) {
      const columnsResult = await postgresMetaAPI(`tables/${tableName}/columns`)
      if (columnsResult.success) {
        const columns = columnsResult.data
        const namingIssues = []
        
        columns.forEach(col => {
          // Check for camelCase vs snake_case inconsistencies
          if (col.name.includes('_') && /[A-Z]/.test(col.name)) {
            namingIssues.push(`Mixed case column: ${col.name} (should be snake_case)`)
          }
          if (col.name === 'User_Id') {
            namingIssues.push(`Inconsistent naming: User_Id should be user_id`)
          }
        })
        
        if (namingIssues.length > 0) {
          console.log(`   ⚠️  ${tableName} naming issues:`)
          namingIssues.forEach(issue => {
            console.log(`      - ${issue}`)
            issues.push(`${tableName}: ${issue}`)
          })
        } else {
          console.log(`   ✅ ${tableName} - consistent naming`)
        }
      }
    }
  }

  // Test REST API access for each table
  console.log('\n🌐 Testing REST API access...')
  for (const table of expectedTables) {
    if (keywordsTables.includes(table)) {
      const restResult = await testRESTAccess(table)
      if (restResult.success) {
        console.log(`   ✅ ${table} - REST API accessible`)
      } else {
        console.log(`   ❌ ${table} - REST API failed (${restResult.status || 'unknown'})`)
        issues.push(`REST API access failed for ${table}`)
      }
    }
  }

  return { success: allTablesPresent, issues }
}

// Validate indexes and identify optimization opportunities
const validateIndexes = async () => {
  console.log('\n🔍 Validating indexes and optimization opportunities...')
  
  const indexesResult = await postgresMetaAPI('indexes')
  if (!indexesResult.success) {
    console.log('❌ Failed to fetch indexes:', indexesResult.error)
    return { success: false, issues: [] }
  }

  const keywordsIndexes = indexesResult.data.filter(idx => 
    idx.table_name && (idx.table_name.includes('keyword') || idx.table_name.includes('data_scraping'))
  )
  
  console.log(`📊 Found ${keywordsIndexes.length} Keywords-related indexes`)
  
  // Group indexes by table
  const indexesByTable = {}
  const issues = []
  
  keywordsIndexes.forEach(idx => {
    if (!indexesByTable[idx.table_name]) {
      indexesByTable[idx.table_name] = []
    }
    indexesByTable[idx.table_name].push({
      name: idx.name,
      columns: idx.index_keys || [],
      unique: idx.is_unique || false
    })
  })

  // Analyze index coverage and suggest improvements
  const expectedIndexPatterns = {
    'keywords': [
      { pattern: ['user_id', 'gmail'], type: 'composite user lookup' },
      { pattern: ['status'], type: 'filtering' },
      { pattern: ['category'], type: 'filtering' },
      { pattern: ['created_at'], type: 'temporal queries' }
    ],
    'keyword_instagram_assignments': [
      { pattern: ['user_id', 'gmail'], type: 'user access' },
      { pattern: ['keyword_id'], type: 'foreign key' },
      { pattern: ['instagram_id'], type: 'foreign key' }
    ]
  }

  for (const [tableName, indexes] of Object.entries(indexesByTable)) {
    console.log(`   📋 ${tableName}: ${indexes.length} indexes`)
    indexes.forEach(idx => {
      console.log(`      - ${idx.name} (${idx.unique ? 'UNIQUE' : 'NON-UNIQUE'})`)
    })
    
    // Check for missing recommended indexes
    if (expectedIndexPatterns[tableName]) {
      const existingPatterns = indexes.map(idx => idx.columns?.join(',') || '').filter(p => p)
      expectedIndexPatterns[tableName].forEach(expected => {
        const patternStr = expected.pattern.join(',')
        if (!existingPatterns.some(existing => existing.includes(patternStr))) {
          issues.push(`Missing recommended index on ${tableName}(${patternStr}) for ${expected.type}`)
          console.log(`      ⚠️  Missing: ${expected.type} index on (${patternStr})`)
        }
      })
    }
  }

  // Suggest performance improvements
  console.log(`\n💡 Index optimization opportunities:`)
  console.log(`   - Composite indexes for common filter combinations`)
  console.log(`   - Covering indexes to avoid table lookups`)
  console.log(`   - Partial indexes for active records only`)
  console.log(`   - GIN indexes for full-text search on descriptions`)

  return { success: keywordsIndexes.length > 0, issues }
}

// Validate RLS policies and security
const validateRLS = async () => {
  console.log('\n🔐 Validating RLS policies...')
  
  const policiesResult = await postgresMetaAPI('policies')
  if (!policiesResult.success) {
    console.log('❌ Failed to fetch policies:', policiesResult.error)
    return { success: false, issues: [] }
  }

  const keywordsPolicies = policiesResult.data.filter(policy => 
    policy.table && (policy.table.includes('keyword') || policy.table.includes('data_scraping'))
  )
  
  console.log(`📊 Found ${keywordsPolicies.length} Keywords RLS policies`)
  
  // Group policies by table
  const policiesByTable = {}
  const issues = []
  
  keywordsPolicies.forEach(policy => {
    if (!policiesByTable[policy.table]) {
      policiesByTable[policy.table] = []
    }
    policiesByTable[policy.table].push({
      name: policy.name,
      command: policy.command, // SELECT, INSERT, UPDATE, DELETE
      definition: policy.definition
    })
  })

  for (const [tableName, policies] of Object.entries(policiesByTable)) {
    console.log(`   🔒 ${tableName}: ${policies.length} policies`)
    
    const commands = policies.map(p => p.command)
    const expectedCommands = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
    
    expectedCommands.forEach(cmd => {
      if (commands.includes(cmd)) {
        console.log(`      ✅ ${cmd} policy exists`)
      } else {
        console.log(`      ⚠️  Missing ${cmd} policy`)
        issues.push(`Missing ${cmd} policy for ${tableName}`)
      }
    })
    
    // Check for User_Id vs user_id inconsistency in policies
    policies.forEach(policy => {
      if (policy.definition && policy.definition.includes('"User_Id"')) {
        issues.push(`Policy ${policy.name} uses "User_Id" instead of user_id`)
        console.log(`      ⚠️  Policy uses "User_Id" instead of user_id: ${policy.name}`)
      }
    })
  }

  // Security improvement suggestions
  console.log(`\n💡 Security enhancement opportunities:`)
  console.log(`   - Granular policies for admin vs user access`)
  console.log(`   - Service role policies for automation`)
  console.log(`   - Audit trail policies for change tracking`)
  console.log(`   - Time-based access restrictions`)

  return { success: keywordsPolicies.length > 0, issues }
}

// Validate functions and triggers
const validateFunctions = async () => {
  console.log('\n⚙️  Validating functions and triggers...')
  
  const functionsResult = await postgresMetaAPI('functions')
  if (!functionsResult.success) {
    console.log('❌ Failed to fetch functions:', functionsResult.error)
    return { success: false, issues: [] }
  }

  const expectedFunctions = [
    'update_updated_at_column'
  ]

  const allFunctions = functionsResult.data.map(f => f.name)
  const issues = []
  
  let allFunctionsPresent = true
  for (const expectedFunc of expectedFunctions) {
    const isPresent = allFunctions.includes(expectedFunc)
    console.log(`   ${isPresent ? '✅' : '❌'} ${expectedFunc}`)
    if (!isPresent) {
      allFunctionsPresent = false
      issues.push(`Missing function: ${expectedFunc}`)
    }
  }

  // Check for triggers
  const triggersResult = await postgresMetaAPI('triggers')
  if (triggersResult.success) {
    const keywordsTriggers = triggersResult.data.filter(trigger => 
      trigger.table && trigger.table.includes('keyword')
    )
    console.log(`📊 Found ${keywordsTriggers.length} Keywords-related triggers`)
    
    keywordsTriggers.forEach(trigger => {
      console.log(`   ✅ ${trigger.name} on ${trigger.table}`)
    })
  }

  return { success: allFunctionsPresent, issues }
}

// Check for missing modern features
const checkModernFeatures = async () => {
  console.log('\n🚀 Checking for modern schema features...')
  
  const issues = []
  const suggestions = []
  
  // Check for audit columns
  const tablesResult = await postgresMetaAPI('tables')
  if (tablesResult.success) {
    const keywordsTables = tablesResult.data.filter(t => 
      t.name.includes('keyword') || t.name.includes('data_scraping')
    )
    
    for (const table of keywordsTables) {
      const columnsResult = await postgresMetaAPI(`tables/${table.name}/columns`)
      if (columnsResult.success) {
        const columnNames = columnsResult.data.map(col => col.name)
        
        // Check for audit trail columns
        const auditColumns = ['created_by', 'updated_by', 'deleted_at']
        const missingAudit = auditColumns.filter(col => !columnNames.includes(col))
        
        if (missingAudit.length > 0) {
          issues.push(`${table.name} missing audit columns: ${missingAudit.join(', ')}`)
          console.log(`   ⚠️  ${table.name} missing: ${missingAudit.join(', ')}`)
        } else {
          console.log(`   ✅ ${table.name} has audit columns`)
        }
        
        // Check for soft delete capability
        if (!columnNames.includes('deleted_at')) {
          suggestions.push(`Add soft delete capability to ${table.name}`)
        }
      }
    }
  }
  
  console.log(`\n💡 Modern feature recommendations:`)
  console.log(`   - Add audit trail columns (created_by, updated_by, deleted_at)`)
  console.log(`   - Implement soft delete functionality`)
  console.log(`   - Add comprehensive table/column comments`)
  console.log(`   - Create materialized views for analytics`)
  console.log(`   - Add JSONB columns for flexible metadata`)

  return { success: true, issues, suggestions }
}

// Performance analysis
const analyzePerformance = async () => {
  console.log('\n⚡ Performance analysis...')
  
  const start = Date.now()
  const tablesResult = await postgresMetaAPI('tables')
  const end = Date.now()
  
  if (tablesResult.success) {
    console.log(`   ✅ postgres-meta API response time: ${end - start}ms`)
    
    // Simulate common query patterns and suggest optimizations
    console.log(`\n💡 Query optimization opportunities:`)
    console.log(`   - User keyword lookup: Needs composite index on (user_id, gmail)`)
    console.log(`   - Active keywords filter: Needs partial index WHERE status = 'active'`)
    console.log(`   - Keyword search: Needs GIN index for full-text search`)
    console.log(`   - Assignment queries: Needs covering indexes for join elimination`)
    
    return { success: true, responseTime: end - start }
  } else {
    console.log('   ❌ Performance test failed')
    return { success: false, responseTime: null }
  }
}

// Main validation execution
const main = async () => {
  console.log('\n' + '='.repeat(80))
  console.log('🔍 KEYWORDS MANAGEMENT SCHEMA VALIDATION')
  console.log('='.repeat(80))

  const results = {
    tables: { success: false, issues: [] },
    indexes: { success: false, issues: [] },
    rls: { success: false, issues: [] },
    functions: { success: false, issues: [] },
    modernFeatures: { success: false, issues: [], suggestions: [] },
    performance: { success: false, responseTime: null }
  }

  try {
    // Run all validations
    results.tables = await validateTables()
    results.indexes = await validateIndexes()
    results.rls = await validateRLS()
    results.functions = await validateFunctions()
    results.modernFeatures = await checkModernFeatures()
    results.performance = await analyzePerformance()

    // Compile all issues
    const allIssues = [
      ...results.tables.issues,
      ...results.indexes.issues,
      ...results.rls.issues,
      ...results.functions.issues,
      ...results.modernFeatures.issues
    ]

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 VALIDATION SUMMARY')
    console.log('='.repeat(80))
    
    const criticalPassed = results.tables.success && results.rls.success
    
    for (const [test, result] of Object.entries(results)) {
      if (test === 'modernFeatures') continue // Handle separately
      console.log(`${result.success ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${result.success ? 'PASSED' : 'FAILED'}`)
    }
    
    console.log('\n📋 IDENTIFIED ISSUES:')
    if (allIssues.length === 0) {
      console.log('   ✅ No critical issues found')
    } else {
      allIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
    }
    
    console.log('\n🚀 MODERNIZATION OPPORTUNITIES:')
    if (results.modernFeatures.suggestions) {
      results.modernFeatures.suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion}`)
      })
    }
    
    if (criticalPassed && allIssues.length === 0) {
      console.log('\n🎉 SCHEMA IS FUNCTIONAL!')
      console.log('✅ Core functionality working correctly')
      console.log('💡 Ready for modernization enhancements')
    } else {
      console.log('\n⚠️  SCHEMA NEEDS ATTENTION')
      console.log(`Found ${allIssues.length} issues that should be addressed`)
      console.log('🔧 Recommend proceeding with modernization plan')
    }
    
    console.log('='.repeat(80))
    
    // Save results for migration planning
    const validationResults = {
      timestamp: new Date().toISOString(),
      results,
      totalIssues: allIssues.length,
      recommendations: [
        'Standardize all column names to snake_case',
        'Add audit trail columns (created_by, updated_by, deleted_at)',
        'Implement soft delete functionality',
        'Create composite indexes for common query patterns',
        'Add comprehensive RLS policies with granular permissions',
        'Create materialized views for analytics performance'
      ]
    }
    
    require('fs').writeFileSync(
      'keywords-schema-validation-results.json',
      JSON.stringify(validationResults, null, 2)
    )
    
    console.log('📄 Validation results saved to: keywords-schema-validation-results.json')
    
    process.exit(criticalPassed ? 0 : 1)

  } catch (error) {
    console.error('\n❌ Validation failed:', error)
    process.exit(1)
  }
}

// Execute validation
main().catch(console.error)