"use client"

import { useState } from "react"
import { ScrapingForm } from "@/components/features/orion/scraping-form"
import { InstagramTable } from "@/components/features/orion/instagram-table"
import { GoogleMapsTable } from "@/components/features/orion/google-maps-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Plus, Database } from "lucide-react"

// Interface for Instagram scraping data
interface DataScrapingInstagram {
  id: number
  inputUrl: string
  username: string | null
  followersCount: string | null
  followsCount: string | null
  biography: string | null
  postsCount: string | null
  highlightReelCount: string | null
  igtvVideoCount: string | null
  latestPostsTotal: string | null
  latestPostsLikes: string | null
  latestPostsComments: string | null
  Url: string | null
  User_Id: string | null
  gmail: string | null
}

// Interface for Google Maps scraping data
interface GoogleMapsData {
  id: number
  inputUrl: string
  placeName: string | null
  address: string | null
  phoneNumber: string | null
  website: string | null
  rating: string | null
  reviewCount: string | null
  category: string | null
  hours: string | null
  description: string | null
  coordinates: string | null
  imageUrl: string | null
  priceRange: string | null
  User_Id: string | null
  gmail: string | null
  createdAt: string
}

interface OrionClientProps {
  instagramData: DataScrapingInstagram[]
  googleMapsData: GoogleMapsData[]
}

export function OrionClient({ instagramData, googleMapsData }: OrionClientProps) {
  const [showScrapingPanel, setShowScrapingPanel] = useState(false)
  const [scrapingType, setScrapingType] = useState<"instagram" | "google-maps">("instagram")

  return (
    <div className="space-y-4">
      <Tabs defaultValue="instagram" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="google-maps">Google Maps</TabsTrigger>
          </TabsList>
          <Button 
            onClick={() => setShowScrapingPanel(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Scraping
          </Button>
        </div>
        
        <TabsContent value="instagram" className="space-y-4">
          <div className="max-h-96 overflow-y-auto rounded-lg border bg-card p-2 shadow-sm w-full">
            <InstagramTable data={instagramData} />
          </div>
        </TabsContent>
        
        <TabsContent value="google-maps" className="space-y-4">
          <div className="max-h-96 overflow-y-auto rounded-lg border bg-card p-2 shadow-sm w-full">
            <GoogleMapsTable data={googleMapsData} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Slide-out Scraping Panel */}
      <Sheet open={showScrapingPanel} onOpenChange={setShowScrapingPanel}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Scraping Tool
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <Tabs 
              defaultValue="instagram" 
              value={scrapingType}
              onValueChange={(value) => setScrapingType(value as "instagram" | "google-maps")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="google-maps">Google Maps</TabsTrigger>
              </TabsList>
              
              <TabsContent value="instagram" className="mt-4">
                <ScrapingForm 
                  scrapingType="instagram" 
                  onSuccess={() => {
                    // Refresh the page to show new data
                    window.location.reload()
                  }}
                />
              </TabsContent>
              
              <TabsContent value="google-maps" className="mt-4">
                <ScrapingForm 
                  scrapingType="google-maps"
                  onSuccess={() => {
                    // Refresh the page to show new data
                    window.location.reload()
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Action Button (Alternative trigger) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setShowScrapingPanel(true)}
          size="lg"
          className="rounded-full shadow-lg"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}