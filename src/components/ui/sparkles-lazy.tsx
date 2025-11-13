'use client'

import dynamic from 'next/dynamic'

const SparklesCore = dynamic(() => import('./sparkles').then(mod => ({ default: mod.SparklesCore })), {
  loading: () => (
    <div className="h-full w-full animate-pulse bg-gradient-to-br from-blue-50/20 to-purple-50/20 rounded" />
  ),
  ssr: false
})

export const SparklesLazy = SparklesCore