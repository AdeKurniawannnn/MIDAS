'use client'

import dynamic from 'next/dynamic'

const InteractiveMap = dynamic(() => import('./interactive-map').then(mod => ({ default: mod.InteractiveMap })), {
  loading: () => (
    <div className="h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
  ssr: false
})

export default InteractiveMap