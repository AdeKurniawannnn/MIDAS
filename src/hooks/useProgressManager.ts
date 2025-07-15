"use client"

import { useCallback, useEffect, useRef } from 'react'
import { useProgress } from '@/lib/progress/progress-context'
import { toast } from 'sonner'

export interface ProgressManagerOptions {
  autoStart?: boolean
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  onComplete?: (results?: any[]) => void
  onError?: (error: string) => void
  onProgress?: (progress: number, step: string) => void
  enablePersistence?: boolean
}

export function useProgressManager(
  url: string,
  maxResults: number,
  options: ProgressManagerOptions = {}
) {
  const {
    autoStart = false,
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 2000,
    onComplete,
    onError,
    onProgress,
    enablePersistence = true
  } = options

  const progress = useProgress()
  const jobIdRef = useRef<string | null>(null)
  const retryCountRef = useRef(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get current job
  const currentJob = jobIdRef.current ? progress.getJob(jobIdRef.current) : null

  // Initialize job
  const initializeJob = useCallback(() => {
    if (!jobIdRef.current) {
      jobIdRef.current = progress.createJob(url, maxResults)
      progress.setActiveJob(jobIdRef.current)
    }
    return jobIdRef.current
  }, [url, maxResults, progress])

  // Progress polling simulation
  const startProgressPolling = useCallback((jobId: string) => {
    let currentProgress = 0
    const steps = [
      "Initializing scraper...",
      "Validating URL...",
      "Connecting to target...",
      "Analyzing page structure...",
      "Extracting data...",
      "Processing results...",
      "Finalizing..."
    ]
    
    let stepIndex = 0
    const totalSteps = steps.length
    const stepDuration = 1000 // 1 second per step
    
    const interval = setInterval(() => {
      const stepProgress = Math.min(currentProgress + Math.random() * 25, 100)
      
      if (stepIndex < totalSteps) {
        progress.updateJob(jobId, {
          progress: stepProgress,
          currentStep: steps[stepIndex],
          processedItems: Math.floor((stepProgress / 100) * Number(maxResults)),
          totalItems: Number(maxResults),
          estimatedTime: ((100 - stepProgress) / 100) * (totalSteps - stepIndex) * stepDuration
        })
      }
      
      currentProgress = stepProgress
      
      if (currentProgress >= 100) {
        clearInterval(interval)
        progress.completeProgress(jobId)
        toast.success('Scraping completed successfully!')
      } else if (currentProgress >= (stepIndex + 1) * (100 / totalSteps)) {
        stepIndex++
      }
    }, stepDuration)
    
    return interval
  }, [maxResults, progress])

  // Start scraping with progress tracking
  const startScraping = useCallback(async () => {
    const jobId = initializeJob()
    
    try {
      progress.startProgress(jobId)
      retryCountRef.current = 0
      
      // Simulate API call
      const response = await fetch('/api/scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          maxResults,
          jobId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Start progress polling
      startProgressPolling(jobId)
      
      toast.success('Scraping started successfully')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      progress.errorProgress(jobId, errorMessage)
      
      if (enableRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        toast.error(`Scraping failed. Retrying... (${retryCountRef.current}/${maxRetries})`)
        
        setTimeout(() => {
          startScraping()
        }, retryDelay)
      } else {
        toast.error(`Scraping failed: ${errorMessage}`)
        onError?.(errorMessage)
      }
    }
  }, [url, maxResults, enableRetry, maxRetries, retryDelay, onError, progress, initializeJob, startProgressPolling])

  // Pause scraping
  const pauseScraping = useCallback(() => {
    if (jobIdRef.current) {
      progress.pauseProgress(jobIdRef.current)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      toast.info('Scraping paused')
    }
  }, [progress])

  // Resume scraping
  const resumeScraping = useCallback(() => {
    if (jobIdRef.current) {
      progress.resumeProgress(jobIdRef.current)
      startProgressPolling(jobIdRef.current)
      toast.info('Scraping resumed')
    }
  }, [progress, startProgressPolling])

  // Stop scraping
  const stopScraping = useCallback(() => {
    if (jobIdRef.current) {
      progress.deleteJob(jobIdRef.current)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      toast.info('Scraping stopped')
      jobIdRef.current = null
    }
  }, [progress])

  // Retry scraping
  const retryScraping = useCallback(() => {
    if (jobIdRef.current) {
      const job = progress.getJob(jobIdRef.current)
      if (job && job.status === 'error') {
        progress.updateJob(jobIdRef.current, {
          status: 'idle',
          errors: [],
          progress: 0,
          processedItems: 0
        })
        startScraping()
      }
    }
  }, [progress, startScraping])

  // Get progress statistics
  const getProgressStats = useCallback(() => {
    if (!currentJob) return null
    
    const duration = currentJob.startTime 
      ? (currentJob.endTime || new Date()).getTime() - currentJob.startTime.getTime()
      : 0
    
    return {
      progress: currentJob.progress,
      status: currentJob.status,
      duration,
      estimatedTime: currentJob.estimatedTime,
      processedItems: currentJob.processedItems,
      totalItems: currentJob.totalItems,
      errors: currentJob.errors,
      isPaused: currentJob.isPaused,
      currentStep: currentJob.currentStep
    }
  }, [currentJob])

  // Persistence
  useEffect(() => {
    if (enablePersistence && jobIdRef.current) {
      const jobData = {
        jobId: jobIdRef.current,
        url,
        maxResults,
        timestamp: Date.now()
      }
      localStorage.setItem('scraping-job', JSON.stringify(jobData))
    }
  }, [url, maxResults, enablePersistence])

  // Restore from persistence
  useEffect(() => {
    if (enablePersistence && !jobIdRef.current) {
      const stored = localStorage.getItem('scraping-job')
      if (stored) {
        try {
          const jobData = JSON.parse(stored)
          const job = progress.getJob(jobData.jobId)
          if (job && job.url === url && job.maxResults === maxResults) {
            jobIdRef.current = jobData.jobId
            progress.setActiveJob(jobData.jobId)
          }
        } catch (error) {
          localStorage.removeItem('scraping-job')
        }
      }
    }
  }, [url, maxResults, enablePersistence, progress])

  // Auto-start
  useEffect(() => {
    if (autoStart && !currentJob) {
      startScraping()
    }
  }, [autoStart, currentJob, startScraping])

  // Cleanup
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const interval = progressIntervalRef.current
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  return {
    // Current job state
    job: currentJob,
    isActive: currentJob?.status === 'processing' || currentJob?.status === 'paused',
    isLoading: currentJob?.status === 'initializing' || currentJob?.status === 'processing',
    isPaused: currentJob?.isPaused || false,
    isCompleted: currentJob?.status === 'completed',
    isError: currentJob?.status === 'error',
    
    // Progress info
    progress: currentJob?.progress || 0,
    currentStep: currentJob?.currentStep || '',
    estimatedTime: currentJob?.estimatedTime,
    processedItems: currentJob?.processedItems || 0,
    totalItems: currentJob?.totalItems || maxResults,
    errors: currentJob?.errors || [],
    
    // Actions
    start: startScraping,
    pause: pauseScraping,
    resume: resumeScraping,
    stop: stopScraping,
    retry: retryScraping,
    
    // Utilities
    getStats: getProgressStats,
    canRetry: enableRetry && retryCountRef.current < maxRetries,
    retryCount: retryCountRef.current,
    maxRetries
  }
}