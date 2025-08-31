import { testSupabase, TEST_USER } from './integration-setup'

/**
 * Test database utilities for seeding and managing test data with transaction management
 * 
 * Features:
 * - Transaction-based test isolation 
 * - Fast data seeding and cleanup
 * - Comprehensive error handling
 * - Performance monitoring
 * - Data validation utilities
 */

// Transaction management for test isolation
export class TestTransaction {
  private static currentTransaction: any = null
  
  static async begin() {
    if (this.currentTransaction) {
      throw new Error('Transaction already in progress. Call rollback() first.')
    }
    
    try {
      // Begin transaction using Supabase client
      // Note: Supabase client doesn't expose direct transaction API
      // We'll use cleanup strategies instead
      this.currentTransaction = { id: Date.now(), timestamp: new Date() }
      return this.currentTransaction
    } catch (error) {
      throw new Error(`Failed to begin transaction: ${error.message}`)
    }
  }
  
  static async rollback() {
    if (!this.currentTransaction) {
      return // No transaction to rollback
    }
    
    try {
      // Clean up all test data created during transaction
      await TestDatabase.cleanupAllTestData()
      this.currentTransaction = null
    } catch (error) {
      throw new Error(`Failed to rollback transaction: ${error.message}`)
    }
  }
  
  static isActive() {
    return this.currentTransaction !== null
  }
  
  static getTransactionInfo() {
    return this.currentTransaction
  }
}

// Database seeding utilities with enhanced error handling
export class TestDatabase {
  static async seedKeywords(count: number = 5) {
    const keywords = Array.from({ length: count }, (_, i) => ({
      keyword: `test-keyword-${i + 1}-${Date.now()}`,
      description: `Test description ${i + 1}`,
      category: i % 2 === 0 ? 'category-a' : 'category-b',
      priority: (i % 5) + 1,
      status: i % 3 === 0 ? 'inactive' : 'active',
      gmail: TEST_USER.email,
      user_id: TEST_USER.id,
      tags: [`tag-${i}`, `common-tag`],
      search_volume: Math.floor(Math.random() * 10000),
      competition_score: Math.random(),
    }))

    const { data, error } = await testSupabase
      .from('keywords_v2')
      .insert(keywords)
      .select()

    if (error) throw error
    return data
  }

  static async seedGoogleMapsData(count: number = 3) {
    const places = Array.from({ length: count }, (_, i) => ({
      input_url: `https://maps.google.com/test-${i + 1}`,
      place_name: `Test Place ${i + 1}`,
      address: `${100 + i} Test St, Test City`,
      phone_number: `+123456789${i}`,
      website: `https://testplace${i + 1}.com`,
      rating: 3.5 + (i * 0.3),
      review_count: 50 + (i * 25),
      category: ['Restaurant', 'Hotel', 'Shop'][i % 3],
      gmail: TEST_USER.email,
      user_id: TEST_USER.id,
      coordinates: { lat: 40.7128 + i * 0.1, lng: -74.0060 + i * 0.1 },
      hours: {
        monday: '9:00-17:00',
        tuesday: '9:00-17:00',
        wednesday: '9:00-17:00',
        thursday: '9:00-17:00',
        friday: '9:00-17:00',
        saturday: '10:00-16:00',
        sunday: 'closed'
      },
      quality_score: 3 + (i % 3)
    }))

    const { data, error } = await testSupabase
      .from('data_scraping_google_maps_v2')
      .insert(places)
      .select()

    if (error) throw error
    return data
  }

  static async seedScrapingJobs(keywordIds: number[], count: number = 2) {
    const jobs = keywordIds.flatMap(keywordId => 
      Array.from({ length: count }, (_, i) => ({
        keyword_id: keywordId,
        job_type: ['instagram', 'google_maps'][i % 2],
        job_priority: (i % 10) + 1,
        status: ['pending', 'completed', 'failed'][i % 3],
        results_count: i * 10,
        expected_results: (i + 1) * 15,
        gmail: TEST_USER.email,
        user_id: TEST_USER.id,
        job_config: { 
          search_term: `keyword-${keywordId}`,
          limit: 100,
          type: 'hashtag' 
        },
        external_job_id: `ext-job-${keywordId}-${i}`,
        estimated_duration: 120 + (i * 30),
        actual_duration: i > 0 ? 100 + (i * 25) : null
      }))
    )

    const { data, error } = await testSupabase
      .from('keyword_scraping_jobs_v2')
      .insert(jobs)
      .select()

    if (error) throw error
    return data
  }

