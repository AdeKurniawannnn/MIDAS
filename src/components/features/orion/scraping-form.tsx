"use client"

import { useState } from "react"
import { useAuth } from '@/lib/providers/AuthProvider'
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { AnimatedButton, useAnimatedButton } from "@/components/ui/animated-button"
import { Spinner } from "@/components/ui/spinner"
import { ProgressBar } from "@/components/ui/progress-bar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckCircle2, AlertCircle, Pause, Play, Square } from "lucide-react"
import { CoordinateInput } from "./coordinate-input"

type ScrapingStatus = 'idle' | 'initializing' | 'processing' | 'paused' | 'completed' | 'error'
type ScrapingType = 'instagram' | 'google-maps'

interface ScrapingFormProps {
  scrapingType: ScrapingType
  onSuccess?: () => void
}

export function ScrapingForm({ scrapingType, onSuccess }: ScrapingFormProps) {
  const { user, isAuthenticated } = useAuth()
  const [url, setUrl] = useState("")
  const [maxResults, setMaxResults] = useState("1")
  const [selectedAction, setSelectedAction] = useState("Action Menu")
  const [status, setStatus] = useState<ScrapingStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [processedItems, setProcessedItems] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  
  const startButton = useAnimatedButton()
  const pauseButton = useAnimatedButton()
  const stopButton = useAnimatedButton()
  const exportButton = useAnimatedButton()

  const maxResultsOptions = [
    { label: "1", value: "1" },
    { label: "10", value: "10" },
    { label: "50", value: "50" },
    { label: "100", value: "100" },
  ]

  const isLoading = status === 'initializing' || status === 'processing'
  const isActive = status === 'processing' || status === 'paused' || status === 'completed' || status === 'error'

  // Simulate progress for demonstration
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
    const stepDuration = 1000 // 1 second per step
    
    setStatus('processing')
    setProgress(0)
    setCurrentStep(steps[0])
    setTotalItems(parseInt(maxResults))
    setProcessedItems(0)
    setEstimatedTime(totalSteps * stepDuration)
    
    const interval = setInterval(() => {
      if (isPaused) return
      
      currentProgress += (100 / totalSteps)
      stepIndex++
      
      setProgress(Math.min(currentProgress, 100))
      setProcessedItems(Math.floor((currentProgress / 100) * parseInt(maxResults)))
      setEstimatedTime(Math.max(0, (totalSteps - stepIndex) * stepDuration))
      
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex])
      }
      
      if (currentProgress >= 100) {
        clearInterval(interval)
        setStatus('completed')
        setCurrentStep("Scraping completed successfully!")
        setEstimatedTime(0)
        setProcessedItems(parseInt(maxResults))
        onSuccess?.()
      }
    }, stepDuration)
    
    return interval
  }

  const handleStartScraping = async () => {
    if (!url) {
      alert('Please enter a URL first')
      return
    }

    if (!isAuthenticated || !user) {
      alert('You must log in first')
      return
    }

    startButton.showLoading()
    setStatus('initializing')
    setErrors([])
    setProgress(0)
    setCurrentStep("Preparing to start scraping...")
    
    try {
      const response = await fetch('/api/scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          maxResults: parseInt(maxResults),
          userEmail: user.email,
          userid: user.id,
          scrapingType: scrapingType,
          coordinates: scrapingType === 'google-maps' && latitude && longitude ? {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          } : null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send data to webhook')
      }

      // Start progress simulation
      simulateProgress()
      
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      setErrors(['Failed to start scraping. Please try again.'])
      startButton.showError()
    }
  }

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      setStatus('processing')
      pauseButton.reset()
    } else {
      setIsPaused(true)
      setStatus('paused')
      pauseButton.showSuccess(1000)
    }
  }

  const handleStopScraping = () => {
    setStatus('idle')
    setProgress(0)
    setCurrentStep("")
    setProcessedItems(0)
    setTotalItems(0)
    setEstimatedTime(null)
    setIsPaused(false)
    startButton.reset()
    pauseButton.reset()
    stopButton.showSuccess(1000)
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

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-lg bg-background shadow-sm">
      {/* Input Section */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={scrapingType === 'instagram' ? "Enter Instagram URL..." : "Enter Google Maps URL or search term..."}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isActive}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Max results per URL (optional)
          </span>
          <Combobox
            options={maxResultsOptions}
            value={maxResults}
            onChange={setMaxResults}
            disabled={isActive}
            className="w-20"
          />
        </div>
      </div>
      
      {/* Coordinate Input Section - Only for Google Maps */}
      {scrapingType === 'google-maps' && (
        <CoordinateInput
          latitude={latitude}
          longitude={longitude}
          onLatitudeChange={setLatitude}
          onLongitudeChange={setLongitude}
          disabled={isActive}
        />
      )}

      {/* Progress Section */}
      {isActive && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === 'processing' && <Spinner size="sm" />}
              {status === 'paused' && <Pause className="h-4 w-4 text-yellow-500" />}
              {status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm font-medium">{currentStep}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{processedItems}/{totalItems} items</span>
              {estimatedTime && estimatedTime > 0 && (
                <span>~{formatTime(estimatedTime)} remaining</span>
              )}
            </div>
          </div>
          
          <ProgressBar
            value={progress}
            showLabel={false}
            variant={status === 'error' ? 'error' : status === 'completed' ? 'success' : 'default'}
            animated={status === 'processing'}
          />
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Errors occurred:</span>
          </div>
          <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <AnimatedButton 
          variant="default" 
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 min-w-[140px]"
          onClick={handleStartScraping}
          disabled={isLoading || isActive}
          loading={startButton.loading}
          animationType="hover"
          loadingText="Starting..."
        >
          <Play className="h-4 w-4 mr-2" />
          Start Scraping
        </AnimatedButton>
        
        {isActive && (
          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={handlePauseResume}
            className="flex items-center gap-2 border-2 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 transition-all duration-200 min-w-[120px]"
            animationType="hover"
            success={pauseButton.success}
            successText={isPaused ? "Resuming..." : "Paused"}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            )}
          </AnimatedButton>
        )}
        
        <AnimatedButton 
          variant="outline" 
          size="lg"
          onClick={handleStopScraping}
          disabled={!isActive}
          animationType="hover"
          success={stopButton.success}
          successText="Stopped"
          className="border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 min-w-[120px]"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Scraping
        </AnimatedButton>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <AnimatedButton variant="outline" disabled={isActive} animationType="hover">
              {selectedAction} ▼
            </AnimatedButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {
              setUrl("")
              setSelectedAction("URL Cleared")
            }}>Clear URL</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setMaxResults("1")
              setSelectedAction("Max Results Reset")
            }}>Reset Max Results</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setUrl("")
              setMaxResults("1")
              setSelectedAction("All Reset")
            }}>Reset All</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <AnimatedButton 
          variant="outline" 
          className="ml-auto"
          animationType="hover"
          onClick={() => exportButton.showSuccess()}
          success={exportButton.success}
          successText="Exported!"
        >
          Export Results
        </AnimatedButton>
      </div>
    </div>
  )
}
