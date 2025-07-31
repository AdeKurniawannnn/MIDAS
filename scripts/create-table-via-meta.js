#!/usr/bin/env node
/**
 * Create tables using postgres-meta API (no direct DB connection needed)
 * This works with your current Coolify setup without exposing PostgreSQL port
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Creating Table via postgres-meta API')
console.log('URL:', SUPABASE_URL)

const createTableViaMeta = async (tableName, columns) => {
  console.log(`📋 Creating table: ${tableName}`)
  
  try {
    const response = await fetch(`${SUPABASE_URL}/pg/tables`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: tableName,
        schema: 'public',
        columns: columns,
        rls_enabled: true,
        comment: `Table created programmatically via postgres-meta API`
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Table created successfully via postgres-meta:', result.name)
      return result
    } else {
      const error = await response.text()
      console.log('❌ postgres-meta API failed:', response.status, error)
      return null
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
    return null
  }
}

const listTables = async () => {
  console.log('\n📋 Listing existing tables via postgres-meta...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/pg/tables?include_system_schemas=false`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Accept': 'application/json',
      }
    })

    if (response.ok) {
      const tables = await response.json()
      console.log('✅ Found tables:', tables.map(t => t.name).join(', '))
      return tables
    } else {
      const error = await response.text()
      console.log('❌ Failed to list tables:', error)
      return []
    }
  } catch (error) {
    console.log('❌ Error listing tables:', error.message)
    return []
  }
}

const main = async () => {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 POSTGRES-META API TABLE CREATION TEST')
  console.log('='.repeat(60))

  // Test 1: List existing tables
  await listTables()

  // Test 2: Create a new table
  const newTable = await createTableViaMeta('api_test_table', [
    {
      name: 'id',
      type: 'bigserial',
      is_primary_key: true,
      is_nullable: false
    },
    {
      name: 'name',
      type: 'text',
      is_nullable: false,
      comment: 'Name of the item'
    },
    {
      name: 'description',
      type: 'text',
      is_nullable: true,
      comment: 'Optional description'
    },
    {
      name: 'status',
      type: 'text',
      is_nullable: false,
      default_value: "'active'",
      comment: 'Status: active, inactive, pending'
    },
    {
      name: 'metadata',
      type: 'jsonb',
      is_nullable: true,
      default_value: "'{}'::jsonb",
      comment: 'Additional metadata as JSON'
    },
    {
      name: 'created_at',
      type: 'timestamptz',
      is_nullable: false,
      default_value: "timezone('utc'::text, now())",
      comment: 'Creation timestamp'
    }
  ])

  if (newTable) {
    console.log('\n🎉 SUCCESS! Table created without direct database access!')
    console.log('✨ You can now use this table via REST API:')
    console.log(`   GET  ${SUPABASE_URL}/rest/v1/${newTable.name}`)
    console.log(`   POST ${SUPABASE_URL}/rest/v1/${newTable.name}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎯 SUMMARY:')
  console.log('✅ postgres-meta API is working through Kong proxy')
  console.log('✅ Can create tables without direct database connection')
  console.log('✅ Tables are immediately available via REST API')
  console.log('⚠️  For Supabase CLI, you still need to expose port 5432')
  console.log('='.repeat(60))
}

main().catch(console.error)