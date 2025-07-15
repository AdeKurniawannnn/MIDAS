"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProgress } from '@/lib/progress/progress-context'
import { useRealTimeProgress } from '@/hooks/useRealTimeProgress'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Spinner } from '@/components/ui/spinner'
import { 
  Minimize2, 
  Maximize2, 
  X, 
  Pause, 
  Play, 
  Square,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface BackgroundProgressProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  showWhenMinimized?: boolean
}

export function BackgroundProgress({ 
  position = 'bottom-right',
  showWhenMinimized = true 
}: BackgroundProgressProps) {
  const progress = useProgress()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  const { isConnected, lastUpdate } = useRealTimeProgress({
    enablePolling: true,
    pollingInterval: 2000,
    onUpdate: (jobId, progressValue, step) => {
      // Show toast for significant progress updates
      if (progressValue % 25 === 0 && progressValue > 0) {
        toast.info(`${Math.round(progressValue)}% complete - ${step}`)
      }
    },
    onComplete: (jobId, results) => {
      toast.success(`Scraping completed! ${results.length} items processed`)
    },
    onError: (jobId, error) => {
      toast.error(`Scraping failed: ${error}`)
    }
  })

  const activeJobs = progress.getJobsByStatus('processing')
  const pausedJobs = progress.getJobsByStatus('paused')
  const completedJobs = progress.getJobsByStatus('completed')
  const errorJobs = progress.getJobsByStatus('error')
  
  const allActiveJobs = [...activeJobs, ...pausedJobs]
  const currentJob = allActiveJobs[0] // Show first active job
  
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  // Show/hide based on job status
  useEffect(() => {
    const hasActiveJobs = allActiveJobs.length > 0
    const hasRecentlyCompleted = completedJobs.some(job => 
      job.endTime && Date.now() - job.endTime.getTime() < 5000
    )
    const hasErrors = errorJobs.length > 0
    
    setIsVisible(hasActiveJobs || hasRecentlyCompleted || hasErrors)
  }, [allActiveJobs.length, completedJobs, errorJobs])

  // Auto-minimize after completion
  useEffect(() => {
    if (currentJob?.status === 'completed') {
      const timer = setTimeout(() => {
        setIsMinimized(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentJob?.status])

  const handlePauseResume = () => {
    if (!currentJob) return
    
    if (currentJob.isPaused) {
      progress.resumeProgress(currentJob.id)
    } else {
      progress.pauseProgress(currentJob.id)
    }
  }

  const handleStop = () => {
    if (!currentJob) return
    progress.deleteJob(currentJob.id)
  }

  const handleClose = () => {
    setIsVisible(false)
    // Clear completed and error jobs
    completedJobs.forEach(job => progress.deleteJob(job.id))
    errorJobs.forEach(job => progress.deleteJob(job.id))
  }

  const formatTime = (ms: number | null) => {
    if (!ms) return '--'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getStatusIcon = () => {
    if (!currentJob) return null
    
    switch (currentJob.status) {
      case 'processing':
        return <Spinner size="sm" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    if (!currentJob) return 'bg-card'
    
    switch (currentJob.status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200'
      case 'paused':
        return 'bg-yellow-50 border-yellow-200'
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-card'
    }
  }

  if (!isVisible || (!showWhenMinimized && isMinimized)) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed z-50 ${positionClasses[position]}`}
      >
        {isMinimized ? (
          // Minimized view
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`p-3 rounded-lg shadow-lg border ${getStatusColor()} cursor-pointer`}
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {allActiveJobs.length > 0 && (
                  `${Math.round(currentJob?.progress || 0)}%`
                )}
                {completedJobs.length > 0 && completedJobs.length === 1 && 'Complete'}
                {completedJobs.length > 1 && `${completedJobs.length} Complete`}
                {errorJobs.length > 0 && 'Error'}
              </span>
              {allActiveJobs.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  +{allActiveJobs.length - 1} more
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          // Expanded view
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-lg shadow-lg border ${getStatusColor()} w-80`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium text-sm">
                  {currentJob?.status === 'processing' && 'Scraping in progress'}
                  {currentJob?.status === 'paused' && 'Scraping paused'}
                  {currentJob?.status === 'completed' && 'Scraping completed'}
                  {currentJob?.status === 'error' && 'Scraping failed'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="h-6 w-6 p-0"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {currentJob && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {currentJob.currentStep || 'Processing...'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {currentJob.processedItems}/{currentJob.totalItems}
                    </span>
                  </div>
                  
                  <ProgressBar
                    value={currentJob.progress}
                    size="sm"
                    variant={
                      currentJob.status === 'error' ? 'error' :
                      currentJob.status === 'completed' ? 'success' : 'default'
                    }
                    animated={currentJob.status === 'processing'}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(currentJob.estimatedTime)} remaining</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className={`h-3 w-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>

                {currentJob.status === 'processing' || currentJob.status === 'paused' ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePauseResume}
                      className="flex-1"
                    >
                      {currentJob.isPaused ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStop}
                      className="flex-1"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Stop
                    </Button>
                  </div>
                ) : currentJob.status === 'error' ? (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {currentJob.errors[currentJob.errors.length - 1]}
                  </div>
                ) : (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    Successfully processed {currentJob.processedItems} items
                  </div>
                )}
              </>
            )}

            {allActiveJobs.length > 1 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  {allActiveJobs.length - 1} more job(s) in queue
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}