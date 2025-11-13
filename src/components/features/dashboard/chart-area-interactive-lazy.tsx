'use client'

import dynamic from 'next/dynamic'

const ChartAreaInteractive = dynamic(() => import('./chart-area-interactive').then(mod => ({ default: mod.ChartAreaInteractive })), {
  loading: () => (
    <div className="h-64 bg-gray-200 animate-pulse rounded-lg">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2 mt-4 ml-4"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2 mb-2 ml-4"></div>
    </div>
  ),
  ssr: false
})

export default ChartAreaInteractive