import { Skeleton } from "../skeleton"

export function ParallaxSectionSkeleton() {
  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-black/70 z-10" />
      
      {/* Skeleton background circles */}
      <div className="absolute w-96 h-96 rounded-full bg-primary/20 blur-3xl top-10 left-20 -z-10" />
      <div className="absolute w-64 h-64 rounded-full bg-blue-500/20 blur-3xl bottom-20 right-20 -z-10" />
      <div className="absolute w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl bottom-40 left-40 -z-10" />
      
      {/* Content skeleton */}
      <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
        <Skeleton className="h-12 md:h-16 w-full max-w-2xl mx-auto mb-6" />
        <Skeleton className="h-6 md:h-8 w-full max-w-3xl mx-auto mb-8" />
        <Skeleton className="h-12 w-40 mx-auto" />
      </div>
      
      {/* Floating elements skeletons */}
      <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-primary rounded-full opacity-50" />
      <div className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-blue-500 rounded-full opacity-50" />
      <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-yellow-500 rounded-full opacity-50" />
    </section>
  )
}