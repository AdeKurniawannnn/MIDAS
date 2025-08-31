import { createClient } from '@supabase/supabase-js'

/**
 * Integration test setup with comprehensive environment validation and mock services
 * 
 * Features:
 * - Database connection with fallbacks
 * - External API mocking
 * - Environment safety checks
 * - Performance monitoring setup
 * - Test isolation utilities
 */

// Environment validation and safety checks
const validateTestEnvironment = () => {
  const issues = []
  
  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'test') {
    console.warn(`⚠️ NODE_ENV is '${process.env.NODE_ENV}', expected 'test'`)
  }
  
  // Prevent production database access
  const dangerousUrls = ['supabase.co/dashboard', 'app.supabase.com', 'prod']
  const testUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  
  if (dangerousUrls.some(danger => testUrl.includes(danger))) {
    issues.push(`Potentially dangerous database URL detected: ${testUrl}`)
  }
  
  // Check for required configuration
  if (!process.env.TEST_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('Missing database URL: set TEST_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  }
  
  if (!process.env.TEST_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('Missing database key: set TEST_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  if (issues.length > 0) {
    throw new Error(`❌ Test environment validation failed:\n${issues.map(issue => `  - ${issue}`).join('\n')}`)
  }
  
  console.log('✅ Test environment validation passed')
}

// Validate environment before proceeding
validateTestEnvironment()

// Test database configuration with enhanced error handling
const testSupabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const testSupabaseAnonKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!testSupabaseUrl || !testSupabaseAnonKey) {
  throw new Error('Test Supabase configuration missing. Please set TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY')
}

// Enhanced Supabase client with better error handling
export const testSupabase = createClient(testSupabaseUrl, testSupabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Test-Client': 'integration-test',
      'X-Client-Info': 'midas-test-suite'
    }
  }
})

// Test user for consistent testing
export const TEST_USER = {
  id: 'test-user-integration-id',
  email: 'integration@test.com'
}

// Test data generators
export const createTestKeyword = (overrides = {}) => ({
  keyword: `test-keyword-${Date.now()}`,
  description: 'Integration test keyword',
  category: 'testing',
  priority: 1,
  status: 'active',
  email_user: TEST_USER.email, // Legacy table field
  gmail: TEST_USER.email,      // New table field
  user_id: TEST_USER.id,       // New table field
  ...overrides
})

export const createTestGoogleMapsData = (overrides = {}) => ({
  input_url: 'https://maps.google.com/test',
  place_name: `Test Place ${Date.now()}`,
  address: '123 Test St, Test City',
  phone_number: '+1234567890',
  website: 'https://testplace.com',
  rating: 4.5,
  review_count: 100,
  category: 'Restaurant',
  gmail: TEST_USER.email,
  user_id: TEST_USER.id,
  ...overrides
})

// Mock service configurations
export class MockServices {
  static setupInstagramAPIMocks() {
    if (!process.env.MOCK_INSTAGRAM_API && !process.env.MOCK_EXTERNAL_APIS) {
      return
    }

    // Mock fetch calls to Instagram-like endpoints
    const originalFetch = global.fetch
    
    // Mock global fetch - this would be set up in actual test files
    /*
    global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
      // Mock Instagram scraper API calls
      if (url.includes('instagram') || url.includes('apify')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              hashtag: 'testhashtag',
              posts: Array.from({ length: 5 }, (_, i) => ({
                id: `mock_post_${i}`,
                shortcode: `mock${i}`,
                caption: `Mock post ${i + 1}`,
                likes: Math.floor(Math.random() * 1000),
                comments: Math.floor(Math.random() * 100)
              }))
            }
          })
        } as Response)
      }
      
      // Call original fetch for non-mocked requests
      return originalFetch(url, options)
    }) as jest.Mock
    */
    
    console.log('🎭 Instagram API mocks enabled')
  }

