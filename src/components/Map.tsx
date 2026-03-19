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

// Injects recenter button directly into Google's native control layer
function RecenterButton() {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const btn = document.createElement('button')
    btn.title = 'My location'
    btn.setAttribute('aria-label', 'My location')
    btn.style.cssText = `
      width:40px; height:40px; background:white; border:none;
      border-radius:2px; box-shadow:0 1px 4px rgba(0,0,0,0.3);
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      margin-right:10px; margin-bottom:0; padding:0;
    `
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="#666">
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/>
    </svg>`

    btn.addEventListener('mouseenter', () => btn.style.background = '#f5f5f5')
    btn.addEventListener('mouseleave', () => btn.style.background = 'white')
    btn.addEventListener('click', () => {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          map.setZoom(14)
        },
        () => {}
      )
    })

    // Push into Google's RIGHT_BOTTOM control slot — same layer as pegman/zoom
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(btn)

    return () => {
      // Clean up on unmount
      const controls = map.controls[google.maps.ControlPosition.RIGHT_BOTTOM]
      for (let i = 0; i < controls.getLength(); i++) {
        if (controls.getAt(i) === btn) { controls.removeAt(i); break }
      }
    }
  }, [map])

  return null
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
