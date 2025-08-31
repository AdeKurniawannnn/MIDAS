import React, { memo } from 'react'
import Image, { StaticImageData } from 'next/image'
import Link from 'next/link'
import { CaseStudy as CaseStudyType } from '@/lib/types/work'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, CheckCircle2, Target, Users, BarChart3, Lightbulb } from 'lucide-react'
import { ResponsiveImage, BackgroundImage } from '@/components/shared/image'

interface CaseStudyProps {
  caseStudy: CaseStudyType
  isPreview?: boolean
  priority?: boolean // For image loading priority
}

// Optimized image path resolver
const getOptimizedImagePath = (imageId: string, thumbnail: string | StaticImageData): string => {
  const imageMap: Record<string, string> = {
    'branding': '/images/branding.jpg',
    'onlineMarketplace': '/images/online marketplace.jpg',
    'videoProduction': '/images/video production.jpg',
    'digital-transformation': '/images/case-studies/digital-transformation-thumb.jpg',
    'ecommerce-automation': '/images/case-studies/ecommerce-automation-thumb.jpg',
    'marketing-campaign': '/images/case-studies/marketing-campaign-thumb.jpg'
  }
  
  // If thumbnail is StaticImageData, use its src property
  const thumbnailPath = typeof thumbnail === 'string' ? thumbnail : thumbnail.src
  
  return imageMap[imageId] || thumbnailPath
}

// Memoized preview component for better performance
const CaseStudyPreview = memo(({ caseStudy, priority = false }: { caseStudy: CaseStudyType, priority?: boolean }) => {
  const displayCategory = caseStudy.category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const imagePath = getOptimizedImagePath(caseStudy.imageId || '', caseStudy.thumbnail)

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative h-60 w-full overflow-hidden">
        <ResponsiveImage
          src={imagePath}
          alt={caseStudy.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge className="absolute left-4 top-4 bg-primary/90 backdrop-blur-sm">
          {displayCategory}
        </Badge>
      </div>
      <CardContent className="p-6">
        <h3 className="mb-2 text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
          {caseStudy.title}
        </h3>
        <p className="mb-4 text-muted-foreground line-clamp-2">
          {caseStudy.description}
        </p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3">
            {caseStudy.results.slice(0, 2).map((result, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-bold text-primary">{result.value}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{result.metric}</div>
              </div>
            ))}
          </div>
        </div>
        <Button asChild variant="outline" className="gap-2 w-full group-hover:bg-primary group-hover:text-white transition-all">
          <Link href={`/case-studies/${caseStudy.id}`}>
            View Case Study <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
})

CaseStudyPreview.displayName = 'CaseStudyPreview'

export const CaseStudy = memo(({ caseStudy, isPreview = false, priority = false }: CaseStudyProps & { priority?: boolean }) => {
  const {
    id,
    title,
    category,
    description,
    thumbnail,
    images,
    background,
    challenge,
    objectives,
    approach,
    process,
    deliverables,
    results,
    clientName,
    clientLogo,
    imageId = '',
  } = caseStudy

  // Convert category to display format (e.g., 'digital-automation' -> 'Digital Automation')
  const displayCategory = category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Early return for preview mode with optimized preview component
  if (isPreview) {
    return <CaseStudyPreview caseStudy={caseStudy} priority={priority} />
  }

  const imagePath = getOptimizedImagePath(imageId, thumbnail)

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative flex min-h-[50vh] w-full items-center overflow-hidden rounded-xl">
        <BackgroundImage
          src={imagePath}
          alt={title}
          overlay
          overlayColor="black"
          overlayOpacity={50}
          className="absolute inset-0"
          priority
        >
          <div className="container relative z-10 px-4 py-20 text-white">
            <Badge className="mb-4 bg-primary">{displayCategory}</Badge>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">{title}</h1>
            <p className="mb-6 max-w-2xl text-lg text-gray-200">{description}</p>
            {clientLogo && (
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white p-2">
                  <Image src={clientLogo} alt={clientName} fill className="object-contain" />
                </div>
                <p className="font-medium">{clientName}</p>
              </div>
            )}
          </div>
        </BackgroundImage>
      </section>

      <div className="container px-4">
        <div className="mx-auto max-w-4xl space-y-16">
          {/* Background Section */}
          <section>
            <h2 className="mb-6 text-3xl font-bold">Background</h2>
            <p className="text-lg text-muted-foreground">{background}</p>
          </section>

          {/* Challenge Section */}
          <section>
            <h2 className="mb-6 text-3xl font-bold">The Challenge</h2>
            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex gap-4">
                <Users className="h-8 w-8 flex-shrink-0 text-primary" />
                <p className="text-lg">{challenge}</p>
              </div>
            </div>
          </section>

          {/* Objectives Section */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold">
              <Target className="h-7 w-7 text-primary" /> Objectives
            </h2>
            <ul className="space-y-4">
              {objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <p>{objective}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Approach Section */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold">
              <Lightbulb className="h-7 w-7 text-primary" /> Our Approach
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">{approach}</p>

            {/* Process Steps */}
            <div className="space-y-6">
              {process.map((step, index) => (
                <div key={index} className="rounded-lg border p-6">
                  <h3 className="mb-2 text-xl font-semibold">
                    <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {index + 1}
                    </span>
                    {step.phase}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Gallery Section */}
          <section>
            <h2 className="mb-6 text-3xl font-bold">Project Gallery</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative aspect-video overflow-hidden rounded-lg">
                  <ResponsiveImage 
                    src={image} 
                    alt={`${title} - Image ${index + 1}`} 
                    fill 
                    className="object-cover" 
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Deliverables Section */}
          <section>
            <h2 className="mb-6 text-3xl font-bold">Deliverables</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {deliverables.map((deliverable, index) => (
                <li key={index} className="flex items-start gap-3 rounded-lg border p-4">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{deliverable}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Results Section */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold">
              <BarChart3 className="h-7 w-7 text-primary" /> Results
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {results.map((result, index) => (
                <div key={index} className="rounded-lg border bg-card p-6 text-center">
                  <p className="text-4xl font-bold text-primary">{result.value}</p>
                  <p className="text-sm text-muted-foreground">{result.metric}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="rounded-lg bg-muted p-8 text-center">
            <h2 className="text-2xl font-bold">Need similar results for your business?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Let&apos;s discuss how we can help you achieve your business goals through our comprehensive digital solutions.
            </p>
            <Button size="lg" className="mt-6 gap-2">
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
})

CaseStudy.displayName = 'CaseStudy'

export { CaseStudyPreview }
