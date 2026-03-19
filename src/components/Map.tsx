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

// Custom map controls matching Google Maps style
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

  const openStreetView = () => {
    if (!map) return
    const sv = map.getStreetView()
    const center = map.getCenter()
    if (center) {
      sv.setPosition(center)
      sv.setVisible(true)
    }
  }

  const btnBase = "w-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors select-none"
  const cardStyle = "bg-white rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.3)]"

  return (
    <div className="absolute right-3 bottom-8 flex flex-col items-center gap-2 z-10">
      {/* Recenter */}
      <div className={cardStyle}>
        <button onClick={recenter} className={`${btnBase} h-10`} aria-label="My location">
          {/* Filled crosshair target — matches Google Maps icon */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/>
          </svg>
        </button>
      </div>

      {/* Zoom +/− */}
      <div className={cardStyle}>
        <button onClick={zoomIn} className={`${btnBase} h-10 text-xl font-thin border-b border-gray-200`} aria-label="Zoom in">
          +
        </button>
        <button onClick={zoomOut} className={`${btnBase} h-10 text-xl font-thin`} aria-label="Zoom out">
          −
        </button>
      </div>

      {/* Street View pegman */}
      <div className={cardStyle}>
        <button onClick={openStreetView} className={`${btnBase} h-10`} aria-label="Street View" title="Street View">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#F9A825">
            <circle cx="12" cy="4" r="2.5"/>
            <path d="M12 7.5c-1.1 0-2 .4-2.7 1L7 11l1.5 1 1.5-2v3.5L8 20h2l1-3.5h2L14 20h2l-2-6.5V10l1.5 2 1.5-1-2.3-2.5c-.7-.6-1.6-1-2.7-1z"/>
          </svg>
        </button>
      </div>
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
