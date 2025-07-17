"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Play, CheckCircle, XCircle, Archive, Trash2 } from "lucide-react"

interface BulkActionsBarProps {
  selectedCount: number
  onBulkAction: (action: string, scrapingType?: string) => void
}

export function BulkActionsBar({ selectedCount, onBulkAction }: BulkActionsBarProps) {
  const [showScrapeDialog, setShowScrapeDialog] = useState(false)

  const handleScrape = (scrapingType: 'instagram' | 'google_maps') => {
    onBulkAction('scrape', scrapingType)
    setShowScrapeDialog(false)
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
                >
                  <div className="text-lg">📸</div>
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
    </div>
  )
}