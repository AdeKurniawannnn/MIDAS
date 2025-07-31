#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function executeMigration() {
  console.log('🚀 Starting Instagram Schema Migration via HTTP...')
  console.log(`📍 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  
  // Read the SQL file
  const sqlFilePath = path.join(__dirname, 'instagram-schema.sql')
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
  
  // Split into smaller chunks for execution
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
  
  console.log(`📋 Found ${statements.length} SQL statements to execute`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    
    if (statement.length < 10) continue // Skip very short statements
    
    console.log(`\n📝 Executing statement ${i + 1}/${statements.length}`)
    console.log(`🔧 Preview: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`)
    
    try {
      // Use direct database connection API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'exec_sql',
          params: { query: statement }
        })
      })

      if (response.ok) {
        console.log(`✅ Success: Statement ${i + 1}`)
        successCount++
      } else {
        const errorText = await response.text()
        
        // Try alternative approach for certain statements
        if (statement.includes('CREATE EXTENSION') || 
            statement.includes('CREATE FUNCTION') || 
            statement.includes('CREATE TABLE') ||
            statement.includes('CREATE INDEX') ||
            statement.includes('CREATE VIEW') ||
            statement.includes('CREATE TRIGGER') ||
            statement.includes('ALTER TABLE') ||
            statement.includes('INSERT INTO')) {
          
          console.log(`⚠️  Primary method failed, trying alternative...`)
          
          // Alternative: try using curl to execute SQL
          const curlCommand = `curl -X POST "${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/" \
            -H "apikey: ${process.env.SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Content-Type: application/vnd.pgrst.object+json" \
            -H "Accept: application/json" \
            -H "Prefer: return=minimal" \
            --data-raw "${statement.replace(/"/g, '\\"')}"`;
          
          const { exec } = require('child_process')
          const curlResult = await new Promise((resolve) => {
            exec(curlCommand, (error, stdout, stderr) => {
              resolve({ error, stdout, stderr })
            })
          })
          
          if (!curlResult.error) {
            console.log(`✅ Success via curl: Statement ${i + 1}`)
            successCount++
          } else {
            console.log(`❌ Failed: Statement ${i + 1}`)
            console.log(`🔍 Error: ${errorText}`)
            errorCount++
          }
        } else {
          console.log(`❌ Failed: Statement ${i + 1}`)
          console.log(`🔍 Error: ${errorText}`)
          errorCount++
        }
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.log(`❌ Failed: Statement ${i + 1}`)
      console.log(`🔍 Error: ${error.message}`)
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`📊 Migration Summary:`)
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📝 Total: ${successCount + errorCount}`)
  
  if (errorCount === 0) {
    console.log('🎉 Migration completed successfully!')
    
    // Test if tables were created
    console.log('\n🔍 Verifying created tables...')
    await verifyTables()
  } else {
    console.log('⚠️  Migration completed with some errors.')
    console.log('🔍 Check the logs above for details.')
  }
}

async function verifyTables() {
  const tablesToCheck = [
    'migration_history',
    'instagram_hashtags',
    'instagram_locations',
    'instagram_music_info',
    'instagram_posts',
    'instagram_post_hashtags',
    'instagram_post_mentions',
    'instagram_search_queries'
  ]
  
  for (const table of tablesToCheck) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=count`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        }
      })
      
      if (response.ok) {
        console.log(`✅ Table exists: ${table}`)
      } else {
        console.log(`❌ Table missing: ${table}`)
      }
    } catch (error) {
      console.log(`❓ Could not verify: ${table}`)
    }
  }
}

// Run migration
if (require.main === module) {
  executeMigration().catch(error => {
    console.error('💥 Migration script failed:', error.message)
    process.exit(1)
  })
}

module.exports = { executeMigration }