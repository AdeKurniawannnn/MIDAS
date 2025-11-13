"use client"

import React from "react"

interface FloatingPaperProps {
  count?: number
  className?: string
}

// TEMPORARY FALLBACK: Disabled floating paper to fix SSR window errors
// Returns empty div to avoid window access during SSR
export function FloatingPaper({ count = 5, className = "" }: FloatingPaperProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true" />
  )
}