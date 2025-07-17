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

// POST /api/keywords/assignments - Create keyword assignments
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    const body = await request.json()
    const { assignments, assignmentType, targetId } = body
    
    // Validate required fields
    if (!assignments || !assignmentType || !targetId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Determine the table name based on assignment type
    const tableName = assignmentType === 'instagram' 
      ? 'keyword_instagram_assignments' 
      : 'keyword_google_maps_assignments'
    
    // Clear existing assignments for this target
    const deleteField = assignmentType === 'instagram' ? 'instagram_id' : 'google_maps_id'
    await supabase
      .from(tableName)
      .delete()
      .eq(deleteField, targetId)
      .eq('user_id', user.id)
    
    // Insert new assignments if any
    if (assignments.length > 0) {
      const { error } = await supabase
        .from(tableName)
        .insert(assignments)
      
      if (error) {
        console.error('Error creating assignments:', error)
        return NextResponse.json({ error: 'Failed to create assignments' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in POST /api/keywords/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/keywords/assignments - Get keyword assignments
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    const { searchParams } = new URL(request.url)
    const assignmentType = searchParams.get('type') // 'instagram' or 'google_maps'
    const targetId = searchParams.get('targetId')
    
    if (!assignmentType || !targetId) {
      return NextResponse.json({ error: 'Missing type or targetId' }, { status: 400 })
    }
    
    // Determine the table name and field
    const tableName = assignmentType === 'instagram' 
      ? 'keyword_instagram_assignments' 
      : 'keyword_google_maps_assignments'
    const targetField = assignmentType === 'instagram' ? 'instagram_id' : 'google_maps_id'
    
    // Fetch assignments with keyword details
    const { data, error } = await supabase
      .from(tableName)
      .select(`
        *,
        keywords:keyword_id (
          id,
          keyword,
          description,
          category,
          status
        )
      `)
      .eq(targetField, parseInt(targetId))
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }
    
    return NextResponse.json({ assignments: data || [] })
    
  } catch (error) {
    console.error('Error in GET /api/keywords/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/keywords/assignments - Delete keyword assignment
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = createSupabaseClient()
    
    const { searchParams } = new URL(request.url)
    const assignmentType = searchParams.get('type')
    const assignmentId = searchParams.get('id')
    
    if (!assignmentType || !assignmentId) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
    }
    
    // Determine the table name
    const tableName = assignmentType === 'instagram' 
      ? 'keyword_instagram_assignments' 
      : 'keyword_google_maps_assignments'
    
    // Delete assignment
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', parseInt(assignmentId))
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error deleting assignment:', error)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in DELETE /api/keywords/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}