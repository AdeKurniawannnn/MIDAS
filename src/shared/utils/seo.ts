import { Metadata } from 'next'
import { services } from '@/lib/data/services'
import type { Service } from '@/lib/types/service'

// Base URL configuration
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://midas-agency.com'

// Default SEO configuration
export const defaultSEO = {
  title: 'MIDAS - Digital Marketing & Technology Solutions Agency',
  description: 'Transform your business with MIDAS digital marketing and technology solutions. Specializing in automation, branding, video production, IT systems, and performance marketing.',
  keywords: [
    'digital marketing agency',
    'technology solutions',
    'business automation',
    'brand development',
    'video production',
    'IT systems',
    'performance marketing',
    'KOL endorsement',
    'marketing strategy',
    'digital transformation'
  ],
  author: 'MIDAS Agency',
  language: 'en',
  domain: 'midas-agency.com'
}

// Generate metadata for the home page
export function generateHomeMetadata(): Metadata {
  return {
    title: defaultSEO.title,
    description: defaultSEO.description,
    keywords: defaultSEO.keywords,
    authors: [{ name: defaultSEO.author }],
    creator: defaultSEO.author,
    publisher: defaultSEO.author,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: baseUrl,
      title: defaultSEO.title,
      description: defaultSEO.description,
      siteName: 'MIDAS Agency',
      images: [
        {
          url: `${baseUrl}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'MIDAS - Digital Marketing & Technology Solutions Agency',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultSEO.title,
      description: defaultSEO.description,
      images: [`${baseUrl}/images/og-image.jpg`],
      creator: '@midasagency',
      site: '@midasagency',
    },
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
      yahoo: 'your-yahoo-verification-code',
    },
    alternates: {
      canonical: baseUrl,
    },
    category: 'Digital Marketing Agency',
  }
}

// Generate metadata for service pages
export function generateServiceMetadata(slug: string): Metadata {
  const service = services[slug]
  
  if (!service) {
    return generateHomeMetadata()
  }

  const title = `${service.title} Services - MIDAS Agency`
  const description = `${service.longDescription || service.description} Professional ${service.title.toLowerCase()} services by MIDAS digital marketing agency.`
  const url = `${baseUrl}/services/${slug}`
  
  return {
    title,
    description,
    keywords: [
      service.title.toLowerCase(),
      ...service.features?.map(f => f.toLowerCase()) || [],
      'digital marketing',
      'MIDAS agency',
      'professional services'
    ],
    authors: [{ name: defaultSEO.author }],
    creator: defaultSEO.author,
    publisher: defaultSEO.author,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title,
      description,
      siteName: 'MIDAS Agency',
      images: [
        {
          url: `${baseUrl}/images/services/${slug}-og.jpg`,
          width: 1200,
          height: 630,
          alt: `${service.title} Services - MIDAS Agency`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/images/services/${slug}-og.jpg`],
      creator: '@midasagency',
      site: '@midasagency',
    },
    alternates: {
      canonical: url,
    },
    category: 'Professional Services',
  }
}

