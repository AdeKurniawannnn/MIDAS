"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useState, useEffect, useMemo } from 'react'
import { useViewportSizing } from "@/hooks/useViewportSizing"

const portfolioItems = [
  {
    id: "ecommerce-automation",
    title: "E-commerce Automation",
    client: "TechRetail Co.",
    description:
      "Implemented automated inventory and order management systems, resulting in 40% operational cost reduction.",
    image: "/images/online marketplace.jpg",
    results: ["40% cost reduction", "60% faster order processing", "99.9% accuracy"],
  },
  {
    id: "brand-transformation",
    title: "Brand Transformation",
    client: "FreshStart Foods",
    description:
      "Complete brand overhaul including visual identity, packaging, and digital presence.",
    image: "/images/branding.jpg",
    results: ["150% social media growth", "85% brand recognition", "3x sales increase"],
  },
  {
    id: "video-marketing-campaign",
    title: "Video Marketing Campaign",
    client: "SportsFit",
    description:
      "Created viral video content series that showcased product benefits and user success stories.",
    image: "/images/video production.jpg",
    results: ["1M+ views", "200% engagement rate", "45% conversion rate"],
  },
]

export function Portfolio() {
  const [hovered, setHovered] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const viewport = useViewportSizing()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })
  
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
  
  // Memoized animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0, y: reducedMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.6,
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
        duration: reducedMotion ? 0 : 0.4
      }
    }
  }), [reducedMotion])

  return (
    <section 
      id="portfolio" 
      className={viewport.sectionSpacing}
      aria-label="Portfolio showcase section"
      ref={ref}
    >
      <div className="container mx-auto px-4">
        <motion.div 
          className={`text-center max-w-3xl mx-auto ${viewport.height < 700 ? 'mb-8' : 'mb-12 md:mb-16'}`}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reducedMotion ? 0 : 20 }}
          transition={{ duration: reducedMotion ? 0 : 0.6 }}
        >
          <h2 
            id="portfolio-heading"
            className={`${viewport.width >= 1600 ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-3xl md:text-4xl'} font-bold mb-4`}
          >
            Our Work
          </h2>
          <p className={`${viewport.width >= 1600 ? 'text-xl sm:text-2xl' : 'text-xl'} text-gray-600`}>
            Discover how we&apos;ve helped businesses achieve their digital goals
          </p>
        </motion.div>

        <motion.div 
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${viewport.height < 700 ? 'gap-4 md:gap-6' : 'gap-6 md:gap-8'}`}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          role="list"
          aria-labelledby="portfolio-heading"
        >
          {portfolioItems.map((item, index) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              role="listitem"
            >
              <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-video bg-gray-100 relative group">
                  <Image 
                    src={item.image} 
                    alt={`${item.title} case study thumbnail for ${item.client}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index === 0}
                    quality={index === 0 ? 90 : 75}
                    loading={index === 0 ? "eager" : "lazy"}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription className="font-medium text-primary">
                  {item.client}
                </CardDescription>
              </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <p className="text-gray-600">{item.description}</p>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Key Results:</h4>
                    <ul className="list-disc list-inside text-gray-600">
                      {item.results.map((result) => (
                        <li key={result}>{result}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4">
                    <Button 
                      variant="ghost" 
                      className="group" 
                      asChild
                      aria-label={`View detailed case study for ${item.title} project`}
                    >
                      <Link href={`/case-studies/${item.id}`}>
                        View Case Study{" "}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reducedMotion ? 0 : 20 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.3 }}
        >
          <motion.div
            whileHover={reducedMotion ? {} : { scale: 1.05 }}
            whileTap={reducedMotion ? {} : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 210, damping: 20 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Button 
              size="lg" 
              asChild
              aria-label="View all case studies and portfolio projects"
            >
              <Link href="/case-studies">
                View All Case Studies
                <motion.span
                  animate={hovered && !reducedMotion ? { x: 5 } : { x: 0 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  className="inline-block"
                >
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </motion.span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 