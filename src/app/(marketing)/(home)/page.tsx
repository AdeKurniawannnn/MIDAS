import nextDynamic from "next/dynamic"
import { Suspense } from "react"
import { Layout } from "@/components/layout/Layout"
import { Hero } from "@/components/sections/Hero"
import { Services } from "@/components/sections/Services"
import { Testimonials } from "@/components/sections/Testimonials"
import { CTA } from "@/components/sections/CTA"
import { ClientShowcase } from "@/components/sections/ClientShowcase"
import { StructuredData } from "@/components/shared/seo/StructuredData"
import { ErrorBoundary } from "@/components/sections/ErrorBoundary"
import { LazySection } from "@/components/ui/LazySection"
import { 
  ParallaxSectionSkeleton,
  FeaturesTabSkeleton,
  PortfolioSkeleton
} from "@/components/ui/skeletons"
import { 
  generateHomeMetadata,
  generateOrganizationStructuredData,
  generateReviewStructuredData,
  generateFAQStructuredData
} from "@/lib/utils/seo"

// Dynamic imports with optimized loading strategies
const ParallaxSection = nextDynamic(
  () => import("@/components/sections/ParallaxSection").then(mod => ({ default: mod.ParallaxSection })),
  { 
    ssr: false, // Client-side only for animations
    loading: () => <ParallaxSectionSkeleton />
  }
)

const FeaturesTab = nextDynamic(
  () => import("@/components/sections/FeaturesTab").then(mod => ({ default: mod.FeaturesTab }))
)

const Portfolio = nextDynamic(
  () => import("@/components/sections/Portfolio").then(mod => ({ default: mod.Portfolio })),
  {
    loading: () => <PortfolioSkeleton />
  }
)

// Force dynamic rendering untuk mengatasi masalah environment variables  
export const dynamic = 'force-dynamic'

// Generate metadata for SEO
export async function generateMetadata() {
  return generateHomeMetadata()
}

export default function Home() {
  // Generate structured data for the home page
  const organizationData = generateOrganizationStructuredData()
  const reviewData = generateReviewStructuredData()
  const faqData = generateFAQStructuredData()

  return (
    <Layout>
      <StructuredData data={[organizationData, reviewData, faqData]} />
      <ErrorBoundary>
        <Hero />
      </ErrorBoundary>
      <ErrorBoundary>
        <ClientShowcase />
      </ErrorBoundary>
      <ErrorBoundary>
        <Services />
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<ParallaxSectionSkeleton />}>
          <ParallaxSection />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <LazySection fallback={<FeaturesTabSkeleton />} rootMargin="300px">
          <Suspense fallback={<FeaturesTabSkeleton />}>
            <FeaturesTab />
          </Suspense>
        </LazySection>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<PortfolioSkeleton />}>
          <Portfolio />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Testimonials />
      </ErrorBoundary>
      <ErrorBoundary>
        <CTA />
      </ErrorBoundary>
    </Layout>
  )
}
