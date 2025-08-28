/**
 * Instagram Scraper API Integration
 * Handles Apify Instagram scraper API calls for keyword-based scraping
 */

export interface InstagramScrapingRequest {
  keyword: string
  maxResults?: number
  userId?: string
  userEmail?: string
}

export interface InstagramScrapingResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

export interface ScrapingProgress {
  status: 'idle' | 'initializing' | 'processing' | 'completed' | 'error'
  progress: number
  currentStep: string
  processedItems: number
  totalItems: number
  estimatedTime?: number
}

/**
 * Start Instagram scraping for a specific keyword
 */
export async function startInstagramScraping(
  request: InstagramScrapingRequest
): Promise<InstagramScrapingResponse> {
  try {
    const response = await fetch('/api/scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: request.keyword,
        maxResults: request.maxResults || 1,
        userEmail: request.userEmail,
        userid: request.userId,
        scrapingType: 'instagram'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to start Instagram scraping')
    }

    const result = await response.json()
    return {
      success: true,
      message: 'Instagram scraping started successfully',
      data: result
    }
  } catch (error) {
    console.error('Instagram scraping error:', error)
    return {
      success: false,
      message: 'Failed to start Instagram scraping',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Start bulk Instagram scraping for multiple keywords
 */
export async function startBulkInstagramScraping(
  keywords: string[],
  options: {
    maxResults?: number
    userId?: string
    userEmail?: string
    onProgress?: (progress: { completed: number; total: number; current: string }) => void
  }
): Promise<InstagramScrapingResponse> {
  const { maxResults = 1, userId, userEmail, onProgress } = options
  const results: any[] = []
  const errors: string[] = []

  try {
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i]
      
      // Update progress
      onProgress?.({
        completed: i,
        total: keywords.length,
        current: keyword
      })

      try {
        const result = await startInstagramScraping({
          keyword,
          maxResults,
          userId,
          userEmail
        })

        if (result.success) {
          results.push({ keyword, result: result.data })
        } else {
          errors.push(`${keyword}: ${result.error}`)
        }

        // Add delay between requests to avoid rate limiting
        if (i < keywords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        errors.push(`${keyword}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Final progress update
    onProgress?.({
      completed: keywords.length,
      total: keywords.length,
      current: 'Completed'
    })

    if (errors.length === keywords.length) {
      return {
        success: false,
        message: 'All scraping requests failed',
        error: errors.join('; ')
      }
    }

    return {
      success: true,
      message: `Bulk scraping completed. ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        errors: errors,
        totalProcessed: keywords.length
      }
    }
  } catch (error) {
    console.error('Bulk Instagram scraping error:', error)
    return {
      success: false,
      message: 'Bulk Instagram scraping failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validate Instagram keyword format
 */
export function validateInstagramKeyword(keyword: string): {
  isValid: boolean
  error?: string
  formatted?: string
} {
  if (!keyword || keyword.trim().length === 0) {
    return {
      isValid: false,
      error: 'Keyword cannot be empty'
    }
  }

  const trimmed = keyword.trim()
  
  // Remove # if present and validate
  const cleaned = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  
  if (cleaned.length === 0) {
    return {
      isValid: false,
      error: 'Keyword cannot be just a hashtag symbol'
    }
  }

  // Basic validation for Instagram hashtags
  const validPattern = /^[a-zA-Z0-9_]+$/
  if (!validPattern.test(cleaned)) {
    return {
      isValid: false,
      error: 'Keyword can only contain letters, numbers, and underscores'
    }
  }

  return {
    isValid: true,
    formatted: cleaned
  }
}

/**
 * Get scraping status for a keyword (mock implementation)
 */
export function getScrapingStatus(keywordId: number): ScrapingProgress {
  // This would typically fetch from database or cache
  // For now, return idle status
  return {
    status: 'idle',
    progress: 0,
    currentStep: '',
    processedItems: 0,
    totalItems: 0
  }
}