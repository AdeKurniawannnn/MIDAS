"use client"

import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Eye, EyeOff, Crosshair } from "lucide-react"

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface BusinessData {
  id: number
  placeName: string | null
  address: string | null
  phoneNumber: string | null
  website: string | null
  rating: string | null
  reviewCount: string | null
  category: string | null
  coordinates: string | null
  imageUrl: string | null
  priceRange: string | null
}

interface InteractiveMapProps {
  onCoordinateSelect?: (lat: number, lng: number) => void
  businessData?: BusinessData[]
  selectedLatitude?: string
  selectedLongitude?: string
  mode?: 'input' | 'display' | 'both'
  height?: string
  className?: string
}

// Custom marker icon for businesses
const businessIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'business-marker'
})

// Custom marker icon for selected coordinate
const selectedIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'selected-marker'
})

function MapClickHandler({ onCoordinateSelect, enabled }: { onCoordinateSelect?: (lat: number, lng: number) => void, enabled: boolean }) {
  useMapEvents({
    click(e) {
      if (enabled && onCoordinateSelect) {
        onCoordinateSelect(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

function parseCoordinates(coordString: string | null): { lat: number; lng: number } | null {
  if (!coordString) return null
  
  try {
    // Handle different coordinate formats
    const cleanCoord = coordString.replace(/[^\d.,-]/g, '')
    const [lat, lng] = cleanCoord.split(',').map(coord => parseFloat(coord.trim()))
    
    if (isNaN(lat) || isNaN(lng)) return null
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    
    return { lat, lng }
  } catch {
    return null
  }
}

export function InteractiveMap({
  onCoordinateSelect,
  businessData = [],
  selectedLatitude,
  selectedLongitude,
  mode = 'both',
  height = '400px',
  className = ''
}: InteractiveMapProps) {
  const [clickMode, setClickMode] = useState(mode === 'input' || mode === 'both')
  const [showBusinesses, setShowBusinesses] = useState(mode === 'display' || mode === 'both')
  const mapRef = useRef<L.Map | null>(null)
  
  // Default center (Jakarta, Indonesia)
  const defaultCenter: [number, number] = [-6.2088, 106.8456]
  
  // Parse selected coordinates
  const selectedCoords = selectedLatitude && selectedLongitude ? 
    { lat: parseFloat(selectedLatitude), lng: parseFloat(selectedLongitude) } : null
  
  // Parse business coordinates
  const businessMarkers = businessData
    .map(business => {
      const coords = parseCoordinates(business.coordinates)
      return coords ? { ...business, coords } : null
    })
    .filter(Boolean) as (BusinessData & { coords: { lat: number; lng: number } })[]

  // Calculate map center based on data
  const getMapCenter = (): [number, number] => {
    if (selectedCoords) {
      return [selectedCoords.lat, selectedCoords.lng]
    }
    
    if (businessMarkers.length > 0) {
      const avgLat = businessMarkers.reduce((sum, marker) => sum + marker.coords.lat, 0) / businessMarkers.length
      const avgLng = businessMarkers.reduce((sum, marker) => sum + marker.coords.lng, 0) / businessMarkers.length
      return [avgLat, avgLng]
    }
    
    return defaultCenter
  }

  const mapCenter = getMapCenter()

  useEffect(() => {
    // Fix for CSS import in Next.js
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'
    document.head.appendChild(link)
    
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  const handleCoordinateClick = (lat: number, lng: number) => {
    if (onCoordinateSelect) {
      onCoordinateSelect(lat, lng)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          handleCoordinateClick(latitude, longitude)
          
          // Fly to current location if map is available
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 13)
          }
        },
        (error) => {
          console.error('Error getting current location:', error)
        }
      )
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        {mode === 'both' && (
          <>
            <Button
              variant={clickMode ? "default" : "outline"}
              size="sm"
              onClick={() => setClickMode(!clickMode)}
              className="bg-white hover:bg-gray-50 text-gray-700 border shadow-sm"
            >
              <Crosshair className="h-4 w-4 mr-1" />
              {clickMode ? 'Click Mode On' : 'Click Mode Off'}
            </Button>
            
            <Button
              variant={showBusinesses ? "default" : "outline"}
              size="sm"
              onClick={() => setShowBusinesses(!showBusinesses)}
              className="bg-white hover:bg-gray-50 text-gray-700 border shadow-sm"
            >
              {showBusinesses ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Businesses ({businessMarkers.length})
            </Button>
          </>
        )}
        
        {(mode === 'input' || mode === 'both') && (
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="bg-white hover:bg-gray-50 text-gray-700 border shadow-sm"
          >
            <Navigation className="h-4 w-4 mr-1" />
            My Location
          </Button>
        )}
      </div>
      
      {/* Map Status */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        {clickMode && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Click to select coordinates
          </Badge>
        )}
        {showBusinesses && businessMarkers.length > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {businessMarkers.length} businesses shown
          </Badge>
        )}
      </div>

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height, width: '100%' }}
        className="rounded-lg border"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Click handler for coordinate selection */}
        <MapClickHandler 
          onCoordinateSelect={handleCoordinateClick}
          enabled={clickMode}
        />
        
        {/* Selected coordinate marker */}
        {selectedCoords && (
          <Marker
            position={[selectedCoords.lat, selectedCoords.lng]}
            icon={selectedIcon}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium mb-1">Selected Location</div>
                <div>Lat: {selectedCoords.lat.toFixed(6)}</div>
                <div>Lng: {selectedCoords.lng.toFixed(6)}</div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Business markers with clustering */}
        {showBusinesses && businessMarkers.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {businessMarkers.map((business) => (
              <Marker
                key={business.id}
                position={[business.coords.lat, business.coords.lng]}
                icon={businessIcon}
              >
                <Popup maxWidth={300}>
                  <div className="text-sm space-y-2">
                    <div className="font-medium text-base">
                      {business.placeName || 'Unknown Business'}
                    </div>
                    
                    {business.address && (
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-0.5 text-gray-500" />
                        <span className="text-gray-600">{business.address}</span>
                      </div>
                    )}
                    
                    {business.category && (
                      <Badge variant="secondary" className="text-xs">
                        {business.category}
                      </Badge>
                    )}
                    
                    <div className="flex gap-4 text-xs text-gray-500">
                      {business.rating && (
                        <span>⭐ {business.rating}</span>
                      )}
                      {business.reviewCount && (
                        <span>({business.reviewCount} reviews)</span>
                      )}
                    </div>
                    
                    {business.phoneNumber && (
                      <div className="text-xs">📞 {business.phoneNumber}</div>
                    )}
                    
                    {business.website && (
                      <div className="text-xs">
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          🌐 Website
                        </a>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-400 pt-1 border-t">
                      {business.coords.lat.toFixed(6)}, {business.coords.lng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  )
}