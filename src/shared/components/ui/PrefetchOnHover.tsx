"use client"

import { useState, useRef } from "react"

interface PrefetchOnHoverProps {
  children: React.ReactNode
  prefetchComponent: () => Promise<any>
  fallback: React.ComponentType
}

export function PrefetchOnHover({ 
  children, 
  prefetchComponent,
  fallback: Fallback 
}: PrefetchOnHoverProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const prefetchRef = useRef<Promise<any> | null>(null)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (!prefetchRef.current && !isLoaded) {
      prefetchRef.current = prefetchComponent().then(() => {
        setIsLoaded(true)
      })
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isLoaded ? children : <Fallback />}
    </div>
  )
}