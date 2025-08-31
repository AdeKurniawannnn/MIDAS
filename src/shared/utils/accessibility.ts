// Enhanced accessibility utilities for case studies and components

// ARIA label generators for better screen reader support
export const generateAriaLabels = {
  caseStudyCard: (title: string, category: string) => 
    `Case study: ${title} in ${category} category. Click to read full details.`,
  
  resultMetric: (value: string, metric: string) => 
    `Result metric: ${metric} improved by ${value}`,
  
  imageGallery: (title: string, index: number, total: number) => 
    `Image ${index + 1} of ${total} from ${title} case study`,
  
  navigationLink: (destination: string) => 
    `Navigate to ${destination} page`,
  
  filterButton: (category: string, count: number) => 
    `Filter case studies by ${category} category. ${count} cases available.`,
  
  backToTop: () => 
    'Return to top of page',
  
  externalLink: (title: string) => 
    `${title} (opens in new tab)`
}

// Focus management utilities
export const focusManagement = {
  // Trap focus within a container (useful for modals)
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  },

  // Restore focus to a specific element
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  },

  // Move focus to main content (skip navigation)
  skipToMainContent: () => {
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]')
    if (mainContent instanceof HTMLElement) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation for card grids
  handleGridNavigation: (
    event: KeyboardEvent, 
    currentIndex: number, 
    totalItems: number, 
    itemsPerRow: number = 3
  ) => {
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
        newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : currentIndex
        break
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
        break
      case 'ArrowDown':
        newIndex = currentIndex + itemsPerRow < totalItems ? currentIndex + itemsPerRow : currentIndex
        break
      case 'ArrowUp':
        newIndex = currentIndex - itemsPerRow >= 0 ? currentIndex - itemsPerRow : currentIndex
        break
      case 'Home':
        newIndex = 0
        break
      case 'End':
        newIndex = totalItems - 1
        break
      default:
        return currentIndex
    }

    event.preventDefault()
    return newIndex
  },

  // Handle escape key for closing modals/dropdowns
  handleEscapeKey: (callback: () => void) => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }
}

// Screen reader utilities
export const screenReader = {
  // Announce dynamic content changes
  announceToScreenReader: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  },

  // Create skip links for keyboard users
  createSkipLink: (targetId: string, text: string) => {
    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.textContent = text
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded'
    
    return skipLink
  }
}

// Color contrast utilities
export const colorContrast = {
  // Check if text color has sufficient contrast against background
  checkContrast: (textColor: string, backgroundColor: string): boolean => {
    // This is a simplified check - in production, use a proper contrast library
    const getRelativeLuminance = (color: string): number => {
      // Convert hex to RGB and calculate relative luminance
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255

      const [rs, gs, bs] = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      )

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    const l1 = getRelativeLuminance(textColor)
    const l2 = getRelativeLuminance(backgroundColor)
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    
    return ratio >= 4.5 // WCAG AA standard
  },

  // Get accessible color combinations
  getAccessibleColors: () => ({
    primary: { text: '#ffffff', bg: '#0066cc' },
    secondary: { text: '#333333', bg: '#f5f5f5' },
    success: { text: '#ffffff', bg: '#22c55e' },
    warning: { text: '#000000', bg: '#fbbf24' },
    error: { text: '#ffffff', bg: '#dc2626' }
  })
}

// Motion preferences utilities
export const motionPreferences = {
  // Check if user prefers reduced motion (safe for SSR)
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Apply motion preferences to animations
  getAnimationDuration: (defaultDuration: number): number => {
    return motionPreferences.prefersReducedMotion() ? 0 : defaultDuration
  },

  // Create accessible transition classes
  getTransitionClasses: (defaultTransition: string): string => {
    return motionPreferences.prefersReducedMotion() 
      ? 'transition-none' 
      : defaultTransition
  }
}

// Touch/mobile accessibility utilities
export const touchAccessibility = {
  // Ensure minimum touch target size (44px x 44px recommended)
  getTouchTargetClasses: () => 'min-h-[44px] min-w-[44px]',

  // Add touch-friendly spacing
  getTouchSpacing: () => 'space-y-2 md:space-y-1',

  // Handle touch gestures for accessibility
  addSwipeSupport: (element: HTMLElement, onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
    let startX = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return

      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const diffX = startX - endX
      const diffY = startY - endY

      // Only trigger if horizontal swipe is more significant than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && onSwipeLeft) {
          onSwipeLeft()
        } else if (diffX < 0 && onSwipeRight) {
          onSwipeRight()
        }
      }

      startX = 0
      startY = 0
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }
}

// Form accessibility utilities
export const formAccessibility = {
  // Generate form field IDs and labels
  generateFieldId: (fieldName: string, formId?: string): string => {
    const baseId = formId ? `${formId}-${fieldName}` : fieldName
    return baseId.toLowerCase().replace(/\s+/g, '-')
  },

  // Create proper error message associations
  associateErrorMessage: (fieldId: string, errorId: string) => ({
    'aria-describedby': errorId,
    'aria-invalid': 'true'
  }),

  // Create proper label associations
  associateLabel: (fieldId: string) => ({
    htmlFor: fieldId
  }),

  // Generate required field indicators
  getRequiredFieldProps: () => ({
    'aria-required': 'true',
    required: true
  })
}

// Image accessibility utilities
export const imageAccessibility = {
  // Generate descriptive alt text for case study images
  generateCaseStudyAlt: (title: string, imageType: 'hero' | 'gallery' | 'thumbnail', index?: number): string => {
    switch (imageType) {
      case 'hero':
        return `Hero image for ${title} case study showing project overview`
      case 'gallery':
        return `Gallery image ${index ? index + 1 : ''} showcasing ${title} project details`
      case 'thumbnail':
        return `Thumbnail preview of ${title} case study`
      default:
        return `Image related to ${title} case study`
    }
  },

  // Check if image needs loading optimization
  shouldLazyLoad: (isAboveFold: boolean, priority: boolean = false): boolean => {
    return !isAboveFold && !priority
  },

  // Generate responsive image sizes
  getResponsiveSizes: (breakpoints: Record<string, string>): string => {
    return Object.entries(breakpoints)
      .map(([size, width]) => `(max-width: ${size}) ${width}`)
      .join(', ')
  }
}

// Default export with all utilities
const accessibilityUtils = {
  generateAriaLabels,
  focusManagement,
  keyboardNavigation,
  screenReader,
  colorContrast,
  motionPreferences,
  touchAccessibility,
  formAccessibility,
  imageAccessibility
}

export default accessibilityUtils