"use client"

import React from 'react'
import { Layout } from '@/components/layout/Layout'

interface ServiceLayoutProps {
  children: React.ReactNode;
}

export default function ServiceLayout({ children }: ServiceLayoutProps) {
  return (
    <div className="bg-gray-950 min-h-screen w-full">
      <Layout>
        {children}
      </Layout>
    </div>
  )
} 