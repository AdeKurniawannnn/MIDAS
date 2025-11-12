import { Skeleton } from "../skeleton"
import { CardSkeleton } from "../skeleton-loader"

export function PortfolioSkeleton() {
  return (
    <section id="portfolio" className="py-20" aria-label="Portfolio showcase section">
      <div className="container mx-auto px-4">
        {/* Header skeleton */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Skeleton className="h-10 md:h-12 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
        </div>

        {/* Portfolio grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" role="list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} role="listitem">
              <CardSkeleton 
                showImage={true}
                showTitle={true} 
                showDescription={true}
                showActions={true}
                className="h-full"
              />
            </div>
          ))}
        </div>

        {/* CTA button skeleton */}
        <div className="text-center mt-12">
          <Skeleton className="h-12 w-48 mx-auto" />
        </div>
      </div>
    </section>
  )
}