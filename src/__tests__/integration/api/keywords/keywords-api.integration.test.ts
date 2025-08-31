import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '../route'
import { 
  testSupabase, 
  TEST_USER, 
  createTestKeyword,
  createMockNextRequest,
  expectSuccess,
  expectError
} from '@/test-utils/integration-setup'
import { TestDatabase, TestValidators } from '@/test-utils/test-database'

describe('Keywords API Integration Tests', () => {
  describe('GET /api/keywords', () => {
    it('should return empty array when no keywords exist', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords')
      const response = await GET(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.keywords).toEqual([])
      expect(data.total).toBe(0)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
    })

    it('should return paginated keywords for authenticated user', async () => {
      // Seed test data
      const seededKeywords = await TestDatabase.seedKeywords(15)
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords?page=2&limit=5')
      const response = await GET(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.keywords).toHaveLength(5)
      expect(data.page).toBe(2)
      expect(data.limit).toBe(5)
      
      // Validate each keyword
      data.keywords.forEach(TestValidators.validateKeyword)
    })

    it('should filter keywords by search term', async () => {
      await TestDatabase.seedKeywords(10)
      
      // Create a specific keyword to search for
      const { data: specificKeyword } = await testSupabase
        .from('keywords_v2')
        .insert(createTestKeyword({ 
          keyword: 'unique-search-term',
          description: 'This should be found by search'
        }))
        .select()
        .single()

      const request = createMockNextRequest(
        'http://localhost:3000/api/keywords?search=unique-search'
      )
      const response = await GET(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.keywords).toHaveLength(1)
      expect(data.keywords[0].keyword).toBe('unique-search-term')
    })

    it('should filter keywords by status', async () => {
      await TestDatabase.seedKeywords(10)
      
      const request = createMockNextRequest(
        'http://localhost:3000/api/keywords?status=active'
      )
      const response = await GET(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      // All returned keywords should be active
      data.keywords.forEach(keyword => {
        expect(keyword.status).toBe('active')
      })
    })

    it('should sort keywords by different fields', async () => {
      const seededKeywords = await TestDatabase.seedKeywords(5)
      
      // Test sorting by priority ascending
      const request = createMockNextRequest(
        'http://localhost:3000/api/keywords?sortBy=priority&sortOrder=asc'
      )
      const response = await GET(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      // Verify sorting
      for (let i = 1; i < data.keywords.length; i++) {
        expect(data.keywords[i].priority).toBeGreaterThanOrEqual(
          data.keywords[i - 1].priority
        )
      }
    })

    it('should handle invalid pagination parameters gracefully', async () => {
      const request = createMockNextRequest(
        'http://localhost:3000/api/keywords?page=0&limit=-5'
      )
      const response = await GET(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      // Should use defaults
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
    })
  })

  describe('POST /api/keywords', () => {
    it('should create a new keyword with valid data', async () => {
      const keywordData = createTestKeyword({
        keyword: 'integration-test-keyword',
        description: 'Test description',
        category: 'testing',
        priority: 3
      })

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(keywordData)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      TestValidators.validateKeyword(data)
      expect(data.keyword).toBe('integration-test-keyword')
      expect(data.description).toBe('Test description')
      expect(data.category).toBe('testing')
      expect(data.priority).toBe(3)

      // Verify it was actually saved to database
      const { data: savedKeyword } = await testSupabase
        .from('keywords_v2')
        .select('*')
        .eq('id', data.id)
        .single()

      expect(savedKeyword).toBeTruthy()
      expect(savedKeyword.keyword).toBe('integration-test-keyword')
    })

    it('should reject keyword creation with missing required fields', async () => {
      const invalidData = {
        description: 'Missing keyword field',
        // keyword is missing
        category: 'testing'
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      
      expectError(response, 400)
      const data = await response.json()
      
      expect(data.error).toContain('required')
    })

    it('should prevent duplicate keywords for same user', async () => {
      const keywordData = createTestKeyword({ keyword: 'duplicate-test-keyword' })

      // Create first keyword
      await testSupabase.from('keywords_v2').insert(keywordData)

      // Try to create duplicate
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(keywordData)
      })

      const response = await POST(request)
      
      expectError(response, 500)
      const data = await response.json()
      
      expect(data.error).toBeTruthy()
    })

    it('should handle very long keyword text appropriately', async () => {
      const keywordData = createTestKeyword({
        keyword: 'a'.repeat(1000), // Very long keyword
        description: 'b'.repeat(2000) // Very long description
      })

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(keywordData)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      TestValidators.validateKeyword(data)
    })

    it('should set default values for optional fields', async () => {
      const minimalKeywordData = {
        keyword: 'minimal-keyword',
        category: 'testing',
        gmail: TEST_USER.email
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(minimalKeywordData)
      })

      const response = await POST(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.status).toBe('active') // Default status
      expect(data.priority).toBe('1') // Default priority
      expect(data.gmail).toBe(TEST_USER.email)
    })

    it('should handle malformed JSON gracefully', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: '{ invalid json }'
      })

      const response = await POST(request)
      
      expectError(response, 500)
      const data = await response.json()
      
      expect(data.error).toBeTruthy()
    })
  })

  describe('PUT /api/keywords', () => {
    it('should update existing keyword with valid data', async () => {
      // Create initial keyword
      const { data: initialKeyword } = await testSupabase
        .from('keywords_v2')
        .insert(createTestKeyword({ keyword: 'initial-keyword' }))
        .select()
        .single()

      const updateData = {
        id: initialKeyword.id,
        keyword: 'updated-keyword',
        description: 'Updated description',
        category: 'updated-category',
        priority: 4,
        status: 'inactive'
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.keyword).toBe('updated-keyword')
      expect(data.description).toBe('Updated description')
      expect(data.category).toBe('updated-category')
      expect(data.priority).toBe(4)
      expect(data.status).toBe('inactive')

      // Verify database was updated
      const { data: updatedKeyword } = await testSupabase
        .from('keywords_v2')
        .select('*')
        .eq('id', initialKeyword.id)
        .single()

      expect(updatedKeyword.keyword).toBe('updated-keyword')
      expect(updatedKeyword.updated_at).not.toBe(initialKeyword.updated_at)
    })

    it('should reject update for non-existent keyword', async () => {
      const updateData = {
        id: 99999, // Non-existent ID
        keyword: 'non-existent',
        category: 'test'
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      
      expectError(response, 404)
      const data = await response.json()
      
      expect(data.error).toContain('not found')
    })

    it('should prevent user from updating another user\'s keyword', async () => {
      // Create keyword for different user
      const { data: otherKeyword } = await testSupabase
        .from('keywords_v2')
        .insert(createTestKeyword({ 
          gmail: 'other-user@test.com',
          user_id: 'other-user-id'
        }))
        .select()
        .single()

      const updateData = {
        id: otherKeyword.id,
        keyword: 'hijacked-keyword',
        category: 'test'
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      
      expectError(response, 404)
    })

    it('should validate required fields in update', async () => {
      const { data: keyword } = await testSupabase
        .from('keywords_v2')
        .insert(createTestKeyword())
        .select()
        .single()

      const invalidUpdateData = {
        id: keyword.id,
        keyword: '', // Empty keyword should fail
        category: 'test'
      }

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'PUT',
        body: JSON.stringify(invalidUpdateData)
      })

      const response = await PUT(request)
      
      expectError(response, 400)
    })
  })

  describe('DELETE /api/keywords', () => {
    it('should delete existing keyword', async () => {
      const { data: keyword } = await testSupabase
        .from('keywords_v2')
        .insert(createTestKeyword({ keyword: 'keyword-to-delete' }))
        .select()
        .single()

      const request = createMockNextRequest(
        `http://localhost:3000/api/keywords?id=${keyword.id}`,
        { method: 'DELETE' }
      )

      const response = await DELETE(request)
      
      expectSuccess(response)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.deletedKeyword.id).toBe(keyword.id)

      // Verify keyword was deleted
      const { data: deletedKeyword } = await testSupabase
        .from('keywords_v2')
        .select('*')
        .eq('id', keyword.id)
        .single()

      expect(deletedKeyword).toBeNull()
    })

    it('should reject deletion of non-existent keyword', async () => {
      const request = createMockNextRequest(
        'http://localhost:3000/api/keywords?id=99999',
        { method: 'DELETE' }
      )

      const response = await DELETE(request)
      
      expectError(response, 404)
      const data = await response.json()
      
      expect(data.error).toContain('not found')
    })

    it('should prevent user from deleting another user\'s keyword', async () => {
      const { data: otherKeyword } = await testSupabase
        .from('keywords_v2')
        .insert(createTestKeyword({ 
          gmail: 'other-user@test.com',
          user_id: 'other-user-id'
        }))
        .select()
        .single()

      const request = createMockNextRequest(
        `http://localhost:3000/api/keywords?id=${otherKeyword.id}`,
        { method: 'DELETE' }
      )

      const response = await DELETE(request)
      
      expectError(response, 404)
    })

    it('should require ID parameter', async () => {
      const request = createMockNextRequest(
        'http://localhost:3000/api/keywords',
        { method: 'DELETE' }
      )

      const response = await DELETE(request)
      
      expectError(response, 400)
      const data = await response.json()
      
      expect(data.error).toContain('required')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we test basic error response structure
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      })

      const response = await POST(request)
      
      expectError(response, 400)
      const data = await response.json()
      
      expect(data).toHaveProperty('error')
    })

    it('should validate keyword text constraints', async () => {
      const keywordData = createTestKeyword({
        keyword: '   ', // Only whitespace
        category: 'test'
      })

      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(keywordData)
      })

      const response = await POST(request)
      
      // Should either fail validation or trim to empty and fail
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle concurrent requests properly', async () => {
      const keywordData = createTestKeyword({
        keyword: 'concurrent-test-keyword'
      })

      // Make multiple concurrent requests
      const requests = Array.from({ length: 5 }, () =>
        POST(createMockNextRequest('http://localhost:3000/api/keywords', {
          method: 'POST',
          body: JSON.stringify({
            ...keywordData,
            keyword: `${keywordData.keyword}-${Math.random()}`
          })
        }))
      )

      const responses = await Promise.all(requests)
      
      // All should succeed since keywords are unique
      responses.forEach(response => {
        expect(response.status).toBeLessThan(400)
      })
    })
  })
})