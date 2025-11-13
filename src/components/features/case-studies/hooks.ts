// Custom hooks for case studies frontend functionality
// Enhanced UX interactions and state management

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useInView } from 'framer-motion'

// Hook for managing case study filters with smooth transitions
export const useCaseStudyFilters = (initialCategory: string = 'all') => {
  const [activeFilter, setActiveFilter] = useState(initialCategory)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleFilterChange = useCallback(async (category: string) => {
    if (category === activeFilter) return
    
    setIsTransitioning(true)
    
    // Small delay for smooth transition effect
    await new Promise(resolve => setTimeout(resolve, 150))
    
    setActiveFilter(category)
    setIsTransitioning(false)
  }, [activeFilter])

  return {
    activeFilter,
    isTransitioning,
    handleFilterChange
  }
}

// Hook for infinite scroll case study loading
export const useInfiniteScroll = (
  items: any[],
  itemsPerPage: number = 9,
  hasMore: boolean = true
) => {
  const [displayedItems, setDisplayedItems] = useState(items.slice(0, itemsPerPage))
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(loadMoreRef, { margin: "100px" })

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const nextPage = page + 1
    const newItems = items.slice(0, nextPage * itemsPerPage)
    
    setDisplayedItems(newItems)
    setPage(nextPage)
    setIsLoading(false)
  }, [items, itemsPerPage, page, hasMore, isLoading])

  useEffect(() => {
    if (isInView && hasMore && !isLoading) {
      loadMore()
    }
  }, [isInView, hasMore, isLoading, loadMore])

  // Reset when items change (e.g., filtering)
  useEffect(() => {
    setDisplayedItems(items.slice(0, itemsPerPage))
    setPage(1)
  }, [items, itemsPerPage])

  return {
    displayedItems,
    isLoading,
    hasMore: displayedItems.length < items.length,
    loadMoreRef
  }
}

// Hook for advanced search with debouncing and fuzzy matching
export const useAdvancedSearch = (items: any[], searchFields: string[] = ['title', 'description']) => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setIsSearching(false)
    }, 300)

    if (query !== debouncedQuery) {
      setIsSearching(true)
    }

    return () => clearTimeout(timer)
  }, [query, debouncedQuery])

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items

    const searchTerms = debouncedQuery.toLowerCase().split(' ')
    
    return items.filter(item => {
      const searchableText = searchFields
        .map(field => item[field] || '')
        .join(' ')
        .toLowerCase()
      
      return searchTerms.every(term => 
        searchableText.includes(term) ||
        // Fuzzy matching - allow for typos
        searchableText.split(' ').some(word => 
          word.includes(term) || term.includes(word)
        )
      )
    })
  }, [items, debouncedQuery, searchFields])

  return {
    query,
    setQuery,
    filteredItems,
    isSearching,
    hasResults: filteredItems.length > 0,
    resultCount: filteredItems.length
  }
}

// Hook for managing case study favorites/bookmarks
export const useFavorites = (storageKey: string = 'case-study-favorites') => {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch (error) {
        console.warn('Failed to parse favorites from localStorage')
      }
    }
  }, [storageKey])

  const addFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const updated = [...prev, id]
      localStorage.setItem(storageKey, JSON.stringify(updated))
      return updated
    })
  }, [storageKey])

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const updated = prev.filter(fav => fav !== id)
      localStorage.setItem(storageKey, JSON.stringify(updated))
      return updated
    })
  }, [storageKey])

  const toggleFavorite = useCallback((id: string) => {
    if (favorites.includes(id)) {
      removeFavorite(id)
    } else {
      addFavorite(id)
    }
  }, [favorites, addFavorite, removeFavorite])

  return {
    favorites,
    isFavorite: useCallback((id: string) => favorites.includes(id), [favorites]),
    addFavorite,
    removeFavorite,
    toggleFavorite
  }
}

