import { 
  testSupabase,
  TEST_USER,
  createTestKeyword,
  createTestGoogleMapsData
} from '@/test-utils/integration-setup'
import { TestDatabase, TestValidators } from '@/test-utils/test-database'

describe('Database Operations Integration Tests', () => {
  describe('Keywords Table Operations', () => {
    it('should insert keyword with all constraints enforced', async () => {
      const keywordData = createTestKeyword({
        keyword: 'database-test-keyword',
        priority: 3,
        competition_score: 0.75,
        search_volume: 5000,
        tags: ['test', 'database', 'integration']
      })

      const { data, error } = await testSupabase
        .from('keywords_v2')
        .insert(keywordData)
        .select()
        .single()

      expect(error).toBeNull()
      TestValidators.validateKeyword(data)
      
      expect(data.keyword).toBe('database-test-keyword')
      expect(data.priority).toBe(3)
      expect(data.competition_score).toBe(0.75)
      expect(data.search_volume).toBe(5000)
      expect(data.tags).toEqual(['test', 'database', 'integration'])
    })

    it('should enforce unique constraint on user + keyword combination', async () => {
      const keywordData = createTestKeyword({ keyword: 'unique-constraint-test' })

      // Insert first keyword
      const { data: firstKeyword, error: firstError } = await testSupabase
        .from('keywords_v2')
        .insert(keywordData)
        .select()
        .single()

      expect(firstError).toBeNull()
      expect(firstKeyword).toBeTruthy()

      // Try to insert duplicate - should fail
      const { data: duplicateKeyword, error: duplicateError } = await testSupabase
        .from('keywords_v2')
        .insert(keywordData)
        .select()
        .single()

      expect(duplicateError).toBeTruthy()
      expect(duplicateKeyword).toBeNull()
      expect(duplicateError.code).toBe('23505') // Unique constraint violation
    })

    it('should enforce check constraints on priority and competition score', async () => {
      const invalidData = [
        createTestKeyword({ priority: 0 }), // Priority too low
        createTestKeyword({ priority: 6 }), // Priority too high
        createTestKeyword({ competition_score: -0.1 }), // Negative competition score
        createTestKeyword({ competition_score: 1.5 }) // Competition score too high
      ]

      for (const data of invalidData) {
        const { data: result, error } = await testSupabase
          .from('keywords_v2')
          .insert(data)
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(result).toBeNull()
        expect(error.code).toBe('23514') // Check constraint violation
      }
    })

    it('should automatically set audit trail fields', async () => {
      const keywordData = createTestKeyword()

      const { data, error } = await testSupabase
        .from('keywords_v2')
        .insert(keywordData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.created_at).toBeTruthy()
      expect(data.updated_at).toBeTruthy()
      expect(new Date(data.created_at)).toBeInstanceOf(Date)
      expect(new Date(data.updated_at)).toBeInstanceOf(Date)
    })

    it('should update updated_at on record modification', async () => {
      const { data: originalKeyword } = await testSupabase
        .from('keywords_v2')
        .insert(createTestKeyword())
        .select()
        .single()

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))

      const { data: updatedKeyword, error } = await testSupabase
        .from('keywords_v2')
        .update({ description: 'Updated description' })
        .eq('id', originalKeyword.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(new Date(updatedKeyword.updated_at))
        .toBeInstanceOf(Date)
      expect(new Date(updatedKeyword.updated_at).getTime())
        .toBeGreaterThan(new Date(originalKeyword.updated_at).getTime())
    })

    it('should handle JSONB fields correctly', async () => {
      const keywordData = createTestKeyword({
        metadata: {
          source: 'api_test',
          difficulty: 'medium',
          trends: {
            monthly: [100, 150, 200, 180],
            yearly: 2024
          }
        },
        performance_metrics: {
          ctr: 0.15,
          conversions: 50,
          cost_per_click: 2.50
        }
      })

      const { data, error } = await testSupabase
        .from('keywords_v2')
        .insert(keywordData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.metadata).toEqual(keywordData.metadata)
      expect(data.performance_metrics).toEqual(keywordData.performance_metrics)
      
      // Test JSONB querying
      const { data: jsonbQuery } = await testSupabase
        .from('keywords_v2')
        .select('*')
        .eq('metadata->>source', 'api_test')

      expect(jsonbQuery).toHaveLength(1)
      expect(jsonbQuery[0].id).toBe(data.id)
    })
  })

  describe('Google Maps Data Table Operations', () => {
    it('should insert Google Maps data with proper validation', async () => {
      const placesData = createTestGoogleMapsData({
        place_name: 'Test Restaurant',
        rating: 4.5,
        review_count: 250,
        coordinates: { lat: 40.7128, lng: -74.0060 },
        hours: {
          monday: '9:00-22:00',
          tuesday: '9:00-22:00',
          wednesday: '9:00-22:00',
          thursday: '9:00-22:00',
          friday: '9:00-23:00',
          saturday: '10:00-23:00',
          sunday: '10:00-21:00'
        },
        quality_score: 4
      })

      const { data, error } = await testSupabase
        .from('data_scraping_google_maps_v2')
        .insert(placesData)
        .select()
        .single()

      expect(error).toBeNull()
      TestValidators.validateGoogleMapsPlace(data)
      
      expect(data.place_name).toBe('Test Restaurant')
      expect(data.rating).toBe(4.5)
      expect(data.review_count).toBe(250)
      expect(data.coordinates).toEqual({ lat: 40.7128, lng: -74.0060 })
      expect(data.quality_score).toBe(4)
    })

    it('should enforce rating constraints', async () => {
      const invalidRatings = [-1, 6, 10]

      for (const rating of invalidRatings) {
        const { data, error } = await testSupabase
          .from('data_scraping_google_maps_v2')
          .insert(createTestGoogleMapsData({ rating }))
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
        expect(error.code).toBe('23514') // Check constraint violation
      }
    })

    it('should enforce review count constraints', async () => {
      const invalidReviewCounts = [-1, -100]

      for (const review_count of invalidReviewCounts) {
        const { data, error } = await testSupabase
          .from('data_scraping_google_maps_v2')
          .insert(createTestGoogleMapsData({ review_count }))
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
        expect(error.code).toBe('23514') // Check constraint violation
      }
    })

    it('should enforce quality score constraints', async () => {
      const invalidQualityScores = [0, 6, -1]

      for (const quality_score of invalidQualityScores) {
        const { data, error } = await testSupabase
          .from('data_scraping_google_maps_v2')
          .insert(createTestGoogleMapsData({ quality_score }))
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
        expect(error.code).toBe('23514') // Check constraint violation
      }
    })
  })

  describe('Keyword Assignments Table Operations', () => {
    let testKeywords: any[]
    let testPlaces: any[]

    beforeEach(async () => {
      testKeywords = await TestDatabase.seedKeywords(3)
      testPlaces = await TestDatabase.seedGoogleMapsData(3)
    })

    it('should create keyword to Google Maps assignments', async () => {
      const assignmentData = {
        keyword_id: testKeywords[0].id,
        google_maps_id: testPlaces[0].id,
        assignment_type: 'manual',
        confidence_score: 0.85,
        relevance_score: 0.92,
        gmail: TEST_USER.email,
        user_id: TEST_USER.id,
        assignment_notes: 'Test assignment for integration testing'
      }

      const { data, error } = await testSupabase
        .from('keyword_google_maps_assignments_v2')
        .insert(assignmentData)
        .select()
        .single()

      expect(error).toBeNull()
      TestValidators.validateAssignment(data)
      
      expect(data.keyword_id).toBe(testKeywords[0].id)
      expect(data.google_maps_id).toBe(testPlaces[0].id)
      expect(data.assignment_type).toBe('manual')
      expect(data.confidence_score).toBe(0.85)
      expect(data.relevance_score).toBe(0.92)
    })

    it('should enforce unique constraint on keyword-place assignments', async () => {
      const assignmentData = {
        keyword_id: testKeywords[0].id,
        google_maps_id: testPlaces[0].id,
        assignment_type: 'manual',
        gmail: TEST_USER.email,
        user_id: TEST_USER.id
      }

      // Insert first assignment
      const { data: firstAssignment, error: firstError } = await testSupabase
        .from('keyword_google_maps_assignments_v2')
        .insert(assignmentData)
        .select()
        .single()

      expect(firstError).toBeNull()
      expect(firstAssignment).toBeTruthy()

      // Try to insert duplicate
      const { data: duplicateAssignment, error: duplicateError } = await testSupabase
        .from('keyword_google_maps_assignments_v2')
        .insert(assignmentData)
        .select()
        .single()

      expect(duplicateError).toBeTruthy()
      expect(duplicateAssignment).toBeNull()
      expect(duplicateError.code).toBe('23505') // Unique constraint violation
    })

    it('should enforce foreign key constraints', async () => {
      const invalidAssignments = [
        {
          keyword_id: 99999, // Non-existent keyword
          google_maps_id: testPlaces[0].id,
          gmail: TEST_USER.email,
          user_id: TEST_USER.id
        },
        {
          keyword_id: testKeywords[0].id,
          google_maps_id: 99999, // Non-existent place
          gmail: TEST_USER.email,
          user_id: TEST_USER.id
        }
      ]

      for (const assignmentData of invalidAssignments) {
        const { data, error } = await testSupabase
          .from('keyword_google_maps_assignments_v2')
          .insert(assignmentData)
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
        expect(error.code).toBe('23503') // Foreign key constraint violation
      }
    })

    it('should enforce score constraints', async () => {
      const invalidScores = [
        { confidence_score: -0.1, relevance_score: 0.5 },
        { confidence_score: 0.5, relevance_score: -0.1 },
        { confidence_score: 1.1, relevance_score: 0.5 },
        { confidence_score: 0.5, relevance_score: 1.1 }
      ]

      for (const scores of invalidScores) {
        const assignmentData = {
          keyword_id: testKeywords[0].id,
          google_maps_id: testPlaces[0].id,
          gmail: TEST_USER.email,
          user_id: TEST_USER.id,
          ...scores
        }

        const { data, error } = await testSupabase
          .from('keyword_google_maps_assignments_v2')
          .insert(assignmentData)
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
        expect(error.code).toBe('23514') // Check constraint violation
      }
    })
  })

  describe('Scraping Jobs Table Operations', () => {
    let testKeywords: any[]

    beforeEach(async () => {
      testKeywords = await TestDatabase.seedKeywords(2)
    })

    it('should create scraping jobs with proper validation', async () => {
      const jobData = {
        keyword_id: testKeywords[0].id,
        job_type: 'instagram',
        job_priority: 5,
        status: 'pending',
        expected_results: 100,
        estimated_duration: 120,
        max_retries: 3,
        job_config: {
          search_term: testKeywords[0].keyword,
          limit: 50,
          type: 'hashtag'
        },
        gmail: TEST_USER.email,
        user_id: TEST_USER.id,
        external_job_id: 'ext-job-123'
      }

      const { data, error } = await testSupabase
        .from('keyword_scraping_jobs_v2')
        .insert(jobData)
        .select()
        .single()

      expect(error).toBeNull()
      TestValidators.validateScrapingJob(data)
      
      expect(data.keyword_id).toBe(testKeywords[0].id)
      expect(data.job_type).toBe('instagram')
      expect(data.job_priority).toBe(5)
      expect(data.expected_results).toBe(100)
      expect(data.job_config).toEqual(jobData.job_config)
    })

    it('should enforce job type constraints', async () => {
      const invalidJobTypes = ['invalid', 'facebook', 'linkedin']

      for (const job_type of invalidJobTypes) {
        const { data, error } = await testSupabase
          .from('keyword_scraping_jobs_v2')
          .insert({
            keyword_id: testKeywords[0].id,
            job_type,
            gmail: TEST_USER.email,
            user_id: TEST_USER.id
          })
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
        expect(error.code).toBe('23514') // Check constraint violation
      }
    })

    it('should enforce status constraints', async () => {
      const invalidStatuses = ['invalid', 'processing', 'done']

      for (const status of invalidStatuses) {
        const { data, error } = await testSupabase
          .from('keyword_scraping_jobs_v2')
          .insert({
            keyword_id: testKeywords[0].id,
            job_type: 'instagram',
            status,
            gmail: TEST_USER.email,
            user_id: TEST_USER.id
          })
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
        expect(error.code).toBe('23514') // Check constraint violation
      }
    })

    it('should enforce priority range constraints', async () => {
      const invalidPriorities = [0, 11, -1, 100]

      for (const job_priority of invalidPriorities) {
        const { data, error } = await testSupabase
          .from('keyword_scraping_jobs_v2')
          .insert({
            keyword_id: testKeywords[0].id,
            job_type: 'instagram',
            job_priority,
            gmail: TEST_USER.email,
            user_id: TEST_USER.id
          })
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
        expect(error.code).toBe('23514') // Check constraint violation
      }
    })

    it('should enforce retry count constraint', async () => {
      const jobData = {
        keyword_id: testKeywords[0].id,
        job_type: 'instagram',
        max_retries: 3,
        retry_count: 5, // More than max_retries
        gmail: TEST_USER.email,
        user_id: TEST_USER.id
      }

      const { data, error } = await testSupabase
        .from('keyword_scraping_jobs_v2')
        .insert(jobData)
        .select()
        .single()

      expect(error).toBeTruthy()
      expect(data).toBeNull()
      expect(error.code).toBe('23514') // Check constraint violation
    })
  })

  describe('Complex Queries and Joins', () => {
    let testKeywords: any[]
    let testPlaces: any[]
    let testAssignments: any[]

    beforeEach(async () => {
      testKeywords = await TestDatabase.seedKeywords(5)
      testPlaces = await TestDatabase.seedGoogleMapsData(5)
      testAssignments = await TestDatabase.createKeywordAssignments(
        testKeywords.slice(0, 3).map(k => k.id),
        testPlaces.slice(0, 3).map(p => p.id)
      )
    })

    it('should perform complex joins across related tables', async () => {
      const { data, error } = await testSupabase
        .from('keywords_v2')
        .select(`
          *,
          keyword_google_maps_assignments_v2!inner (
            *,
            data_scraping_google_maps_v2 (
              place_name,
              rating,
              review_count,
              category
            )
          )
        `)
        .eq('gmail', TEST_USER.email)

      expect(error).toBeNull()
      expect(data).toHaveLength(3) // Only keywords with assignments

      data.forEach(keyword => {
        expect(keyword.keyword_google_maps_assignments_v2).toBeTruthy()
        expect(keyword.keyword_google_maps_assignments_v2.length).toBeGreaterThan(0)
        
        keyword.keyword_google_maps_assignments_v2.forEach(assignment => {
          expect(assignment.data_scraping_google_maps_v2).toBeTruthy()
          expect(assignment.data_scraping_google_maps_v2.place_name).toBeTruthy()
        })
      })
    })

    it('should aggregate data correctly', async () => {
      // Get keyword statistics
      const { data, error } = await testSupabase
        .from('keywords_v2')
        .select('status, priority')
        .eq('gmail', TEST_USER.email)

      expect(error).toBeNull()
      
      const stats = data.reduce((acc, keyword) => {
        acc[keyword.status] = (acc[keyword.status] || 0) + 1
        return acc
      }, {})

      expect(Object.keys(stats)).toContain('active')
      expect(stats.active).toBeGreaterThan(0)
    })

    it('should filter and sort complex queries', async () => {
      const { data, error } = await testSupabase
        .from('keywords_v2')
        .select(`
          *,
          keyword_google_maps_assignments_v2 (
            confidence_score,
            data_scraping_google_maps_v2 (
              place_name,
              rating
            )
          )
        `)
        .eq('gmail', TEST_USER.email)
        .eq('status', 'active')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      
      // Verify sorting
      for (let i = 1; i < data.length; i++) {
        expect(data[i].priority).toBeGreaterThanOrEqual(data[i - 1].priority)
        
        // If same priority, should be sorted by created_at desc
        if (data[i].priority === data[i - 1].priority) {
          expect(new Date(data[i].created_at).getTime())
            .toBeLessThanOrEqual(new Date(data[i - 1].created_at).getTime())
        }
      }
    })
  })

  describe('Transaction Testing', () => {
    it('should handle multiple related insertions in transaction', async () => {
      // Create keyword and assignments atomically
      const keywordData = createTestKeyword({ keyword: 'transaction-test-keyword' })
      
      // Start transaction-like operations
      const { data: keyword, error: keywordError } = await testSupabase
        .from('keywords_v2')
        .insert(keywordData)
        .select()
        .single()

      expect(keywordError).toBeNull()

      const placeData = createTestGoogleMapsData({ place_name: 'Transaction Test Place' })
      const { data: place, error: placeError } = await testSupabase
        .from('data_scraping_google_maps_v2')
        .insert(placeData)
        .select()
        .single()

      expect(placeError).toBeNull()

      const assignmentData = {
        keyword_id: keyword.id,
        google_maps_id: place.id,
        assignment_type: 'automatic',
        gmail: TEST_USER.email,
        user_id: TEST_USER.id
      }

      const { data: assignment, error: assignmentError } = await testSupabase
        .from('keyword_google_maps_assignments_v2')
        .insert(assignmentData)
        .select()
        .single()

      expect(assignmentError).toBeNull()
      expect(assignment.keyword_id).toBe(keyword.id)
      expect(assignment.google_maps_id).toBe(place.id)
    })
  })

  describe('Performance Testing', () => {
    it('should handle bulk insertions efficiently', async () => {
      const bulkKeywords = Array.from({ length: 100 }, (_, i) => 
        createTestKeyword({ 
          keyword: `bulk-keyword-${i}`,
          priority: (i % 5) + 1,
          status: i % 2 === 0 ? 'active' : 'inactive'
        })
      )

      const startTime = Date.now()
      
      const { data, error } = await testSupabase
        .from('keywords_v2')
        .insert(bulkKeywords)
        .select('id, keyword, status')

      const endTime = Date.now()

      expect(error).toBeNull()
      expect(data).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds

      // Verify all insertions
      data.forEach((keyword, index) => {
        expect(keyword.keyword).toBe(`bulk-keyword-${index}`)
      })
    })

    it('should handle complex queries efficiently', async () => {
      // Ensure we have enough data
      await TestDatabase.seedKeywords(20)
      await TestDatabase.seedGoogleMapsData(20)

      const startTime = Date.now()

      const { data, error } = await testSupabase
        .from('keywords_v2')
        .select(`
          id,
          keyword,
          status,
          priority,
          created_at
        `)
        .eq('gmail', TEST_USER.email)
        .order('created_at', { ascending: false })
        .limit(10)

      const endTime = Date.now()

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(2000) // Should be fast
    })
  })
})