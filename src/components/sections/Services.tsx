"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Video, Palette, LineChart, Users, Megaphone, Brain, LucideIcon } from "lucide-react"
import Link from "next/link"
import { services } from "@/lib/data/services"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { getIconComponent } from "@/lib/utils/icons"
import { useState, useEffect, useMemo, memo } from 'react'
import { useViewportSizing } from "@/hooks/useViewportSizing"

interface AnimatedIconProps {
  slug: string
  iconName: string
  hoveredIcon: string | null
  onMouseEnter: () => void
  onMouseLeave: () => void
  reducedMotion: boolean
}

// Memoized AnimatedIcon component for performance
const AnimatedIcon = memo(({ slug, iconName, hoveredIcon, onMouseEnter, onMouseLeave, reducedMotion }: AnimatedIconProps) => {
  const Icon = getIconComponent(iconName)
  const isHovered = hoveredIcon === slug
  
  // Framer Motion variants for consistent animation
  const iconVariants = useMemo(() => ({
    default: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    },
    hovered: {
      scale: reducedMotion ? 1 : 1.08,
      rotate: reducedMotion ? 0 : 5,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    }
  }), [reducedMotion])

  return (
    <motion.div
      variants={iconVariants}
      initial="default"
      animate={isHovered ? "hovered" : "default"}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer"
    >
      <Icon className="h-12 w-12 text-primary mb-4" aria-hidden="true" />
    </motion.div>
  )
})

AnimatedIcon.displayName = 'AnimatedIcon'

export function Services() {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const viewport = useViewportSizing()
  
  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // Memoized animation variants for performance
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.1
      }
    }
  }), [reducedMotion])

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.3
      }
    }
  }), [reducedMotion])
  
  const backgroundVariants = useMemo(() => ({
    animate: reducedMotion ? {
      scale: 1,
      rotate: 0
    } : {
      scale: [1, 1.1, 1],
      rotate: [0, 10, 0]
    }
  }), [reducedMotion])

  return (
    <section 
      id="services" 
      ref={ref} 
      className={`${viewport.sectionSpacing} bg-gray-50 dark:bg-gray-900 relative overflow-hidden`}
      aria-label="Our services section"
    >
      {/* Animated background elements - respect reduced motion */}
      <motion.div 
        className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full"
        variants={backgroundVariants}
        animate="animate"
        transition={reducedMotion ? { duration: 0 } : { duration: 15, repeat: Infinity, repeatType: "reverse" as const }}
        aria-hidden="true"
      />
      
      <motion.div 
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full"
        animate={reducedMotion ? {
          scale: 1,
          rotate: 0
        } : {
          scale: [1, 1.2, 1],
          rotate: [0, -10, 0]
        }}
        transition={reducedMotion ? { duration: 0 } : { duration: 20, repeat: Infinity, repeatType: "reverse" as const }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className={`text-center max-w-3xl mx-auto ${viewport.height < 700 ? 'mb-8' : 'mb-12 md:mb-16'}`}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reducedMotion ? 0 : 20 }}
          transition={{ duration: reducedMotion ? 0 : 0.6 }}
        >
          <h2 
            id="services-heading"
            className={`${viewport.width >= 1600 ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl md:text-4xl'} font-bold mb-4`}
          >
            Our Services
          </h2>
          <p className={`${viewport.width >= 1600 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} text-gray-600 dark:text-gray-400`}>
            Comprehensive digital solutions to elevate your brand and drive growth
          </p>
        </motion.div>

        <motion.div 
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${viewport.height < 700 ? 'gap-4 md:gap-6' : 'gap-6 md:gap-8'}`}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          role="list"
          aria-labelledby="services-heading"
        >
          {Object.entries(services).map(([slug, service]: [string, { title: string, description: string, iconName: string }], index) => {
            return (
              <motion.div 
                key={slug}
                variants={itemVariants}
                whileHover={reducedMotion ? {} : { y: -10 }}
                transition={reducedMotion ? { duration: 0 } : { 
                  duration: 0.2,
                  type: "spring",
                  damping: 15,
                  stiffness: 100
                }}
                role="listitem"
              >
                <Link 
                  href={`/services/${slug}`}
                  aria-label={`Learn more about ${service.title} services`}
                  className="block rounded-lg focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  <Card className="border-2 hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer h-full overflow-hidden group focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <CardHeader>
                      <AnimatedIcon 
                        slug={slug}
                        iconName={service.iconName}
                        hoveredIcon={hoveredIcon}
                        onMouseEnter={() => setHoveredIcon(slug)}
                        onMouseLeave={() => setHoveredIcon(null)}
                        reducedMotion={reducedMotion}
                      />
                      <CardTitle className="group-hover:text-primary transition-colors" id={`service-${slug}-title`}>
                        {service.title}
                      </CardTitle>
                      <CardDescription aria-describedby={`service-${slug}-title`}>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <motion.p 
                        className="text-sm text-gray-500 dark:text-gray-400 flex items-center"
                        whileHover={reducedMotion ? {} : { x: 5 }}
                        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Click to learn more 
                        <motion.svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="ml-1"
                          initial={{ x: 0 }}
                          animate={reducedMotion ? { x: 0 } : { x: [0, 5, 0] }}
                          transition={reducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                          aria-hidden="true"
                        >
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </motion.svg>
                      </motion.p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
} 