  static async createKeywordAssignments(keywordIds: number[], googleMapsIds: number[]) {
    const assignments = keywordIds.flatMap(keywordId =>
      googleMapsIds.slice(0, 2).map((gmId, i) => ({
        keyword_id: keywordId,
        google_maps_id: gmId,
        assignment_type: i === 0 ? 'manual' : 'automatic',
        confidence_score: 0.7 + (i * 0.2),
        relevance_score: 0.8 + (i * 0.1),
        gmail: TEST_USER.email,
        user_id: TEST_USER.id,
        assignment_notes: `Test assignment ${i + 1} for keyword ${keywordId}`
      }))
    )

    const { data, error } = await testSupabase
      .from('keyword_google_maps_assignments_v2')
      .insert(assignments)
      .select()

    if (error) throw error
    return data
  }

  static async getKeywordStats(userId: string = TEST_USER.id) {
    const { data, error } = await testSupabase
      .from('keywords_v2')
      .select('status')
      .eq('user_id', userId)

    if (error) throw error

    return {
      total: data.length,
      active: data.filter(k => k.status === 'active').length,
      inactive: data.filter(k => k.status === 'inactive').length,
      archived: data.filter(k => k.status === 'archived').length
    }
  }

  static async waitForJobCompletion(jobId: number, timeoutMs: number = 5000) {
    const start = Date.now()
    
    while (Date.now() - start < timeoutMs) {
      const { data } = await testSupabase
        .from('keyword_scraping_jobs_v2')
        .select('status')
        .eq('id', jobId)
        .single()

      if (data && ['completed', 'failed', 'cancelled'].includes(data.status)) {
        return data.status
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`)
  }

  // Enhanced cleanup with performance monitoring
  static async cleanupAllTestData() {
    const start = Date.now()
    
    try {
      console.log('🧹 Starting comprehensive test data cleanup...')
      
      // Clean up in reverse dependency order to avoid foreign key conflicts
      const cleanupOperations = [
        () => testSupabase.from('keyword_google_maps_assignments_v2').delete().eq('gmail', TEST_USER.email),
        () => testSupabase.from('keyword_instagram_assignments_v2').delete().eq('gmail', TEST_USER.email),
        () => testSupabase.from('instagram_post_hashtags').delete().eq('created_at', 'gte', new Date(Date.now() - 86400000).toISOString()),
        () => testSupabase.from('instagram_post_mentions').delete().eq('created_at', 'gte', new Date(Date.now() - 86400000).toISOString()),
        () => testSupabase.from('instagram_posts').delete().eq('user_id', TEST_USER.id),
        () => testSupabase.from('instagram_hashtags').delete().eq('user_id', TEST_USER.id),
        () => testSupabase.from('instagram_search_queries').delete().eq('user_id', TEST_USER.id),
        () => testSupabase.from('keyword_scraping_jobs_v2').delete().eq('gmail', TEST_USER.email),
        () => testSupabase.from('keyword_analytics_v2').delete().eq('user_id', TEST_USER.id),
        () => testSupabase.from('data_scraping_google_maps_v2').delete().eq('gmail', TEST_USER.email),
        () => testSupabase.from('keywords_v2').delete().eq('gmail', TEST_USER.email),
        
        // Clean up legacy tables if they exist (ignore errors)
        () => testSupabase.from('keywords').delete().eq('email_user', TEST_USER.email).then(() => {}, () => {})
      ]

      const results = await Promise.allSettled(cleanupOperations.map(op => op()))
      
      // Log any failures for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`⚠️ Cleanup operation ${index} failed:`, result.reason)
        }
      })

      const duration = Date.now() - start
      console.log(`✅ Test data cleanup completed in ${duration}ms`)
      
      if (duration > 5000) {
        console.warn(`⚠️ Cleanup took ${duration}ms - consider optimizing test data volume`)
      }
      
      return { duration, success: true }
    } catch (error) {
      const duration = Date.now() - start
      console.error(`❌ Test data cleanup failed after ${duration}ms:`, error)
      throw new Error(`Test cleanup failed: ${error.message}`)
    }
  }

  // Bulk operations for performance
  static async seedCompleteTestSuite() {
    const start = Date.now()
    
    try {
      console.log('🌱 Seeding complete test suite...')
      
      // Seed keywords first
      const keywords = await this.seedKeywords(10)
      const keywordIds = keywords.map(k => k.id)
      
      // Seed Google Maps data
      const places = await this.seedGoogleMapsData(8)
      const placeIds = places.map(p => p.id)
      
      // Create relationships
      await Promise.all([
        this.seedScrapingJobs(keywordIds, 3),
        this.createKeywordAssignments(keywordIds.slice(0, 5), placeIds.slice(0, 3)),
        this.seedInstagramData(keywordIds.slice(0, 3))
      ])
      
      const duration = Date.now() - start
      console.log(`✅ Complete test suite seeded in ${duration}ms`)
      
      return {
        keywords: keywords.length,
        places: places.length,
        keywordIds,
        placeIds,
        duration
      }
    } catch (error) {
      const duration = Date.now() - start
      console.error(`❌ Test suite seeding failed after ${duration}ms:`, error)
      throw error
    }
  }

  // Instagram data seeding for comprehensive tests
  static async seedInstagramData(keywordIds: number[], postsPerKeyword: number = 5) {
    const hashtagData = keywordIds.map((keywordId, i) => ({
      hashtag_name: `testtag${keywordId}${Date.now()}`,
      posts_count: 1000 + (i * 100),
      hashtag_url: `https://instagram.com/explore/tags/testtag${keywordId}`,
      search_query: `keyword-${keywordId}`,
      user_id: TEST_USER.id,
      metadata: { test: true, keyword_id: keywordId }
    }))

