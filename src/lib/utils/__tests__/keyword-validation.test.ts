import { z } from 'zod'

// Business logic schemas and validators to test
const KeywordSchema = z.object({
  keyword: z.string()
    .min(1, 'Keyword cannot be empty')
    .max(255, 'Keyword too long')
    .regex(/^[\w\s\-#@]+$/, 'Keyword contains invalid characters')
    .transform(str => str.trim()),
  description: z.string()
    .max(1000, 'Description too long')
    .optional()
    .nullable()
    .transform(str => str?.trim() || null),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category too long'),
  priority: z.number()
    .int('Priority must be an integer')
    .min(1, 'Priority must be at least 1')
    .max(5, 'Priority must be at most 5')
    .default(1),
  status: z.enum(['active', 'inactive', 'archived', 'pending'])
    .default('active'),
  tags: z.array(z.string().max(50))
    .max(10, 'Too many tags')
    .optional(),
  search_volume: z.number()
    .int('Search volume must be an integer')
    .min(0, 'Search volume cannot be negative')
    .optional()
    .nullable(),
  competition_score: z.number()
    .min(0, 'Competition score cannot be negative')
    .max(1, 'Competition score cannot exceed 1')
    .optional()
    .nullable()
})

const BulkOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'archive', 'delete', 'scrape']),
  keywordIds: z.array(z.number().positive())
    .min(1, 'At least one keyword ID is required')
    .max(100, 'Too many keywords selected for bulk operation'),
  scrapingType: z.enum(['instagram', 'google_maps', 'tiktok', 'youtube'])
    .optional()
}).refine(
  data => data.operation !== 'scrape' || data.scrapingType,
  { message: 'Scraping type is required for scrape operations', path: ['scrapingType'] }
)

