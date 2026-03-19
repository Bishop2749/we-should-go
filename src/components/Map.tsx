'use client'

import { useState, useCallback } from 'react'
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import { type Location, getCategoryMeta } from '@/types'
import LocationCard from './LocationCard'

interface MapProps {
  locations: Location[]
  currentUserId: string | null
  onDeleteLocation: (id: string) => void
}

// Custom colored pin marker
function CategoryPin({ category }: { category: string }) {
  const meta = getCategoryMeta(category)
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        backgroundColor: meta.color,
        border: '2.5px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          transform: 'rotate(45deg)',
          display: 'block',
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        {meta.emoji}
      </span>
    </div>
  )
}

// Panning helper (must be inside APIProvider)
function PanToMarker({ position }: { position: google.maps.LatLngLiteral | null }) {
  const map = useMap()
  if (map && position) {
    // Pan to marker but offset slightly upward so InfoWindow is visible
    const offset = { lat: position.lat - 0.002, lng: position.lng }
    map.panTo(offset)
  }
  return null
}

export default function MapComponent({ locations, currentUserId, onDeleteLocation }: MapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const handleMarkerClick = useCallback((location: Location) => {
    setSelectedLocation(location)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedLocation(null)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      onDeleteLocation(id)
      setSelectedLocation(null)
    },
    [onDeleteLocation]
  )

  const defaultCenter = { lat: 37.7749, lng: -122.4194 } // SF as default

  return (
    <>
      <PanToMarker
        position={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : null}
      />
      <GoogleMap
        defaultCenter={defaultCenter}
        defaultZoom={12}
        mapId="we-should-go-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ width: '100%', height: '100%' }}
        onClick={handleClose}
        mapTypeControlOptions={{ position: 0 }}
      >
        {locations.map((loc) => (
          <AdvancedMarker
            key={loc.id}
            position={{ lat: loc.lat, lng: loc.lng }}
            onClick={() => handleMarkerClick(loc)}
            title={loc.name}
          >
            <CategoryPin category={loc.category} />
          </AdvancedMarker>
        ))}

        {selectedLocation && (
          <InfoWindow
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            onCloseClick={handleClose}
            pixelOffset={[0, -44]}
            disableAutoPan
          >
            <LocationCard
              location={selectedLocation}
              currentUserId={currentUserId}
              onClose={handleClose}
              onDelete={handleDelete}
            />
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  )
}
