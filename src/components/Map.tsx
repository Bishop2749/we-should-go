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

// Recenter button — only custom control we keep
function RecenterButton() {
  const map = useMap()

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
    <div className="absolute right-[11px] bottom-[172px] z-10">
      <button
        onClick={recenter}
        aria-label="My location"
        title="My location"
        style={{
          width: 40, height: 40,
          background: 'white',
          border: 'none',
          borderRadius: 2,
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }} fill="#666">
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/>
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
        disableDefaultUI={false}
        zoomControl={true}
        streetViewControl={true}
        mapTypeControl={false}
        fullscreenControl={false}
        rotateControl={false}
        scaleControl={false}
        style={{ width: '100%', height: '100%' }}
        onClick={handleClose}
      >
        <GeolocationHandler />
        <RecenterButton />

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
