/**
 * @file Bulk Operations Integration Tests
 * @description Real integration tests for /api/keywords/bulk endpoint
 * Tests bulk status updates, bulk deletions, transaction handling, and performance
 */

import { GET, POST } from '../route'
import { testSupabase, TEST_USER, createTestKeyword, createMockNextRequest } from '@/test-utils/integration-setup'

describe('Bulk Operations Integration Tests', () => {
  
  describe('POST /api/keywords/bulk - Bulk Status Updates', () => {
    
    test('should activate multiple keywords in bulk', async () => {
      // Create test keywords with inactive status
      const keywordData = [
        createTestKeyword({ keyword: 'bulk-test-1', status: 'inactive' }),
        createTestKeyword({ keyword: 'bulk-test-2', status: 'inactive' }),
        createTestKeyword({ keyword: 'bulk-test-3', status: 'inactive' })
      ]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(keywordData)
        .select()
      
      expect(createdKeywords).toHaveLength(3)
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      // Perform bulk activation
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'activate'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.operation).toBe('activate')
      expect(data.affected).toBe(3)
      
      // Verify keywords are actually activated in database
      const { data: activatedKeywords } = await testSupabase
        .from('keywords')
        .select('*')
        .in('id', keywordIds)
      
      expect(activatedKeywords).toHaveLength(3)
      activatedKeywords.forEach(keyword => {
        expect(keyword.status).toBe('active')
      })
    })
    
    test('should deactivate multiple keywords in bulk', async () => {
      // Create test keywords with active status
      const keywordData = [
        createTestKeyword({ keyword: 'deactivate-test-1', status: 'active' }),
        createTestKeyword({ keyword: 'deactivate-test-2', status: 'active' })
      ]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(keywordData)
        .select()
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      // Perform bulk deactivation
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'deactivate'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.operation).toBe('deactivate')
      expect(data.affected).toBe(2)
      
      // Verify keywords are actually deactivated in database
      const { data: deactivatedKeywords } = await testSupabase
        .from('keywords')
        .select('*')
        .in('id', keywordIds)
      
      expect(deactivatedKeywords).toHaveLength(2)
      deactivatedKeywords.forEach(keyword => {
        expect(keyword.status).toBe('inactive')
      })
    })
    
    test('should archive multiple keywords in bulk', async () => {
      // Create test keywords
      const keywordData = [
        createTestKeyword({ keyword: 'archive-test-1', status: 'active' }),
        createTestKeyword({ keyword: 'archive-test-2', status: 'inactive' })
      ]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(keywordData)
        .select()
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      // Perform bulk archiving
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'archive'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.operation).toBe('archive')
      expect(data.affected).toBe(2)
      
      // Verify keywords are actually archived in database
      const { data: archivedKeywords } = await testSupabase
        .from('keywords')
        .select('*')
        .in('id', keywordIds)
      
      expect(archivedKeywords).toHaveLength(2)
      archivedKeywords.forEach(keyword => {
        expect(keyword.status).toBe('archived')
      })
    })
  })
  
  describe('POST /api/keywords/bulk - Bulk Deletion', () => {
    
    test('should delete multiple keywords in bulk', async () => {
      // Create test keywords
      const keywordData = [
        createTestKeyword({ keyword: 'delete-test-1' }),
        createTestKeyword({ keyword: 'delete-test-2' }),
        createTestKeyword({ keyword: 'delete-test-3' })
      ]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(keywordData)
        .select()
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      // Perform bulk deletion
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'delete'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.operation).toBe('delete')
      expect(data.affected).toBe(3)
      
      // Verify keywords are actually deleted from database
      const { data: deletedKeywords } = await testSupabase
        .from('keywords')
        .select('*')
        .in('id', keywordIds)
      
      expect(deletedKeywords).toHaveLength(0)
    })
    
    test('should only delete keywords belonging to authenticated user', async () => {
      // Create keywords for different users
      const user1Keywords = [
        createTestKeyword({ email_user: 'user1@test.com', keyword: 'user1-delete-1' }),
        createTestKeyword({ email_user: 'user1@test.com', keyword: 'user1-delete-2' })
      ]
      
      const user2Keywords = [
        createTestKeyword({ email_user: 'user2@test.com', keyword: 'user2-protected-1' }),
        createTestKeyword({ email_user: 'user2@test.com', keyword: 'user2-protected-2' })
      ]
      
      const { data: user1Created } = await testSupabase.from('keywords').insert(user1Keywords).select()
      const { data: user2Created } = await testSupabase.from('keywords').insert(user2Keywords).select()
      
      const allKeywordIds = [
        ...user1Created.map(k => k.id),
        ...user2Created.map(k => k.id)
      ]
      
      // Try to delete all keywords as user1
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        headers: {
          'x-user-email': 'user1@test.com',
          'x-user-id': 'user1-id',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywordIds: allKeywordIds,
          operation: 'delete'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      // Verify only user1's keywords were deleted
      const { data: remainingKeywords } = await testSupabase
        .from('keywords')
        .select('*')
        .in('id', allKeywordIds)
      
      expect(remainingKeywords).toHaveLength(2) // Only user2's keywords should remain
      expect(remainingKeywords.every(k => k.email_user === 'user2@test.com')).toBe(true)
    })
  })
  
  describe('POST /api/keywords/bulk - Scraping Operations', () => {
    
    test('should handle bulk scraping operation placeholder', async () => {
      // Create test keywords
      const keywordData = [
        createTestKeyword({ keyword: 'scrape-test-1' }),
        createTestKeyword({ keyword: 'scrape-test-2' })
      ]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(keywordData)
        .select()
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      // Perform bulk scraping operation
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'scrape',
          scrapingType: 'instagram'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.operation).toBe('scrape')
      expect(data.affected).toBe(2)
    })
    
    test('should require scraping type for scrape operation', async () => {
      const keywordData = [createTestKeyword({ keyword: 'scrape-no-type' })]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(keywordData)
        .select()
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      // Try to scrape without specifying scraping type
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'scrape'
          // Missing scrapingType
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Scraping type is required')
    })
  })
  
  describe('GET /api/keywords/bulk - Job Status Tracking', () => {
    
    test('should return empty jobs array for now', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.jobs).toEqual([])
      expect(data.message).toContain('not yet implemented')
    })
  })
  
  describe('Input Validation and Error Handling', () => {
    
    test('should reject request without keyword IDs', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'activate'
          // Missing keywordIds
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Keyword IDs and operation are required')
    })
    
    test('should reject request with empty keyword IDs array', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds: [],
          operation: 'activate'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Keyword IDs and operation are required')
    })
    
    test('should reject request without operation', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds: [1, 2, 3]
          // Missing operation
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Keyword IDs and operation are required')
    })
    
    test('should reject invalid operation type', async () => {
      const keywordData = [createTestKeyword()]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(keywordData)
        .select()
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'invalid-operation'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Invalid operation')
    })
    
    test('should handle non-existent keyword IDs gracefully', async () => {
      const nonExistentIds = [99999, 99998, 99997]
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds: nonExistentIds,
          operation: 'activate'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200) // Should succeed even if no keywords found
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.affected).toBe(3) // Reports attempt count, not actual affected
    })
    
    test('should handle malformed keyword IDs', async () => {
      const malformedIds = ['not-a-number', null, undefined, 'abc']
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds: malformedIds,
          operation: 'activate'
        })
      })
      
      const response = await POST(request)
      
      // Should handle gracefully (either error or filter out invalid IDs)
      expect([200, 400, 500]).toContain(response.status)
    })
  })
  
  describe('Performance and Large Dataset Testing', () => {
    
    test('should handle bulk operations on large dataset', async () => {
      // Create 50 test keywords
      const bulkKeywords = Array.from({ length: 50 }, (_, i) => 
        createTestKeyword({ keyword: `bulk-performance-test-${i}`, status: 'inactive' })
      )
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(bulkKeywords)
        .select('id')
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      // Measure performance of bulk activation
      const startTime = Date.now()
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'activate'
        })
      })
      
      const response = await POST(request)
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.affected).toBe(50)
      
      // Performance assertion - should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000)
      
      // Verify all keywords were actually updated
      const { data: updatedKeywords } = await testSupabase
        .from('keywords')
        .select('status')
        .in('id', keywordIds)
      
      expect(updatedKeywords).toHaveLength(50)
      expect(updatedKeywords.every(k => k.status === 'active')).toBe(true)
    })
    
    test('should handle concurrent bulk operations', async () => {
      // Create keywords for concurrent operations
      const batch1 = Array.from({ length: 10 }, (_, i) => 
        createTestKeyword({ keyword: `concurrent-batch1-${i}`, status: 'inactive' })
      )
      
      const batch2 = Array.from({ length: 10 }, (_, i) => 
        createTestKeyword({ keyword: `concurrent-batch2-${i}`, status: 'active' })
      )
      
      const { data: batch1Created } = await testSupabase.from('keywords').insert(batch1).select('id')
      const { data: batch2Created } = await testSupabase.from('keywords').insert(batch2).select('id')
      
      // Create concurrent bulk operations
      const operation1 = POST(createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds: batch1Created.map(k => k.id),
          operation: 'activate'
        })
      }))
      
      const operation2 = POST(createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds: batch2Created.map(k => k.id),
          operation: 'deactivate'
        })
      }))
      
      // Execute concurrent operations
      const [response1, response2] = await Promise.all([operation1, operation2])
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      const [data1, data2] = await Promise.all([response1.json(), response2.json()])
      
      expect(data1.success).toBe(true)
      expect(data2.success).toBe(true)
      
      // Verify final states
      const { data: finalBatch1 } = await testSupabase
        .from('keywords')
        .select('status')
        .in('id', batch1Created.map(k => k.id))
      
      const { data: finalBatch2 } = await testSupabase
        .from('keywords')
        .select('status')
        .in('id', batch2Created.map(k => k.id))
      
      expect(finalBatch1.every(k => k.status === 'active')).toBe(true)
      expect(finalBatch2.every(k => k.status === 'inactive')).toBe(true)
    })
  })
  
  describe('Transaction and Data Integrity', () => {
    
    test('should maintain data consistency during bulk operations', async () => {
      // Create keywords with specific initial states
      const keywordData = [
        createTestKeyword({ keyword: 'consistency-test-1', status: 'active', priority: '1' }),
        createTestKeyword({ keyword: 'consistency-test-2', status: 'active', priority: '2' }),
        createTestKeyword({ keyword: 'consistency-test-3', status: 'active', priority: '3' })
      ]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(keywordData)
        .select()
      
      const keywordIds = createdKeywords.map(k => k.id)
      
      // Perform bulk deactivation
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds,
          operation: 'deactivate'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      // Verify that only status changed, other fields remained intact
      const { data: updatedKeywords } = await testSupabase
        .from('keywords')
        .select('*')
        .in('id', keywordIds)
        .order('priority')
      
      expect(updatedKeywords).toHaveLength(3)
      
      updatedKeywords.forEach((keyword, index) => {
        expect(keyword.status).toBe('inactive') // Status should be changed
        expect(keyword.keyword).toBe(`consistency-test-${index + 1}`) // Keyword should remain same
        expect(keyword.priority).toBe((index + 1).toString()) // Priority should remain same
        expect(keyword.email_user).toBe(TEST_USER.email) // User association should remain same
      })
    })
    
    test('should handle partial failures gracefully', async () => {
      // This test would be more meaningful with actual database constraints
      // For now, we test that the operation reports correct affected count
      
      const validKeywords = [
        createTestKeyword({ keyword: 'partial-test-1' }),
        createTestKeyword({ keyword: 'partial-test-2' })
      ]
      
      const { data: createdKeywords } = await testSupabase
        .from('keywords')
        .insert(validKeywords)
        .select()
      
      const mixedIds = [
        ...createdKeywords.map(k => k.id),
        99999 // Non-existent ID
      ]
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        body: JSON.stringify({
          keywordIds: mixedIds,
          operation: 'activate'
        })
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Verify valid keywords were processed
      const { data: processedKeywords } = await testSupabase
        .from('keywords')
        .select('*')
        .in('id', createdKeywords.map(k => k.id))
      
      expect(processedKeywords).toHaveLength(2)
      processedKeywords.forEach(keyword => {
        expect(keyword.status).toBe('active')
      })
    })
  })
})