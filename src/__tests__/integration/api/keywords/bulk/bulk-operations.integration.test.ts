import { POST, GET } from '../route'
import { 
  createMockNextRequest,
  expectSuccess,
  expectError
} from '@/test-utils/integration-setup'
import { TestDatabase, TestValidators } from '@/test-utils/test-database'

describe('Keywords Bulk Operations Integration Tests', () => {
  let testKeywords: any[]

  beforeEach(async () => {
    // Seed test keywords for bulk operations
    testKeywords = await TestDatabase.seedKeywords(10)
  })

  describe('POST /api/keywords/bulk - Bulk Status Updates', () => {
    it('should activate multiple keywords', async () => {
      const keywordIds = testKeywords.slice(0, 3).map(k => k.id)
      
      const bulkOperation = {
        operation: 'activate',
        keywordIds
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.operation).toBe('activate')
      expect(data.affected).toBe(3)

      // Verify keywords were actually updated
      const { data: updatedKeywords } = await require('@/test-utils/integration-setup').testSupabase
        .from('keywords_v2')
        .select('id, status')
        .in('id', keywordIds)

      updatedKeywords.forEach(keyword => {
        expect(keyword.status).toBe('active')
      })
    })

    it('should deactivate multiple keywords', async () => {
      // First ensure keywords are active
      const activeKeywordIds = testKeywords.slice(0, 4).map(k => k.id)
      
      await require('@/test-utils/integration-setup').testSupabase
        .from('keywords_v2')
        .update({ status: 'active' })
        .in('id', activeKeywordIds)

      const bulkOperation = {
        operation: 'deactivate',
        keywordIds: activeKeywordIds
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.operation).toBe('deactivate')
      expect(data.affected).toBe(4)

      // Verify status changes
      const { data: updatedKeywords } = await require('@/test-utils/integration-setup').testSupabase
        .from('keywords_v2')
        .select('id, status')
        .in('id', activeKeywordIds)

      updatedKeywords.forEach(keyword => {
        expect(keyword.status).toBe('inactive')
      })
    })

    it('should archive multiple keywords', async () => {
      const keywordIds = testKeywords.slice(0, 2).map(k => k.id)
      
      const bulkOperation = {
        operation: 'archive',
        keywordIds
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.operation).toBe('archive')
      expect(data.affected).toBe(2)

      // Verify archival
      const { data: archivedKeywords } = await require('@/test-utils/integration-setup').testSupabase
        .from('keywords_v2')
        .select('id, status')
        .in('id', keywordIds)

      archivedKeywords.forEach(keyword => {
        expect(keyword.status).toBe('archived')
      })
    })

    it('should delete multiple keywords', async () => {
      const keywordIds = testKeywords.slice(0, 3).map(k => k.id)
      
      const bulkOperation = {
        operation: 'delete',
        keywordIds
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.operation).toBe('delete')
      expect(data.affected).toBe(3)

      // Verify deletion
      const { data: deletedKeywords } = await require('@/test-utils/integration-setup').testSupabase
        .from('keywords_v2')
        .select('id')
        .in('id', keywordIds)

      expect(deletedKeywords).toEqual([])
    })

    it('should handle scrape operation', async () => {
      const keywordIds = testKeywords.slice(0, 2).map(k => k.id)
      
      const bulkOperation = {
        operation: 'scrape',
        keywordIds,
        scrapingType: 'instagram'
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.operation).toBe('scrape')
      expect(data.affected).toBe(2)
      
      // Note: Actual scraping job creation is marked as TODO in implementation
      // This test verifies the endpoint accepts scrape operations
    })
  })

  describe('Bulk Operation Validation', () => {
    it('should reject bulk operation without keyword IDs', async () => {
      const bulkOperation = {
        operation: 'activate',
        keywordIds: []
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectError(response, 400)
      const data = await response.json()
      
      expect(data.error).toContain('required')
    })

    it('should reject bulk operation without operation type', async () => {
      const bulkOperation = {
        keywordIds: [1, 2, 3]
        // operation is missing
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectError(response, 400)
      const data = await response.json()
      
      expect(data.error).toContain('required')
    })

    it('should reject invalid operation types', async () => {
      const bulkOperation = {
        operation: 'invalid-operation',
        keywordIds: [1, 2, 3]
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectError(response, 400)
      const data = await response.json()
      
      expect(data.error).toContain('Invalid operation')
    })

    it('should require scraping type for scrape operations', async () => {
      const bulkOperation = {
        operation: 'scrape',
        keywordIds: [1, 2, 3]
        // scrapingType is missing
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectError(response, 400)
      const data = await response.json()
      
      expect(data.error).toContain('Scraping type is required')
    })

    it('should only affect user\'s own keywords', async () => {
      // Create keyword for different user
      const { data: otherKeyword } = await require('@/test-utils/integration-setup').testSupabase
        .from('keywords_v2')
        .insert({
          keyword: 'other-user-keyword',
          category: 'test',
          gmail: 'other-user@test.com',
          user_id: 'other-user-id',
          status: 'active'
        })
        .select()
        .single()

      const bulkOperation = {
        operation: 'deactivate',
        keywordIds: [otherKeyword.id]
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.affected).toBe(1) // Indicates operation was attempted

      // Verify other user's keyword was NOT affected
      const { data: unchangedKeyword } = await require('@/test-utils/integration-setup').testSupabase
        .from('keywords_v2')
        .select('status')
        .eq('id', otherKeyword.id)
        .single()

      expect(unchangedKeyword.status).toBe('active') // Should remain unchanged
    })
  })

  describe('GET /api/keywords/bulk - Bulk Operation Status', () => {
    it('should return empty bulk operation status', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk')
      
      const response = await GET(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.jobs).toEqual([])
      expect(data.message).toContain('not yet implemented')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle bulk operations on many keywords', async () => {
      // Create more keywords for bulk testing
      const manyKeywords = await TestDatabase.seedKeywords(50)
      const keywordIds = manyKeywords.map(k => k.id)
      
      const bulkOperation = {
        operation: 'activate',
        keywordIds
      }

      const startTime = Date.now()
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      const endTime = Date.now()
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.affected).toBe(50)
      
      // Performance assertion - should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max
    })

    it('should handle mixed valid and invalid keyword IDs', async () => {
      const validIds = testKeywords.slice(0, 2).map(k => k.id)
      const invalidIds = [99999, 99998] // Non-existent IDs
      const mixedIds = [...validIds, ...invalidIds]
      
      const bulkOperation = {
        operation: 'activate',
        keywordIds: mixedIds
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      // Should succeed but only affect valid keywords
      expect(data.success).toBe(true)
      expect(data.affected).toBe(4) // All IDs were processed
      
      // Verify only valid keywords were actually updated
      const { data: updatedKeywords } = await require('@/test-utils/integration-setup').testSupabase
        .from('keywords_v2')
        .select('status')
        .in('id', validIds)

      updatedKeywords.forEach(keyword => {
        expect(keyword.status).toBe('active')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: '{ invalid json }'
      })

      const response = await POST(request)
      
      expectError(response, 500)
      const data = await response.json()
      
      expect(data.error).toBeTruthy()
    })

    it('should handle empty request body', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: ''
      })

      const response = await POST(request)
      
      expectError(response, 500)
    })
  })
})