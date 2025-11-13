'use client'

// Comprehensive performance monitoring and optimization system
import React, { 
  useEffect, 
  useState, 
  useCallback, 
  useRef,
  createContext,
  useContext,
  ReactNode
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Monitor,
  Smartphone,
  Wifi,
  X
} from 'lucide-react'

// Performance metrics interface
interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  
  // Custom metrics
  renderTime: number
  componentCount: number
  reRenderCount: number
  memoryUsage: number
  
  // Device info
  deviceType: 'mobile' | 'tablet' | 'desktop'
  connectionType: string
  deviceMemory: number
  hardwareConcurrency: number
  
  // User preferences
  prefersReducedMotion: boolean
  prefersColorScheme: 'light' | 'dark'
}

// Performance context
const PerformanceContext = createContext<{
  metrics: PerformanceMetrics | null
  isMonitoring: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
  optimizeForDevice: () => void
}>({
  metrics: null,
  isMonitoring: false,
  startMonitoring: () => {},
  stopMonitoring: () => {},
  optimizeForDevice: () => {}
})

// Performance provider component
export const PerformanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const observerRef = useRef<PerformanceObserver>()
  const renderCountRef = useRef(0)
  
  // Collect comprehensive performance metrics
  const collectMetrics = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const nav = navigator as any
    const perf = performance as any
    
    // Device detection
    const width = window.innerWidth
    const deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
    
    // Core metrics
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    const newMetrics: PerformanceMetrics = {
      // Core Web Vitals (approximated)
      lcp: getLCP(),
      fid: getFID(),
      cls: getCLS(),
      fcp: getFCP(),
      ttfb: navigationEntry?.responseStart - navigationEntry?.requestStart || 0,
      
      // Custom metrics
      renderTime: performance.now(),
      componentCount: document.querySelectorAll('[data-component]').length,
      reRenderCount: renderCountRef.current,
      memoryUsage: perf.memory?.usedJSHeapSize || 0,
      
      // Device info
      deviceType,
      connectionType: nav.connection?.effectiveType || 'unknown',
      deviceMemory: nav.deviceMemory || 0,
      hardwareConcurrency: nav.hardwareConcurrency || 0,
      
      // User preferences (SSR-safe)
      prefersReducedMotion: typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
      prefersColorScheme: typeof window !== 'undefined' && window.matchMedia ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 'dark'
    }
    
    setMetrics(newMetrics)
  }, [])

  // Update metrics from Performance Observer
  const updateMetrics = useCallback((entry: PerformanceEntry) => {
    setMetrics(prev => {
      if (!prev) return prev
      
      const updated = { ...prev }
      
      switch (entry.entryType) {
        case 'paint':
          if (entry.name === 'first-contentful-paint') {
            updated.fcp = entry.startTime
          }
          break
        case 'layout-shift':
          updated.cls += (entry as any).value
          break
        case 'first-input':
          updated.fid = (entry as any).processingStart - entry.startTime
          break
      }
      
      return updated
    })
  }, [])

  // Initialize performance monitoring
  const startMonitoring = useCallback(() => {
    if (typeof window === 'undefined' || isMonitoring) return
    
    setIsMonitoring(true)
    
    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          updateMetrics(entry)
        }
      })
      
      // Observe paint, navigation, and layout shift entries
      try {
        observerRef.current.observe({ entryTypes: ['paint', 'navigation', 'layout-shift', 'first-input'] })
      } catch (error) {
        console.warn('Performance Observer error:', error)
      }
    }
    
    // Start periodic monitoring
    intervalRef.current = setInterval(collectMetrics, 2000)
    
    // Initial collection
    collectMetrics()
  }, [isMonitoring, collectMetrics, updateMetrics])
  
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }, [])
  

  
  // Device-specific optimizations
  const optimizeForDevice = useCallback(() => {
    if (!metrics) return
    
    const optimizations = []
    
    // Memory optimization
    if (metrics.deviceMemory <= 4) {
      optimizations.push('Enable reduced memory mode')
      // Trigger garbage collection if available
      if ('gc' in window) {
        (window as any).gc()
      }
    }
    
    // Connection optimization
    if (['slow-2g', '2g'].includes(metrics.connectionType)) {
      optimizations.push('Enable data saver mode')
    }
    
    // Animation optimization
    if (metrics.prefersReducedMotion || metrics.deviceType === 'mobile') {
      optimizations.push('Reduce animation complexity')
    }
    
    console.log('Applied optimizations:', optimizations)
  }, [metrics])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])
  
  // Track re-renders
  useEffect(() => {
    renderCountRef.current += 1
  })
  
  return (
    <PerformanceContext.Provider
      value={{
        metrics,
        isMonitoring,
        startMonitoring,
        stopMonitoring,
        optimizeForDevice
      }}
    >
      {children}
    </PerformanceContext.Provider>
  )
}

// Hook to use performance context
export const usePerformance = () => {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}

