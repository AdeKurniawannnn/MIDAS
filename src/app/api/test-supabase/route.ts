import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Force dynamic rendering for API routes that use cookies
export const dynamic = 'force-dynamic'

// Initialize Supabase client for testing
function createSupabaseClient() {
  const cookieStore = cookies()
  
  console.log('🧪 Test - Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
  })
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          'Cookie': cookieStore.getAll()
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ')
        }
      }
    }
  )
}

// GET /api/test-supabase - Test Supabase connection and permissions
export async function GET(request: NextRequest) {
  console.log('🧪 Testing Supabase connection...')
  
  try {
    const supabase = createSupabaseClient()
    const results: any = {
      environmentVariables: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'
      }
    }

    // Test 1: Check authentication
    console.log('🧪 Test 1: Authentication...')
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      results.authentication = {
        success: !authError,
        hasUser: !!user,
        userEmail: user?.email || null,
        userId: user?.id || null,
        error: authError?.message || null
      }
      console.log('🧪 Auth test result:', results.authentication)
    } catch (err) {
      results.authentication = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown auth error'
      }
    }

    // Test 2: Test basic connection (try to read from a simple table)
    console.log('🧪 Test 2: Basic connection...')
    try {
      const { data, error: connectionError } = await supabase
        .from('keywords')
        .select('count(*)')
        .limit(1)
        
      results.connection = {
        success: !connectionError,
        error: connectionError?.message || null,
        details: connectionError?.details || null
      }
      console.log('🧪 Connection test result:', results.connection)
    } catch (err) {
      results.connection = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown connection error'
      }
    }

    // Test 3: Test table exists and structure
    console.log('🧪 Test 3: Table structure...')
    try {
      const { data, error: structureError } = await supabase
        .from('keywords')
        .select('*')
        .limit(1)
        
      results.tableStructure = {
        success: !structureError,
        error: structureError?.message || null,
        hint: structureError?.hint || null,
        code: structureError?.code || null,
        hasData: data && data.length > 0
      }
      
      if (data && data.length > 0) {
        results.tableStructure.sampleColumns = Object.keys(data[0])
      }
      console.log('🧪 Table structure test result:', results.tableStructure)
    } catch (err) {
      results.tableStructure = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown structure error'
      }
    }

    // Test 4: Test insert permission (if user is authenticated)
    if (results.authentication.success && results.authentication.hasUser) {
      console.log('🧪 Test 4: Insert permissions...')
      try {
        // Try to insert a test record (we'll delete it immediately)
        const testData = {
          keyword: 'TEST_KEYWORD_DELETE_ME',
          category: 'test',
          priority: '1',
          status: 'active',
          user_id: results.authentication.userId,
          email_user: results.authentication.userEmail,
          description: 'Test entry - should be deleted'
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from('keywords')
          .insert([testData])
          .select()
          
        if (!insertError && insertData && insertData.length > 0) {
          // Clean up: delete the test record
          await supabase
            .from('keywords')
            .delete()
            .eq('id', insertData[0].id)
            
          results.insertPermission = {
            success: true,
            message: 'Insert/delete permissions working correctly'
          }
        } else {
          results.insertPermission = {
            success: false,
            error: insertError?.message || null,
            details: insertError?.details || null,
            hint: insertError?.hint || null,
            code: insertError?.code || null
          }
        }
        console.log('🧪 Insert permission test result:', results.insertPermission)
      } catch (err) {
        results.insertPermission = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown insert error'
        }
      }
    } else {
      results.insertPermission = {
        skipped: true,
        reason: 'User not authenticated'
      }
    }

    console.log('🧪 All tests completed')
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: results
    })
    
  } catch (error) {
    console.error('🚫 Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}