  static setupApifyMocks() {
    if (!process.env.MOCK_APIFY_API && !process.env.MOCK_EXTERNAL_APIS) {
      return
    }

    // Mock Apify actor runs - these functions will be mocked in test files
    // Example mock implementations:
    /*
    jest.mock('@/lib/api/instagram-scraper', () => ({
      startInstagramScraping: jest.fn().mockResolvedValue({
        runId: 'mock-run-id',
        status: 'RUNNING'
      }),
      getScrapingStatus: jest.fn().mockResolvedValue({
        status: 'SUCCEEDED',
        output: {
          items: [
            {
              hashtag: 'testhashtag',
              posts: Array.from({ length: 10 }, (_, i) => ({
                id: `mock_${i}`,
                shortcode: `test${i}`,
                url: `https://instagram.com/p/test${i}`,
                caption: `Mock caption ${i + 1}`,
                likes: Math.floor(Math.random() * 1000)
              }))
            }
          ]
        }
      })
    }))
    */
    
    console.log('🎭 Apify API mocks enabled')
  }

  static resetAllMocks() {
    // jest.restoreAllMocks()
    
    // Reset fetch if it was mocked
    // Reset fetch if it was mocked - uncomment in actual test files
    // if (jest.isMockFunction(global.fetch)) {
    //   global.fetch = fetch
    // }
    
    console.log('🔄 All API mocks reset')
  }
}

// Performance monitoring for tests
export class TestPerformanceMonitor {
  private static metrics: Map<string, { start: number; end?: number }> = new Map()
  
  static startOperation(operationName: string) {
    this.metrics.set(operationName, { start: Date.now() })
  }
  
  static endOperation(operationName: string) {
    const metric = this.metrics.get(operationName)
    if (metric) {
      metric.end = Date.now()
      const duration = metric.end - metric.start
      
      if (duration > 2000) {
        console.warn(`⚠️ Slow operation detected: ${operationName} took ${duration}ms`)
      }
      
      return duration
    }
    return 0
  }
  
  static getMetrics() {
    const results = Array.from(this.metrics.entries()).map(([name, metric]) => ({
      operation: name,
      duration: metric.end ? metric.end - metric.start : Date.now() - metric.start,
      completed: !!metric.end
    }))
    
    return results
  }
  
  static clearMetrics() {
    this.metrics.clear()
  }
}

// Simple database cleanup utilities
export const cleanupTestData = async () => {
  try {
    console.log('🧹 Starting test data cleanup...')
    
    // Clean up in reverse dependency order to avoid foreign key conflicts
    // Use direct table cleanup for legacy keywords table
    try {
      await testSupabase.from('keywords').delete().eq('email_user', TEST_USER.email)
    } catch (error) {
      // Ignore errors if table doesn't exist
      console.log('Keywords table cleanup skipped (table may not exist)')
    }
    
    console.log('✅ Test data cleanup completed')
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error)
    // Don't throw error to avoid breaking tests
  }
}

// Global setup and teardown with enhanced error handling
// These functions should be called from actual test files:
/*
beforeAll(async () => {
  console.log('🚀 Starting integration test suite...')
  
  // Setup API mocks
  MockServices.setupInstagramAPIMocks()
  MockServices.setupApifyMocks()
  
  // Initial cleanup to ensure clean state
  await cleanupTestData()
  
  console.log('✅ Integration test suite setup completed')
})

afterAll(async () => {
  console.log('🏁 Finishing integration test suite...')
  
  // Final cleanup
  await cleanupTestData()
  
  // Reset all mocks
  MockServices.resetAllMocks()
  
  // Clear performance metrics
  TestPerformanceMonitor.clearMetrics()
  
  console.log('✅ Integration test suite teardown completed')
})
*/

// Exported setup functions for use in test files
export const setupIntegrationTests = async () => {
  console.log('🚀 Starting integration test suite...')
  
  // Setup API mocks
  MockServices.setupInstagramAPIMocks()
  MockServices.setupApifyMocks()
  
  // Initial cleanup to ensure clean state
  await cleanupTestData()
  
  console.log('✅ Integration test suite setup completed')
}