// Generate metadata for case studies pages
export function generateCaseStudyMetadata(id: string, title?: string, description?: string): Metadata {
  const caseTitle = title || 'Case Study'
  const caseDescription = description || 'Discover how MIDAS helped transform businesses with our innovative digital solutions.'
  const metaTitle = `${caseTitle} - Case Study | MIDAS Agency`
  const url = `${baseUrl}/case-studies/${id}`
  
  return {
    title: metaTitle,
    description: caseDescription,
    keywords: [
      'case study',
      'success story',
      'client results',
      'digital transformation',
      'MIDAS agency',
      'business growth'
    ],
    authors: [{ name: defaultSEO.author }],
    creator: defaultSEO.author,
    publisher: defaultSEO.author,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url,
      title: metaTitle,
      description: caseDescription,
      siteName: 'MIDAS Agency',
      images: [
        {
          url: `${baseUrl}/images/case-studies/${id}-og.jpg`,
          width: 1200,
          height: 630,
          alt: `${caseTitle} - MIDAS Case Study`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: caseDescription,
      images: [`${baseUrl}/images/case-studies/${id}-og.jpg`],
      creator: '@midasagency',
      site: '@midasagency',
    },
    alternates: {
      canonical: url,
    },
    category: 'Case Study',
  }
}

// Generate structured data for organization
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MIDAS Agency',
    alternateName: 'MIDAS Digital Marketing Agency',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    image: `${baseUrl}/images/og-image.jpg`,
    description: defaultSEO.description,
    foundingDate: '2020',
    sameAs: [
      'https://www.linkedin.com/company/midas-agency',
      'https://twitter.com/midasagency',
      'https://www.instagram.com/midasagency',
      'https://www.facebook.com/midasagency'
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
      addressLocality: 'Jakarta',
      addressRegion: 'Jakarta',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+62-21-xxxx-xxxx',
      contactType: 'customer service',
      areaServed: 'ID',
      availableLanguage: ['English', 'Indonesian']
    },
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: -6.2088,
        longitude: 106.8456
      },
      geoRadius: 1000000 // 1000km radius
    }
  }
}

// Generate structured data for services
export function generateServiceStructuredData(slug: string) {
  const service = services[slug]
  
  if (!service) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.longDescription || service.description,
    provider: {
      '@type': 'Organization',
      name: 'MIDAS Agency',
      url: baseUrl
    },
    serviceType: service.title,
    category: 'Digital Marketing',
    areaServed: {
      '@type': 'Country',
      name: 'Indonesia'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${service.title} Services`,
      itemListElement: service.features?.map((feature, index) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: feature,
          description: `Professional ${feature.toLowerCase()} services`
        },
        position: index + 1
      })) || []
    }
  }
}

// Generate structured data for case studies/reviews
export function generateReviewStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MIDAS Agency',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1'
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5'
        },
        author: {
          '@type': 'Person',
          name: 'John Smith'
        },
        reviewBody: 'MIDAS transformed our digital presence completely. Their automation solutions saved us countless hours and improved our efficiency dramatically.',
        datePublished: '2024-01-15'
      },
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5'
        },
        author: {
          '@type': 'Person',
          name: 'Sarah Johnson'
        },
        reviewBody: 'Outstanding branding and video production services. The team understood our vision perfectly and delivered beyond expectations.',
        datePublished: '2024-02-20'
      }
    ]
  }
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url
    }))
  }
}

// Generate FAQ structured data
export function generateFAQStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What services does MIDAS Agency offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MIDAS offers comprehensive digital marketing and technology solutions including Digital Automation, IT Systems, Video Production, Branding, Marketing Strategy, KOL Endorsement, and Performance Marketing.'
        }
      },
      {
        '@type': 'Question',
        name: 'How can digital automation help my business?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Digital automation streamlines your operations, reduces manual work, minimizes errors, and increases efficiency. Our solutions can save up to 85% of manual processing time while improving accuracy to over 99%.'
        }
      },
      {
        '@type': 'Question',
        name: 'What makes MIDAS different from other agencies?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MIDAS combines cutting-edge technology with strategic thinking. We focus on measurable results and long-term partnerships, offering both creative solutions and technical expertise under one roof.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do you work with international clients?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, while we are based in Indonesia, we serve clients globally. Our team is experienced in working across different time zones and cultural contexts.'
        }
      }
    ]
  }
}

// SEO utils for canonical URLs
export function getCanonicalUrl(path: string): string {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

// Generate sitemap data
export function generateSitemapData() {
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFreq: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFreq: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/case-studies`, lastModified: new Date(), changeFreq: 'weekly', priority: 0.8 },
  ]

  const servicePages = Object.keys(services).map(slug => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: new Date(),
    changeFreq: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...servicePages]
}