const GoogleMapsDataSchema = z.object({
  place_name: z.string().min(1, 'Place name is required').max(500),
  input_url: z.string().url('Invalid URL format'),
  address: z.string().max(500).optional().nullable(),
  phone_number: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  rating: z.number()
    .min(0, 'Rating cannot be negative')
    .max(5, 'Rating cannot exceed 5')
    .optional()
    .nullable(),
  review_count: z.number()
    .int('Review count must be an integer')
    .min(0, 'Review count cannot be negative')
    .optional()
    .nullable(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional().nullable(),
  quality_score: z.number()
    .int('Quality score must be an integer')
    .min(1, 'Quality score must be at least 1')
    .max(5, 'Quality score must be at most 5')
    .optional()
    .nullable()
})

// Validation functions to test
export const validateKeywordData = (data: unknown) => {
  try {
    return { success: true, data: KeywordSchema.parse(data), errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({ 
          field: e.path.join('.'), 
          message: e.message 
        }))
      }
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

export const validateBulkOperation = (data: unknown) => {
  try {
    return { success: true, data: BulkOperationSchema.parse(data), errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({ 
          field: e.path.join('.'), 
          message: e.message 
        }))
      }
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

export const validateGoogleMapsData = (data: unknown) => {
  try {
    return { success: true, data: GoogleMapsDataSchema.parse(data), errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({ 
          field: e.path.join('.'), 
          message: e.message 
        }))
      }
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

// Utility functions to test
export const sanitizeKeyword = (keyword: string): string => {
  return keyword
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-#@]/g, '')
}

export const calculateKeywordDifficulty = (
  searchVolume?: number,
  competitionScore?: number
): 'easy' | 'medium' | 'hard' => {
  if (!searchVolume || !competitionScore) return 'medium'
  
  if (searchVolume < 1000 && competitionScore < 0.3) return 'easy'
  if (searchVolume > 10000 && competitionScore > 0.7) return 'hard'
  return 'medium'
}

export const formatKeywordStats = (keywords: any[]): {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<number, number>
  averagePriority: number
} => {
  const stats = {
    total: keywords.length,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<number, number>,
    averagePriority: 0
  }

  let totalPriority = 0

  keywords.forEach(keyword => {
    // Count by status
    stats.byStatus[keyword.status] = (stats.byStatus[keyword.status] || 0) + 1
    
    // Count by priority
    const priority = keyword.priority || 1
    stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1
    totalPriority += priority
  })

  stats.averagePriority = keywords.length > 0 ? totalPriority / keywords.length : 0

  return stats
}

describe('Keyword Validation Unit Tests', () => {
  describe('validateKeywordData', () => {
    it('should validate correct keyword data', () => {
      const validData = {
        keyword: 'test keyword',
        description: 'A test keyword for validation',
        category: 'testing',
        priority: 3,
        status: 'active',
        tags: ['test', 'validation'],
        search_volume: 5000,
        competition_score: 0.75
      }

      const result = validateKeywordData(validData)

      expect(result.success).toBe(true)
      expect(result.data).toBeTruthy()
      expect(result.errors).toBeNull()
      expect(result.data.keyword).toBe('test keyword')
      expect(result.data.priority).toBe(3)
    })

    it('should reject empty keyword', () => {
      const invalidData = {
        keyword: '',
        category: 'testing'
      }

      const result = validateKeywordData(invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
      expect(result.errors.some(e => e.field === 'keyword')).toBe(true)
    })

    it('should reject keyword with invalid characters', () => {
      const invalidData = {
        keyword: 'test<script>alert("xss")</script>',
        category: 'testing'
      }

      const result = validateKeywordData(invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
      expect(result.errors.some(e => e.field === 'keyword')).toBe(true)
    })

    it('should enforce priority constraints', () => {
      const invalidPriorities = [0, 6, -1, 10]

      invalidPriorities.forEach(priority => {
        const result = validateKeywordData({
          keyword: 'test',
          category: 'testing',
          priority
        })

        expect(result.success).toBe(false)
        expect(result.errors).toBeTruthy()
        expect(result.errors.some(e => e.field === 'priority')).toBe(true)
      })
    })

    it('should enforce competition score constraints', () => {
      const invalidScores = [-0.1, 1.1, 2.0, -1]

      invalidScores.forEach(competition_score => {
        const result = validateKeywordData({
          keyword: 'test',
          category: 'testing',
          competition_score
        })

        expect(result.success).toBe(false)
        expect(result.errors).toBeTruthy()
        expect(result.errors.some(e => e.field === 'competition_score')).toBe(true)
      })
    })

    it('should limit number of tags', () => {
      const tooManyTags = Array.from({ length: 15 }, (_, i) => `tag-${i}`)

      const result = validateKeywordData({
        keyword: 'test',
        category: 'testing',
        tags: tooManyTags
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
      expect(result.errors.some(e => e.field === 'tags')).toBe(true)
    })

    it('should set default values for optional fields', () => {
      const minimalData = {
        keyword: 'test',
        category: 'testing'
      }

      const result = validateKeywordData(minimalData)

      expect(result.success).toBe(true)
      expect(result.data.priority).toBe(1) // Default priority
      expect(result.data.status).toBe('active') // Default status
    })

    it('should trim whitespace from keyword and description', () => {
      const dataWithWhitespace = {
        keyword: '  test keyword  ',
        description: '  test description  ',
        category: 'testing'
      }

      const result = validateKeywordData(dataWithWhitespace)

      expect(result.success).toBe(true)
      expect(result.data.keyword).toBe('test keyword')
      expect(result.data.description).toBe('test description')
    })

    it('should handle null description correctly', () => {
      const dataWithNullDescription = {
        keyword: 'test',
        category: 'testing',
        description: null
      }

      const result = validateKeywordData(dataWithNullDescription)

      expect(result.success).toBe(true)
      expect(result.data.description).toBeNull()
    })
  })

  describe('validateBulkOperation', () => {
    it('should validate correct bulk operation', () => {
      const validOperation = {
        operation: 'activate',
        keywordIds: [1, 2, 3, 4, 5]
      }

      const result = validateBulkOperation(validOperation)

      expect(result.success).toBe(true)
      expect(result.data).toBeTruthy()
      expect(result.data.operation).toBe('activate')
      expect(result.data.keywordIds).toEqual([1, 2, 3, 4, 5])
    })

    it('should reject empty keyword IDs array', () => {
      const invalidOperation = {
        operation: 'activate',
        keywordIds: []
      }

      const result = validateBulkOperation(invalidOperation)

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
      expect(result.errors.some(e => e.field === 'keywordIds')).toBe(true)
    })

    it('should reject invalid operation types', () => {
      const invalidOperation = {
        operation: 'invalid',
        keywordIds: [1, 2, 3]
      }

      const result = validateBulkOperation(invalidOperation)

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
      expect(result.errors.some(e => e.field === 'operation')).toBe(true)
    })

    it('should require scraping type for scrape operations', () => {
      const scrapeWithoutType = {
        operation: 'scrape',
        keywordIds: [1, 2, 3]
      }

      const result = validateBulkOperation(scrapeWithoutType)

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
      expect(result.errors.some(e => e.field === 'scrapingType')).toBe(true)
    })

    it('should accept scrape operations with scraping type', () => {
      const validScrapeOperation = {
        operation: 'scrape',
        keywordIds: [1, 2, 3],
        scrapingType: 'instagram'
      }

      const result = validateBulkOperation(validScrapeOperation)

      expect(result.success).toBe(true)
      expect(result.data.scrapingType).toBe('instagram')
    })

    it('should limit number of keywords in bulk operation', () => {
      const tooManyKeywords = Array.from({ length: 150 }, (_, i) => i + 1)

      const result = validateBulkOperation({
        operation: 'activate',
        keywordIds: tooManyKeywords
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
      expect(result.errors.some(e => e.field === 'keywordIds')).toBe(true)
    })

    it('should reject negative or zero keyword IDs', () => {
      const invalidIds = [0, -1, 1, 2]

      const result = validateBulkOperation({
        operation: 'activate',
        keywordIds: invalidIds
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
    })
  })

  describe('validateGoogleMapsData', () => {
    it('should validate correct Google Maps data', () => {
      const validData = {
        place_name: 'Test Restaurant',
        input_url: 'https://maps.google.com/place/test',
        address: '123 Test St, Test City',
        phone_number: '+1-234-567-8900',
        website: 'https://testrestaurant.com',
        rating: 4.5,
        review_count: 250,
        coordinates: { lat: 40.7128, lng: -74.0060 },
        quality_score: 4
      }

      const result = validateGoogleMapsData(validData)

      expect(result.success).toBe(true)
      expect(result.data).toBeTruthy()
      expect(result.data.place_name).toBe('Test Restaurant')
      expect(result.data.rating).toBe(4.5)
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid',
        'javascript:alert("xss")'
      ]

      invalidUrls.forEach(input_url => {
        const result = validateGoogleMapsData({
          place_name: 'Test',
          input_url
        })

        expect(result.success).toBe(false)
        expect(result.errors).toBeTruthy()
        expect(result.errors.some(e => e.field === 'input_url')).toBe(true)
      })
    })

    it('should enforce rating constraints', () => {
      const invalidRatings = [-1, 6, 10]

      invalidRatings.forEach(rating => {
        const result = validateGoogleMapsData({
          place_name: 'Test',
          input_url: 'https://maps.google.com/test',
          rating
        })

        expect(result.success).toBe(false)
        expect(result.errors).toBeTruthy()
        expect(result.errors.some(e => e.field === 'rating')).toBe(true)
      })
    })

    it('should validate coordinate ranges', () => {
      const invalidCoordinates = [
        { lat: 91, lng: 0 },    // Latitude too high
        { lat: -91, lng: 0 },   // Latitude too low
        { lat: 0, lng: 181 },   // Longitude too high
        { lat: 0, lng: -181 }   // Longitude too low
      ]

      invalidCoordinates.forEach(coordinates => {
        const result = validateGoogleMapsData({
          place_name: 'Test',
          input_url: 'https://maps.google.com/test',
          coordinates
        })

        expect(result.success).toBe(false)
        expect(result.errors).toBeTruthy()
      })
    })

    it('should validate phone number format', () => {
      const validPhones = ['+1234567890', '(123) 456-7890', '+1-234-567-8900']
      const invalidPhones = ['abc123', '123abc', 'phone']

      validPhones.forEach(phone_number => {
        const result = validateGoogleMapsData({
          place_name: 'Test',
          input_url: 'https://maps.google.com/test',
          phone_number
        })

        expect(result.success).toBe(true)
      })

      invalidPhones.forEach(phone_number => {
        const result = validateGoogleMapsData({
          place_name: 'Test',
          input_url: 'https://maps.google.com/test',
          phone_number
        })

        expect(result.success).toBe(false)
        expect(result.errors.some(e => e.field === 'phone_number')).toBe(true)
      })
    })
  })
})

describe('Utility Functions Unit Tests', () => {
  describe('sanitizeKeyword', () => {
    it('should trim and normalize whitespace', () => {
      expect(sanitizeKeyword('  test   keyword  ')).toBe('test keyword')
      expect(sanitizeKeyword('test\t\nkeyword')).toBe('test keyword')
    })

    it('should convert to lowercase', () => {
      expect(sanitizeKeyword('TEST KEYWORD')).toBe('test keyword')
      expect(sanitizeKeyword('Test Keyword')).toBe('test keyword')
    })

    it('should remove invalid characters', () => {
      expect(sanitizeKeyword('test<>keyword')).toBe('testkeyword')
      expect(sanitizeKeyword('test&keyword')).toBe('testkeyword')
      expect(sanitizeKeyword('test!@#$%^&*()keyword')).toBe('test@#keyword')
    })

    it('should preserve valid characters', () => {
      expect(sanitizeKeyword('test-keyword')).toBe('test-keyword')
      expect(sanitizeKeyword('test_keyword')).toBe('test_keyword')
      expect(sanitizeKeyword('#hashtag')).toBe('#hashtag')
      expect(sanitizeKeyword('@mention')).toBe('@mention')
    })
  })

  describe('calculateKeywordDifficulty', () => {
    it('should return "easy" for low volume and competition', () => {
      expect(calculateKeywordDifficulty(500, 0.2)).toBe('easy')
      expect(calculateKeywordDifficulty(999, 0.29)).toBe('easy')
    })

    it('should return "hard" for high volume and competition', () => {
      expect(calculateKeywordDifficulty(15000, 0.8)).toBe('hard')
      expect(calculateKeywordDifficulty(50000, 0.9)).toBe('hard')
    })

    it('should return "medium" for moderate values', () => {
      expect(calculateKeywordDifficulty(5000, 0.5)).toBe('medium')
      expect(calculateKeywordDifficulty(2000, 0.6)).toBe('medium')
    })

    it('should return "medium" for missing values', () => {
      expect(calculateKeywordDifficulty()).toBe('medium')
      expect(calculateKeywordDifficulty(1000)).toBe('medium')
      expect(calculateKeywordDifficulty(undefined, 0.5)).toBe('medium')
    })

    it('should handle edge cases', () => {
      expect(calculateKeywordDifficulty(1000, 0.3)).toBe('medium') // Boundary case
      expect(calculateKeywordDifficulty(10000, 0.7)).toBe('medium') // Boundary case
      expect(calculateKeywordDifficulty(0, 0)).toBe('easy')
    })
  })

  describe('formatKeywordStats', () => {
    it('should calculate correct statistics for keyword array', () => {
      const keywords = [
        { status: 'active', priority: 1 },
        { status: 'active', priority: 2 },
        { status: 'inactive', priority: 3 },
        { status: 'active', priority: 1 },
        { status: 'archived', priority: 4 }
      ]

      const stats = formatKeywordStats(keywords)

      expect(stats.total).toBe(5)
      expect(stats.byStatus).toEqual({
        active: 3,
        inactive: 1,
        archived: 1
      })
      expect(stats.byPriority).toEqual({
        1: 2,
        2: 1,
        3: 1,
        4: 1
      })
      expect(stats.averagePriority).toBe(2.2) // (1+2+3+1+4)/5
    })

    it('should handle empty array', () => {
      const stats = formatKeywordStats([])

      expect(stats.total).toBe(0)
      expect(stats.byStatus).toEqual({})
      expect(stats.byPriority).toEqual({})
      expect(stats.averagePriority).toBe(0)
    })

    it('should handle keywords with missing priority', () => {
      const keywords = [
        { status: 'active' }, // No priority - should default to 1
        { status: 'active', priority: 2 },
        { status: 'inactive', priority: null } // Null priority - should default to 1
      ]

      const stats = formatKeywordStats(keywords)

      expect(stats.total).toBe(3)
      expect(stats.byPriority[1]).toBe(2) // Two keywords with default priority
      expect(stats.byPriority[2]).toBe(1)
      expect(stats.averagePriority).toBe(4/3) // (1+2+1)/3
    })

    it('should handle large datasets efficiently', () => {
      const largeKeywordSet = Array.from({ length: 10000 }, (_, i) => ({
        status: i % 2 === 0 ? 'active' : 'inactive',
        priority: (i % 5) + 1
      }))

      const startTime = Date.now()
      const stats = formatKeywordStats(largeKeywordSet)
      const endTime = Date.now()

      expect(stats.total).toBe(10000)
      expect(stats.byStatus.active).toBe(5000)
      expect(stats.byStatus.inactive).toBe(5000)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })

    it('should maintain accuracy with decimal averages', () => {
      const keywords = [
        { status: 'active', priority: 1 },
        { status: 'active', priority: 2 },
        { status: 'active', priority: 3 }
      ]

      const stats = formatKeywordStats(keywords)

      expect(stats.averagePriority).toBe(2) // (1+2+3)/3 = 2
    })
  })
})