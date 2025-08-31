/**
 * @file Scraping API Integration Tests
 * @description Real integration tests for /api/scraping endpoint
 * Tests webhook integration, data validation, error handling, and platform-specific logic
 */

import { POST } from '../scraping/route'
import { createMockNextRequest, TEST_USER } from '@/test-utils/integration-setup'
import { NextRequest } from 'next/server'

// Mock fetch globally for webhook testing
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Scraping API Integration Tests', () => {
  
  beforeEach(() => {
    mockFetch.mockClear()
  })
  
  describe('POST /api/scraping - Instagram Scraping', () => {
    
    test('should successfully trigger Instagram scraping with valid URL', async () => {
      // Mock successful webhook response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ 
          success: true, 
          message: 'Webhook received successfully' 
        })),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)
      
      const scrapingData = {
        url: 'https://instagram.com/testaccount',
        maxResults: 10,
        userid: TEST_USER.id,
        userEmail: TEST_USER.email,
        scrapingType: 'instagram'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Data berhasil diproses')
      
      // Verify webhook was called with correct data
      expect(mockFetch).toHaveBeenCalledTimes(2) // First GET test, then POST
      
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall).toBeTruthy()
      expect(postCall[0]).toContain('Web_Midas') // Instagram webhook URL
    })
    
    test('should successfully trigger Google Maps scraping with coordinates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Test response'),
        headers: new Headers()
      } as Response)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ 
          success: true, 
          places: [] 
        })),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)
      
      const scrapingData = {
        url: 'https://maps.google.com/search/restaurants',
        maxResults: 20,
        userid: TEST_USER.id,
        userEmail: TEST_USER.email,
        scrapingType: 'google-maps',
        coordinates: { lat: -6.200000, lng: 106.816666 }
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Verify Google Maps webhook was called
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall[0]).toContain('Web_Midas_GoogleMaps')
      
      // Check that coordinates were included in the request
      const requestBody = JSON.parse(postCall[1].body as string)
      expect(requestBody.coordinates).toEqual({ lat: -6.200000, lng: 106.816666 })
    })
    
    test('should reject request without required URL', async () => {
      const invalidData = {
        maxResults: 10,
        scrapingType: 'instagram'
        // Missing required URL
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBe('URL diperlukan')
      
      // Should not call webhook
      expect(mockFetch).not.toHaveBeenCalled()
    })
    
    test('should reject invalid scraping type', async () => {
      const invalidData = {
        url: 'https://example.com',
        scrapingType: 'invalid-platform'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Scraping type tidak valid')
      expect(data.error).toContain('instagram atau google-maps')
    })
    
    test('should default to Instagram when no scraping type specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Test response'),
        headers: new Headers()
      } as Response)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)
      
      const scrapingData = {
        url: 'https://example.com/profile'
        // No scrapingType specified
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      // Should default to Instagram webhook
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall[0]).toContain('Web_Midas')
      expect(postCall[0]).not.toContain('GoogleMaps')
    })
  })
  
  describe('Webhook Integration Tests', () => {
    
    test('should handle webhook timeout gracefully', async () => {
      // Mock timeout error
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))
      
      const scrapingData = {
        url: 'https://instagram.com/testaccount',
        scrapingType: 'instagram'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.error).toBe('Terjadi kesalahan internal server')
      expect(data.detail).toContain('timeout')
    })
    
    test('should handle webhook 404 error with detailed message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Endpoint not found'),
        headers: new Headers()
      } as Response)
      
      const scrapingData = {
        url: 'https://instagram.com/testaccount',
        scrapingType: 'instagram'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.detail).toContain('Endpoint webhook tidak ditemukan (404)')
    })
    
    test('should handle webhook server error (5xx)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Test response'),
        headers: new Headers()
      } as Response)
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: () => Promise.resolve('Server error'),
        headers: new Headers()
      } as Response)
      
      const scrapingData = {
        url: 'https://instagram.com/testaccount',
        scrapingType: 'instagram'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.detail).toContain('Server webhook mengalami masalah (502)')
    })
    
    test('should handle webhook authentication error (401/403)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Test response'),
        headers: new Headers()
      } as Response)
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Authentication required'),
        headers: new Headers()
      } as Response)
      
      const scrapingData = {
        url: 'https://instagram.com/testaccount',
        scrapingType: 'instagram'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.detail).toContain('Akses ditolak (401)')
    })
    
    test('should include user context in webhook payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Test response'),
        headers: new Headers()
      } as Response)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)
      
      const scrapingData = {
        url: 'https://instagram.com/testaccount',
        userid: 'custom-user-id',
        userEmail: 'custom@user.com',
        scrapingType: 'instagram'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      // Verify user data was included in webhook payload
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      const requestBody = JSON.parse(postCall[1].body as string)
      
      expect(requestBody.userId).toBe('custom-user-id')
      expect(requestBody.userEmail).toBe('custom@user.com')
      expect(requestBody.source).toBe('MyDAS')
      expect(requestBody.timestamp).toBeTruthy()
    })
  })
  
  describe('Data Validation & Sanitization', () => {
    
    test('should validate URL format', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        '',
        null,
        undefined
      ]
      
      for (const url of invalidUrls) {
        const request = createMockNextRequest('http://localhost:3000/api/scraping', {
          method: 'POST',
          body: JSON.stringify({ url })
        })
        
        const response = await POST(request)
        expect(response.status).toBe(400)
      }
    })
    
    test('should sanitize and validate maxResults parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)
      
      const scrapingData = {
        url: 'https://instagram.com/testaccount',
        maxResults: 'invalid-number', // Should default to 1
        scrapingType: 'instagram'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(200)
      
      // Check that maxResults was sanitized to default value
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      const requestBody = JSON.parse(postCall[1].body as string)
      expect(requestBody.maxResults).toBe(1)
    })
    
    test('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"url": "https://test.com", invalid json}'
      })
      
      const response = await POST(request)
      expect(response.status).toBe(500) // Should handle JSON parsing error
    })
    
    test('should prevent webhook URL injection', async () => {
      const maliciousData = {
        url: 'https://instagram.com/test',
        webhookUrl: 'https://malicious-site.com/steal-data'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(maliciousData)
      })
      
      const response = await POST(request)
      
      // Should use predefined webhook URLs only
      if (mockFetch.mock.calls.length > 0) {
        const webhookCalls = mockFetch.mock.calls.filter(call => call[1]?.method === 'POST')
        for (const call of webhookCalls) {
          expect(call[0]).toContain('Web_Midas')
          expect(call[0]).not.toContain('malicious-site.com')
        }
      }
    })
  })
  
  describe('Performance & Rate Limiting', () => {
    
    test('should handle multiple concurrent requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)
      
      const requests = Array.from({ length: 5 }, (_, i) => 
        POST(createMockNextRequest('http://localhost:3000/api/scraping', {
          method: 'POST',
          body: JSON.stringify({
            url: `https://instagram.com/test${i}`,
            scrapingType: 'instagram'
          })
        }))
      )
      
      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Should have made webhook calls for each request
      expect(mockFetch.mock.calls.length).toBeGreaterThan(5)
    })
    
    test('should timeout long-running webhook requests', async () => {
      // Mock a very slow webhook response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve('Slow response'),
            headers: new Headers()
          } as Response), 30000) // 30 seconds
        )
      )
      
      const scrapingData = {
        url: 'https://instagram.com/testaccount',
        scrapingType: 'instagram'
      }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify(scrapingData)
      })
      
      // Should handle timeout gracefully
      const startTime = Date.now()
      const response = await POST(request)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(30000) // Should not wait full 30 seconds
      expect(response.status).toBe(500)
    }, 35000)
  })
  
  describe('Platform-Specific Logic', () => {
    
    test('should use correct webhook for Instagram platform', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers()
      } as Response)
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://instagram.com/test',
          scrapingType: 'instagram'
        })
      })
      
      await POST(request)
      
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall[0]).toContain('Web_Midas')
      expect(postCall[0]).not.toContain('GoogleMaps')
    })
    
    test('should use correct webhook for Google Maps platform', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers()
      } as Response)
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://maps.google.com/search/restaurants',
          scrapingType: 'google-maps'
        })
      })
      
      await POST(request)
      
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall[0]).toContain('Web_Midas_GoogleMaps')
    })
    
    test('should exclude coordinates from Instagram requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers()
      } as Response)
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://instagram.com/test',
          scrapingType: 'instagram',
          coordinates: { lat: 10, lng: 20 } // Should be ignored for Instagram
        })
      })
      
      await POST(request)
      
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      const requestBody = JSON.parse(postCall[1].body as string)
      expect(requestBody.coordinates).toBeUndefined()
    })
    
    test('should include coordinates only for Google Maps requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers()
      } as Response)
      
      const coordinates = { lat: -6.200000, lng: 106.816666 }
      
      const request = createMockNextRequest('http://localhost:3000/api/scraping', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://maps.google.com/search',
          scrapingType: 'google-maps',
          coordinates
        })
      })
      
      await POST(request)
      
      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST')
      const requestBody = JSON.parse(postCall[1].body as string)
      expect(requestBody.coordinates).toEqual(coordinates)
    })
  })
})