    const { data: hashtags, error: hashtagError } = await testSupabase
      .from('instagram_hashtags')
      .insert(hashtagData)
      .select()

    if (hashtagError) throw hashtagError

    // Seed posts for each hashtag
    const postsData = hashtags.flatMap(hashtag => 
      Array.from({ length: postsPerKeyword }, (_, i) => ({
        instagram_id: `test_post_${hashtag.id}_${i}_${Date.now()}`,
        short_code: `test${hashtag.id}${i}`,
        post_url: `https://instagram.com/p/test${hashtag.id}${i}`,
        post_type: ['Image', 'Video', 'Reel'][i % 3] as 'Image' | 'Video' | 'Reel',
        caption: `Test post ${i + 1} for hashtag ${hashtag.hashtag_name}`,
        likes_count: Math.floor(Math.random() * 1000),
        comments_count: Math.floor(Math.random() * 100),
        video_play_count: Math.floor(Math.random() * 5000),
        ig_play_count: Math.floor(Math.random() * 5000),
        reshare_count: Math.floor(Math.random() * 50),
        owner_username: `testuser${i}`,
        owner_full_name: `Test User ${i}`,
        hashtag_id: hashtag.id,
        user_id: TEST_USER.id,
        is_sponsored: i % 4 === 0,
        latest_comments: [
          { user: 'commenter1', text: 'Great post!', timestamp: new Date().toISOString() }
        ],
        child_posts: [],
        metadata: { test: true, hashtag_id: hashtag.id }
      }))
    )

    const { data: posts, error: postsError } = await testSupabase
      .from('instagram_posts')
      .insert(postsData)
      .select()

    if (postsError) throw postsError

    return { hashtags, posts }
  }

  // Memory and performance monitoring
  static async monitorTestPerformance<T>(
    operation: () => Promise<T>, 
    operationName: string = 'Test Operation'
  ): Promise<{ result: T; duration: number; memoryUsage?: any }> {
    const start = Date.now()
    const initialMemory = process.memoryUsage?.()
    
    try {
      const result = await operation()
      const duration = Date.now() - start
      const finalMemory = process.memoryUsage?.()
      
      const memoryDelta = finalMemory && initialMemory ? {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        rss: finalMemory.rss - initialMemory.rss
      } : undefined
      
      if (duration > 1000) {
        console.warn(`⚠️ ${operationName} took ${duration}ms (threshold: 1000ms)`)
      }
      
      if (memoryDelta && memoryDelta.heapUsed > 50 * 1024 * 1024) {
        console.warn(`⚠️ ${operationName} used ${Math.round(memoryDelta.heapUsed / 1024 / 1024)}MB heap`)
      }
      
      return { result, duration, memoryUsage: memoryDelta }
    } catch (error) {
      const duration = Date.now() - start
      console.error(`❌ ${operationName} failed after ${duration}ms:`, error)
      throw error
    }
  }
}

