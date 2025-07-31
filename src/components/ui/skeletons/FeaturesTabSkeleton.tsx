import { Skeleton } from "../skeleton"

export function FeaturesTabSkeleton() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden min-h-[1050px]">
      {/* Background elements skeleton */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header skeleton */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Skeleton className="h-10 md:h-12 w-80 mx-auto mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
        </div>

        <div className="w-full min-h-[800px]">
          {/* Tab navigation skeleton */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 lg:gap-2 p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col py-4 px-2 items-center space-y-2 rounded-lg">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Content area skeleton */}
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0 h-[600px]">
                {/* Left side - content skeleton */}
                <div className="p-8 flex flex-col justify-center space-y-6">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-20" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Right side - visual skeleton */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-8 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-12 right-12 w-24 h-24 bg-primary/5 rounded-full" />
                  <div className="absolute bottom-12 left-12 w-32 h-32 bg-blue-500/5 rounded-full" />
                  <div className="relative z-10 w-full h-full min-h-[300px] rounded-lg bg-gradient-to-br from-primary/10 to-blue-500/10 border border-white/20 dark:border-gray-700/20 shadow-inner flex items-center justify-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}