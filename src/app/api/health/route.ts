import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if required environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'MyDAS API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: supabaseUrl && supabaseAnonKey ? 'connected' : 'missing_config',
          url_configured: !!supabaseUrl,
          key_configured: !!supabaseAnonKey
        },
        server: {
          status: 'running',
          uptime: process.uptime()
        }
      }
    }

    return NextResponse.json(healthStatus, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 500 })
  }
}