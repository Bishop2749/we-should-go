'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import { type Location, getCategoryMeta } from '@/types'
import LocationCard from './LocationCard'

// Moves the map to the user's real location on mount
function GeolocationHandler() {
  const map = useMap()
  useEffect(() => {
    if (!map || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        map.setZoom(13)
      },
      () => {}
    )
  }, [map])
  return null
}

// Custom map controls: +/- zoom and recenter button
function MapControls() {
  const map = useMap()

  const zoomIn = () => map?.setZoom((map.getZoom() ?? 12) + 1)
  const zoomOut = () => map?.setZoom((map.getZoom() ?? 12) - 1)

  const recenter = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        map?.setZoom(14)
      },
      () => {}
    )
  }

  return (
    <div className="absolute right-3 bottom-8 flex flex-col gap-1.5 z-10">
      {/* Zoom controls */}
      <div className="flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <button
          onClick={zoomIn}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors text-lg font-light border-b border-gray-100"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors text-lg font-light"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Recenter button */}
      <button
        onClick={recenter}
        className="w-10 h-10 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center text-emerald-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        aria-label="Center on my location"
        title="My location"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="8" strokeOpacity={0.3} />
        </svg>
      </button>
    </div>
  )
}

interface MapProps {
  locations: Location[]
  currentUserId: string | null
  onDeleteLocation: (id: string) => void
}

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
      <span style={{ transform: 'rotate(45deg)', display: 'block', fontSize: 16, lineHeight: 1 }}>
        {meta.emoji}
      </span>
    </div>
  )
}

function PanToMarker({ position }: { position: google.maps.LatLngLiteral | null }) {
  const map = useMap()
  if (map && position) {
    map.panTo({ lat: position.lat - 0.002, lng: position.lng })
  }
  return null
}

export default function MapComponent({ locations, currentUserId, onDeleteLocation }: MapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const handleMarkerClick = useCallback((location: Location) => setSelectedLocation(location), [])
  const handleClose = useCallback(() => setSelectedLocation(null), [])
  const handleDelete = useCallback(
    (id: string) => { onDeleteLocation(id); setSelectedLocation(null) },
    [onDeleteLocation]
  )

  return (
    <>
      <PanToMarker
        position={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : null}
      />
      <GoogleMap
        defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
        defaultZoom={12}
        mapId="we-should-go-map"
        gestureHandling="greedy"
        disableDefaultUI={true}
        style={{ width: '100%', height: '100%' }}
        onClick={handleClose}
      >
        <GeolocationHandler />
        <MapControls />

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
