"use client"

import { useEffect } from 'react'

/**
 * Viewport Provider Component
 * Initializes viewport height CSS custom properties on mount
 * Should be included once in the app layout
 */
export function ViewportProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return
    }

    const updateViewportProperties = () => {
      const vh = window.innerHeight * 0.01
      const vw = window.innerWidth * 0.01
      
      // Set CSS custom properties for viewport units
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      document.documentElement.style.setProperty('--vw', `${vw}px`)
      
      // Calculate safe area insets for mobile browsers
      const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0px'
      const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0px'
      
      document.documentElement.style.setProperty('--safe-area-top', safeAreaTop)
      document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom)
      
      // Dynamic hero height calculation (75% of viewport max)
      const heroMaxHeight = Math.min(window.innerHeight * 0.75, 800)
      document.documentElement.style.setProperty('--hero-max-height', `${heroMaxHeight}px`)
    }

    // Initial calculation
    updateViewportProperties()

    // Update on resize and orientation change
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateViewportProperties, 100)
    }

    const handleOrientationChange = () => {
      // iOS needs extra time for orientation change
      setTimeout(updateViewportProperties, 500)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    // Handle iOS viewport height issues
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Additional updates for iOS Safari
      window.addEventListener('scroll', updateViewportProperties, { passive: true })
      
      // Update when going fullscreen/leaving fullscreen
      document.addEventListener('fullscreenchange', updateViewportProperties)
      document.addEventListener('webkitfullscreenchange', updateViewportProperties)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('scroll', updateViewportProperties)
      document.removeEventListener('fullscreenchange', updateViewportProperties)
      document.removeEventListener('webkitfullscreenchange', updateViewportProperties)
      clearTimeout(timeoutId)
    }
  }, [])

  return <>{children}</>
}