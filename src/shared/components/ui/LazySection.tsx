"use client"

import { useState, useEffect, useRef } from "react"

interface LazySectionProps {
  fallback: React.ReactNode
  children: React.ReactNode
  rootMargin?: string
  threshold?: number
}

export function LazySection({ 
  fallback, 
  children, 
  rootMargin = "300px",
  threshold = 0.1 
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}