// Performance dashboard component
export const PerformanceDashboard: React.FC<{
  isVisible: boolean
  onClose: () => void
}> = ({ isVisible, onClose }) => {
  const { metrics, isMonitoring, startMonitoring, stopMonitoring, optimizeForDevice } = usePerformance()
  
  // Performance scoring
  const getPerformanceScore = useCallback(() => {
    if (!metrics) return 0
    
    let score = 100
    
    // Core Web Vitals scoring
    if (metrics.lcp > 2500) score -= 20
    if (metrics.fid > 100) score -= 15
    if (metrics.cls > 0.1) score -= 15
    if (metrics.fcp > 1800) score -= 10
    
    // Memory usage scoring
    if (metrics.memoryUsage > 50 * 1024 * 1024) score -= 10 // 50MB
    
    // Re-render scoring
    if (metrics.reRenderCount > 50) score -= 10
    
    return Math.max(0, score)
  }, [metrics])
  
  const performanceScore = getPerformanceScore()
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }
  
  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 70) return <TrendingUp className="h-5 w-5 text-yellow-500" />
    return <AlertTriangle className="h-5 w-5 text-red-500" />
  }
  
  if (!isVisible) return null
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-background border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Performance Dashboard
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Performance Score */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getScoreIcon(performanceScore)}
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                    {performanceScore}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          performanceScore >= 90 ? 'bg-green-500' :
                          performanceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${performanceScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Controls */}
            <div className="flex gap-2 mb-6">
              <Button
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </Button>
              <Button onClick={optimizeForDevice} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Optimize
              </Button>
            </div>
            
            {/* Metrics Grid */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Core Web Vitals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Core Web Vitals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">LCP</span>
                      <Badge variant={metrics.lcp <= 2500 ? "default" : "destructive"}>
                        {Math.round(metrics.lcp)}ms
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">FID</span>
                      <Badge variant={metrics.fid <= 100 ? "default" : "destructive"}>
                        {Math.round(metrics.fid)}ms
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">CLS</span>
                      <Badge variant={metrics.cls <= 0.1 ? "default" : "destructive"}>
                        {metrics.cls.toFixed(3)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">FCP</span>
                      <Badge variant={metrics.fcp <= 1800 ? "default" : "destructive"}>
                        {Math.round(metrics.fcp)}ms
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Device Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {metrics.deviceType === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                      Device Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Type</span>
                      <Badge>{metrics.deviceType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Memory</span>
                      <Badge>{metrics.deviceMemory || 'Unknown'} GB</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">CPU Cores</span>
                      <Badge>{metrics.hardwareConcurrency}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Connection</span>
                      <Badge variant={['4g', 'unknown'].includes(metrics.connectionType) ? "default" : "secondary"}>
                        <Wifi className="h-3 w-3 mr-1" />
                        {metrics.connectionType}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                {/* App Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">App Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Components</span>
                      <Badge>{metrics.componentCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Re-renders</span>
                      <Badge variant={metrics.reRenderCount > 50 ? "destructive" : "default"}>
                        {metrics.reRenderCount}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Memory</span>
                      <Badge variant={metrics.memoryUsage > 50 * 1024 * 1024 ? "destructive" : "default"}>
                        {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Reduced Motion</span>
                      <Badge variant={metrics.prefersReducedMotion ? "secondary" : "outline"}>
                        {metrics.prefersReducedMotion ? 'On' : 'Off'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Performance indicator component
export const PerformanceIndicator: React.FC = () => {
  const { metrics, isMonitoring } = usePerformance()
  const [showDashboard, setShowDashboard] = useState(false)
  
  if (!isMonitoring || !metrics) return null
  
  const memoryMB = metrics.memoryUsage / 1024 / 1024
  const isHealthy = memoryMB < 50 && metrics.reRenderCount < 50
  
  return (
    <>
      <motion.div
        className="fixed bottom-4 left-4 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant={isHealthy ? "default" : "destructive"}
          size="sm"
          onClick={() => setShowDashboard(true)}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          {memoryMB.toFixed(1)}MB
        </Button>
      </motion.div>
      
      <PerformanceDashboard
        isVisible={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  )
}

// Utility functions for Core Web Vitals measurement
const getLCP = (): number => {
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
  return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0
}

const getFID = (): number => {
  const fidEntries = performance.getEntriesByType('first-input')
  return fidEntries.length > 0 ? (fidEntries[0] as any).processingStart - fidEntries[0].startTime : 0
}

const getCLS = (): number => {
  const clsEntries = performance.getEntriesByType('layout-shift')
  return clsEntries.reduce((sum, entry) => sum + (entry as any).value, 0)
}

const getFCP = (): number => {
  const fcpEntries = performance.getEntriesByName('first-contentful-paint')
  return fcpEntries.length > 0 ? fcpEntries[0].startTime : 0
}

const PerformanceMonitorComponents = {
  PerformanceProvider,
  PerformanceDashboard,
  PerformanceIndicator,
  usePerformance
}

export default PerformanceMonitorComponents