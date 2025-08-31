/**
 * Custom hook for Instagram scraping functionality
 */

import { useState, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { useToast } from '@/components/ui/use-toast'
import { 
  startInstagramScraping, 
  startBulkInstagramScraping,
  validateInstagramKeyword,
  ScrapingProgress 
} from '@/lib/api/instagram-scraper'

export interface UseInstagramScraperOptions {
  maxResults?: number
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useInstagramScraper(options: UseInstagramScraperOptions = {}) {
  const { maxResults = 1, onSuccess, onError } = options
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<ScrapingProgress>({
    status: 'idle',
    progress: 0,
    currentStep: '',
    processedItems: 0,
    totalItems: 0
  })

  const scrapeKeyword = useCallback(async (keyword: string) => {
    if (!isAuthenticated || !user) {
      const error = 'Authentication required to start scraping'
      toast({
        title: "Authentication Required",
        description: error,
        variant: "destructive",
      })
      onError?.(error)
      return
    }

    // Validate keyword
    const validation = validateInstagramKeyword(keyword)
    if (!validation.isValid) {
      toast({
        title: "Invalid Keyword",
        description: validation.error,
        variant: "destructive",
      })
      onError?.(validation.error || 'Invalid keyword')
      return
    }

    setIsLoading(true)
    setProgress({
      status: 'initializing',
      progress: 0,
      currentStep: 'Preparing to scrape...',
      processedItems: 0,
      totalItems: maxResults
    })

    try {
      // Start scraping
      const result = await startInstagramScraping({
        keyword: validation.formatted!,
        maxResults,
        userId: user.id,
        userEmail: user.email
      })

      if (result.success) {
        setProgress({
          status: 'completed',
          progress: 100,
          currentStep: 'Scraping completed successfully!',
          processedItems: maxResults,
          totalItems: maxResults
        })

        toast({
          title: "Scraping Started",
          description: `Instagram scraping initiated for "${keyword}"`,
        })

        onSuccess?.(result.data)
      } else {
        throw new Error(result.error || 'Scraping failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      setProgress({
        status: 'error',
        progress: 0,
        currentStep: `Error: ${errorMessage}`,
        processedItems: 0,
        totalItems: maxResults
      })

      toast({
        title: "Scraping Failed",
        description: errorMessage,
        variant: "destructive",
      })

      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
      
      // Reset progress after 3 seconds
      setTimeout(() => {
        setProgress({
          status: 'idle',
          progress: 0,
          currentStep: '',
          processedItems: 0,
          totalItems: 0
        })
      }, 3000)
    }
  }, [isAuthenticated, user, maxResults, onSuccess, onError, toast])

  const scrapeBulkKeywords = useCallback(async (keywords: string[]) => {
    if (!isAuthenticated || !user) {
      const error = 'Authentication required to start scraping'
      toast({
        title: "Authentication Required",
        description: error,
        variant: "destructive",
      })
      onError?.(error)
      return
    }

    if (keywords.length === 0) {
      const error = 'No keywords selected for scraping'
      toast({
        title: "No Keywords Selected",
        description: error,
        variant: "destructive",
      })
      onError?.(error)
      return
    }

    setIsLoading(true)
    setProgress({
      status: 'initializing',
      progress: 0,
      currentStep: 'Preparing bulk scraping...',
      processedItems: 0,
      totalItems: keywords.length
    })

    try {
      const result = await startBulkInstagramScraping(keywords, {
        maxResults,
        userId: user.id,
        userEmail: user.email,
        onProgress: (progressData) => {
          setProgress({
            status: 'processing',
            progress: (progressData.completed / progressData.total) * 100,
            currentStep: `Processing: ${progressData.current}`,
            processedItems: progressData.completed,
            totalItems: progressData.total
          })
        }
      })

      if (result.success) {
        setProgress({
          status: 'completed',
          progress: 100,
          currentStep: 'Bulk scraping completed!',
          processedItems: keywords.length,
          totalItems: keywords.length
        })

        toast({
          title: "Bulk Scraping Completed",
          description: result.message,
        })

        onSuccess?.(result.data)
      } else {
        throw new Error(result.error || 'Bulk scraping failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      setProgress({
        status: 'error',
        progress: 0,
        currentStep: `Error: ${errorMessage}`,
        processedItems: 0,
        totalItems: keywords.length
      })

      toast({
        title: "Bulk Scraping Failed",
        description: errorMessage,
        variant: "destructive",
      })

      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
      
      // Reset progress after 5 seconds for bulk operations
      setTimeout(() => {
        setProgress({
          status: 'idle',
          progress: 0,
          currentStep: '',
          processedItems: 0,
          totalItems: 0
        })
      }, 5000)
    }
  }, [isAuthenticated, user, maxResults, onSuccess, onError, toast])

  const resetProgress = useCallback(() => {
    setProgress({
      status: 'idle',
      progress: 0,
      currentStep: '',
      processedItems: 0,
      totalItems: 0
    })
  }, [])

  return {
    scrapeKeyword,
    scrapeBulkKeywords,
    resetProgress,
    isLoading,
    progress,
    isAuthenticated
  }
}