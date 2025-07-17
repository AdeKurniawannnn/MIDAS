"use client"

import { useState } from "react"
import { ScrapingForm } from "@/components/features/orion/scraping-form"
import { InstagramTable } from "@/components/features/orion/instagram-table"
import { GoogleMapsTable } from "@/components/features/orion/google-maps-table"
import { ResizableSidebar } from "@/components/features/orion/resizable-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SimpleRippleButton } from "@/components/ui/simple-ripple-button"
import { Plus, Database, Zap, Settings } from "lucide-react"
import { useAuth } from "@/lib/providers/AuthProvider"

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

interface EnhancedOrionClientProps {
  instagramData: DataScrapingInstagram[]
  googleMapsData: GoogleMapsData[]
}

export function EnhancedOrionClient({ instagramData, googleMapsData }: EnhancedOrionClientProps) {
  const [showScrapingPanel, setShowScrapingPanel] = useState(false)
  const [activeTab, setActiveTab] = useState<"instagram" | "google-maps">("instagram")
  const [scrapingType, setScrapingType] = useState<"instagram" | "google-maps">("instagram")
  const { user } = useAuth()

  // Filter data berdasarkan email user
  const userEmail = user?.email || ""
  const filteredInstagramData = instagramData.filter((item) => item.gmail === userEmail)
  const filteredGoogleMapsData = googleMapsData.filter((item) => item.gmail === userEmail)

  const handleTabChange = (value: string) => {
    setActiveTab(value as "instagram" | "google-maps")
    setScrapingType(value as "instagram" | "google-maps")
  }

  const handleOpenScraping = (type?: "instagram" | "google-maps") => {
    if (type) {
      setScrapingType(type)
    }
    setShowScrapingPanel(true)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md h-11">
              <TabsTrigger value="instagram" className="text-sm sm:text-base font-medium">
                Instagram
              </TabsTrigger>
              <TabsTrigger value="google-maps" className="text-sm sm:text-base font-medium">
                Google Maps
              </TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              {activeTab === "instagram" 
                ? `${filteredInstagramData.length} Instagram records`
                : `${filteredGoogleMapsData.length} Google Maps records`
              }
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <SimpleRippleButton 
              variant="outline"
              size="default"
              rippleColor="blue"
              onClick={() => handleOpenScraping(activeTab)}
              className="flex items-center gap-2 h-10 sm:h-11 border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 hover:scale-105 transition-all duration-150 text-sm sm:text-base transform-gpu"
            >
              <Plus className="h-4 w-4 transition-transform duration-150 group-active:rotate-90" />
              <span className="hidden sm:inline">New {activeTab === "instagram" ? "Instagram" : "Google Maps"} Scraping</span>
              <span className="sm:hidden">New</span>
            </SimpleRippleButton>
            
            <SimpleRippleButton 
              onClick={() => handleOpenScraping()}
              size="default"
              rippleColor="white"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-semibold shadow-lg hover:shadow-xl active:shadow-md active:scale-95 hover:scale-105 transition-all duration-150 h-10 sm:h-11 text-sm sm:text-base transform-gpu"
            >
              <Zap className="h-4 w-4 mr-2 transition-transform duration-150 hover:scale-110" />
              <span className="hidden sm:inline">Quick Scrape</span>
              <span className="sm:hidden">Scrape</span>
            </SimpleRippleButton>
          </div>
        </div>
        
        <TabsContent value="instagram" className="space-y-4">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h3 className="font-semibold text-lg">Instagram Data</h3>
                <div className="ml-auto text-sm text-muted-foreground">
                  {filteredInstagramData.length} records
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              <InstagramTable data={filteredInstagramData} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="google-maps" className="space-y-4">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-lg">Google Maps Data</h3>
                <div className="ml-auto text-sm text-muted-foreground">
                  {filteredGoogleMapsData.length} records
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              <GoogleMapsTable data={filteredGoogleMapsData} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resizable Scraping Panel */}
      <ResizableSidebar
        isOpen={showScrapingPanel}
        onClose={() => setShowScrapingPanel(false)}
        defaultWidth={35}
        minWidth={25}
        maxWidth={55}
        storageKey="orion-scraping-panel-width"
      >
        <div className="space-y-6">
          <Tabs 
            value={scrapingType}
            onValueChange={(value) => setScrapingType(value as "instagram" | "google-maps")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="instagram" className="text-base font-medium">
                Instagram
              </TabsTrigger>
              <TabsTrigger value="google-maps" className="text-base font-medium">
                Google Maps
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="instagram" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Database className="h-5 w-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-purple-900">Instagram Scraping</h4>
                    <p className="text-sm text-purple-700">Extract profile data, posts, and engagement metrics</p>
                  </div>
                </div>
                <ScrapingForm 
                  scrapingType="instagram" 
                  onSuccess={() => {
                    // Refresh the page to show new data
                    window.location.reload()
                  }}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="google-maps" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Database className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Google Maps Scraping</h4>
                    <p className="text-sm text-green-700">Extract business listings, reviews, and location data</p>
                  </div>
                </div>
                <ScrapingForm 
                  scrapingType="google-maps"
                  onSuccess={() => {
                    // Refresh the page to show new data
                    window.location.reload()
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ResizableSidebar>

      {/* Enhanced Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <SimpleRippleButton 
          onClick={() => handleOpenScraping()}
          size="lg"
          rippleColor="white"
          className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 hover:scale-110 active:scale-95 transition-all duration-150 group transform-gpu"
        >
          <Plus className="h-6 w-6 group-hover:rotate-90 group-active:rotate-180 transition-transform duration-150" />
        </SimpleRippleButton>
      </div>
    </div>
  )
}