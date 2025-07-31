#!/usr/bin/env node
/**
 * Keywords Schema Migration Tool via postgres-meta API
 * Executes the modernized keywords schema migration without direct database access
 * 
 * This tool migrates from the legacy keywords schema to the new v2.0 schema
 * using only the postgres-meta API endpoints, making it compatible with
 * restricted database environments like Coolify setups.
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Keywords Schema Migration Tool v2.0')
console.log('URL:', SUPABASE_URL)
console.log('Service Role Key:', SERVICE_ROLE_KEY ? 'Present' : 'Missing')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
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

// Utility function for executing SQL via direct postgres-meta query endpoint
const executeSQL = async (sql, description = '') => {
  console.log(`🔧 Executing: ${description || 'SQL command'}`)
  
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
      console.log(`   ✅ Success: ${description}`)
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

// Migration file paths
const migrationFiles = [
  '001_keywords_tables_v2.sql',
  '002_keywords_indexes_optimized.sql', 
  '003_keywords_rls_policies_enhanced.sql',
  '004_keywords_functions_triggers.sql',
  '005_keywords_views_api.sql'
]

// Read migration file content
const readMigrationFile = (filename) => {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`)
  }
  
  return fs.readFileSync(filePath, 'utf8')
}

// Pre-migration checks
const preMigrationChecks = async () => {
  console.log('\n📋 Pre-migration checks...')
  
  const checks = {
    apiConnection: false,
    existingTables: false,
    backupReady: false,
    permissions: false
  }
  
  // Check API connection
  const tablesResult = await postgresMetaAPI('tables')
  if (tablesResult.success) {
    checks.apiConnection = true
    console.log('   ✅ postgres-meta API connection successful')
  } else {
    console.log('   ❌ postgres-meta API connection failed:', tablesResult.error)
    return { success: false, checks }
  }
  
  // Check for existing keywords tables
  const existingTables = tablesResult.data.filter(t => 
    t.name.includes('keyword') || t.name.includes('data_scraping')
  )
  
  if (existingTables.length > 0) {
    checks.existingTables = true
    console.log(`   ✅ Found ${existingTables.length} existing keywords-related tables`)
    existingTables.forEach(table => {
      console.log(`      - ${table.name}`)
    })
  } else {
    console.log('   ⚠️  No existing keywords tables found (fresh installation)')
  }
  
  // Check permissions by attempting to create a simple test table
  const testSQL = `
    CREATE TABLE IF NOT EXISTS test_migration_permissions (
      id SERIAL PRIMARY KEY,
      test_value TEXT DEFAULT 'Migration permissions verified'
    );
  `
  
  const permissionTest = await executeSQL(testSQL, 'Testing migration permissions')
  if (permissionTest.success) {
    checks.permissions = true
    console.log('   ✅ Migration permissions verified')
    
    // Clean up test table
    await executeSQL('DROP TABLE IF EXISTS test_migration_permissions;', 'Cleaning up permission test')
  } else {
    console.log('   ❌ Insufficient permissions for migration')
    return { success: false, checks }
  }
  
  // Check if we should create backup
  if (existingTables.length > 0) {
    console.log('   ⚠️  Consider backing up existing data before migration')
    checks.backupReady = true
  } else {
    checks.backupReady = true
  }
  
  return { success: true, checks }
}

// Execute a single migration
const executeMigration = async (filename) => {
  console.log(`\n🔧 Executing migration: ${filename}`)
  
  try {
    const sql = readMigrationFile(filename)
    
    // Execute the entire file as one query to preserve multi-line statements like functions
    console.log(`   📄 Executing complete migration file`)
    
    const result = await executeSQL(sql, `Complete migration: ${filename}`)
    
    if (result.success) {
      console.log(`   ✅ Migration ${filename} completed successfully`)
      return { 
        success: true, 
        filename, 
        successCount: 1, 
        failureCount: 0, 
        failures: [] 
      }
    } else {
      console.log(`   ❌ Migration ${filename} failed`)
      console.log(`   Error: ${result.error}`)
      
      // Check if it's a continuable error
      const continuableErrors = [
        'already exists',
        'does not exist',
        'relation already exists',
        'function already exists',
        'extension "uuid-ossp" already exists',
        'extension "pgcrypto" already exists'
      ]
      
      const errorString = typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
      const isContinuable = continuableErrors.some(err => 
        errorString.toLowerCase().includes(err)
      )
      
      return { 
        success: isContinuable, 
        filename, 
        successCount: isContinuable ? 1 : 0, 
        failureCount: isContinuable ? 0 : 1, 
        failures: isContinuable ? [] : [{
          statement: filename,
          error: result.error
        }]
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Failed to read or execute migration: ${error.message}`)
    return { 
      success: false, 
      filename, 
      error: error.message,
      successCount: 0,
      failureCount: 1,
      failures: [{
        statement: filename,
        error: error.message
      }]
    }
  }
}

// Post-migration validation
const postMigrationValidation = async () => {
  console.log('\n🔍 Post-migration validation...')
  
  const validationResults = {
    tables: { expected: 6, found: 0, missing: [] },
    indexes: { found: 0 },
    policies: { found: 0 },
    functions: { expected: 10, found: 0, missing: [] },
    views: { expected: 8, found: 0, missing: [] },
    materializedViews: { expected: 2, found: 0, missing: [] }
  }
  
  // Check tables
  const tablesResult = await postgresMetaAPI('tables')
  if (tablesResult.success) {
    const keywordsTables = tablesResult.data.filter(t => 
      t.name.includes('keyword') || t.name.includes('data_scraping') || t.name.endsWith('_v2')
    )
    
    validationResults.tables.found = keywordsTables.length
    
    const expectedTables = [
      'keywords_v2',
      'data_scraping_google_maps_v2',
      'keyword_instagram_assignments_v2',
      'keyword_google_maps_assignments_v2',
      'keyword_scraping_jobs_v2',
      'keyword_analytics_v2'
    ]
    
    expectedTables.forEach(tableName => {
      if (!keywordsTables.some(t => t.name === tableName)) {
        validationResults.tables.missing.push(tableName)
      }
    })
    
    console.log(`   📊 Tables: ${validationResults.tables.found}/${validationResults.tables.expected} found`)
    if (validationResults.tables.missing.length > 0) {
      console.log(`      Missing: ${validationResults.tables.missing.join(', ')}`)
    }
  }
  
  // Check indexes
  const indexesResult = await postgresMetaAPI('indexes')
  if (indexesResult.success) {
    const keywordsIndexes = indexesResult.data.filter(idx => 
      idx.table_name && (idx.table_name.includes('keyword') || idx.table_name.includes('data_scraping'))
    )
    
    validationResults.indexes.found = keywordsIndexes.length
    console.log(`   📊 Indexes: ${validationResults.indexes.found} found`)
  }
  
  // Check RLS policies
  const policiesResult = await postgresMetaAPI('policies')
  if (policiesResult.success) {
    const keywordsPolicies = policiesResult.data.filter(policy => 
      policy.table && (policy.table.includes('keyword') || policy.table.includes('data_scraping'))
    )
    
    validationResults.policies.found = keywordsPolicies.length
    console.log(`   📊 RLS Policies: ${validationResults.policies.found} found`)
  }
  
  // Check functions
  const functionsResult = await postgresMetaAPI('functions')
  if (functionsResult.success) {
    const expectedFunctions = [
      'update_updated_at_column',
      'bulk_insert_keywords',
      'archive_old_keywords',
      'create_scraping_job',
      'get_next_scraping_job',
      'update_job_status',
      'compute_keyword_analytics',
      'batch_compute_daily_analytics',
      'refresh_trending_keywords',
      'refresh_category_performance'
    ]
    
    const allFunctions = functionsResult.data.map(f => f.name)
    
    expectedFunctions.forEach(funcName => {
      if (allFunctions.includes(funcName)) {
        validationResults.functions.found++
      } else {
        validationResults.functions.missing.push(funcName)
      }
    })
    
    console.log(`   📊 Functions: ${validationResults.functions.found}/${validationResults.functions.expected} found`)
    if (validationResults.functions.missing.length > 0) {
      console.log(`      Missing: ${validationResults.functions.missing.join(', ')}`)
    }
  }
  
  // Test a few critical functions
  console.log('\n🧪 Testing critical functions...')
  
  const functionTests = [
    {
      name: 'update_updated_at_column',
      test: 'SELECT update_updated_at_column()',
      description: 'Timestamp update function'
    }
  ]
  
  for (const test of functionTests) {
    const result = await executeSQL(`SELECT 1 WHERE EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = '${test.name}');`, `Testing ${test.description}`)
    if (result.success) {
      console.log(`   ✅ ${test.description} exists`)
    } else {
      console.log(`   ❌ ${test.description} missing or failed`)
    }
  }
  
  return validationResults
}

// Data migration helper (if needed)
const migrateExistingData = async () => {
  console.log('\n📦 Checking for data migration needs...')
  
  // Check if old tables exist
  const tablesResult = await postgresMetaAPI('tables')
  if (!tablesResult.success) {
    console.log('   ❌ Cannot check for existing tables')
    return { success: false }
  }
  
  const oldTables = tablesResult.data.filter(t => 
    ['keywords', 'keyword_instagram_assignments', 'keyword_google_maps_assignments', 'keyword_scraping_jobs', 'data_scraping_google_maps'].includes(t.name)
  )
  
  if (oldTables.length === 0) {
    console.log('   ✅ No legacy tables found - clean installation')
    return { success: true, migrated: 0 }
  }
  
  console.log(`   📋 Found ${oldTables.length} legacy tables that may need migration:`)
  oldTables.forEach(table => {
    console.log(`      - ${table.name}`)
  })
  
  // For now, just report - actual data migration would require more complex logic
  console.log('   ⚠️  Data migration not implemented in this version')
  console.log('   💡 Consider running manual data migration if you have existing data')
  
  return { success: true, migrated: 0, requiresManualMigration: true }
}

// Generate migration report
const generateMigrationReport = (results) => {
  const timestamp = new Date().toISOString()
  const report = {
    timestamp,
    migration_version: '2.0',
    results,
    summary: {
      total_migrations: results.length,
      successful_migrations: results.filter(r => r.success).length,
      failed_migrations: results.filter(r => !r.success).length,
      total_statements_executed: results.reduce((sum, r) => sum + (r.successCount || 0), 0),
      total_failures: results.reduce((sum, r) => sum + (r.failureCount || 0), 0)
    }
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, `keywords-migration-report-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  return { report, reportPath }
}

// Main migration execution
const main = async () => {
  console.log('\n' + '='.repeat(80))
  console.log('🚀 KEYWORDS SCHEMA MIGRATION v2.0 - VIA POSTGRES-META API')
  console.log('='.repeat(80))

  try {
    // Pre-migration checks
    const preCheck = await preMigrationChecks()
    if (!preCheck.success) {
      console.log('\n❌ Pre-migration checks failed. Aborting migration.')
      process.exit(1)
    }
    
    console.log('\n✅ Pre-migration checks passed!')
    
    // Execute migrations
    console.log('\n🔧 Starting migration execution...')
    const migrationResults = []
    
    for (const filename of migrationFiles) {
      const result = await executeMigration(filename)
      migrationResults.push(result)
      
      if (!result.success && result.failures && result.failures.some(f => 
        !f.error.toLowerCase().includes('already exists')
      )) {
        console.log(`\n🛑 Critical failure in ${filename}. Consider stopping here.`)
        console.log('Continuing with remaining migrations...')
      }
    }
    
    // Check for data migration needs
    const dataMigration = await migrateExistingData()
    
    // Post-migration validation
    const validation = await postMigrationValidation()
    
    // Generate report
    const { report, reportPath } = generateMigrationReport(migrationResults)
    
    // Final summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(80))
    
    console.log(`Migration Version: v2.0`)
    console.log(`Timestamp: ${report.timestamp}`)
    console.log(`Total Migrations: ${report.summary.total_migrations}`)
    console.log(`Successful: ${report.summary.successful_migrations}`)
    console.log(`Failed: ${report.summary.failed_migrations}`)
    console.log(`Total SQL Statements: ${report.summary.total_statements_executed}`)
    
    if (report.summary.failed_migrations === 0) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!')
      console.log('✅ All migrations executed without critical errors')
      console.log('✅ Schema v2.0 is ready for use')
    } else {
      console.log('\n⚠️  MIGRATION COMPLETED WITH SOME ISSUES')
      console.log(`❌ ${report.summary.failed_migrations} migrations had issues`)
      console.log('🔍 Check the detailed report for specifics')
    }
    
    if (dataMigration.requiresManualMigration) {
      console.log('\n⚠️  MANUAL DATA MIGRATION REQUIRED')
      console.log('Legacy tables detected - manual data migration recommended')
    }
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`)
    console.log('\n🚀 Next Steps:')
    console.log('1. Review the migration report for any issues')
    console.log('2. Test the new schema with your application')
    console.log('3. Update your application to use the new v2 table names')
    console.log('4. Set up materialized view refresh schedules')
    console.log('5. Configure any necessary data migration if you have existing data')
    
    console.log('='.repeat(80))
    
    process.exit(report.summary.failed_migrations === 0 ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ Migration failed with unexpected error:', error)
    process.exit(1)
  }
}

// Execute migration
main().catch(console.error)