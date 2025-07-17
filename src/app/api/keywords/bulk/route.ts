import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { BulkKeywordOperation } from '@/lib/types/keywords'

// Initialize Supabase client
function createSupabaseClient() {
  const cookieStore = cookies()
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

// Get user from session
async function getUser() {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  return user
}

// POST /api/keywords/bulk - Bulk operations on keywords
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    const body: BulkKeywordOperation = await request.json()
    
    // Validate required fields
    if (!body.keywordIds || body.keywordIds.length === 0 || !body.operation) {
      return NextResponse.json({ error: 'Keyword IDs and operation are required' }, { status: 400 })
    }
    
    let result: any = null
    
    switch (body.operation) {
      case 'activate':
        result = await supabase
          .from('keywords')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .in('id', body.keywordIds)
          .eq('user_id', user.id)
        break
        
      case 'deactivate':
        result = await supabase
          .from('keywords')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .in('id', body.keywordIds)
          .eq('user_id', user.id)
        break
        
      case 'archive':
        result = await supabase
          .from('keywords')
          .update({ status: 'archived', updated_at: new Date().toISOString() })
          .in('id', body.keywordIds)
          .eq('user_id', user.id)
        break
        
      case 'delete':
        result = await supabase
          .from('keywords')
          .delete()
          .in('id', body.keywordIds)
          .eq('user_id', user.id)
        break
        
      case 'scrape':
        if (!body.scrapingType) {
          return NextResponse.json({ error: 'Scraping type is required for scrape operation' }, { status: 400 })
        }
        
        // Create scraping jobs for each keyword
        const jobs = body.keywordIds.map(keywordId => ({
          keyword_id: keywordId,
          job_type: body.scrapingType!,
          status: 'pending' as const,
          user_id: user.id,
          gmail: user.email
        }))
        
        result = await supabase
          .from('keyword_scraping_jobs')
          .insert(jobs)
          
        // In a real implementation, you would trigger the actual scraping process here
        // For now, we'll just create the jobs
        
        break
        
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }
    
    if (result.error) {
      console.error(`Error in bulk ${body.operation}:`, result.error)
      return NextResponse.json({ error: `Failed to ${body.operation} keywords` }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      operation: body.operation,
      affected: body.keywordIds.length 
    })
    
  } catch (error) {
    console.error('Error in POST /api/keywords/bulk:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/keywords/bulk - Get bulk operation status
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation')
    const status = searchParams.get('status')
    
    let query = supabase
      .from('keyword_scraping_jobs')
      .select(`
        *,
        keywords:keyword_id (
          keyword,
          category
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (operation) {
      query = query.eq('job_type', operation)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching bulk operations:', error)
      return NextResponse.json({ error: 'Failed to fetch bulk operations' }, { status: 500 })
    }
    
    return NextResponse.json({ jobs: data || [] })
    
  } catch (error) {
    console.error('Error in GET /api/keywords/bulk:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}