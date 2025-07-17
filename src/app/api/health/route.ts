import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check that verifies the server is running
    // You can add more sophisticated health checks here like:
    // - Database connectivity
    // - External service availability
    // - Memory/CPU usage
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  // For simple health checks that don't need response body
  return new Response(null, { status: 200 });
}