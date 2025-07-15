"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Map, X } from "lucide-react"
import { InteractiveMap } from "./interactive-map"

interface CoordinateInputProps {
  latitude: string
  longitude: string
  onLatitudeChange: (value: string) => void
  onLongitudeChange: (value: string) => void
  disabled?: boolean
}

export function CoordinateInput({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  disabled = false
}: CoordinateInputProps) {
  const [latError, setLatError] = useState("")
  const [lngError, setLngError] = useState("")
  const [showMap, setShowMap] = useState(false)

  const validateLatitude = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      setLatError("Please enter a valid number")
      return false
    }
    if (num < -90 || num > 90) {
      setLatError("Latitude must be between -90 and 90")
      return false
    }
    setLatError("")
    return true
  }

  const validateLongitude = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      setLngError("Please enter a valid number")
      return false
    }
    if (num < -180 || num > 180) {
      setLngError("Longitude must be between -180 and 180")
      return false
    }
    setLngError("")
    return true
  }

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onLatitudeChange(value)
    if (value) {
      validateLatitude(value)
    } else {
      setLatError("")
    }
  }

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onLongitudeChange(value)
    if (value) {
      validateLongitude(value)
    } else {
      setLngError("")
    }
  }

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords
          onLatitudeChange(lat.toString())
          onLongitudeChange(lng.toString())
          setLatError("")
          setLngError("")
        },
        (error) => {
          console.error("Error getting location:", error)
          alert("Unable to get your current location. Please check your location permissions.")
        }
      )
    } else {
      alert("Geolocation is not supported by this browser.")
    }
  }

  const handleMapCoordinateSelect = (lat: number, lng: number) => {
    onLatitudeChange(lat.toString())
    onLongitudeChange(lng.toString())
    setLatError("")
    setLngError("")
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Coordinate Input</Label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude" className="text-sm">
            Latitude
          </Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="e.g., -6.2088"
            value={latitude}
            onChange={handleLatitudeChange}
            disabled={disabled}
            className={latError ? "border-red-500" : ""}
          />
          {latError && (
            <p className="text-xs text-red-500">{latError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="longitude" className="text-sm">
            Longitude
          </Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="e.g., 106.8456"
            value={longitude}
            onChange={handleLongitudeChange}
            disabled={disabled}
            className={lngError ? "border-red-500" : ""}
          />
          {lngError && (
            <p className="text-xs text-red-500">{lngError}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          Use Current Location
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowMap(!showMap)}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          {showMap ? <X className="h-4 w-4" /> : <Map className="h-4 w-4" />}
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
        
        {latitude && longitude && !latError && !lngError && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <MapPin className="h-4 w-4" />
            <span>Valid coordinates</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Enter coordinates to search for businesses in a specific area. Click &quot;Use Current Location&quot; to automatically fill in your current position, or &quot;Show Map&quot; to select coordinates interactively.
      </p>
      
      {/* Interactive Map */}
      {showMap && (
        <div className="mt-4">
          <InteractiveMap
            onCoordinateSelect={handleMapCoordinateSelect}
            selectedLatitude={latitude}
            selectedLongitude={longitude}
            mode="input"
            height="300px"
            className="rounded-lg border"
          />
        </div>
      )}
    </div>
  )
}