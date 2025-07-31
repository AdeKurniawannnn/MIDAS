import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    action: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { action } = params
    
    // Check authentication and admin role
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 })
    }

    // Execute specific SQL chunk
    if (action === 'execute-chunk') {
      const { chunk_id, sql, migration_name } = await request.json()
      
      if (!chunk_id || !sql || !migration_name) {
        return NextResponse.json({
          error: 'Missing required fields: chunk_id, sql, migration_name'
        }, { status: 400 })
      }

      const startTime = Date.now()
      
      try {
        // Execute the SQL
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql: sql
        })

        const executionTime = Date.now() - startTime

        if (sqlError) {
          // Log failed migration
          await supabase.from('migration_history').insert({
            migration_name,
            chunk_id,
            chunk_name: chunk_id,
            executed_by: session.user.id,
            success: false,
            error_message: sqlError.message,
            execution_time_ms: executionTime
          })

          return NextResponse.json({
            error: `Migration chunk failed: ${chunk_id}`,
            details: sqlError.message
          }, { status: 500 })
        }

        // Log successful migration
        await supabase.from('migration_history').insert({
          migration_name,
          chunk_id,
          chunk_name: chunk_id,
          executed_by: session.user.id,
          success: true,
          execution_time_ms: executionTime
        })

        return NextResponse.json({
          success: true,
          message: `Migration chunk ${chunk_id} executed successfully`,
          execution_time_ms: executionTime
        })

      } catch (error) {
        const executionTime = Date.now() - startTime
        
        // Log failed migration
        await supabase.from('migration_history').insert({
          migration_name,
          chunk_id,
          chunk_name: chunk_id,
          executed_by: session.user.id,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          execution_time_ms: executionTime
        })

        return NextResponse.json({
          error: `Migration chunk failed: ${chunk_id}`,
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    // Rollback migration (drop tables)
    if (action === 'rollback') {
      const { migration_name } = await request.json()
      
      if (!migration_name) {
        return NextResponse.json({
          error: 'Missing migration_name'
        }, { status: 400 })
      }

      const rollbackSQL = `
        -- Drop Instagram schema tables in reverse dependency order
        DROP VIEW IF EXISTS public.user_post_analytics;
        DROP VIEW IF EXISTS public.hashtag_analytics;
        
        DROP TRIGGER IF EXISTS update_instagram_posts_updated_at ON public.instagram_posts;
        DROP TRIGGER IF EXISTS update_instagram_hashtags_updated_at ON public.instagram_hashtags;
        
        DROP TABLE IF EXISTS public.instagram_post_mentions CASCADE;
        DROP TABLE IF EXISTS public.instagram_post_hashtags CASCADE;
        DROP TABLE IF EXISTS public.instagram_search_queries CASCADE;
        DROP TABLE IF EXISTS public.instagram_posts CASCADE;
        DROP TABLE IF EXISTS public.instagram_music_info CASCADE;
        DROP TABLE IF EXISTS public.instagram_locations CASCADE;
        DROP TABLE IF EXISTS public.instagram_hashtags CASCADE;
        
        DROP FUNCTION IF EXISTS insert_instagram_hashtag_data(UUID, TEXT, JSONB, TEXT);
        DROP FUNCTION IF EXISTS update_updated_at_column();
      `

      const startTime = Date.now()
      
      try {
        const { error: rollbackError } = await supabase.rpc('execute_sql', {
          sql: rollbackSQL
        })

        const executionTime = Date.now() - startTime

        if (rollbackError) {
          return NextResponse.json({
            error: 'Rollback failed',
            details: rollbackError.message
          }, { status: 500 })
        }

        // Log rollback
        await supabase.from('migration_history').insert({
          migration_name: `${migration_name}_rollback`,
          chunk_id: 'rollback',
          chunk_name: 'Full Rollback',
          executed_by: session.user.id,
          success: true,
          execution_time_ms: executionTime
        })

        return NextResponse.json({
          success: true,
          message: 'Migration rolled back successfully',
          execution_time_ms: executionTime
        })

      } catch (error) {
        return NextResponse.json({
          error: 'Rollback failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    // Check migration status
    if (action === 'check-status') {
      const { migration_name } = await request.json()

      // Check if tables exist
      const tableCheckSQL = `
        SELECT 
          table_name,
          CASE 
            WHEN table_name IS NOT NULL THEN true 
            ELSE false 
          END as exists
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'instagram_hashtags',
          'instagram_locations', 
          'instagram_music_info',
          'instagram_posts',
          'instagram_post_hashtags',
          'instagram_post_mentions',
          'instagram_search_queries',
          'migration_history'
        );
      `

      const { data: tableStatus, error: tableError } = await supabase.rpc('execute_sql', {
        sql: tableCheckSQL
      })

      if (tableError) {
        return NextResponse.json({
          error: 'Failed to check table status',
          details: tableError.message
        }, { status: 500 })
      }

      // Get recent migration history
      const { data: history, error: historyError } = await supabase
        .from('migration_history')
        .select('*')
        .eq('migration_name', migration_name || 'instagram_scraper_schema')
        .order('executed_at', { ascending: false })
        .limit(10)

      return NextResponse.json({
        success: true,
        tables: tableStatus,
        recent_history: history || [],
        migration_name: migration_name || 'instagram_scraper_schema'
      })
    }

    return NextResponse.json({
      error: 'Invalid action',
      available_actions: ['execute-chunk', 'rollback', 'check-status']
    }, { status: 400 })

  } catch (error) {
    console.error('Migration action error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { action } = params
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'history') {
      const { data: history, error } = await supabase
        .from('migration_history')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50)

      if (error) {
        return NextResponse.json({
          error: 'Failed to fetch migration history',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        history
      })
    }

    if (action === 'tables') {
      // Check existing Instagram tables
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', 'instagram_%')

      return NextResponse.json({
        success: true,
        instagram_tables: tables || []
      })
    }

    return NextResponse.json({
      error: 'Invalid action',
      available_actions: ['history', 'tables']
    }, { status: 400 })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}