import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { Layout } from "@/components/layout/Layout"
import { StructuredData } from "@/components/shared/seo/StructuredData"
import { CaseStudy } from "@/components/shared/work/CaseStudy"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Search, Filter, ChevronDown } from "lucide-react"
import { 
  generateOrganizationStructuredData,
  generateBreadcrumbStructuredData
} from "@/lib/utils/seo"
import { caseStudies } from "@/lib/data/case-studies"
import { generateAriaLabels } from "@/lib/utils/accessibility"
import { Metadata } from 'next'

// Optimized for static generation
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

// Enhanced metadata for case studies page
export const metadata: Metadata = {
  title: 'Case Studies - MIDAS Agency Success Stories | Real Client Results',
  description: 'Discover how MIDAS helped businesses achieve remarkable results through digital transformation, automation, and strategic marketing solutions. Real success stories with measurable outcomes.',
  keywords: [
    'case studies',
    'success stories',
    'client results',
    'digital transformation',
    'marketing automation',
    'business growth',
    'ROI improvement',
    'MIDAS agency',
    'client testimonials',
    'project outcomes'
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Case Studies - MIDAS Agency',
    description: 'Real success stories from our clients who transformed their businesses with MIDAS solutions.',
    type: 'website',
    url: 'https://midas-agency.com/case-studies',
    images: [{
      url: '/images/case-studies/case-studies-og.jpg',
      width: 1200,
      height: 630,
      alt: 'MIDAS Agency Case Studies'
    }]
  },
  alternates: {
    canonical: 'https://midas-agency.com/case-studies',
  },
  other: {
    'theme-color': '#000000'
  }
}

// Loading skeleton component
function CaseStudySkeleton() {
  return (
    <Card className="overflow-hidden" aria-label="Loading case study">
      <Skeleton className="h-60 w-full" />
      <CardContent className="p-6">
        <Skeleton className="h-6 w-24 mb-2" aria-label="Loading category" />
        <Skeleton className="h-8 w-full mb-2" aria-label="Loading title" />
        <Skeleton className="h-4 w-full mb-4" aria-label="Loading description" />
        <Skeleton className="h-10 w-32" aria-label="Loading action button" />
      </CardContent>
    </Card>
  )
}

