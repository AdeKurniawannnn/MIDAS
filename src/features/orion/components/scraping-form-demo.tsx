"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { ScrapingForm } from "./scraping-form"
import { SimplifiedScrapingForm } from "./simplified-scraping-form"

type ScrapingType = 'instagram' | 'google-maps'

export function ScrapingFormDemo() {
  const [scrapingType, setScrapingType] = useState<ScrapingType>('instagram')

  const handleSuccess = () => {
    console.log("Scraping completed successfully!")
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Scraping Form Comparison</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Compare the original complex scraping form with the new simplified version.
          The simplified form reduces complexity from 10+ elements to 3 primary elements.
        </p>
      </div>

      {/* Scraping Type Selection */}
      <div className="flex justify-center">
        <Tabs value={scrapingType} onValueChange={(value) => setScrapingType(value as ScrapingType)}>
          <TabsList>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="google-maps">Google Maps</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Form Comparison */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Original Form */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Original Form
              <Badge variant="secondary">Complex</Badge>
            </CardTitle>
            <CardDescription>
              The original form with 10+ UI elements, custom components, and complex interactions.
            </CardDescription>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">AnimatedButton</Badge>
                <Badge variant="outline">Combobox</Badge>
                <Badge variant="outline">ProgressBar</Badge>
                <Badge variant="outline">DropdownMenu</Badge>
                <Badge variant="outline">Multiple States</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="max-h-[800px] overflow-y-auto">
              <ScrapingForm scrapingType={scrapingType} onSuccess={handleSuccess} />
            </div>
          </CardContent>
        </Card>

        {/* Simplified Form */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Simplified Form
              <Badge variant="default">Simple</Badge>
            </CardTitle>
            <CardDescription>
              The new simplified form with 3 primary elements and clean shadcn/ui components.
            </CardDescription>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">shadcn Button</Badge>
                <Badge variant="outline">shadcn Progress</Badge>
                <Badge variant="outline">shadcn Form</Badge>
                <Badge variant="outline">Collapsible Settings</Badge>
                <Badge variant="outline">Toast Notifications</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-start">
            <SimplifiedScrapingForm scrapingType={scrapingType} onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Comparison Features */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Original Form Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                10+ UI elements on screen
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Custom AnimatedButton component
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Complex progress bar with multiple states
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Multiple action buttons always visible
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Dropdown menu for secondary actions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Alert-based error handling
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Complex state management
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simplified Form Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                3 primary elements: URL input, button, progress
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Standard shadcn/ui Button component
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Clean shadcn/ui Progress component
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Single primary action button
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Collapsible advanced settings
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Toast notifications for feedback
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                React Hook Form validation
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technical Improvements */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Improvements</CardTitle>
          <CardDescription>
            Key technical enhancements in the simplified version
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Form Validation</h4>
              <p className="text-sm text-muted-foreground">
                Uses react-hook-form with Zod schema validation for robust input handling
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">User Experience</h4>
              <p className="text-sm text-muted-foreground">
                Toast notifications provide non-blocking feedback instead of alerts
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Accessibility</h4>
              <p className="text-sm text-muted-foreground">
                Proper form labeling, ARIA attributes, and keyboard navigation
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Design Consistency</h4>
              <p className="text-sm text-muted-foreground">
                Uses standard shadcn/ui components for consistent styling
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Progressive Disclosure</h4>
              <p className="text-sm text-muted-foreground">
                Advanced options are hidden by default, reducing cognitive load
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Smart Validation</h4>
              <p className="text-sm text-muted-foreground">
                Context-aware URL validation based on scraping type
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}