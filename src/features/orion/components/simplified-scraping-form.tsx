"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@/features/auth'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { ChevronDown, ChevronUp, Play, Settings, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { CoordinateInput } from "./coordinate-input"

type ScrapingStatus = 'idle' | 'initializing' | 'processing' | 'completed' | 'error'
type ScrapingType = 'instagram' | 'google-maps'

interface SimplifiedScrapingFormProps {
  scrapingType: ScrapingType
  onSuccess?: () => void
}

// Form validation schema
const formSchema = z.object({
  url: z.string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine((url) => {
      if (url.includes('instagram.com')) return true
      if (url.includes('google.com/maps') || url.includes('maps.google.com')) return true
      // Allow search terms for Google Maps
      return url.length > 3
    }, "Please enter a valid Instagram URL or Google Maps URL/search term"),
  maxResults: z.string().min(1, "Max results is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function SimplifiedScrapingForm({ scrapingType, onSuccess }: SimplifiedScrapingFormProps) {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [status, setStatus] = useState<ScrapingStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [processedItems, setProcessedItems] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      maxResults: "10",
      latitude: "",
      longitude: "",
    },
  })

  const maxResultsOptions = [
    { label: "1", value: "1" },
    { label: "10", value: "10" },
    { label: "50", value: "50" },
    { label: "100", value: "100" },
  ]

  const isLoading = status === 'initializing' || status === 'processing'
  const isActive = status === 'processing' || status === 'completed' || status === 'error'

  // Smart URL validation
  const validateUrl = (url: string) => {
    if (!url) return false
    
    if (scrapingType === 'instagram') {
      return url.includes('instagram.com')
    } else if (scrapingType === 'google-maps') {
      return url.includes('google.com/maps') || url.includes('maps.google.com') || url.length > 3
    }
    
    return false
  }

  // Progress simulation
  const simulateProgress = () => {
    const steps = [
      "Initializing scraper...",
      "Validating URL...",
      "Connecting to target...",
      "Analyzing page structure...",
      "Extracting data...",
      "Processing results...",
      "Finalizing..."
    ]
    
    let currentProgress = 0
    let stepIndex = 0
    const totalSteps = steps.length
    const stepDuration = 1000
    
    setStatus('processing')
    setProgress(0)
    setCurrentStep(steps[0])
    const maxResults = parseInt(form.getValues('maxResults'))
    setTotalItems(maxResults)
    setProcessedItems(0)
    setEstimatedTime(totalSteps * stepDuration)
    
    const interval = setInterval(() => {
      currentProgress += (100 / totalSteps)
      stepIndex++
      
      setProgress(Math.min(currentProgress, 100))
      setProcessedItems(Math.floor((currentProgress / 100) * maxResults))
      setEstimatedTime(Math.max(0, (totalSteps - stepIndex) * stepDuration))
      
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex])
      }
      
      if (currentProgress >= 100) {
        clearInterval(interval)
        setStatus('completed')
        setCurrentStep("Scraping completed successfully!")
        setEstimatedTime(0)
        setProcessedItems(maxResults)
        toast({
          title: "Scraping completed successfully!",
          description: `Processed ${maxResults} items`
        })
        onSuccess?.()
      }
    }, stepDuration)
    
    return interval
  }

  const onSubmit = async (data: FormData) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "You must log in first to start scraping",
        variant: "destructive"
      })
      return
    }

    if (!validateUrl(data.url)) {
      toast({
        title: "Invalid URL",
        description: `Please enter a valid ${scrapingType === 'instagram' ? 'Instagram' : 'Google Maps'} URL`,
        variant: "destructive"
      })
      return
    }

    setStatus('initializing')
    setProgress(0)
    setCurrentStep("Preparing to start scraping...")
    
    try {
      const response = await fetch('/api/scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: data.url,
          maxResults: parseInt(data.maxResults),
          userEmail: user.email,
          userid: user.id,
          scrapingType: scrapingType,
          coordinates: scrapingType === 'google-maps' && data.latitude && data.longitude ? {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude)
          } : null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send data to webhook')
      }

      toast({
        title: "Scraping started!",
        description: "Your scraping job has been initiated"
      })

      simulateProgress()
      
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      setCurrentStep("Failed to start scraping")
      toast({
        title: "Failed to start scraping",
        description: "Please try again or contact support",
        variant: "destructive"
      })
    }
  }

  const handleStop = () => {
    setStatus('idle')
    setProgress(0)
    setCurrentStep("")
    setProcessedItems(0)
    setTotalItems(0)
    setEstimatedTime(null)
    toast({
      title: "Scraping stopped",
      description: "The scraping process has been terminated"
    })
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'initializing':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Form Section */}
          <div className="space-y-4 p-6 border rounded-xl bg-background shadow-sm">
            {/* URL Input - Primary Element */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    {scrapingType === 'instagram' ? 'Instagram URL' : 'Google Maps URL or Search Term'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={scrapingType === 'instagram' ? 
                        "https://instagram.com/username" : 
                        "https://maps.google.com/... or search term"
                      }
                      disabled={isActive}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {scrapingType === 'instagram' ? 
                      "Enter the Instagram profile or post URL you want to scrape" : 
                      "Enter a Google Maps URL or search for businesses/places"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Advanced Settings - Collapsible */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-2 text-sm text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Advanced Settings
                  </div>
                  {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="maxResults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Results</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isActive}
                      >
                        <FormControl>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maxResultsOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Limit the number of results to scrape
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Coordinates for Google Maps */}
                {scrapingType === 'google-maps' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="40.7128"
                              disabled={isActive}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="-74.0060"
                              disabled={isActive}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Primary Action Button */}
            <div className="pt-4">
              {status === 'idle' ? (
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  disabled={isLoading}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Scraping
                </Button>
              ) : (
                <Button 
                  type="button"
                  variant="outline" 
                  size="lg" 
                  className="w-full h-12 text-base"
                  onClick={handleStop}
                  disabled={status === 'completed'}
                >
                  Stop Scraping
                </Button>
              )}
            </div>
          </div>

          {/* Progress Indicator - Simple */}
          {isActive && (
            <div className="space-y-4 p-6 border rounded-xl bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div>
                    <p className="font-medium text-sm">{currentStep}</p>
                    <p className="text-xs text-muted-foreground">
                      {processedItems}/{totalItems} items processed
                      {estimatedTime && estimatedTime > 0 && (
                        <span className="ml-2">• ~{formatTime(estimatedTime)} remaining</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <Progress 
                value={progress} 
                className="h-2"
              />
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}