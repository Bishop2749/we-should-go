'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps'
import { type Location, getCategoryMeta } from '@/types'
import type { Event, EventAttendee } from '@/types/events'
import LocationCard from './LocationCard'
import PoiCard from './PoiCard'
import EventCard from './EventCard'

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

// Custom controls — compact, rounded, matching Google Maps mobile style
function MapControls() {
  const map = useMap()

  const zoomIn = () => map?.setZoom((map.getZoom() ?? 12) + 1)
  const zoomOut = () => map?.setZoom((map.getZoom() ?? 12) - 1)
  const recenter = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => { map?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); map?.setZoom(14) },
      () => {}
    )
  }

  const card = {
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
    overflow: 'hidden' as const,
    display: 'flex',
    flexDirection: 'column' as const,
  }

  const btn = {
    width: 42, height: 42,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#444',
    fontSize: 20,
    fontWeight: 300,
    transition: 'background 0.15s',
  }

  return (
    <div style={{ position: 'absolute', right: 12, bottom: 80, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
      {/* Recenter */}
      <div style={card}>
        <button
          style={btn}
          onClick={recenter}
          aria-label="My location"
          onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#444" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.5" fill="#444" stroke="none"/>
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <circle cx="12" cy="12" r="7" fill="none"/>
          </svg>
        </button>
      </div>

      {/* Zoom */}
      <div style={card}>
        <button
          style={{ ...btn, borderBottom: '1px solid #e8e8e8' }}
          onClick={zoomIn}
          aria-label="Zoom in"
          onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          +
        </button>
        <button
          style={btn}
          onClick={zoomOut}
          aria-label="Zoom out"
          onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          −
        </button>
      </div>

    </div>
  )
}

/** Distinctive pin for event markers — purple calendar style */
function EventPin({ title }: { title: string }) {
  return (
    <div
      title={title}
      style={{
        width: 38,
        height: 38,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        border: '2.5px solid white',
        boxShadow: '0 2px 10px rgba(99,102,241,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <span style={{ transform: 'rotate(45deg)', display: 'block', fontSize: 17, lineHeight: 1 }}>
        📅
      </span>
    </div>
  )
}

interface PoiClick { placeId: string; lat: number; lng: number }

interface EventWithMeta extends Event {
  myStatus?: EventAttendee['status']
  attendeeCount?: number
}

interface MapProps {
  locations: Location[]
  events: EventWithMeta[]
  currentUserId: string | null
  onDeleteLocation: (id: string) => void
  onAddFromPoi: (place: { name: string; address: string; lat: number; lng: number; placeId: string; googleMapsUrl: string }) => void
  onCreateEventFromPoi?: (place: { name: string; address: string; lat: number; lng: number; placeId: string; googleMapsUrl: string }) => void
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

export default function MapComponent({
  locations,
  events,
  currentUserId,
  onDeleteLocation,
  onAddFromPoi,
  onCreateEventFromPoi,
}: MapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedPoi, setSelectedPoi] = useState<PoiClick | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventWithMeta | null>(null)

  const handleMarkerClick = useCallback((location: Location) => {
    setSelectedPoi(null)
    setSelectedEvent(null)
    setSelectedLocation(location)
  }, [])

  const handleEventMarkerClick = useCallback((event: EventWithMeta) => {
    setSelectedPoi(null)
    setSelectedLocation(null)
    setSelectedEvent(event)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedLocation(null)
    setSelectedPoi(null)
    setSelectedEvent(null)
  }, [])

  const handleDelete = useCallback(
    (id: string) => { onDeleteLocation(id); setSelectedLocation(null) },
    [onDeleteLocation]
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapClick = useCallback((e: any) => {
    if (e.detail?.placeId) {
      e.stop?.()
      setSelectedLocation(null)
      setSelectedEvent(null)
      setSelectedPoi({ placeId: e.detail.placeId, lat: e.detail.latLng?.lat ?? 0, lng: e.detail.latLng?.lng ?? 0 })
    } else {
      handleClose()
    }
  }, [handleClose])

  const selectedPosition = selectedLocation
    ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
    : selectedEvent
      ? { lat: selectedEvent.lat, lng: selectedEvent.lng }
      : null

  return (
    <>
      <PanToMarker position={selectedPosition} />
      <GoogleMap
        defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
        defaultZoom={12}
        mapId="we-should-go-map"
        gestureHandling="greedy"
        disableDefaultUI={true}
        style={{ width: '100%', height: '100%' }}
        onClick={handleMapClick}
      >
        <GeolocationHandler />
        <MapControls />

        {/* Location pins */}
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

        {/* Event pins — distinct purple/indigo style */}
        {events.map((evt) => (
          <AdvancedMarker
            key={evt.id}
            position={{ lat: evt.lat, lng: evt.lng }}
            onClick={() => handleEventMarkerClick(evt)}
            title={evt.title}
            zIndex={10}
          >
            <EventPin title={evt.title} />
          </AdvancedMarker>
        ))}

      </GoogleMap>

      {/* Saved location card */}
      {selectedLocation && (
        <LocationCard
          location={selectedLocation}
          currentUserId={currentUserId}
          onClose={handleClose}
          onDelete={handleDelete}
        />
      )}

      {/* Event card */}
      {selectedEvent && (
        <EventCard
          event={selectedEvent}
          attendeeCount={selectedEvent.attendeeCount}
          myStatus={selectedEvent.myStatus}
          onClose={handleClose}
        />
      )}

      {/* POI tap card — intercepts Google's native InfoWindow */}
      {selectedPoi && (
        <PoiCard
          placeId={selectedPoi.placeId}
          lat={selectedPoi.lat}
          lng={selectedPoi.lng}
          onClose={handleClose}
          onAdd={(place) => { onAddFromPoi(place); handleClose() }}
          onCreateEvent={onCreateEventFromPoi ? (place) => { onCreateEventFromPoi(place); handleClose() } : undefined}
          alreadySaved={locations.some(l => l.place_id === selectedPoi.placeId)}
        />
      )}
    </>
  )
}