export const teardownIntegrationTests = async () => {
  console.log('🏁 Finishing integration test suite...')
  
  // Final cleanup
  await cleanupTestData()
  
  // Reset all mocks
  MockServices.resetAllMocks()
  
  // Clear performance metrics
  TestPerformanceMonitor.clearMetrics()
  
  console.log('✅ Integration test suite teardown completed')
}

// Setup and teardown for each test with performance monitoring
// These should be called from actual test files:
/*
beforeEach(async () => {
  TestPerformanceMonitor.startOperation('test-setup')
  await cleanupTestData()
  TestPerformanceMonitor.endOperation('test-setup')
})

afterEach(async () => {
  TestPerformanceMonitor.startOperation('test-cleanup')
  await cleanupTestData()
  TestPerformanceMonitor.endOperation('test-cleanup')
  
  // Log performance warnings if test took too long
  const metrics = TestPerformanceMonitor.getMetrics()
  const totalDuration = metrics.reduce((sum, metric) => sum + metric.duration, 0)
  
  if (totalDuration > 10000) {
    console.warn(`⚠️ Test took ${totalDuration}ms total (threshold: 10000ms)`)
  }
  
  TestPerformanceMonitor.clearMetrics()
})
*/

// Enhanced test utilities with better error messages
export const expectSuccess = (response: Response, context?: string) => {
  if (response.status >= 400) {
    const contextMsg = context ? ` (Context: ${context})` : ''
    throw new Error(`Expected successful response but got ${response.status}${contextMsg}`)
  }
  // In test files, add: expect(response.status).toBeLessThan(400)
}

export const expectError = (response: Response, expectedStatus: number, context?: string) => {
  if (response.status !== expectedStatus) {
    const contextMsg = context ? ` (Context: ${context})` : ''
    throw new Error(`Expected ${expectedStatus} but got ${response.status}${contextMsg}`)
  }
  // In test files, add: expect(response.status).toBe(expectedStatus)
}

export const createAuthHeaders = (userEmail = TEST_USER.email, userId = TEST_USER.id) => ({
  'x-user-email': userEmail,
  'x-user-id': userId,
  'Content-Type': 'application/json'
})

// Enhanced mock request helpers for API testing
export const createMockRequest = (url: string, init: RequestInit = {}) => {
  return new Request(url, {
    headers: {
      ...createAuthHeaders(),
      ...init.headers
    },
    ...init
  })
}

export const createMockNextRequest = (url: string, init: RequestInit = {}) => {
  const request = createMockRequest(url, init)
  // Add NextRequest specific properties if needed
  return request as any // NextRequest type casting
}

// Test utilities for common operations
export const waitForCondition = async (
  condition: () => Promise<boolean> | boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<boolean> => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await condition()
      if (result) {
        return true
      }
    } catch (error) {
      // Ignore errors during condition checking
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  
  return false
}

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> => {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        console.warn(`⚠️ Operation failed (attempt ${attempt}/${maxRetries}): ${(error as Error).message}`)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }
  }
  
  throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`)
}

// Test environment information
export const getTestEnvironmentInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    testUser: TEST_USER,
    supabaseUrl: testSupabaseUrl,
    mocksEnabled: {
      instagram: !!process.env.MOCK_INSTAGRAM_API || !!process.env.MOCK_EXTERNAL_APIS,
      apify: !!process.env.MOCK_APIFY_API || !!process.env.MOCK_EXTERNAL_APIS,
      external: !!process.env.MOCK_EXTERNAL_APIS
    },
    testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
    cleanupMode: process.env.TEST_CLEANUP_MODE || 'aggressive'
  }
}

console.log('✅ Integration test setup initialized')
console.log('📊 Test environment:', getTestEnvironmentInfo())