import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

// GET /api/keywords/stats - Get keyword statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    // Get all keywords for the user
    const { data: keywords, error } = await supabase
      .from('keywords')
      .select('status, category')
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error fetching keywords for stats:', error)
      return NextResponse.json({ error: 'Failed to fetch keyword stats' }, { status: 500 })
    }
    
    // Calculate stats
    const stats = {
      total: keywords?.length || 0,
      active: keywords?.filter(k => k.status === 'active').length || 0,
      inactive: keywords?.filter(k => k.status === 'inactive').length || 0,
      archived: keywords?.filter(k => k.status === 'archived').length || 0,
      categories: {} as { [key: string]: number }
    }
    
    // Count by category
    keywords?.forEach(keyword => {
      if (keyword.category) {
        stats.categories[keyword.category] = (stats.categories[keyword.category] || 0) + 1
      }
    })
    
    // Get recent jobs count
    const { data: recentJobs, error: jobsError } = await supabase
      .from('keyword_scraping_jobs')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    
    if (!jobsError) {
      (stats as any).recentJobs = recentJobs?.length || 0
    }
    
    return NextResponse.json(stats)
    
  } catch (error) {
    console.error('Error in GET /api/keywords/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}