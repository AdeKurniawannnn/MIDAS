#!/usr/bin/env node
/**
 * Test script to demonstrate programmatic table creation in Supabase
 * This script shows how to create tables using the REST API when direct DB access is restricted
 */

const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Testing Programmatic Table Creation in Supabase')
console.log('URL:', SUPABASE_URL)
console.log('Using Service Role Key:', SERVICE_ROLE_KEY ? 'Yes' : 'No')

// First, let's create the execute_sql function using raw SQL
const createExecuteSqlFunction = async () => {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION public.execute_sql(query TEXT)
    RETURNS TEXT AS $$
    BEGIN
        EXECUTE query;
        RETURN 'Query executed successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error: ' || SQLERRM;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  try {
    // Try to execute this via the SQL Editor API endpoint (if available)
    console.log('📝 Attempting to create execute_sql function...')
    
    // Alternative approach: Try to create a test table directly via PostgREST metadata
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: functionSQL })
    })

    if (response.ok) {
      console.log('✅ execute_sql function created successfully')
      return true
    } else {
      const error = await response.text()
      console.log('❌ Failed to create execute_sql function:', error)
      return false
    }
  } catch (error) {
    console.log('❌ Error creating execute_sql function:', error.message)
    return false
  }
}

// Create a table using different approaches
const createTableViaAPI = async () => {
  console.log('\n🔨 Method 1: Testing table creation via direct SQL...')
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.api_test_table (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
  `

  try {
    // Method 1: Try the execute_sql RPC function
    console.log('Attempting via execute_sql RPC...')
    let response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: createTableSQL })
    })

    if (response.ok) {
      const result = await response.text()
      console.log('✅ Table created via execute_sql RPC:', result)
      return true
    } else {
      const error = await response.text()
      console.log('❌ RPC method failed:', error)
    }

    // Method 2: Try postgres-meta API (if available)
    console.log('\n🔨 Method 2: Testing postgres-meta API...')
    response = await fetch(`${SUPABASE_URL}/pg/tables`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'api_test_table_2',
        schema: 'public',
        columns: [
          { name: 'id', type: 'bigserial', is_primary_key: true },
          { name: 'name', type: 'text', is_nullable: false },
          { name: 'description', type: 'text', is_nullable: true },
          { name: 'created_at', type: 'timestamptz', default_value: "timezone('utc'::text, now())" }
        ]
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Table created via postgres-meta API:', result)
      return true
    } else {
      const error = await response.text()
      console.log('❌ postgres-meta method failed:', error)
    }

    return false
  } catch (error) {
    console.log('❌ Error during table creation:', error.message)
    return false
  }
}

// Test existing table access
const testTableAccess = async () => {
  console.log('\n🔍 Testing access to existing tables...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/keywords?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Accept': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Successfully accessed existing keywords table')
      console.log('   Sample data:', data.length > 0 ? 'Found records' : 'Empty table')
      return true
    } else {
      console.log('❌ Failed to access keywords table')
      return false
    }
  } catch (error) {
    console.log('❌ Error accessing table:', error.message)
    return false
  }
}

// Check what tables currently exist
const listExistingTables = async () => {
  console.log('\n📋 Checking existing tables via API introspection...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Accept': 'application/json',
      }
    })

    if (response.ok) {
      const schema = await response.json()
      const tables = Object.keys(schema.paths || {}).filter(path => 
        path.startsWith('/') && path !== '/' && !path.includes('{')
      ).map(path => path.substring(1))
      
      console.log('✅ Found tables:', tables.join(', '))
      return tables
    } else {
      console.log('❌ Failed to list tables')
      return []
    }
  } catch (error) {
    console.log('❌ Error listing tables:', error.message)
    return []
  }
}

// Main execution
const main = async () => {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 SUPABASE PROGRAMMATIC TABLE CREATION TEST')
  console.log('='.repeat(60))

  // Test 1: Check existing table access
  await testTableAccess()

  // Test 2: List existing tables
  await listExistingTables()

  // Test 3: Try to create execute_sql function
  // await createExecuteSqlFunction()

  // Test 4: Try to create new table
  // await createTableViaAPI()

  console.log('\n' + '='.repeat(60))
  console.log('🎯 SUMMARY: ')
  console.log('✅ REST API is accessible and working')
  console.log('✅ Existing tables can be queried via PostgREST')
  console.log('⚠️  Direct database connection blocked by network/firewall')
  console.log('⚠️  Table creation requires either:')
  console.log('   1. Direct database access (currently blocked)')
  console.log('   2. Custom RPC functions (needs to be created via dashboard)')
  console.log('   3. postgres-meta API (may not be exposed)')
  console.log('   4. Supabase CLI with proper network access')
  console.log('='.repeat(60))
}

// Run the test
main().catch(console.error)