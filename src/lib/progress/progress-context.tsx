"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface ScrapingJob {
  id: string
  url: string
  maxResults: number
  status: 'idle' | 'initializing' | 'processing' | 'paused' | 'completed' | 'error'
  progress: number
  currentStep: string
  estimatedTime: number | null
  processedItems: number
  totalItems: number
  startTime: Date | null
  endTime: Date | null
  errors: string[]
  isPaused: boolean
  results?: any[]
}

interface ProgressContextType {
  jobs: Record<string, ScrapingJob>
  activeJobId: string | null
  
  // Job management
  createJob: (url: string, maxResults: number) => string
  updateJob: (jobId: string, updates: Partial<ScrapingJob>) => void
  deleteJob: (jobId: string) => void
  setActiveJob: (jobId: string | null) => void
  
  // Progress tracking
  startProgress: (jobId: string) => void
  updateProgress: (jobId: string, progress: number, currentStep: string) => void
  pauseProgress: (jobId: string) => void
  resumeProgress: (jobId: string) => void
  completeProgress: (jobId: string, results?: any[]) => void
  errorProgress: (jobId: string, error: string) => void
  
  // Utility functions
  getActiveJob: () => ScrapingJob | null
  getJob: (jobId: string) => ScrapingJob | null
  getAllJobs: () => ScrapingJob[]
  getJobsByStatus: (status: ScrapingJob['status']) => ScrapingJob[]
  clearCompletedJobs: () => void
  
  // Background processing
  canRunInBackground: boolean
  setCanRunInBackground: (value: boolean) => void
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Record<string, ScrapingJob>>({})
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [canRunInBackground, setCanRunInBackground] = useState(true)

  const createJob = useCallback((url: string, maxResults: number): string => {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newJob: ScrapingJob = {
      id,
      url,
      maxResults,
      status: 'idle',
      progress: 0,
      currentStep: '',
      estimatedTime: null,
      processedItems: 0,
      totalItems: maxResults,
      startTime: null,
      endTime: null,
      errors: [],
      isPaused: false,
      results: []
    }
    
    setJobs(prev => ({ ...prev, [id]: newJob }))
    return id
  }, [])

  const updateJob = useCallback((jobId: string, updates: Partial<ScrapingJob>) => {
    setJobs(prev => {
      const existingJob = prev[jobId]
      if (!existingJob) return prev
      
      return {
        ...prev,
        [jobId]: { ...existingJob, ...updates }
      }
    })
  }, [])

  const deleteJob = useCallback((jobId: string) => {
    setJobs(prev => {
      const newJobs = { ...prev }
      delete newJobs[jobId]
      return newJobs
    })
    
    if (activeJobId === jobId) {
      setActiveJobId(null)
    }
  }, [activeJobId])

  const setActiveJob = useCallback((jobId: string | null) => {
    setActiveJobId(jobId)
  }, [])

  const startProgress = useCallback((jobId: string) => {
    updateJob(jobId, {
      status: 'processing',
      startTime: new Date(),
      endTime: null,
      errors: [],
      isPaused: false
    })
  }, [updateJob])

  const updateProgress = useCallback((jobId: string, progress: number, currentStep: string) => {
    const job = jobs[jobId]
    if (!job) return
    
    const processedItems = Math.floor((progress / 100) * job.totalItems)
    const elapsed = job.startTime ? Date.now() - job.startTime.getTime() : 0
    const estimatedTime = progress > 0 ? Math.round((elapsed / progress) * (100 - progress)) : null
    
    updateJob(jobId, {
      progress: Math.min(Math.max(progress, 0), 100),
      currentStep,
      processedItems,
      estimatedTime
    })
  }, [jobs, updateJob])

  const pauseProgress = useCallback((jobId: string) => {
    updateJob(jobId, {
      status: 'paused',
      isPaused: true
    })
  }, [updateJob])

  const resumeProgress = useCallback((jobId: string) => {
    updateJob(jobId, {
      status: 'processing',
      isPaused: false
    })
  }, [updateJob])

  const completeProgress = useCallback((jobId: string, results?: any[]) => {
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      endTime: new Date(),
      isPaused: false,
      results: results || [],
      processedItems: jobs[jobId]?.totalItems || 0
    })
  }, [jobs, updateJob])

  const errorProgress = useCallback((jobId: string, error: string) => {
    updateJob(jobId, {
      status: 'error',
      errors: [...(jobs[jobId]?.errors || []), error],
      endTime: new Date(),
      isPaused: false
    })
  }, [jobs, updateJob])

  const getActiveJob = useCallback((): ScrapingJob | null => {
    return activeJobId ? jobs[activeJobId] || null : null
  }, [activeJobId, jobs])

  const getJob = useCallback((jobId: string): ScrapingJob | null => {
    return jobs[jobId] || null
  }, [jobs])

  const getAllJobs = useCallback((): ScrapingJob[] => {
    return Object.values(jobs).sort((a, b) => {
      const aTime = a.startTime?.getTime() || 0
      const bTime = b.startTime?.getTime() || 0
      return bTime - aTime // Most recent first
    })
  }, [jobs])

  const getJobsByStatus = useCallback((status: ScrapingJob['status']): ScrapingJob[] => {
    return Object.values(jobs).filter(job => job.status === status)
  }, [jobs])

  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => {
      const newJobs: Record<string, ScrapingJob> = {}
      Object.values(prev).forEach(job => {
        if (job.status !== 'completed' && job.status !== 'error') {
          newJobs[job.id] = job
        }
      })
      return newJobs
    })
  }, [])

  const value: ProgressContextType = {
    jobs,
    activeJobId,
    
    createJob,
    updateJob,
    deleteJob,
    setActiveJob,
    
    startProgress,
    updateProgress,
    pauseProgress,
    resumeProgress,
    completeProgress,
    errorProgress,
    
    getActiveJob,
    getJob,
    getAllJobs,
    getJobsByStatus,
    clearCompletedJobs,
    
    canRunInBackground,
    setCanRunInBackground
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}

export default ProgressContext