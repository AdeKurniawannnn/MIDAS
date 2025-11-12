"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useInstagramScraper } from "@/hooks/useInstagramScraper"
import { Play, CheckCircle, XCircle, Archive, Trash2, Instagram, Loader2, AlertCircle } from "lucide-react"

interface BulkActionsBarProps {
  selectedCount: number
  selectedKeywords?: string[]
  onBulkAction: (action: string, scrapingType?: string) => void
}

export function BulkActionsBar({ selectedCount, selectedKeywords = [], onBulkAction }: BulkActionsBarProps) {
  const [showScrapeDialog, setShowScrapeDialog] = useState(false)
  const [showInstagramProgress, setShowInstagramProgress] = useState(false)

  const { 
    scrapeBulkKeywords, 
    isLoading: isInstagramScraping, 
    progress: instagramProgress 
  } = useInstagramScraper({
    maxResults: 10,
    onSuccess: (data) => {
      setTimeout(() => setShowInstagramProgress(false), 3000)
    },
    onError: (error) => {
      setTimeout(() => setShowInstagramProgress(false), 5000)
    }
  })

  const handleScrape = (scrapingType: 'instagram' | 'google_maps') => {
    if (scrapingType === 'instagram') {
      setShowScrapeDialog(false)
      setShowInstagramProgress(true)
      scrapeBulkKeywords(selectedKeywords)
    } else {
      onBulkAction('scrape', scrapingType)
      setShowScrapeDialog(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
      <div className="flex items-center space-x-2">
        <Badge variant="secondary">
          {selectedCount} selected
        </Badge>
        <span className="text-sm text-muted-foreground">
          Choose an action to apply to selected keywords
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Scrape Action */}
        <Dialog open={showScrapeDialog} onOpenChange={setShowScrapeDialog}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Play className="h-4 w-4 mr-2" />
              Scrape
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Scraping</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose the platform to scrape for the selected {selectedCount} keywords:
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleScrape('instagram')}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  disabled={isInstagramScraping}
                >
                  <Instagram className="h-6 w-6" />
                  <span>Instagram</span>
                </Button>
                
                <Button
                  onClick={() => handleScrape('google_maps')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <div className="text-lg">🗺️</div>
                  <span>Google Maps</span>
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This will create scraping jobs for all selected keywords. 
                You can monitor the progress in the jobs section.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Actions */}
        <Button
          variant="outline"
          onClick={() => onBulkAction('activate')}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Activate
        </Button>
        
        <Button
          variant="outline"
          onClick={() => onBulkAction('deactivate')}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Deactivate
        </Button>
        
        <Button
          variant="outline"
          onClick={() => onBulkAction('archive')}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => onBulkAction('delete')}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Instagram Bulk Scraping Progress Dialog */}
      <Dialog open={showInstagramProgress} onOpenChange={setShowInstagramProgress}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Bulk Instagram Scraping
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>{Math.round(instagramProgress.progress)}%</span>
              </div>
              <Progress 
                value={instagramProgress.progress} 
                className="h-2"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {instagramProgress.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
              {instagramProgress.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {instagramProgress.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm font-medium">{instagramProgress.currentStep}</span>
            </div>

            {/* Items Progress */}
            {instagramProgress.totalItems > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Keywords processed:</span>
                <span>{instagramProgress.processedItems}/{instagramProgress.totalItems}</span>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex justify-center">
              {instagramProgress.status === 'completed' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {instagramProgress.status === 'error' && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
              )}
              {(instagramProgress.status === 'processing' || instagramProgress.status === 'initializing') && (
                <Badge variant="secondary">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}