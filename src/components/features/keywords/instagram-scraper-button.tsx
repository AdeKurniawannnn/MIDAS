"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { useInstagramScraper } from "@/hooks/useInstagramScraper"
import { Keyword } from "@/lib/types/keywords"
import { 
  Instagram, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Pause,
  Info
} from "lucide-react"

interface InstagramScraperButtonProps {
  keyword: Keyword
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
  className?: string
  showProgress?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function InstagramScraperButton({
  keyword,
  size = "sm",
  variant = "outline",
  className = "",
  showProgress = false,
  onSuccess,
  onError
}: InstagramScraperButtonProps) {
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  
  const { 
    scrapeKeyword, 
    isLoading, 
    progress, 
    isAuthenticated 
  } = useInstagramScraper({
    maxResults: 10, // Default to 10 results for individual scraping
    onSuccess: (data) => {
      onSuccess?.(data)
      if (showProgress) {
        // Keep dialog open for 2 seconds to show success
        setTimeout(() => setShowProgressDialog(false), 2000)
      }
    },
    onError: (error) => {
      onError?.(error)
      if (showProgress) {
        // Keep dialog open for 3 seconds to show error
        setTimeout(() => setShowProgressDialog(false), 3000)
      }
    }
  })

  const handleScrapeClick = async () => {
    if (showProgress) {
      setShowProgressDialog(true)
    }
    await scrapeKeyword(keyword.keyword)
  }

  const getButtonIcon = () => {
    switch (progress.status) {
      case 'initializing':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Instagram className="h-4 w-4" />
    }
  }

  const getButtonVariant = () => {
    if (progress.status === 'completed') return 'default'
    if (progress.status === 'error') return 'destructive'
    return variant
  }

  const getTooltipText = () => {
    if (!isAuthenticated) return "Login required to scrape Instagram"
    if (isLoading) return `Scraping "${keyword.keyword}"...`
    if (progress.status === 'completed') return "Scraping completed successfully"
    if (progress.status === 'error') return "Scraping failed - click to retry"
    return `Scrape Instagram data for "${keyword.keyword}"`
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant() as any}
              size={size}
              onClick={handleScrapeClick}
              disabled={!isAuthenticated || isLoading}
              className={`${className} transition-all duration-200`}
              aria-label={`Scrape Instagram data for ${keyword.keyword}`}
            >
              {getButtonIcon()}
              {size !== "sm" && (
                <span className="ml-2">
                  {isLoading ? "Scraping..." : "Scrape"}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Progress Dialog */}
      {showProgress && (
        <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Instagram Scraping
              </DialogTitle>
              <DialogDescription>
                Scraping data for keyword: <strong>&quot;{keyword.keyword}&quot;</strong>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span>{Math.round(progress.progress)}%</span>
                </div>
                <Progress 
                  value={progress.progress} 
                  className="h-2"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {getButtonIcon()}
                <span className="text-sm font-medium">{progress.currentStep}</span>
              </div>

              {/* Items Progress */}
              {progress.totalItems > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Items processed:</span>
                  <span>{progress.processedItems}/{progress.totalItems}</span>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex justify-center">
                {progress.status === 'completed' && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {progress.status === 'error' && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                )}
                {(progress.status === 'processing' || progress.status === 'initializing') && (
                  <Badge variant="secondary">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Processing
                  </Badge>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-blue-700">
                  <p className="font-medium">About Instagram Scraping</p>
                  <p className="text-xs mt-1">
                    This will search Instagram for posts, hashtags, and profiles related to your keyword using our Apify integration.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}