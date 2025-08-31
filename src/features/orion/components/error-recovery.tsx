"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useProgress } from '@/lib/progress/progress-context'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Info, 
  CheckCircle, 
  Clock,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ErrorRecoveryProps {
  jobId: string
  onRetry?: () => void
  onDismiss?: () => void
  maxRetries?: number
  retryDelay?: number
  autoRetry?: boolean
}

export function ErrorRecovery({
  jobId,
  onRetry,
  onDismiss,
  maxRetries = 3,
  retryDelay = 2000,
  autoRetry = true
}: ErrorRecoveryProps) {
  const progress = useProgress()
  const job = progress.getJob(jobId)
  
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = useCallback(async () => {
    if (!job || retryCount >= maxRetries) return
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    setCountdown(0)
    
    try {
      // Reset job status
      progress.updateJob(jobId, {
        status: 'idle',
        errors: [],
        progress: 0,
        processedItems: 0,
        currentStep: 'Retrying...'
      })
      
      toast.info(`Retrying scraping... (${retryCount + 1}/${maxRetries})`)
      
      // Call custom retry handler or default behavior
      if (onRetry) {
        await onRetry()
      } else {
        // Default retry behavior - restart the job
        progress.startProgress(jobId)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed'
      progress.errorProgress(jobId, errorMessage)
      toast.error(`Retry failed: ${errorMessage}`)
    } finally {
      setIsRetrying(false)
    }
  }, [job, retryCount, maxRetries, progress, jobId, onRetry])

  // Auto-retry logic
  useEffect(() => {
    if (job?.status === 'error' && autoRetry && retryCount < maxRetries && isOnline) {
      const timer = setTimeout(() => {
        handleRetry()
      }, retryDelay)
      
      // Countdown timer
      let timeLeft = retryDelay / 1000
      setCountdown(timeLeft)
      
      const countdownInterval = setInterval(() => {
        timeLeft -= 1
        setCountdown(timeLeft)
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval)
        }
      }, 1000)
      
      return () => {
        clearTimeout(timer)
        clearInterval(countdownInterval)
      }
    }
  }, [job?.status, retryCount, maxRetries, autoRetry, retryDelay, isOnline, handleRetry])

  const handleDismiss = () => {
    progress.deleteJob(jobId)
    onDismiss?.()
  }

  const getErrorType = (error: string) => {
    if (error.includes('network') || error.includes('fetch')) return 'network'
    if (error.includes('timeout')) return 'timeout'
    if (error.includes('404') || error.includes('not found')) return 'notfound'
    if (error.includes('403') || error.includes('unauthorized')) return 'auth'
    if (error.includes('rate limit')) return 'ratelimit'
    return 'unknown'
  }

  const getErrorSuggestion = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return 'Check your internet connection and try again.'
      case 'timeout':
        return 'The server took too long to respond. This might be temporary.'
      case 'notfound':
        return 'The URL might be incorrect or the page may have moved.'
      case 'auth':
        return 'Authentication failed. Please check your credentials.'
      case 'ratelimit':
        return 'Too many requests. Please wait before trying again.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="h-4 w-4" />
      case 'timeout':
        return <Clock className="h-4 w-4" />
      case 'notfound':
        return <AlertCircle className="h-4 w-4" />
      case 'auth':
        return <AlertTriangle className="h-4 w-4" />
      case 'ratelimit':
        return <Info className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (!job || job.status !== 'error') {
    return null
  }

  const latestError = job.errors[job.errors.length - 1] || 'Unknown error'
  const errorType = getErrorType(latestError)
  const suggestion = getErrorSuggestion(errorType)
  const canRetry = retryCount < maxRetries && isOnline

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Alert className="border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <div className="text-red-600">
            {getErrorIcon(errorType)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-red-800">
                Scraping Failed
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <AlertDescription className="text-red-700 mb-3">
              <div className="mb-2">
                <strong>Error:</strong> {latestError}
              </div>
              <div className="text-sm">
                <strong>Suggestion:</strong> {suggestion}
              </div>
            </AlertDescription>
            
            {/* Network Status */}
            {!isOnline && (
              <div className="flex items-center gap-2 mb-3 text-sm text-red-600">
                <WifiOff className="h-4 w-4" />
                <span>No internet connection detected</span>
              </div>
            )}
            
            {/* Retry Information */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-600">
                Retry {retryCount}/{maxRetries}
                {countdown > 0 && (
                  <span className="ml-2">
                    Auto-retry in {countdown}s
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {canRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isRetrying || countdown > 0}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    {isRetrying ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Retry Now
                      </>
                    )}
                  </Button>
                )}
                
                {!canRetry && retryCount >= maxRetries && (
                  <div className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Max retries reached
                  </div>
                )}
              </div>
            </div>
            
            {/* Error History */}
            {job.errors.length > 1 && (
              <details className="mt-3">
                <summary className="text-sm text-red-600 cursor-pointer hover:text-red-700">
                  View error history ({job.errors.length} errors)
                </summary>
                <div className="mt-2 space-y-1 text-xs text-red-600 bg-red-100 p-2 rounded">
                  {job.errors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-red-400">#{index + 1}</span>
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </Alert>
    </motion.div>
  )
}

// Recovery strategies for different error types
export const errorRecoveryStrategies = {
  network: {
    retryDelay: 5000,
    maxRetries: 5,
    backoffMultiplier: 1.5
  },
  timeout: {
    retryDelay: 3000,
    maxRetries: 3,
    backoffMultiplier: 2
  },
  ratelimit: {
    retryDelay: 30000,
    maxRetries: 2,
    backoffMultiplier: 2
  },
  auth: {
    retryDelay: 1000,
    maxRetries: 1,
    backoffMultiplier: 1
  },
  default: {
    retryDelay: 2000,
    maxRetries: 3,
    backoffMultiplier: 1.5
  }
}

// Helper hook for error recovery
export function useErrorRecovery(jobId: string) {
  const progress = useProgress()
  const job = progress.getJob(jobId)
  
  const getRecoveryStrategy = (error: string) => {
    if (error.includes('network') || error.includes('fetch')) {
      return errorRecoveryStrategies.network
    }
    if (error.includes('timeout')) {
      return errorRecoveryStrategies.timeout
    }
    if (error.includes('rate limit')) {
      return errorRecoveryStrategies.ratelimit
    }
    if (error.includes('403') || error.includes('unauthorized')) {
      return errorRecoveryStrategies.auth
    }
    return errorRecoveryStrategies.default
  }
  
  const recoverFromError = async (customRetryHandler?: () => Promise<void>) => {
    if (!job || job.status !== 'error') return
    
    const latestError = job.errors[job.errors.length - 1] || ''
    const strategy = getRecoveryStrategy(latestError)
    
    try {
      progress.updateJob(jobId, {
        status: 'idle',
        errors: [],
        progress: 0,
        processedItems: 0,
        currentStep: 'Recovering...'
      })
      
      if (customRetryHandler) {
        await customRetryHandler()
      } else {
        progress.startProgress(jobId)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Recovery failed'
      progress.errorProgress(jobId, errorMessage)
      throw error
    }
  }
  
  return {
    job,
    canRecover: job?.status === 'error',
    recoverFromError,
    getRecoveryStrategy
  }
}