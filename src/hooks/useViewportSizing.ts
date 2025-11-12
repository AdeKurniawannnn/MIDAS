import { useState, useEffect } from 'react'

interface ViewportInfo {
  width: number
  height: number
  isSmall: boolean
  isMedium: boolean
  isLarge: boolean
  isXLarge: boolean
  // Proportional sizing helpers
  heroMaxHeight: number
  sectionSpacing: string
  contentSpacing: string
  headingScale: string
}

/**
 * Hook for viewport-aware proportional sizing
 * Ensures sections fit properly within available space
 */
export function useViewportSizing(): ViewportInfo {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    width: 1920,
    height: 1080,
    isSmall: false,
    isMedium: false,
    isLarge: true,
    isXLarge: false,
    heroMaxHeight: 600,
    sectionSpacing: 'py-12',
    contentSpacing: 'space-y-6',
    headingScale: 'text-4xl'
  })

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return
    }

    const updateViewportInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Responsive breakpoints
      const isSmall = width < 768
      const isMedium = width >= 768 && width < 1024
      const isLarge = width >= 1024 && width < 1280
      const isXLarge = width >= 1280

      // Calculate optimal hero height (50-60% of viewport for better content distribution)
      const heroMaxHeight = Math.min(
        height * 0.60, // Never more than 60% of viewport
        isSmall ? 400 : isLarge ? 500 : 450 // Device-specific caps - more conservative
      )

      // Proportional section spacing - much more conservative for better content distribution
      let sectionSpacing: string
      if (height < 700) {
        sectionSpacing = 'py-4 sm:py-6 md:py-8' // Very compact for small screens
      } else if (height < 900) {
        sectionSpacing = 'py-6 sm:py-8 md:py-10' // Conservative spacing
      } else {
        sectionSpacing = 'py-8 sm:py-10 md:py-12' // Comfortable but controlled spacing
      }

      // Content spacing - more conservative for better distribution
      const contentSpacing = height < 700 
        ? 'space-y-3 sm:space-y-4 md:space-y-5' 
        : 'space-y-4 sm:space-y-5 md:space-y-6'

      // Heading scale - more conservative for better content distribution
      let headingScale: string
      if (isSmall) {
        headingScale = height < 700 ? 'text-xl sm:text-2xl md:text-3xl' : 'text-2xl sm:text-3xl md:text-4xl'
      } else if (isMedium) {
        headingScale = 'text-2xl md:text-3xl lg:text-4xl'
      } else {
        headingScale = 'text-3xl md:text-4xl lg:text-5xl'
      }

      setViewportInfo({
        width,
        height,
        isSmall,
        isMedium,
        isLarge,
        isXLarge,
        heroMaxHeight,
        sectionSpacing,
        contentSpacing,
        headingScale
      })

      // Set CSS custom properties for dynamic sizing
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`)
      document.documentElement.style.setProperty('--vw', `${width * 0.01}px`)
      document.documentElement.style.setProperty('--hero-max-height', `${heroMaxHeight}px`)
    }

    // Initial calculation
    updateViewportInfo()

    // Update on resize with debouncing
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateViewportInfo, 150)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return viewportInfo
}