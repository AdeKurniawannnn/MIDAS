"use client"

import React from 'react'

interface ServiceLayoutProps {
  children: React.ReactNode;
}

export default function ServiceLayout({ children }: ServiceLayoutProps) {
  return (
    <div className="bg-gray-950 min-h-screen w-screen overflow-x-hidden">
      {children}
    </div>
  )
} 