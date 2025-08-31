"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Minus, 
  Settings, 
  Zap,
  Target,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react"

interface ResultsInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  presets?: number[]
  label?: string
  description?: string
  showPresets?: boolean
  showAdvanced?: boolean
  className?: string
}

const DEFAULT_PRESETS = [1, 5, 10, 20, 50, 100]
const QUALITY_THRESHOLDS = {
  low: 10,
  medium: 50,
  high: 100
}

export function ResultsInput({
  value,
  onChange,
  min = 1,
  max = 1000,
  step = 1,
  presets = DEFAULT_PRESETS,
  label = "Results per URL",
  description = "Maximum number of results to fetch per URL",
  showPresets = true,
  showAdvanced = true,
  className = ""
}: ResultsInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())
  const [isValid, setIsValid] = useState(true)
  const [validationMessage, setValidationMessage] = useState("")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const validateInput = (val: string) => {
    const numVal = parseInt(val)
    
    if (isNaN(numVal)) {
      setIsValid(false)
      setValidationMessage("Please enter a valid number")
      return false
    }
    
    if (numVal < min) {
      setIsValid(false)
      setValidationMessage(`Minimum value is ${min}`)
      return false
    }
    
    if (numVal > max) {
      setIsValid(false)
      setValidationMessage(`Maximum value is ${max}`)
      return false
    }
    
    setIsValid(true)
    setValidationMessage("")
    return true
  }

  const handleInputChange = (val: string) => {
    setInputValue(val)
    
    if (validateInput(val)) {
      onChange(parseInt(val))
    }
  }

  const handleInputBlur = () => {
    if (!isValid || !inputValue) {
      setInputValue(value.toString())
      setIsValid(true)
      setValidationMessage("")
    }
  }

  const increment = () => {
    const newValue = Math.min(value + step, max)
    onChange(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(value - step, min)
    onChange(newValue)
  }

  const handlePresetSelect = (preset: number) => {
    onChange(preset)
  }

  const getQualityInfo = (val: number) => {
    if (val <= QUALITY_THRESHOLDS.low) {
      return {
        level: "Fast",
        color: "text-green-600",
        icon: <Zap className="h-4 w-4" />,
        description: "Quick results, good for testing"
      }
    } else if (val <= QUALITY_THRESHOLDS.medium) {
      return {
        level: "Balanced",
        color: "text-blue-600",
        icon: <Target className="h-4 w-4" />,
        description: "Good balance of speed and coverage"
      }
    } else {
      return {
        level: "Comprehensive",
        color: "text-orange-600",
        icon: <AlertCircle className="h-4 w-4" />,
        description: "Thorough results, may take longer"
      }
    }
  }

  const qualityInfo = getQualityInfo(value)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Description */}
      <div className="space-y-1">
        <Label htmlFor="results-input" className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Main Input Control */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={decrement}
              disabled={value <= min}
              className="h-8 w-8 p-0 rounded-r-none border-r"
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <Input
              id="results-input"
              type="number"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              min={min}
              max={max}
              step={step}
              className={`text-center border-0 focus-visible:ring-0 ${
                !isValid ? 'text-red-600' : ''
              }`}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={increment}
              disabled={value >= max}
              className="h-8 w-8 p-0 rounded-l-none border-l"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Validation Message */}
          {!isValid && (
            <div className="flex items-center gap-1 mt-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">{validationMessage}</span>
            </div>
          )}
        </div>

        {/* Quality Indicator */}
        <div className={`flex items-center gap-1 ${qualityInfo.color}`}>
          {qualityInfo.icon}
          <span className="text-sm font-medium">{qualityInfo.level}</span>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <Popover open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <h4 className="font-medium">Advanced Options</h4>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Range:</span>
                    <span className="text-muted-foreground">{min} - {max}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Step:</span>
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Current:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    {qualityInfo.icon}
                    <span className="text-sm font-medium">{qualityInfo.level}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {qualityInfo.description}
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Quick Presets */}
      {showPresets && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick presets:</Label>
          <div className="flex flex-wrap gap-1">
            {presets.map((preset) => (
              <Button
                key={preset}
                variant={value === preset ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect(preset)}
                className="h-6 px-2 text-xs"
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Performance Impact</span>
          <span>{Math.round((value / max) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              value <= QUALITY_THRESHOLDS.low 
                ? 'bg-green-500' 
                : value <= QUALITY_THRESHOLDS.medium 
                  ? 'bg-blue-500' 
                  : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Badge */}
      {isValid && (
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span className="text-xs text-muted-foreground">
            Will fetch up to {value} result{value !== 1 ? 's' : ''} per URL
          </span>
        </div>
      )}
    </div>
  )
}