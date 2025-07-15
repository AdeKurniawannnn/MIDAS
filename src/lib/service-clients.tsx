import dynamic from "next/dynamic"
import { ReactElement } from "react"

const LoadingFallback = (): ReactElement => (
  <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-screen w-full"></div>
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