// Enhanced test data validation helpers with better error messages
export class TestValidators {
  static validateKeyword(keyword: any) {
    expect(keyword).toHaveProperty('id')
    expect(keyword).toHaveProperty('keyword')
    expect(keyword).toHaveProperty('gmail')
    expect(keyword).toHaveProperty('created_at')
    expect(keyword.keyword).toBeTruthy()
    expect(keyword.gmail).toBe(TEST_USER.email)
    expect(['active', 'inactive', 'archived', 'pending']).toContain(keyword.status)
    expect(keyword.priority).toBeGreaterThanOrEqual(1)
    expect(keyword.priority).toBeLessThanOrEqual(5)
  }

  static validateGoogleMapsPlace(place: any) {
    expect(place).toHaveProperty('id')
    expect(place).toHaveProperty('place_name')
    expect(place).toHaveProperty('gmail')
    expect(place).toHaveProperty('created_at')
    expect(place.place_name).toBeTruthy()
    expect(place.gmail).toBe(TEST_USER.email)
    
    if (place.rating !== null) {
      expect(place.rating).toBeGreaterThanOrEqual(0)
      expect(place.rating).toBeLessThanOrEqual(5)
    }
    
    if (place.quality_score !== null) {
      expect(place.quality_score).toBeGreaterThanOrEqual(1)
      expect(place.quality_score).toBeLessThanOrEqual(5)
    }
  }

