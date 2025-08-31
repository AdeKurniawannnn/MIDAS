import dynamic from "next/dynamic"
import { ReactElement } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const LoadingFallback = (): ReactElement => (
  <div className="container mx-auto py-20 px-4 space-y-8">
    {/* Header skeleton */}
    <div className="text-center space-y-4">
      <Skeleton className="h-12 w-3/4 mx-auto" />
      <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
    </div>
    
    {/* Content skeleton */}
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
    
    {/* Process skeleton */}
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3 mx-auto" />
      <div className="grid md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

const serviceClientMap: Record<string, React.ComponentType<any>> = {
  "digital-automation": dynamic(() => import("@/components/features/services/digital-automation-client"), {
    loading: () => <LoadingFallback />,
    ssr: false
  }),
  "it-systems": dynamic(() => import("@/components/features/services/it-systems-client"), {
    loading: () => <LoadingFallback />,
    ssr: false
  }),
  "marketing-strategy": dynamic(() => import("@/components/features/services/marketing-strategy-client"), {
    loading: () => <LoadingFallback />,
    ssr: false
  }),
  "performance-marketing": dynamic(() => import("@/components/features/services/performance-marketing-client"), {
    loading: () => <LoadingFallback />,
    ssr: false
  }),
  "branding": dynamic(() => import("@/components/features/services/branding-client"), {
    loading: () => <LoadingFallback />,
    ssr: false
  }),
  "video-production": dynamic(() => import("@/components/features/services/video-production-client"), {
    loading: () => <LoadingFallback />,
    ssr: false
  }),
  "kol-endorsement": dynamic(() => import("@/components/features/services/kol-endorsement-client"), {
    loading: () => <LoadingFallback />,
    ssr: false
  })
}

export function getServiceClientComponent(slug: string): React.ComponentType<any> | null {
  return serviceClientMap[slug] || null
} 