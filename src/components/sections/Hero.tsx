"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "@/lib/utils/motion-exports"
import { useInView } from "react-intersection-observer"
import { ArrowRight, MousePointer } from "lucide-react"
import { SparklesLazy } from "@/components/ui/sparkles-lazy"
import { FloatingPaper } from "@/components/ui/floating-paper"
import { RoboAnimation } from "@/components/ui/robo-animation"
import { useScrollPosition } from "@/hooks/useScrollPosition"
import { useViewportSizing } from "@/hooks/useViewportSizing"

export function Hero() {
  // Add a client-side loading state
  const [isClient, setIsClient] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const viewport = useViewportSizing()
  
  // Set isClient to true after component mounts to ensure we're running in the browser
  useEffect(() => {
    setIsClient(true)

    // Only run media queries on client-side
    if (typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined') {
      // Check for reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })
  
  const scrollY = useScrollPosition()
  
  // Threshold where animation completes
  const scrollThreshold = 800
  
  // Memoize expensive calculations
  const { progress, easedProgress, opacity, translateY } = useMemo(() => {
    const prog = Math.min(1, scrollY / scrollThreshold)
    const eased = prog * prog * prog
    const op = reducedMotion ? 1 : Math.max(0, 1 - prog * 1.5)
    const transform = reducedMotion ? 0 : -eased * 300
    
    return {
      progress: prog,
      easedProgress: eased,
      opacity: op,
      translateY: transform
    }
  }, [scrollY, scrollThreshold, reducedMotion])
  
  // Keyboard navigation handlers
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      // Scroll to services section
      const servicesSection = document.getElementById('services')
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])
  
  // Animation variants with reduced motion support
  const fadeInVariants = useMemo(() => ({
    hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 }
  }), [reducedMotion])
  
  const scaleVariants = useMemo(() => ({
    initial: { scale: 1 },
    animate: reducedMotion ? { scale: 1 } : { scale: [1, 1.05, 1] }
  }), [reducedMotion])
  
  // Enhanced SSR with proper semantic content
  if (!isClient) {
    return (
      <section 
        className="relative overflow-hidden"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
        role="banner"
        aria-label="MIDAS Digital Marketing Hero Section"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center min-h-[60vh] flex items-center justify-center">
            <div className="space-y-8">
              <div className="w-32 h-32 bg-primary/20 rounded-full mx-auto animate-pulse" role="img" aria-label="MIDAS logo placeholder"></div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Transform Your Digital Presence with <span className="text-primary">MIDAS</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Your partner in digital automation, branding, and performance marketing. We turn your vision into measurable success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="h-12 w-40 bg-primary/20 rounded-md mx-auto animate-pulse" aria-label="Get started button loading"></div>
                <div className="h-12 w-40 bg-gray-200 dark:bg-gray-800 rounded-md mx-auto animate-pulse" aria-label="View work button loading"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
  
  return (
    <section 
      ref={ref} 
      className="relative overflow-hidden"
      role="banner"
      aria-label="MIDAS Digital Marketing Hero Section"
      style={{ 
        opacity: opacity,
        transform: `translateY(${translateY}px)`,
        transition: reducedMotion ? 'none' : 'transform 0.05s ease-out, opacity 0.1s ease-out',
        willChange: reducedMotion ? 'auto' : 'transform, opacity',
        minHeight: '100vh'
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" aria-hidden="true" />
      
      {/* Sparkles animation - only if motion is allowed */}
      {!reducedMotion && (
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <SparklesLazy
            id="hero-sparkles"
            background="transparent"
            minSize={0.6}
            maxSize={1.2}
            particleDensity={70}
            className="w-full h-full"
            particleColor="hsl(var(--primary))"
          />
        </div>
      )}
      
      {/* Floating papers - only if motion is allowed */}
      {!reducedMotion && (
        <FloatingPaper count={8} className="-z-10" aria-hidden="true" />
      )}
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: reducedMotion ? 0.5 : 0.5 }}
        transition={reducedMotion ? { duration: 0 } : undefined}
        className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl -z-10"
        aria-hidden="true"
      />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: reducedMotion ? 0.4 : 0.4 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.3 }}
        className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10"
        aria-hidden="true"
      />
      
      <div className="container mx-auto px-4 min-h-screen flex items-center justify-center">
        <div className={`max-w-4xl mx-auto text-center w-full ${viewport.contentSpacing}`}>
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.6 }}
            className="flex justify-center"
            role="img"
            aria-label="MIDAS Robot Animation"
          >
            <RoboAnimation />
          </motion.div>
          
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
          >
            <h1 
              id="main-heading"
              className={`${viewport.width >= 1600 ? 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl' : viewport.height < 700 ? 'text-2xl sm:text-3xl md:text-4xl' : viewport.headingScale} font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-primary rounded-lg leading-[1.1]`}
              tabIndex={0}
            >
              Transform Your Digital Presence with{" "}
              <motion.span 
                className="text-primary inline-block"
                variants={scaleVariants}
                initial="initial"
                animate="animate"
                transition={reducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              >
                MIDAS
              </motion.span>
            </h1>
          </motion.div>
          
          <motion.p 
            className={`${viewport.width >= 1600 ? 'text-xl sm:text-2xl md:text-3xl' : viewport.height < 700 ? 'text-sm sm:text-base md:text-lg' : viewport.isSmall ? 'text-base sm:text-lg' : 'text-lg sm:text-xl md:text-2xl'} text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0`}
            variants={fadeInVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.4 }}
            aria-describedby="main-heading"
          >
            Your partner in digital automation, branding, and performance marketing.
            We turn your vision into measurable success.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0"
            variants={fadeInVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.6 }}
            role="group"
            aria-label="Call to action buttons"
          >
            <Button 
              size="lg" 
              className={`${viewport.width >= 1600 ? 'text-lg sm:text-xl px-8 py-4' : 'text-base sm:text-lg'} group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full sm:w-auto min-w-[160px]`}
              aria-label="Get started with MIDAS digital marketing services - Navigate to contact form"
              onClick={() => {
                const contactSection = document.getElementById('contact')
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' })
                  // Announce navigation for screen readers
                  const announcement = document.createElement('div')
                  announcement.setAttribute('aria-live', 'polite')
                  announcement.textContent = 'Navigating to contact form'
                  document.body.appendChild(announcement)
                  setTimeout(() => document.body.removeChild(announcement), 1000)
                }
              }}
            >
              Get Started
              <motion.span 
                className="inline-block ml-2"
                initial={{ x: 0 }}
                whileHover={reducedMotion ? { x: 0 } : { x: 5 }}
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 10 }}
                aria-hidden="true"
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className={`${viewport.width >= 1600 ? 'text-lg sm:text-xl px-8 py-4' : 'text-base sm:text-lg'} focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full sm:w-auto min-w-[160px]`}
              aria-label="View our portfolio and previous work - Navigate to portfolio section"
              onClick={() => {
                const portfolioSection = document.getElementById('portfolio')
                if (portfolioSection) {
                  portfolioSection.scrollIntoView({ behavior: 'smooth' })
                  // Announce navigation for screen readers
                  const announcement = document.createElement('div')
                  announcement.setAttribute('aria-live', 'polite')
                  announcement.textContent = 'Navigating to portfolio section'
                  document.body.appendChild(announcement)
                  setTimeout(() => document.body.removeChild(announcement), 1000)
                }
              }}
            >
              View Our Work
            </Button>
          </motion.div>
          
          {/* Animated scroll indicator with accessibility - positioned absolutely */}
          {viewport.height > 700 && (
            <motion.div 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reducedMotion ? { duration: 0 } : { delay: 1, duration: 1 }}
            >
            <motion.div
              className="flex flex-col items-center cursor-pointer"
              animate={reducedMotion ? { y: 0 } : { y: [0, 10, 0] }}
              transition={reducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              role="button"
              tabIndex={0}
              aria-label="Scroll down to explore our services"
              onClick={() => {
                const servicesSection = document.getElementById('services')
                if (servicesSection) {
                  servicesSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              onKeyDown={handleKeyDown}
            >
              <span className="text-sm text-gray-500 dark:text-gray-400 mb-2" aria-hidden="true">
                Scroll to explore
              </span>
              <MousePointer className="h-6 w-6 text-primary" aria-hidden="true" />
            </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
} 