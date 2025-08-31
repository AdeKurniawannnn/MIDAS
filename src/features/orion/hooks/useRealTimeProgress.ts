"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { useProgress } from '@/lib/progress/progress-context'

export interface RealTimeProgressOptions {
  enablePolling?: boolean
  pollingInterval?: number
  enableWebSocket?: boolean
  webSocketUrl?: string
  onUpdate?: (jobId: string, progress: number, step: string) => void
  onComplete?: (jobId: string, results: any[]) => void
  onError?: (jobId: string, error: string) => void
  onConnectionChange?: (connected: boolean) => void
}

export function useRealTimeProgress(options: RealTimeProgressOptions = {}) {
  const {
    enablePolling = true,
    pollingInterval = 1000,
    enableWebSocket = false,
    webSocketUrl = '/api/ws/progress',
    onUpdate,
    onComplete,
    onError,
    onConnectionChange
  } = options

  const progress = useProgress()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const webSocketRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5
  const retryDelay = 2000

  // Polling-based progress updates
  const startPolling = useCallback(async () => {
    if (!enablePolling) return

    const pollProgress = async () => {
      try {
        const activeJobs = progress.getJobsByStatus('processing')
        if (activeJobs.length === 0) return

        const jobIds = activeJobs.map(job => job.id)
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobIds })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updates = await response.json()
        
        updates.forEach((update: any) => {
          const { jobId, progress: progressValue, step, status, results, error } = update
          
          if (status === 'completed') {
            progress.completeProgress(jobId, results)
            onComplete?.(jobId, results)
          } else if (status === 'error') {
            progress.errorProgress(jobId, error)
            onError?.(jobId, error)
          } else if (status === 'processing') {
            progress.updateProgress(jobId, progressValue, step)
            onUpdate?.(jobId, progressValue, step)
          }
        })

        setLastUpdate(new Date())
        retryCountRef.current = 0
        
      } catch (error) {
        console.error('Polling error:', error)
        
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          // Exponential backoff
          setTimeout(pollProgress, retryDelay * Math.pow(2, retryCountRef.current))
        }
      }
    }

    pollingIntervalRef.current = setInterval(pollProgress, pollingInterval)
    setIsConnected(true)
    onConnectionChange?.(true)
    
    // Initial poll
    pollProgress()
  }, [enablePolling, pollingInterval, progress, onUpdate, onComplete, onError, onConnectionChange])

  // WebSocket-based real-time updates
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket || typeof window === 'undefined') return

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}${webSocketUrl}`
      
      webSocketRef.current = new WebSocket(wsUrl)
      
      webSocketRef.current.onopen = () => {
        setIsConnected(true)
        onConnectionChange?.(true)
        retryCountRef.current = 0
        
        // Subscribe to active jobs
        const activeJobs = progress.getJobsByStatus('processing')
        if (activeJobs.length > 0) {
          webSocketRef.current?.send(JSON.stringify({
            type: 'subscribe',
            jobIds: activeJobs.map(job => job.id)
          }))
        }
      }
      
      webSocketRef.current.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data)
          const { jobId, progress: progressValue, step, status, results, error } = update
          
          if (status === 'completed') {
            progress.completeProgress(jobId, results)
            onComplete?.(jobId, results)
          } else if (status === 'error') {
            progress.errorProgress(jobId, error)
            onError?.(jobId, error)
          } else if (status === 'processing') {
            progress.updateProgress(jobId, progressValue, step)
            onUpdate?.(jobId, progressValue, step)
          }
          
          setLastUpdate(new Date())
          
        } catch (error) {
          console.error('WebSocket message parsing error:', error)
        }
      }
      
      webSocketRef.current.onclose = () => {
        setIsConnected(false)
        onConnectionChange?.(false)
        
        // Retry connection with exponential backoff
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          setTimeout(connectWebSocket, retryDelay * Math.pow(2, retryCountRef.current))
        }
      }
      
      webSocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
        onConnectionChange?.(false)
      }
      
    } catch (error) {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
      onConnectionChange?.(false)
    }
  }, [enableWebSocket, webSocketUrl, progress, onUpdate, onComplete, onError, onConnectionChange])

  // Subscribe to new jobs
  const subscribeToJob = useCallback((jobId: string) => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'subscribe',
        jobIds: [jobId]
      }))
    }
  }, [])

  // Unsubscribe from jobs
  const unsubscribeFromJob = useCallback((jobId: string) => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        jobIds: [jobId]
      }))
    }
  }, [])

  // Manual refresh
  const refreshProgress = useCallback(async () => {
    if (enablePolling) {
      // Clear current interval and restart
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      startPolling()
    }
  }, [enablePolling, startPolling])

  // Connection management
  const connect = useCallback(() => {
    if (enableWebSocket) {
      connectWebSocket()
    } else if (enablePolling) {
      startPolling()
    }
  }, [enableWebSocket, enablePolling, connectWebSocket, startPolling])

  const disconnect = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    
    if (webSocketRef.current) {
      webSocketRef.current.close()
      webSocketRef.current = null
    }
    
    setIsConnected(false)
    onConnectionChange?.(false)
  }, [onConnectionChange])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!isConnected) {
          connect()
        }
      } else if (document.visibilityState === 'hidden') {
        // Optionally disconnect when page is hidden to save resources
        // disconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isConnected, connect])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected) {
        connect()
      }
    }

    const handleOffline = () => {
      disconnect()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isConnected, connect, disconnect])

  return {
    isConnected,
    lastUpdate,
    retryCount: retryCountRef.current,
    maxRetries,
    
    // Actions
    connect,
    disconnect,
    refresh: refreshProgress,
    subscribeToJob,
    unsubscribeFromJob,
    
    // Status
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: enableWebSocket ? 'websocket' : 'polling'
  }
}