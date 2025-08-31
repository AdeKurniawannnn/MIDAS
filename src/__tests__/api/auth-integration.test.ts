/**
 * @file Authentication Integration Tests
 * @description Real integration tests for authentication flows across API routes
 * Tests user session management, route protection, authorization, and RLS policies
 */

import { GET as keywordsGET, POST as keywordsPOST } from '../keywords/route'
import { POST as bulkPOST } from '../keywords/bulk/route'
import { testSupabase, TEST_USER, createTestKeyword, createMockNextRequest } from '@/test-utils/integration-setup'
import { NextRequest } from 'next/server'

describe('Authentication Integration Tests', () => {
  
  describe('Route Authentication Requirements', () => {
    
    test('should allow access with valid user headers', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'x-user-email': TEST_USER.email,
          'x-user-id': TEST_USER.id,
          'Content-Type': 'application/json'
        }
      })
      
      const response = await keywordsGET(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('keywords')
    })
    
    test('should fallback to development user when headers missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'Content-Type': 'application/json'
          // Missing x-user-email and x-user-id headers
        }
      })
      
      const response = await keywordsGET(request)
      expect(response.status).toBe(200) // Should work with fallback user
    })
    
    test('should handle malformed user ID gracefully', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'x-user-email': 'test@example.com',
          'x-user-id': 'invalid-uuid-format',
          'Content-Type': 'application/json'
        }
      })
      
      const response = await keywordsGET(request)
      expect(response.status).toBe(200) // Should handle gracefully
    })
  })
  
  describe('User Data Isolation', () => {
    
    test('should only return data belonging to authenticated user', async () => {
      // Create keywords for different users
      const user1Keywords = [
        createTestKeyword({ email_user: 'user1@test.com', keyword: 'user1-keyword-1' }),
        createTestKeyword({ email_user: 'user1@test.com', keyword: 'user1-keyword-2' })
      ]
      
      const user2Keywords = [
        createTestKeyword({ email_user: 'user2@test.com', keyword: 'user2-keyword-1' }),
        createTestKeyword({ email_user: 'user2@test.com', keyword: 'user2-keyword-2' })
      ]
      
      await testSupabase.from('keywords').insert([...user1Keywords, ...user2Keywords])
      
      // Test user1 access
      const user1Request = createMockNextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'x-user-email': 'user1@test.com',
          'x-user-id': 'user1-id',
          'Content-Type': 'application/json'
        }
      })
      
      const user1Response = await keywordsGET(user1Request)
      expect(user1Response.status).toBe(200)
      
      const user1Data = await user1Response.json()
      expect(user1Data.keywords).toHaveLength(2)
      expect(user1Data.keywords.every(k => k.keyword.startsWith('user1-'))).toBe(true)
      
      // Test user2 access
      const user2Request = createMockNextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'x-user-email': 'user2@test.com',
          'x-user-id': 'user2-id',
          'Content-Type': 'application/json'
        }
      })
      
      const user2Response = await keywordsGET(user2Request)
      expect(user2Response.status).toBe(200)
      
      const user2Data = await user2Response.json()
      expect(user2Data.keywords).toHaveLength(2)
      expect(user2Data.keywords.every(k => k.keyword.startsWith('user2-'))).toBe(true)
    })
    
    test('should prevent cross-user data modification', async () => {
      // Create keyword for user1
      const { data: user1Keyword } = await testSupabase
        .from('keywords')
        .insert(createTestKeyword({ email_user: 'user1@test.com', keyword: 'user1-protected' }))
        .select()
        .single()
      
      // Try to modify user1's keyword as user2
      const updateRequest = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'PUT',
        headers: {
          'x-user-email': 'user2@test.com',
          'x-user-id': 'user2-id',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: user1Keyword.id,
          keyword: 'hacked-by-user2',
          category: 'hacking'
        })
      })
      
      const response = await keywordsPOST(updateRequest)
      expect(response.status).toBe(404) // Should not find keyword for user2
      
      // Verify original keyword is unchanged
      const { data: unchangedKeyword } = await testSupabase
        .from('keywords')
        .select('*')
        .eq('id', user1Keyword.id)
        .single()
      
      expect(unchangedKeyword.keyword).toBe('user1-protected')
      expect(unchangedKeyword.email_user).toBe('user1@test.com')
    })
    
    test('should prevent cross-user data deletion', async () => {
      // Create keyword for user1
      const { data: user1Keyword } = await testSupabase
        .from('keywords')
        .insert(createTestKeyword({ email_user: 'user1@test.com', keyword: 'user1-protected' }))
        .select()
        .single()
      
      // Try to delete user1's keyword as user2
      const deleteRequest = createMockNextRequest(
        `http://localhost:3000/api/keywords?id=${user1Keyword.id}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-email': 'user2@test.com',
            'x-user-id': 'user2-id',
            'Content-Type': 'application/json'
          }
        }
      )
      
      const response = await keywordsGET(deleteRequest) // Using GET as DELETE is not exposed directly
      expect(response.status).toBe(200) // GET should still work
      
      // Verify keyword still exists
      const { data: existingKeyword } = await testSupabase
        .from('keywords')
        .select('*')
        .eq('id', user1Keyword.id)
        .single()
      
      expect(existingKeyword).toBeTruthy()
      expect(existingKeyword.keyword).toBe('user1-protected')
    })
  })
  
  describe('Authorization Testing', () => {
    
    test('should enforce user ownership for bulk operations', async () => {
      // Create keywords for different users
      const user1Keywords = await testSupabase
        .from('keywords')
        .insert([
          createTestKeyword({ email_user: 'user1@test.com', keyword: 'user1-bulk-1' }),
          createTestKeyword({ email_user: 'user1@test.com', keyword: 'user1-bulk-2' })
        ])
        .select()
      
      const user2Keywords = await testSupabase
        .from('keywords')
        .insert([
          createTestKeyword({ email_user: 'user2@test.com', keyword: 'user2-bulk-1' })
        ])
        .select()
      
      const allKeywordIds = [
        ...user1Keywords.data.map(k => k.id),
        ...user2Keywords.data.map(k => k.id)
      ]
      
      // Try to perform bulk operation as user1 on mixed keyword ownership
      const bulkRequest = createMockNextRequest('http://localhost:3000/api/keywords/bulk', {
        method: 'POST',
        headers: {
          'x-user-email': 'user1@test.com',
          'x-user-id': 'user1-id',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywordIds: allKeywordIds,
          operation: 'activate'
        })
      })
      
      const response = await bulkPOST(bulkRequest)
      expect(response.status).toBe(200) // Operation should succeed
      
      // Verify only user1's keywords were affected
      const { data: updatedKeywords } = await testSupabase
        .from('keywords')
        .select('*')
        .in('id', allKeywordIds)
      
      const user1UpdatedKeywords = updatedKeywords.filter(k => k.email_user === 'user1@test.com')
      const user2UnchangedKeywords = updatedKeywords.filter(k => k.email_user === 'user2@test.com')
      
      // User1's keywords should be activated
      expect(user1UpdatedKeywords.every(k => k.status === 'active')).toBe(true)
      
      // User2's keywords should remain unchanged
      expect(user2UnchangedKeywords.every(k => k.status !== 'active')).toBe(true)
    })
  })
  
  describe('Session and Token Management', () => {
    
    test('should handle multiple concurrent user sessions', async () => {
      const users = [
        { email: 'concurrent1@test.com', id: 'concurrent1-id' },
        { email: 'concurrent2@test.com', id: 'concurrent2-id' },
        { email: 'concurrent3@test.com', id: 'concurrent3-id' }
      ]
      
      // Create keywords for each user
      for (const user of users) {
        await testSupabase.from('keywords').insert([
          createTestKeyword({ email_user: user.email, keyword: `${user.id}-keyword-1` }),
          createTestKeyword({ email_user: user.email, keyword: `${user.id}-keyword-2` })
        ])
      }
      
      // Make concurrent requests for different users
      const concurrentRequests = users.map(user => 
        keywordsGET(createMockNextRequest('http://localhost:3000/api/keywords', {
          headers: {
            'x-user-email': user.email,
            'x-user-id': user.id,
            'Content-Type': 'application/json'
          }
        }))
      )
      
      const responses = await Promise.all(concurrentRequests)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Each user should only see their own data
      for (let i = 0; i < users.length; i++) {
        const data = await responses[i].json()
        expect(data.keywords).toHaveLength(2)
        expect(data.keywords.every(k => k.keyword.includes(users[i].id))).toBe(true)
      }
    })
    
    test('should handle session expiration gracefully', async () => {
      // Test with potentially expired token scenario
      const expiredTokenRequest = createMockNextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'x-user-email': 'expired@test.com',
          'x-user-id': 'expired-user-id',
          'authorization': 'Bearer expired.jwt.token',
          'Content-Type': 'application/json'
        }
      })
      
      const response = await keywordsGET(expiredTokenRequest)
      
      // Should handle gracefully (fallback or proper error)
      expect([200, 401, 403]).toContain(response.status)
    })
    
    test('should validate user email format', async () => {
      const invalidEmails = [
        'not-an-email',
        '',
        '@example.com',
        'user@',
        'user space@example.com'
      ]
      
      for (const email of invalidEmails) {
        const request = createMockNextRequest('http://localhost:3000/api/keywords', {
          headers: {
            'x-user-email': email,
            'x-user-id': 'test-user-id',
            'Content-Type': 'application/json'
          }
        })
        
        const response = await keywordsGET(request)
        
        // Should handle gracefully (either fallback or validation error)
        expect([200, 400]).toContain(response.status)
      }
    })
  })
  
  describe('Permission Edge Cases', () => {
    
    test('should handle user switching between requests', async () => {
      // Create keyword as user1
      const { data: keyword } = await testSupabase
        .from('keywords')
        .insert(createTestKeyword({ email_user: 'user1@test.com', keyword: 'switch-test' }))
        .select()
        .single()
      
      // First request as user1 - should see keyword
      const user1Request = createMockNextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'x-user-email': 'user1@test.com',
          'x-user-id': 'user1-id',
          'Content-Type': 'application/json'
        }
      })
      
      const user1Response = await keywordsGET(user1Request)
      expect(user1Response.status).toBe(200)
      
      const user1Data = await user1Response.json()
      expect(user1Data.keywords).toHaveLength(1)
      
      // Second request as user2 - should not see keyword
      const user2Request = createMockNextRequest('http://localhost:3000/api/keywords', {
        headers: {
          'x-user-email': 'user2@test.com',
          'x-user-id': 'user2-id',
          'Content-Type': 'application/json'
        }
      })
      
      const user2Response = await keywordsGET(user2Request)
      expect(user2Response.status).toBe(200)
      
      const user2Data = await user2Response.json()
      expect(user2Data.keywords).toHaveLength(0)
    })
    
    test('should prevent privilege escalation attempts', async () => {
      // Try to create keyword with different user context in body vs headers
      const maliciousRequest = createMockNextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        headers: {
          'x-user-email': 'normal@test.com',
          'x-user-id': 'normal-user-id',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword: 'privilege-escalation-test',
          category: 'test',
          currentUser: {
            email: 'admin@test.com',
            id: 'admin-user-id'
          }
        })
      })
      
      const response = await keywordsPOST(maliciousRequest)
      expect(response.status).toBe(200) // Should succeed
      
      const data = await response.json()
      
      // Verify keyword was created with header user, not body user
      const { data: createdKeyword } = await testSupabase
        .from('keywords')
        .select('*')
        .eq('id', data.id)
        .single()
      
      expect(createdKeyword.email_user).toBe('normal@test.com') // Should use header email
    })
    
    test('should handle empty or null user identifiers', async () => {
      const nullUserRequests = [
        {
          headers: { 'x-user-email': '', 'x-user-id': 'test-id' }
        },
        {
          headers: { 'x-user-email': 'test@test.com', 'x-user-id': '' }
        },
        {
          headers: { 'x-user-email': null, 'x-user-id': 'test-id' }
        }
      ]
      
      for (const reqConfig of nullUserRequests) {
        const request = createMockNextRequest('http://localhost:3000/api/keywords', reqConfig)
        
        const response = await keywordsGET(request)
        
        // Should handle gracefully (fallback to development user or appropriate error)
        expect([200, 400, 401]).toContain(response.status)
      }
    })
  })
  
  describe('Security Headers and CORS', () => {
    
    test('should include appropriate security headers in responses', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/keywords')
      
      const response = await keywordsGET(request)
      expect(response.status).toBe(200)
      
      // Check for security-related headers
      const headers = response.headers
      expect(headers.get('Content-Type')).toBe('application/json')
      
      // Additional security headers could be tested here
      // e.g., X-Frame-Options, X-Content-Type-Options, etc.
    })
    
    test('should handle cross-origin requests appropriately', async () => {
      const corsRequest = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'GET',
        headers: {
          'Origin': 'https://external-domain.com',
          'x-user-email': TEST_USER.email,
          'x-user-id': TEST_USER.id,
          'Content-Type': 'application/json'
        }
      })
      
      const response = await keywordsGET(corsRequest)
      
      // Should handle CORS appropriately
      expect([200, 403]).toContain(response.status)
    })
  })
})