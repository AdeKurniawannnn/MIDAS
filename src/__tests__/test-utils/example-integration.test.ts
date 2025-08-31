/**
 * Example integration test demonstrating the test database utilities
 * 
 * This file shows how to use the enhanced test infrastructure:
 * - Database seeding and cleanup
 * - Transaction management
 * - Performance monitoring
 * - Data validation
 * - Mock services
 */

import { 
  TestDatabase, 
  TestValidators, 
  TestTransaction,
  TestDatabaseHealth,
  withTestTransaction,
  withPerformanceMonitoring,
  createTestSuite,
  cleanupTestData
} from './test-database'

import { 
  testSupabase, 
  TEST_USER,
  MockServices,
  TestPerformanceMonitor,
  expectSuccess,
  waitForCondition,
  retryOperation,
  getTestEnvironmentInfo
} from './integration-setup'

describe('Test Infrastructure Examples', () => {
  
  describe('Environment Validation', () => {
    it('should validate test environment configuration', async () => {
      const envInfo = getTestEnvironmentInfo()
      
      expect(envInfo.nodeEnv).toBe('test')
      expect(envInfo.testUser).toEqual(TEST_USER)
      expect(envInfo.supabaseUrl).toBeTruthy()
      expect(envInfo.mocksEnabled.external).toBe(true)
    })

    it('should check database connection health', async () => {
      const healthCheck = await TestDatabaseHealth.checkConnection()
      
      expect(healthCheck.connected).toBe(true)
      expect(healthCheck.error).toBeNull()
    })

    it('should validate test environment setup', async () => {
      const validation = await TestDatabaseHealth.validateTestEnvironment()
      
      expect(validation.valid).toBe(true)
      expect(validation.issues).toHaveLength(0)
      expect(validation.testUser).toEqual(TEST_USER)
    })
  })

  describe('Database Operations', () => {
    it('should seed and validate keywords', async () => {
      const keywords = await TestDatabase.seedKeywords(5)
      
      expect(keywords).toHaveLength(5)
      TestValidators.validateTestDataIntegrity(keywords, 5, 'keyword')
      
      keywords.forEach(keyword => {
        TestValidators.validateKeyword(keyword)
      })
    })

    it('should seed Google Maps data', async () => {
      const places = await TestDatabase.seedGoogleMapsData(3)
      
      expect(places).toHaveLength(3)
      TestValidators.validateTestDataIntegrity(places, 3, 'googleMapsPlace')
    })

    it('should create complex data relationships', async () => {
      const testSuite = await createTestSuite()
      
      expect(testSuite.keywords).toBeGreaterThan(0)
      expect(testSuite.places).toBeGreaterThan(0)
      expect(testSuite.keywordIds).toBeInstanceOf(Array)
      expect(testSuite.duration).toBeLessThan(10000) // Should be fast
    })

    it('should seed Instagram data', async () => {
      // First create some keywords
      const keywords = await TestDatabase.seedKeywords(2)
      const keywordIds = keywords.map(k => k.id)
      
      // Seed Instagram data
      const instagramData = await TestDatabase.seedInstagramData(keywordIds, 3)
      
      expect(instagramData.hashtags).toHaveLength(2)
      expect(instagramData.posts).toHaveLength(6) // 2 hashtags * 3 posts each
      
      instagramData.hashtags.forEach(hashtag => {
        TestValidators.validateInstagramHashtag(hashtag)
      })
      
      instagramData.posts.forEach(post => {
        TestValidators.validateInstagramPost(post)
      })
    })
  })

  describe('Transaction Management', () => {
    it('should manage transactions correctly', async () => {
      const result = await withTestTransaction(async () => {
        // Seed some data within transaction
        const keywords = await TestDatabase.seedKeywords(3)
        
        expect(keywords).toHaveLength(3)
        
        // Verify data exists
        const { data } = await testSupabase
          .from('keywords_v2')
          .select('*')
          .eq('gmail', TEST_USER.email)
          
        expect(data).toHaveLength(3)
        
        return keywords
      })
      
      // After transaction rollback, data should be cleaned up
      const { data: finalData } = await testSupabase
        .from('keywords_v2')
        .select('*')
        .eq('gmail', TEST_USER.email)
        
      expect(finalData).toHaveLength(0)
      expect(result).toHaveLength(3)
    })

    it('should handle transaction failures gracefully', async () => {
      await expect(
        withTestTransaction(async () => {
          await TestDatabase.seedKeywords(2)
          throw new Error('Simulated failure')
        })
      ).rejects.toThrow('Simulated failure')
      
      // Verify cleanup happened even after failure
      const { data } = await testSupabase
        .from('keywords_v2')
        .select('*')
        .eq('gmail', TEST_USER.email)
        
      expect(data).toHaveLength(0)
    })
  })

  describe('Performance Monitoring', () => {
    it('should monitor operation performance', async () => {
      const { result, duration, memoryUsage } = await withPerformanceMonitoring(
        async () => {
          return await TestDatabase.seedKeywords(10)
        },
        'Large Keyword Seeding'
      )
      
      expect(result).toHaveLength(10)
      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
      expect(typeof duration).toBe('number')
      
      if (memoryUsage) {
        expect(typeof memoryUsage.heapUsed).toBe('number')
      }
    })

    it('should track performance metrics', async () => {
      TestPerformanceMonitor.startOperation('test-operation')
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const duration = TestPerformanceMonitor.endOperation('test-operation')
      const metrics = TestPerformanceMonitor.getMetrics()
      
      expect(duration).toBeGreaterThan(90)
      expect(duration).toBeLessThan(200)
      expect(metrics).toHaveLength(1)
      expect(metrics[0].operation).toBe('test-operation')
      expect(metrics[0].completed).toBe(true)
    })
  })

  describe('Utility Functions', () => {
    it('should wait for conditions', async () => {
      let counter = 0
      
      const result = await waitForCondition(
        () => {
          counter++
          return counter >= 3
        },
        1000,
        50
      )
      
      expect(result).toBe(true)
      expect(counter).toBeGreaterThanOrEqual(3)
    })

    it('should retry failed operations', async () => {
      let attempts = 0
      
      const result = await retryOperation(
        async () => {
          attempts++
          if (attempts < 3) {
            throw new Error('Simulated failure')
          }
          return 'success'
        },
        3,
        10
      )
      
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should handle permanent failures in retry', async () => {
      await expect(
        retryOperation(
          async () => {
            throw new Error('Permanent failure')
          },
          2,
          10
        )
      ).rejects.toThrow('Operation failed after 2 attempts: Permanent failure')
    })
  })

  describe('Test Statistics and Monitoring', () => {
    it('should gather test statistics', async () => {
      // Seed some data first
      await TestDatabase.seedKeywords(3)
      await TestDatabase.seedGoogleMapsData(2)
      
      const stats = await TestDatabaseHealth.getTestStatistics()
      
      expect(stats.timestamp).toBeTruthy()
      expect(stats.testUser).toBe(TEST_USER.id)
      expect(stats.tableCounts).toBeDefined()
      expect(stats.totalTestRecords).toBeGreaterThan(0)
      
      // Check specific table counts
      expect(stats.tableCounts['keywords_v2']).toBeDefined()
      expect(stats.tableCounts['keywords_v2'].count).toBeGreaterThanOrEqual(3)
    })

    it('should clean up all test data efficiently', async () => {
      // Create comprehensive test data
      await createTestSuite()
      
      // Verify data exists
      const statsBefore = await TestDatabaseHealth.getTestStatistics()
      expect(statsBefore.totalTestRecords).toBeGreaterThan(10)
      
      // Clean up all data
      const cleanupResult = await cleanupTestData()
      
      expect(cleanupResult.success).toBe(true)
      expect(cleanupResult.duration).toBeLessThan(5000)
      
      // Verify all data is cleaned up
      const statsAfter = await TestDatabaseHealth.getTestStatistics()
      expect(statsAfter.totalTestRecords).toBe(0)
    })
  })

  describe('Mock Services', () => {
    beforeAll(() => {
      MockServices.setupInstagramAPIMocks()
      MockServices.setupApifyMocks()
    })

    afterAll(() => {
      MockServices.resetAllMocks()
    })

    it('should mock external API calls', async () => {
      // This would normally make an external API call
      const response = await fetch('https://api.instagram.com/test')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.hashtag).toBe('testhashtag')
      expect(data.data.posts).toHaveLength(5)
    })
  })
})