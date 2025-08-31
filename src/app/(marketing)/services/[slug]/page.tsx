import { notFound } from "next/navigation"
import { services } from "@/features/services/api/services"
import { type ServicePageProps } from "@/features/services/types"
import { getServiceClientComponent } from "@/features/services/components/service-clients"
import { serializeServiceForClient } from "@/shared/utils/service-utils"
import { ServiceHeader, ServiceFeatures, ServiceBenefits, ServiceProcess } from "@/features/services"
import { StructuredData } from "@/components/shared/seo/StructuredData"
import { 
  generateServiceMetadata,
  generateServiceStructuredData,
  generateBreadcrumbStructuredData,
  generateOrganizationStructuredData
} from "@/lib/utils/seo"

// Force dynamic rendering untuk mengatasi masalah environment variables
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return Object.keys(services).map((slug) => ({
    slug,
  }))
}

// Generate metadata for service pages
export async function generateMetadata({ params }: ServicePageProps) {
  return generateServiceMetadata(params.slug)
}

export default function ServicePage({ params }: ServicePageProps) {
  const service = services[params.slug]

  if (!service) {
    notFound()
  }

  // Generate structured data for this service
  const serviceStructuredData = generateServiceStructuredData(params.slug)
  const organizationData = generateOrganizationStructuredData()
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Home', url: 'https://midas-agency.com' },
    { name: 'Services', url: 'https://midas-agency.com/services' },
    { name: service.title, url: `https://midas-agency.com/services/${params.slug}` }
  ])

  // Get client component for this service
  const ClientComponent = getServiceClientComponent(params.slug)

  // If a specific client component exists for this slug, render it
  if (ClientComponent) {
    // Ensure we're only passing serializable data to client component
    const serializedService = serializeServiceForClient(service)
    
    return (
      <>
        <StructuredData data={[serviceStructuredData, organizationData, breadcrumbData].filter(Boolean)} />
        <ClientComponent service={serializedService} />
      </>
    )
  }

  // Otherwise, fall back to the default static page
  return (
    <>
      <StructuredData data={[serviceStructuredData, organizationData, breadcrumbData].filter(Boolean)} />
      <div className="container mx-auto py-20 px-4">
        <ServiceHeader service={service} />
        
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {service.features && <ServiceFeatures features={service.features} />}
          {service.benefits && <ServiceBenefits benefits={service.benefits} />}
        </div>
        
        {service.process && <ServiceProcess process={service.process} />}
      </div>
    </>
  )
} 