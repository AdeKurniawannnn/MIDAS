/**
 * @file Keywords API Integration Tests
 * @description Real integration tests for /api/keywords/* endpoints
 * Tests actual database operations, validation, authentication, and business logic
 */

import { GET, POST, PUT, DELETE } from '../keywords/route'
import { testSupabase, TEST_USER, createTestKeyword, createAuthHeaders, createMockNextRequest } from '@/test-utils/integration-setup'
import { NextRequest } from 'next/server'

describe('Keywords API Integration Tests', () => {
  
  describe('GET /api/keywords - Fetch Keywords', () => {
    
    test('should return empty array when user has no keywords', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.keywords).toEqual([])
      expect(data.total).toBe(0)
    })
    
    test('should return user keywords with proper filtering', async () => {
      // Create test keywords in database
      const testKeywords = [
        createTestKeyword({ keyword: 'seo optimization', category: 'marketing', status: 'active' }),
        createTestKeyword({ keyword: 'web development', category: 'tech', status: 'inactive' }),
        createTestKeyword({ keyword: 'content strategy', category: 'marketing', status: 'active' })
      ]
      
      const { data: insertedKeywords } = await testSupabase
        .from('keywords')
        .insert(testKeywords)
        .select()
      
      expect(insertedKeywords).toHaveLength(3)
      
      // Test fetching all keywords
      const request = createMockNextRequest('http://localhost:3000/api/keywords')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.keywords).toHaveLength(3)
      expect(data.keywords[0]).toHaveProperty('keyword')
      expect(data.keywords[0]).toHaveProperty('category')
      expect(data.keywords[0]).toHaveProperty('status')
    })
    
    test('should filter keywords by search parameter', async () => {
      // Create keywords with different terms
      await testSupabase.from('keywords').insert([
        createTestKeyword({ keyword: 'react development', category: 'tech' }),
        createTestKeyword({ keyword: 'vue framework', category: 'tech' }),
        createTestKeyword({ keyword: 'angular programming', category: 'tech' })
      ])
      
      // Search for "react"
      const request = createMockNextRequest('http://localhost:3000/api/keywords?search=react')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.keywords).toHaveLength(1)
      expect(data.keywords[0].keyword).toContain('react')
    })
    
    test('should filter keywords by status', async () => {
      await testSupabase.from('keywords').insert([
        createTestKeyword({ status: 'active' }),
        createTestKeyword({ status: 'inactive' }),
        createTestKeyword({ status: 'archived' })
      ])
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords?status=active')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.keywords).toHaveLength(1)
      expect(data.keywords[0].status).toBe('active')
    })
    
    test('should handle pagination correctly', async () => {
      // Create 15 test keywords
      const keywords = Array.from({ length: 15 }, (_, i) => 
        createTestKeyword({ keyword: `keyword-${i}` })
      )
      await testSupabase.from('keywords').insert(keywords)
      
      // Request first page with limit of 10
      const request = createMockNextRequest('http://localhost:3000/api/keywords?page=1&limit=10')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.keywords).toHaveLength(10)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
    })
    
    test('should only return keywords for authenticated user', async () => {
      // Create keyword for different user
      await testSupabase.from('keywords').insert(
        createTestKeyword({ email_user: 'other-user@test.com' })
      )
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.keywords).toHaveLength(0) // Should not see other user's keywords
    })
  })
  
  describe('POST /api/keywords - Create Keyword', () => {
    
    test('should create keyword with valid data', async () => {
      const keywordData = {
        keyword: 'digital marketing',
        description: 'Learn digital marketing strategies',
        category: 'marketing',
        priority: 2,
        status: 'active'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(keywordData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.keyword).toBe('digital marketing')
      expect(data.category).toBe('marketing')
      expect(data).toHaveProperty('id')
      
      // Verify it was actually saved to database
      const { data: saved } = await testSupabase
        .from('keywords')
        .select('*')
        .eq('id', data.id)
        .single()
      
      expect(saved.keyword).toBe('digital marketing')
      expect(saved.email_user).toBe(TEST_USER.email)
    })
    
    test('should reject request without required fields', async () => {
      const invalidData = {
        description: 'Missing keyword field',
        category: 'marketing'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('required')
    })
    
    test('should handle duplicate keywords gracefully', async () => {
      const keywordData = createTestKeyword({ keyword: 'duplicate-keyword' })
      
      // Insert first keyword
      await testSupabase.from('keywords').insert(keywordData)
      
      // Try to create duplicate
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ 
          keyword: 'duplicate-keyword',
          category: 'test'
        })
      })
      
      const response = await POST(request)
      
      // Should handle gracefully (either success or proper error)
      expect([200, 409, 400]).toContain(response.status)
    })
    
    test('should trim whitespace from keyword input', async () => {
      const keywordData = {
        keyword: '  social media marketing  ',
        category: 'marketing'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify(keywordData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.keyword).toBe('social media marketing') // Should be trimmed
    })
  })
  
  describe('PUT /api/keywords - Update Keyword', () => {
    
    test('should update existing keyword with valid data', async () => {
      // Create initial keyword
      const { data: initialKeyword } = await testSupabase
        .from('keywords')
        .insert(createTestKeyword({ keyword: 'initial-keyword' }))
        .select()
        .single()
      
      const updateData = {
        id: initialKeyword.id,
        keyword: 'updated-keyword',
        description: 'Updated description',
        category: 'updated-category',
        priority: 3,
        status: 'inactive'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      
      const response = await PUT(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.keyword).toBe('updated-keyword')
      expect(data.status).toBe('inactive')
      
      // Verify changes in database
      const { data: updatedKeyword } = await testSupabase
        .from('keywords')
        .select('*')
        .eq('id', initialKeyword.id)
        .single()
      
      expect(updatedKeyword.keyword).toBe('updated-keyword')
      expect(updatedKeyword.description).toBe('Updated description')
    })
    
    test('should not update keyword belonging to different user', async () => {
      // Create keyword for different user
      const { data: otherUserKeyword } = await testSupabase
        .from('keywords')
        .insert(createTestKeyword({ 
          email_user: 'other-user@test.com',
          keyword: 'other-user-keyword'
        }))
        .select()
        .single()
      
      const updateData = {
        id: otherUserKeyword.id,
        keyword: 'hacked-keyword',
        category: 'hacking'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      
      const response = await PUT(request)
      expect(response.status).toBe(404) // Should not find keyword for this user
    })
    
    test('should reject update without required fields', async () => {
      const invalidUpdate = {
        // Missing id
        keyword: 'test-keyword'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'PUT',
        body: JSON.stringify(invalidUpdate)
      })
      
      const response = await PUT(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('required')
    })
  })
  
  describe('DELETE /api/keywords - Delete Keyword', () => {
    
    test('should delete existing keyword', async () => {
      const { data: keyword } = await testSupabase
        .from('keywords')
        .insert(createTestKeyword())
        .select()
        .single()
      
      const request = createMockNextRequest(
        `http://localhost:3000/api/keywords?id=${keyword.id}`,
        { method: 'DELETE' }
      )
      
      const response = await DELETE(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Verify deletion from database
      const { data: deletedKeyword } = await testSupabase
        .from('keywords')
        .select('*')
        .eq('id', keyword.id)
        .single()
      
      expect(deletedKeyword).toBeNull()
    })
    
    test('should delete only own keywords', async () => {
      const { data: keyword } = await testSupabase
        .from('keywords')
        .insert(createTestKeyword({ keyword: 'keyword-to-delete' }))
        .select()
        .single()
      
      const request = createMockNextRequest(
        `http://localhost:3000/api/keywords?id=${keyword.id}`,
        { method: 'DELETE' }
      )
      
      const response = await DELETE(request)
      expect(response.status).toBe(200)
      
      // Verify actual deletion occurred
      const { data: checkDeleted } = await testSupabase
        .from('keywords')
        .select('*')
        .eq('id', keyword.id)
        .single()
      
      expect(checkDeleted).toBeNull()
    })
    
    test('should not delete keyword belonging to different user', async () => {
      // Create keyword for different user
      const { data: otherUserKeyword } = await testSupabase
        .from('keywords')
        .insert(createTestKeyword({ 
          email_user: 'other-user@test.com',
          keyword: 'protected-keyword'
        }))
        .select()
        .single()
      
      const request = createMockNextRequest(
        `http://localhost:3000/api/keywords?id=${otherUserKeyword.id}`,
        { method: 'DELETE' }
      )
      
      const response = await DELETE(request)
      expect(response.status).toBe(404) // Should not find keyword for this user
    })
    
    test('should return 400 for missing ID parameter', async () => {
      const request = createMockNextRequest(
        'http://localhost:3000/api/keywords',
        { method: 'DELETE' }
      )
      
      const response = await DELETE(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('required')
    })
    
    test('should return 404 for non-existent keyword', async () => {
      const request = createMockNextRequest(
        'http://localhost:3000/api/keywords?id=999999',
        { method: 'DELETE' }
      )
      
      const response = await DELETE(request)
      expect(response.status).toBe(404)
    })
  })
  
  describe('Authentication & Authorization', () => {
    
    test('should handle missing authentication headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'Content-Type': 'application/json'
          // Missing x-user-email and x-user-id
        }
      })
      
      const response = await GET(request)
      
      // Should still work with fallback user in development
      expect(response.status).toBe(200)
    })
    
    test('should use provided authentication headers', async () => {
      const customUser = {
        email: 'custom-user@test.com',
        id: 'custom-user-id'
      }
      
      // Create keyword for custom user
      await testSupabase.from('keywords').insert(
        createTestKeyword({ email_user: customUser.email })
      )
      
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'x-user-email': customUser.email,
          'x-user-id': customUser.id,
          'Content-Type': 'application/json'
        }
      })
      
      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.keywords).toHaveLength(1)
    })
  })
  
  describe('Error Handling & Edge Cases', () => {
    
    test('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: '{"keyword": "test", invalid json}'
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
    
    test('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: ''
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
    
    test('should handle very long keyword names', async () => {
      const longKeyword = 'a'.repeat(1000)
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          keyword: longKeyword,
          category: 'test'
        })
      })
      
      const response = await POST(request)
      
      // Should either accept or gracefully reject
      expect([200, 400]).toContain(response.status)
    })
    
    test('should handle SQL injection attempts', async () => {
      const maliciousKeyword = "'; DROP TABLE keywords; --"
      
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          keyword: maliciousKeyword,
          category: 'test'
        })
      })
      
      const response = await POST(request)
      
      // Should handle gracefully without executing SQL injection
      expect([200, 400]).toContain(response.status)
      
      // Verify database is still intact
      const { error } = await testSupabase.from('keywords').select('*').limit(1)
      expect(error).toBeNull() // Table should still exist
    })
  })
})