// Enhanced hook for touch gestures with advanced detection
export const useTouchGestures = () => {
  const [gestureState, setGestureState] = useState({
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
    isPinching: false,
    isLongPress: false,
    scale: 1,
    velocity: { x: 0, y: 0 },
    direction: null as 'left' | 'right' | 'up' | 'down' | null
  })

  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    initialDistance: 0
  })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const now = Date.now()
    
    gestureRef.current = {
      ...gestureRef.current,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      lastX: touch.clientX,
      lastY: touch.clientY,
      lastTime: now
    }

    // Handle multi-touch for pinch detection
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      gestureRef.current.initialDistance = distance
      setGestureState(prev => ({ ...prev, isPinching: true }))
    }

    // Start long press timer
    gestureRef.current.longPressTimer = setTimeout(() => {
      setGestureState(prev => ({ ...prev, isLongPress: true }))
    }, 500)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const now = Date.now()
    
    // Clear long press if finger moves too much
    const deltaX = Math.abs(touch.clientX - gestureRef.current.startX)
    const deltaY = Math.abs(touch.clientY - gestureRef.current.startY)
    
    if ((deltaX > 10 || deltaY > 10) && gestureRef.current.longPressTimer) {
      clearTimeout(gestureRef.current.longPressTimer)
      gestureRef.current.longPressTimer = null
    }

    // Handle pinch gestures
    if (e.touches.length === 2) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      if (gestureRef.current.initialDistance > 0) {
        const scale = distance / gestureRef.current.initialDistance
        setGestureState(prev => ({ ...prev, scale }))
      }
    }

    // Update velocity calculations
    const timeDelta = now - gestureRef.current.lastTime
    if (timeDelta > 0) {
      const velocityX = (touch.clientX - gestureRef.current.lastX) / timeDelta
      const velocityY = (touch.clientY - gestureRef.current.lastY) / timeDelta
      
      setGestureState(prev => ({
        ...prev,
        velocity: { x: velocityX, y: velocityY }
      }))
    }

    gestureRef.current.lastX = touch.clientX
    gestureRef.current.lastY = touch.clientY
    gestureRef.current.lastTime = now
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    const { startX, startY, startTime, longPressTimer } = gestureRef.current
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      gestureRef.current.longPressTimer = null
    }
    
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const duration = Date.now() - startTime

    // Enhanced swipe detection with velocity consideration
    const minSwipeDistance = 30
    const maxSwipeTime = 500
    const minSwipeVelocity = 0.5

    if (duration < maxSwipeTime && 
        (absDeltaX > minSwipeDistance || absDeltaY > minSwipeDistance) &&
        (Math.abs(gestureState.velocity.x) > minSwipeVelocity || 
         Math.abs(gestureState.velocity.y) > minSwipeVelocity)) {
      
      let direction: 'left' | 'right' | 'up' | 'down' | null = null
      
      if (absDeltaX > absDeltaY) {
        direction = deltaX < 0 ? 'left' : 'right'
        setGestureState(prev => ({
          ...prev,
          isSwipeLeft: deltaX < 0,
          isSwipeRight: deltaX > 0,
          direction
        }))
      } else {
        direction = deltaY < 0 ? 'up' : 'down'
        setGestureState(prev => ({
          ...prev,
          isSwipeUp: deltaY < 0,
          isSwipeDown: deltaY > 0,
          direction
        }))
      }

      // Reset swipe states
      setTimeout(() => {
        setGestureState(prev => ({
          ...prev,
          isSwipeLeft: false,
          isSwipeRight: false,
          isSwipeUp: false,
          isSwipeDown: false,
          direction: null
        }))
      }, 100)
    }

    // Reset pinch state
    if (e.touches.length === 0) {
      setGestureState(prev => ({
        ...prev,
        isPinching: false,
        isLongPress: false,
        scale: 1
      }))
      gestureRef.current.initialDistance = 0
    }
  }, [gestureState.velocity])

  return {
    gestureState,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Hook for viewport-aware animations
export const useViewportAnimation = (threshold: number = 0.3) => {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { 
    once: true
  })

  return { ref, isInView }
}

// Hook for managing case study sorting with animations
export const useSortedCaseStudies = (
  items: any[],
  initialSort: 'title' | 'date' | 'category' = 'title'
) => {
  const [sortBy, setSortBy] = useState(initialSort)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isSorting, setIsSorting] = useState(false)

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'date':
          comparison = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })
  }, [items, sortBy, sortOrder])

  const handleSort = useCallback(async (newSortBy: typeof sortBy) => {
    setIsSorting(true)
    
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }

    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 150))
    setIsSorting(false)
  }, [sortBy])

  return {
    sortedItems,
    sortBy,
    sortOrder,
    isSorting,
    handleSort
  }
}

// Hook for managing modal/overlay states with body scroll lock
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return
    }

    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  }
}

