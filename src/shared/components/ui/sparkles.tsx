"use client"

import React from "react"

interface SparklesProps {
  id?: string
  background?: string
  minSize?: number
  maxSize?: number
  particleDensity?: number
  className?: string
  particleColor?: string
}

// TEMPORARY FALLBACK: Disabled sparkles to fix SSR window errors
// Returns empty div instead of canvas to avoid window access during SSR
export const SparklesCore = ({
  id = "tsparticles",
  background = "transparent",
  minSize = 0.6,
  maxSize = 1.4,
  particleDensity = 100,
  className = "h-full w-full",
  particleColor = "#FFFFFF",
}: SparklesProps) => {
  return (
    <div
      id={id}
      className={className}
      style={{ background }}
      aria-hidden="true"
    />
  )
}