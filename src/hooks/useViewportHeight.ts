import { useEffect } from 'react'

/**
 * Hook to set accurate viewport height CSS custom property
 * Handles mobile browser UI and orientation changes
 */
export function useViewportHeight() {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return
    }

    const updateVH = () => {
      // Get actual viewport height
      const vh = window.innerHeight * 0.01

      // Set CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`)

      // Optional: Set viewport width for responsive calculations
      const vw = window.innerWidth * 0.01
      document.documentElement.style.setProperty('--vw', `${vw}px`)
    }

    // Initial calculation
    updateVH()

    // Update on resize and orientation change
    const handleResize = () => {
      // Debounce for performance
      requestAnimationFrame(updateVH)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    // Handle iOS Safari specific issues
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Additional delay for iOS
      setTimeout(updateVH, 500)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])
}