// Enhanced case study preview component with accessibility
function CaseStudyPreview({ caseStudy, index }: { caseStudy: typeof caseStudies[0], index: number }) {
  const displayCategory = caseStudy.category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const motionClasses = 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1'

  return (
    <article>
      <Card className={`group overflow-hidden ${motionClasses}`}>
        <div className="relative h-60 w-full overflow-hidden">
          <Image
            src={caseStudy.thumbnail}
            alt={`Case study thumbnail: ${caseStudy.title} showcasing ${displayCategory} solutions`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={index < 3}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge 
            className="absolute left-4 top-4 bg-primary/90 backdrop-blur-sm"
            aria-label={`Category: ${displayCategory}`}
          >
            {displayCategory}
          </Badge>
        </div>
        <CardContent className="p-6">
          <h3 className="mb-2 text-xl font-bold group-hover:text-primary transition-colors">
            {caseStudy.title}
          </h3>
          <p className="mb-4 text-muted-foreground line-clamp-2">
            {caseStudy.description}
          </p>
          <div className="flex items-center justify-between" role="group" aria-label="Case study metrics and action">
            <div className="flex gap-2" role="list" aria-label="Key results">
              {caseStudy.results.slice(0, 2).map((result, resultIndex) => (
                <div 
                  key={resultIndex} 
                  className="text-center" 
                  role="listitem"
                  aria-label={generateAriaLabels.resultMetric(result.value, result.metric)}
                >
                  <div className="text-lg font-bold text-primary" aria-hidden="true">{result.value}</div>
                  <div className="text-xs text-muted-foreground" aria-hidden="true">{result.metric}</div>
                </div>
              ))}
            </div>
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className="gap-2 min-h-[44px] group-hover:bg-primary group-hover:text-white transition-all"
              aria-label={generateAriaLabels.caseStudyCard(caseStudy.title, displayCategory)}
            >
              <Link href={`/case-studies/${caseStudy.id}`}>
                <span className="sr-only">Read full case study: </span>
                View Study <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}

export default function CaseStudiesPage() {
  // Generate structured data for case studies page
  const organizationData = generateOrganizationStructuredData()
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Home', url: 'https://midas-agency.com' },
    { name: 'Case Studies', url: 'https://midas-agency.com/case-studies' }
  ])

  // Enhanced case studies catalog structured data
  const caseStudiesCatalogData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MIDAS Agency Case Studies',
    description: 'Comprehensive success stories and client transformations showcasing measurable business outcomes',
    numberOfItems: caseStudies.length,
    itemListElement: caseStudies.map((study, index) => ({
      '@type': 'Article',
      position: index + 1,
      name: study.title,
      description: study.description,
      url: `https://midas-agency.com/case-studies/${study.id}`,
      image: study.thumbnail,
      datePublished: '2024-01-01',
      dateModified: '2024-12-01',
      author: {
        '@type': 'Organization',
        name: 'MIDAS Agency'
      },
      publisher: {
        '@type': 'Organization',
        name: 'MIDAS Agency',
        logo: {
          '@type': 'ImageObject',
          url: 'https://midas-agency.com/logo.png'
        }
      }
    }))
  }

  // Get unique categories for filtering
  const categories = Array.from(new Set(caseStudies.map(study => study.category)))

  return (
    <Layout>
      <StructuredData data={[organizationData, breadcrumbData, caseStudiesCatalogData]} />
      
      {/* Enhanced Hero Section with Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded focus:min-h-[44px] focus:flex focus:items-center"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-20" aria-labelledby="hero-heading">
        <div className="container mx-auto px-4 text-center">
          <h1 
            id="hero-heading"
            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
          >
            Success Stories
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover how MIDAS transformed businesses across industries through innovative digital solutions, 
            automation, and strategic marketing. Real results, measurable outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" role="list" aria-label="Key statistics">
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="listitem">
              <span className="h-2 w-2 bg-green-500 rounded-full" aria-hidden="true"></span>
              <span aria-label="{caseStudies.length} success stories available">
                {caseStudies.length} Success Stories
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="listitem">
              <span className="h-2 w-2 bg-blue-500 rounded-full" aria-hidden="true"></span>
              <span>Proven ROI Results</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="listitem">
              <span className="h-2 w-2 bg-purple-500 rounded-full" aria-hidden="true"></span>
              <span>Multiple Industries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Filter Section */}
      <section className="py-8 border-b" aria-labelledby="filter-heading">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span id="filter-heading">Filter by category:</span>
            </div>
            <div 
              className="flex flex-wrap gap-2" 
              role="group" 
              aria-labelledby="filter-heading"
              aria-describedby="filter-description"
            >
              <div id="filter-description" className="sr-only">
                Use these buttons to filter case studies by category. Currently showing all case studies.
              </div>
              <Badge 
                variant="outline" 
                className="cursor-pointer min-h-[44px] flex items-center hover:bg-primary hover:text-white transition-colors"
                role="button"
                tabIndex={0}
                aria-label={generateAriaLabels.filterButton('all categories', caseStudies.length)}
              >
                All ({caseStudies.length})
              </Badge>
              {categories.map(category => {
                const count = caseStudies.filter(study => study.category === category).length
                const displayName = category.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
                return (
                  <Badge 
                    key={category} 
                    variant="outline" 
                    className="cursor-pointer min-h-[44px] flex items-center hover:bg-primary hover:text-white transition-colors"
                    role="button"
                    tabIndex={0}
                    aria-label={generateAriaLabels.filterButton(displayName, count)}
                  >
                    {displayName} ({count})
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Case Studies Grid */}
      <main id="main-content" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="sr-only">Case Studies Grid</h2>
          <Suspense fallback={
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              aria-label="Loading case studies"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <CaseStudySkeleton key={index} />
              ))}
            </div>
          }>
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              role="grid"
              aria-label={`${caseStudies.length} case studies`}
            >
              {caseStudies.map((study, index) => (
                <div key={study.id} role="gridcell">
                  <CaseStudyPreview caseStudy={study} index={index} />
                </div>
              ))}
            </div>
          </Suspense>
        </div>
      </main>

      {/* Enhanced CTA Section */}
      <section className="bg-muted py-16" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 text-center">
          <h2 id="cta-heading" className="text-3xl font-bold mb-4">
            Ready to Create Your Success Story?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our growing list of successful clients who have transformed their businesses 
            with MIDAS innovative solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center" role="group" aria-label="Call to action buttons">
            <Button 
              size="lg" 
              asChild 
              className="gap-2 min-h-[48px] transition-all"
            >
              <Link 
                href="/contact"
                aria-label={generateAriaLabels.navigationLink('contact us to start your project')}
              >
                Start Your Project <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="gap-2 min-h-[48px] transition-all"
            >
              <Link 
                href="/services"
                aria-label={generateAriaLabels.navigationLink('services page to explore our offerings')}
              >
                Explore Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  )
} 