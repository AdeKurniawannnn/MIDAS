// Performance-optimized hooks with caching, debouncing, and memoization
import { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  useLayoutEffect
} from 'react'
import { useInView } from 'framer-motion'

// Performance-optimized search hook with caching and debouncing
export const useOptimizedSearch = (
  items: any[], 
  searchFields: string[] = ['title', 'description'],
  debounceMs: number = 300
) => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  // Cache for search results
  const searchCache = useRef(new Map<string, any[]>())
  const abortController = useRef<AbortController>()
  
  // Debounce search query
  useEffect(() => {
    setIsSearching(true)
    
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setIsSearching(false)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [query, debounceMs])
  
  // Optimized search with caching
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      searchCache.current.clear()
      return items
    }
    
    const cacheKey = debouncedQuery.toLowerCase()
    
    // Check cache first
    if (searchCache.current.has(cacheKey)) {
      return searchCache.current.get(cacheKey)!
    }
    
    // Abort previous search if still running
    if (abortController.current) {
      abortController.current.abort()
    }
    
    abortController.current = new AbortController()
    
    const searchTerms = debouncedQuery.toLowerCase().split(' ')
    
    const results = items.filter(item => {
      const searchableText = searchFields
        .map(field => item[field] || '')
        .join(' ')
        .toLowerCase()
      
      return searchTerms.every(term => {
        // Basic fuzzy matching
        return searchableText.includes(term) ||
          searchableText.split(' ').some(word => 
            word.includes(term) || 
            term.includes(word) ||
            // Levenshtein distance for typo tolerance
            levenshteinDistance(word, term) <= 2
          )
      })
    })
    
    // Cache results
    searchCache.current.set(cacheKey, results)
    
    // Limit cache size to prevent memory leaks
    if (searchCache.current.size > 50) {
      const firstKey = searchCache.current.keys().next().value
      if (firstKey) {
        searchCache.current.delete(firstKey)
      }
    }
    
    return results
  }, [items, debouncedQuery, searchFields])
  
  // Clear cache when items change
  useEffect(() => {
    searchCache.current.clear()
  }, [items])
  
  return {
    query,
    setQuery,
    filteredItems,
    isSearching,
    hasResults: filteredItems.length > 0,
    resultCount: filteredItems.length,
    clearCache: () => searchCache.current.clear()
  }
}

// Simple Levenshtein distance implementation for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Performance-optimized infinite scroll with intersection observer
export const useOptimizedInfiniteScroll = (
  items: any[],
  itemsPerPage: number = 12,
  threshold: number = 0.8
) => {
  const [displayedItems, setDisplayedItems] = useState(() => 
    items.slice(0, itemsPerPage)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(items.length > itemsPerPage)
  
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(loadMoreRef, { 
    margin: "200px",
    once: false
  })
  
  // Optimized load more with batching
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    
    // Use requestIdleCallback for non-blocking updates
    const loadItems = () => {
      const currentLength = displayedItems.length
      const nextBatch = items.slice(currentLength, currentLength + itemsPerPage)
      
      if (nextBatch.length > 0) {
        setDisplayedItems(prev => [...prev, ...nextBatch])
        setHasMore(currentLength + nextBatch.length < items.length)
      } else {
        setHasMore(false)
      }
      
      setIsLoading(false)
    }
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadItems, { timeout: 100 })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(loadItems, 16)
    }
  }, [items, displayedItems.length, itemsPerPage, isLoading, hasMore])
  
  // Auto-load when in view
  useEffect(() => {
    if (isInView && hasMore && !isLoading) {
      loadMore()
    }
  }, [isInView, hasMore, isLoading, loadMore])
  
  // Reset when items change
  useEffect(() => {
    setDisplayedItems(items.slice(0, itemsPerPage))
    setHasMore(items.length > itemsPerPage)
  }, [items, itemsPerPage])
  
  return {
    displayedItems,
    isLoading,
    hasMore,
    loadMore,
    loadMoreRef
  }
}

// Optimized viewport tracking with throttling
export const useOptimizedViewport = (threshold: number = 0.3) => {
  const [viewportState, setViewportState] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  })
  
  const throttleRef = useRef<NodeJS.Timeout>()
  
  useLayoutEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setViewportState({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      })
    }
    
    const handleResize = () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }
      
      throttleRef.current = setTimeout(updateViewport, 100)
    }
    
    updateViewport()
    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }
    }
  }, [])
  
  return viewportState
}

// Performance-optimized favorites with localStorage caching
export const useOptimizedFavorites = (storageKey: string = 'case-study-favorites') => {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  
  // Debounced storage update
  const updateStorage = useCallback((favSet: Set<string>) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(favSet)))
    } catch (error) {
      console.warn('Failed to save favorites to localStorage:', error)
    }
  }, [storageKey])
  
  const addFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev).add(id)
      updateStorage(newSet)
      return newSet
    })
  }, [updateStorage])
  
  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      updateStorage(newSet)
      return newSet
    })
  }, [updateStorage])
  
  const toggleFavorite = useCallback((id: string) => {
    if (favorites.has(id)) {
      removeFavorite(id)
    } else {
      addFavorite(id)
    }
  }, [favorites, addFavorite, removeFavorite])
  
  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])
  
  return {
    favorites: Array.from(favorites),
    favoriteSet: favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    count: favorites.size
  }
}

// Resource monitoring hook
export const useResourceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    memory: 0,
    timing: 0,
    connection: 'unknown' as string,
    deviceMemory: 0
  })
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateMetrics = () => {
      const nav = navigator as any
      
      setMetrics({
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        timing: performance.now(),
        connection: nav.connection?.effectiveType || 'unknown',
        deviceMemory: nav.deviceMemory || 0
      })
    }
    
    updateMetrics()
    
    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return metrics
}

// Performance-optimized animation state
export const useOptimizedAnimation = (prefersReducedMotion?: boolean) => {
  const [shouldAnimate, setShouldAnimate] = useState(true)
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as any).connection
    const deviceMemory = (navigator as any).deviceMemory
    
    const updateAnimationState = () => {
      const reduce = (prefersReducedMotion ?? 
        mediaQuery.matches) ||
        (connection && ['slow-2g', '2g'].includes(connection.effectiveType)) ||
        (deviceMemory && deviceMemory <= 2)
      
      setShouldAnimate(!reduce)
    }
    
    updateAnimationState()
    mediaQuery.addEventListener('change', updateAnimationState)
    
    return () => {
      mediaQuery.removeEventListener('change', updateAnimationState)
    }
  }, [prefersReducedMotion])
  
  return {
    shouldAnimate,
    reducedMotionConfig: {
      transition: { duration: shouldAnimate ? 0.3 : 0.1 },
      animate: shouldAnimate
    }
  }
}

const PerformanceHooks = {
  useOptimizedSearch,
  useOptimizedInfiniteScroll,
  useOptimizedViewport,
  useOptimizedFavorites,
  useResourceMonitoring,
  useOptimizedAnimation
}

export default PerformanceHooks