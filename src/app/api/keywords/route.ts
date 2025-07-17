import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Keyword, KeywordFormData, KeywordFilters } from '@/lib/types/keywords'

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

// GET /api/keywords - Get all keywords for user
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status') as 'active' | 'inactive' | 'archived'
    const priority = searchParams.get('priority')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Build query
    let query = supabase
      .from('keywords')
      .select('*')
      .eq('user_id', user.id)
    
    // Apply filters
    if (search) {
      query = query.or(`keyword.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (priority) {
      query = query.eq('priority', parseInt(priority))
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data: keywords, error, count } = await query
    
    if (error) {
      console.error('Error fetching keywords:', error)
      return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
    }
    
    return NextResponse.json({
      keywords: keywords || [],
      total: count || 0,
      page,
      limit
    })
    
  } catch (error) {
    console.error('Error in GET /api/keywords:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/keywords - Create new keyword
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    const body: KeywordFormData = await request.json()
    
    // Validate required fields
    if (!body.keyword || !body.category) {
      return NextResponse.json({ error: 'Keyword and category are required' }, { status: 400 })
    }
    
    // Create keyword
    const { data, error } = await supabase
      .from('keywords')
      .insert([
        {
          keyword: body.keyword.trim(),
          description: body.description?.trim(),
          category: body.category,
          priority: body.priority || 1,
          status: body.status || 'active',
          user_id: user.id,
          gmail: user.email
        }
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating keyword:', error)
      return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 })
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in POST /api/keywords:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/keywords - Update keyword
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    const body: KeywordFormData & { id: number } = await request.json()
    
    // Validate required fields
    if (!body.id || !body.keyword || !body.category) {
      return NextResponse.json({ error: 'ID, keyword and category are required' }, { status: 400 })
    }
    
    // Update keyword
    const { data, error } = await supabase
      .from('keywords')
      .update({
        keyword: body.keyword.trim(),
        description: body.description?.trim(),
        category: body.category,
        priority: body.priority || 1,
        status: body.status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating keyword:', error)
      return NextResponse.json({ error: 'Failed to update keyword' }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in PUT /api/keywords:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/keywords - Delete keyword
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    // Delete keyword (cascading delete will handle assignments)
    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', parseInt(id))
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error deleting keyword:', error)
      return NextResponse.json({ error: 'Failed to delete keyword' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in DELETE /api/keywords:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}