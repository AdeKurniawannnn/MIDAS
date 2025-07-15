"use client"

import { useState } from "react"
import { useAuth } from '@/lib/providers/AuthProvider'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

type ScrapingStatus = 'idle' | 'initializing' | 'processing' | 'paused' | 'completed' | 'error'

export function ScrapingForm() {
  const { user, isAuthenticated } = useAuth()
  const [url, setUrl] = useState("")
  const [maxResults, setMaxResults] = useState("1")
  const [selectedAction, setSelectedAction] = useState("Menu Aksi")
  const [status, setStatus] = useState<ScrapingStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [processedItems, setProcessedItems] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [isPaused, setIsPaused] = useState(false)

  const isLoading = status === 'initializing' || status === 'processing'
  const isActive = status === 'processing' || status === 'paused'

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
      }
    }, stepDuration)
    
    return interval
  }

  const handleStartScraping = async () => {
    if (!url) {
      alert('Mohon masukkan URL terlebih dahulu')
      return
    }

    if (!isAuthenticated || !user) {
      alert('Anda harus login terlebih dahulu')
      return
    }

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
          userid: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Gagal mengirim data ke webhook')
      }

      // Start progress simulation
      simulateProgress()
      
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      setErrors(['Gagal memulai scraping. Silakan coba lagi.'])
    }
  }

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      setStatus('processing')
    } else {
      setIsPaused(true)
      setStatus('paused')
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
            placeholder="Enter URL or search term..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isActive}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Max results per URL (optional)
          </span>
          <Select 
            value={maxResults} 
            onValueChange={setMaxResults}
            disabled={isActive}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
      <div className="flex items-center gap-2">
        <Button 
          variant="default" 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleStartScraping}
          disabled={isLoading || isActive}
        >
          {status === 'initializing' && (
            <Spinner size="sm" className="mr-2" />
          )}
          {isLoading ? 'Starting...' : 'Start Scraping'}
        </Button>
        
        {isActive && (
          <Button
            variant="outline"
            onClick={handlePauseResume}
            className="flex items-center gap-2"
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
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={handleStopScraping}
          disabled={!isActive}
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Scraping
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isActive}>
              {selectedAction} ▼
            </Button>
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
        
        <Button variant="outline" className="ml-auto">
          Export Results
        </Button>
      </div>
    </div>
  )
}