  static validateScrapingJob(job: any) {
    expect(job).toHaveProperty('id')
    expect(job).toHaveProperty('keyword_id')
    expect(job).toHaveProperty('job_type')
    expect(job).toHaveProperty('status')
    expect(job).toHaveProperty('gmail')
    expect(['instagram', 'google_maps', 'tiktok', 'youtube']).toContain(job.job_type)
    expect(['pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'retry']).toContain(job.status)
    expect(job.job_priority).toBeGreaterThanOrEqual(1)
    expect(job.job_priority).toBeLessThanOrEqual(10)
  }

  static validateAssignment(assignment: any) {
    expect(assignment).toHaveProperty('id')
    expect(assignment).toHaveProperty('keyword_id')
    expect(assignment).toHaveProperty('google_maps_id')
    expect(assignment).toHaveProperty('assignment_type')
    expect(['manual', 'automatic', 'bulk']).toContain(assignment.assignment_type)
    
    if (assignment.confidence_score !== null) {
      expect(assignment.confidence_score).toBeGreaterThanOrEqual(0)
      expect(assignment.confidence_score).toBeLessThanOrEqual(1)
    }
    
    if (assignment.relevance_score !== null) {
      expect(assignment.relevance_score).toBeGreaterThanOrEqual(0)
      expect(assignment.relevance_score).toBeLessThanOrEqual(1)
    }
  }

  static validateInstagramHashtag(hashtag: any) {
    expect(hashtag).toHaveProperty('id')
    expect(hashtag).toHaveProperty('hashtag_name')
    expect(hashtag).toHaveProperty('hashtag_url')
    expect(hashtag).toHaveProperty('user_id')
    expect(hashtag.hashtag_name).toBeTruthy()
    expect(hashtag.user_id).toBe(TEST_USER.id)
    expect(hashtag.posts_count).toBeGreaterThanOrEqual(0)
  }

  static validateInstagramPost(post: any) {
    expect(post).toHaveProperty('id')
    expect(post).toHaveProperty('instagram_id')
    expect(post).toHaveProperty('post_url')
    expect(post).toHaveProperty('post_type')
    expect(['Image', 'Video', 'Sidecar', 'Reel']).toContain(post.post_type)
    expect(post.likes_count).toBeGreaterThanOrEqual(0)
    expect(post.comments_count).toBeGreaterThanOrEqual(0)
    expect(post.user_id).toBe(TEST_USER.id)
  }

  static validateTestDataIntegrity(data: any, expectedCount: number, entityType: string) {
    expect(data).toBeInstanceOf(Array)
    expect(data).toHaveLength(expectedCount)
    
    if (data.length > 0) {
      data.forEach((item: any, index: number) => {
        try {
          switch (entityType) {
            case 'keyword':
              this.validateKeyword(item)
              break
            case 'googleMapsPlace':
              this.validateGoogleMapsPlace(item)
              break
            case 'scrapingJob':
              this.validateScrapingJob(item)
              break
            case 'assignment':
              this.validateAssignment(item)
              break
            case 'instagramHashtag':
              this.validateInstagramHashtag(item)
              break
            case 'instagramPost':
              this.validateInstagramPost(item)
              break
            default:
              throw new Error(`Unknown entity type: ${entityType}`)
          }
        } catch (validationError) {
          throw new Error(
            `Validation failed for ${entityType} at index ${index}: ${validationError.message}`
          )
        }
      })
    }
  }
}

// Test database connection and health utilities
export class TestDatabaseHealth {
  static async checkConnection() {
    try {
      const { data, error } = await testSupabase
        .from('keywords_v2')
        .select('count')
        .limit(1)
        
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw new Error(`Database connection failed: ${error.message}`)
      }
      
      return { connected: true, error: null }
    } catch (error) {
      return { connected: false, error: error.message }
    }
  }
  
  static async validateTestEnvironment() {
    const issues = []
    
    // Check required environment variables
    const requiredEnvVars = ['TEST_SUPABASE_URL', 'TEST_SUPABASE_ANON_KEY']
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar] && !process.env[envVar.replace('TEST_', 'NEXT_PUBLIC_')]) {
        issues.push(`Missing environment variable: ${envVar}`)
      }
    })
    
    // Check test user configuration
    if (!TEST_USER.id || !TEST_USER.email) {
      issues.push('TEST_USER configuration is invalid')
    }
    
    // Check database connection
    const connectionStatus = await this.checkConnection()
    if (!connectionStatus.connected) {
      issues.push(`Database connection issue: ${connectionStatus.error}`)
    }
    
    // Check NODE_ENV
    if (process.env.NODE_ENV !== 'test') {
      issues.push(`NODE_ENV should be 'test', got '${process.env.NODE_ENV}'`)
    }
    
    return {
      valid: issues.length === 0,
      issues,
      testUser: TEST_USER,
      environment: process.env.NODE_ENV
    }
  }
  
  static async getTestStatistics() {
    try {
      const tables = [
        'keywords_v2',
        'data_scraping_google_maps_v2',
        'keyword_scraping_jobs_v2',
        'instagram_hashtags',
        'instagram_posts'
      ]
      
      const counts = await Promise.all(
        tables.map(async table => {
          try {
            const { count, error } = await testSupabase
              .from(table)
              .select('*', { count: 'exact', head: true })
              .eq('user_id', TEST_USER.id)
              
            return { table, count: count || 0, error: error?.message }
          } catch (error) {
            return { table, count: 0, error: error.message }
          }
        })
      )
      
      return {
        timestamp: new Date().toISOString(),
        testUser: TEST_USER.id,
        tableCounts: counts.reduce((acc, { table, count, error }) => {
          acc[table] = { count, error }
          return acc
        }, {} as Record<string, { count: number; error?: string }>),
        totalTestRecords: counts.reduce((sum, { count }) => sum + count, 0)
      }
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        testUser: TEST_USER.id
      }
    }
  }
}

// Export convenience functions for common test patterns
export const withTestTransaction = async <T>(
  testFunction: () => Promise<T>
): Promise<T> => {
  await TestTransaction.begin()
  try {
    const result = await testFunction()
    await TestTransaction.rollback()
    return result
  } catch (error) {
    await TestTransaction.rollback()
    throw error
  }
}

export const withPerformanceMonitoring = TestDatabase.monitorTestPerformance

export const createTestSuite = TestDatabase.seedCompleteTestSuite

export const cleanupTestData = TestDatabase.cleanupAllTestData