// =============================================================================
// MIDAS Application Constants
// =============================================================================

// Brand Colors
export const BRAND_COLORS = {
  gold: {
    primary: '#f9d423',
    secondary: '#e6b422', 
    accent: '#e2a90c',
    gradient: 'linear-gradient(to right, #f9d423 0%, #e6b422 25%, #f9d423 50%, #e2a90c 75%, #f9d423 100%)',
  },
  background: {
    dark: 'rgba(2, 6, 23, 0.8)',
    darkSolid: 'rgb(2, 6, 23)',
  },
} as const

// Animation Constants
export const ANIMATION = {
  scrollThreshold: 800,
  defaultTransition: {
    duration: 0.3,
    type: 'spring' as const,
    stiffness: 400,
    damping: 10,
  },
  shimmerDuration: 2.5,
  shineDuration: 1.5,
  pulseDuration: 3,
} as const

// Layout Constants
export const LAYOUT = {
  container: 'container mx-auto',
  containerWithPadding: 'container mx-auto px-4',
  maxWidth: {
    content: 'max-w-4xl',
    wide: 'max-w-6xl',
    narrow: 'max-w-2xl',
  },
  spacing: {
    section: 'py-20 md:py-32',
    component: 'py-12 md:py-20',
    small: 'py-8 md:py-12',
  },
} as const

// Development Constants
export const DEV = {
  autoLogin: {
    email: 'test@gmail.com',
    password: 'Test123',
  },
  debugMode: process.env.NEXT_PUBLIC_DEBUG === 'true',
} as const

// API Constants
export const API = {
  endpoints: {
    scraping: '/api/scraping',
  },
} as const

// Navigation Constants
export const NAVIGATION = {
  navItems: [
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
  ],
} as const

// Responsive Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Content Constants
export const CONTENT = {
  company: {
    name: 'MIDAS',
    tagline: 'Marketing & Digital Agency',
    description: 'MIDAS is a full-service marketing and digital agency specializing in brand development, digital marketing, and technology solutions.',
  },
  hero: {
    title: 'Transform Your Digital Presence with MIDAS',
    subtitle: 'Your partner in digital automation, branding, and performance marketing. We turn your vision into measurable success.',
  },
} as const

// Default Values
export const DEFAULTS = {
  windowHeight: 800,
  particleCount: 8,
  particleDensity: 70,
  particleSize: {
    min: 0.6,
    max: 1.2,
  },
} as const