// Hook for performance monitoring
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionDelay: 0
  })

  useEffect(() => {
    // Measure initial load time
    const loadTime = performance.now()
    setMetrics(prev => ({ ...prev, loadTime }))

    // Measure First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ 
              ...prev, 
              renderTime: entry.startTime 
            }))
          }
        }
      })
      
      observer.observe({ entryTypes: ['paint'] })
      
      return () => observer.disconnect()
    }
  }, [])

  return metrics
}

// Hook for responsive design and device detection
export const useResponsiveDesign = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    screenSize: 'mobile' as 'mobile' | 'tablet' | 'desktop',
    orientation: 'portrait' as 'portrait' | 'landscape'
  })

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return
    }

    const updateDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      const deviceInfo = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouchDevice,
        screenSize: (width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop') as 'mobile' | 'tablet' | 'desktop',
        orientation: (width > height ? 'landscape' : 'portrait') as 'portrait' | 'landscape'
      }

      setDevice(deviceInfo)
    }

    updateDevice()
    window.addEventListener('resize', updateDevice)
    window.addEventListener('orientationchange', updateDevice)

    return () => {
      window.removeEventListener('resize', updateDevice)
      window.removeEventListener('orientationchange', updateDevice)
    }
  }, [])

  return device
}

// Hook for managing touch-optimized interactions
export const useTouchOptimization = () => {
  const [touchState, setTouchState] = useState({
    supportsPressure: false,
    supportsHover: false,
    touchPoints: 0,
    hapticSupport: false
  })

  useEffect(() => {
    const checkCapabilities = () => {
      setTouchState({
        supportsPressure: 'force' in Touch.prototype,
        supportsHover: window.matchMedia('(hover: hover)').matches,
        touchPoints: navigator.maxTouchPoints || 0,
        hapticSupport: 'vibrate' in navigator
      })
    }

    checkCapabilities()
    
    // Listen for touch capability changes
    const hoverMediaQuery = window.matchMedia('(hover: hover)')
    hoverMediaQuery.addListener(checkCapabilities)
    
    return () => {
      hoverMediaQuery.removeListener(checkCapabilities)
    }
  }, [])

  const triggerHaptic = useCallback((pattern: number | number[] = 50) => {
    if (touchState.hapticSupport) {
      navigator.vibrate(pattern)
    }
  }, [touchState.hapticSupport])

  return {
    ...touchState,
    triggerHaptic
  }
}

// Hook for adaptive scroll behavior
export const useAdaptiveScroll = (threshold: number = 100) => {
  const [scrollState, setScrollState] = useState({
    isScrolling: false,
    scrollDirection: 'down' as 'up' | 'down',
    scrollVelocity: 0,
    shouldHideUI: false,
    distanceScrolled: 0
  })

  const lastScrollY = useRef(0)
  const velocityHistory = useRef<number[]>([])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return
    }

    let ticking = false
    let scrollTimer: NodeJS.Timeout

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const direction = currentScrollY > lastScrollY.current ? 'down' : 'up'
          const velocity = Math.abs(currentScrollY - lastScrollY.current)

          // Track velocity history for smooth calculations
          velocityHistory.current.push(velocity)
          if (velocityHistory.current.length > 5) {
            velocityHistory.current.shift()
          }

          const avgVelocity = velocityHistory.current.reduce((a, b) => a + b, 0) / velocityHistory.current.length

          setScrollState(prev => ({
            ...prev,
            isScrolling: true,
            scrollDirection: direction,
            scrollVelocity: avgVelocity,
            shouldHideUI: currentScrollY > threshold && direction === 'down' && avgVelocity > 5,
            distanceScrolled: currentScrollY
          }))

          lastScrollY.current = currentScrollY
          ticking = false
        })
        ticking = true
      }

      // Reset scrolling state after inactivity
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        setScrollState(prev => ({
          ...prev,
          isScrolling: false,
          scrollVelocity: 0
        }))
        velocityHistory.current = []
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimer)
    }
  }, [threshold])

  return scrollState
}

const CaseStudyHooks = {
  useCaseStudyFilters,
  useInfiniteScroll,
  useAdvancedSearch,
  useFavorites,
  useTouchGestures,
  useViewportAnimation,
  useSortedCaseStudies,
  useModal,
  usePerformanceMetrics,
  useResponsiveDesign,
  useTouchOptimization,
  useAdaptiveScroll
}

export default CaseStudyHooks