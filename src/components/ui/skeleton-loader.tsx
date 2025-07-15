import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true, 
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} className="h-6 w-full" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={`row-${rowIndex}`}
            className="grid gap-4" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`} 
                className="h-10 w-full" 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface FormSkeletonProps {
  fields?: number
  showTitle?: boolean
  showButtons?: boolean
  className?: string
}

export function FormSkeleton({ 
  fields = 4, 
  showTitle = true, 
  showButtons = true, 
  className 
}: FormSkeletonProps) {
  return (
    <div className={cn("w-full space-y-6", className)}>
      {showTitle && <Skeleton className="h-8 w-1/3" />}
      
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={`field-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      {showButtons && (
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  )
}

interface CardSkeletonProps {
  showImage?: boolean
  showTitle?: boolean
  showDescription?: boolean
  showActions?: boolean
  className?: string
}

export function CardSkeleton({ 
  showImage = true, 
  showTitle = true, 
  showDescription = true, 
  showActions = true,
  className 
}: CardSkeletonProps) {
  return (
    <div className={cn("space-y-4 p-6 border border-border rounded-lg", className)}>
      {showImage && <Skeleton className="h-48 w-full" />}
      
      <div className="space-y-2">
        {showTitle && <Skeleton className="h-6 w-3/4" />}
        {showDescription && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </div>
      
      {showActions && (
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      )}
    </div>
  )
}

interface ListSkeletonProps {
  items?: number
  showAvatar?: boolean
  showMetadata?: boolean
  className?: string
}

export function ListSkeleton({ 
  items = 5, 
  showAvatar = true, 
  showMetadata = true,
  className 
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={`item-${index}`} className="flex items-center space-x-4">
          {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
          
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            {showMetadata && <Skeleton className="h-3 w-1/3" />}
          </div>
          
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
}

interface SearchSkeletonProps {
  showFilters?: boolean
  showSorting?: boolean
  className?: string
}

export function SearchSkeleton({ 
  showFilters = true, 
  showSorting = true,
  className 
}: SearchSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      {(showFilters || showSorting) && (
        <div className="flex items-center space-x-4">
          {showFilters && (
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-18" />
            </div>
          )}
          
          {showSorting && <Skeleton className="h-8 w-32 ml-auto" />}
        </div>
      )}
    </div>
  )
}

interface DashboardSkeletonProps {
  showStats?: boolean
  showChart?: boolean
  showTable?: boolean
  className?: string
}

export function DashboardSkeleton({ 
  showStats = true, 
  showChart = true, 
  showTable = true,
  className 
}: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`stat-${index}`} className="p-6 border border-border rounded-lg space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}
      
      {showChart && (
        <div className="p-6 border border-border rounded-lg">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      
      {showTable && (
        <div className="p-6 border border-border rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-32" />
          </div>
          <TableSkeleton rows={6} columns={5} />
        </div>
      )}
    </div>
  )
}