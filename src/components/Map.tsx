'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps'
import { type Location, getCategoryMeta, NEON_USER_ID, type LocationStatus } from '@/types'
import type { Event, EventAttendee } from '@/types/events'
import LocationCard from './LocationCard'
import PoiCard from './PoiCard'
import EventCard from './EventCard'
import type { FilterState } from './FilterPanel'

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
]

// Moves the map to the user's real location on mount
const DEFAULT_CENTER = { lat: 34.0522, lng: -118.2437 } // Los Angeles

function getInitialCenter() {
  if (typeof window === 'undefined') return DEFAULT_CENTER
  try {
    const saved = localStorage.getItem('wsg_last_location')
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_CENTER
}

function GeolocationHandler() {
  const map = useMap()
  useEffect(() => {
    if (!map || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        map.setCenter(loc)
        try { localStorage.setItem('wsg_last_location', JSON.stringify(loc)) } catch {}
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
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const zoomIn = () => map?.setZoom((map.getZoom() ?? 12) + 1)
  const zoomOut = () => map?.setZoom((map.getZoom() ?? 12) - 1)
  const recenter = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => { map?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); map?.setZoom(14) },
      () => {}
    )
  }

  const cardBg = isDark ? '#1f2937' : 'white'
  const cardBorder = isDark ? '1px solid #374151' : 'none'
  const btnColor = isDark ? '#d1d5db' : '#444'
  const hoverBg = isDark ? '#374151' : '#f0f0f0'

  const card = {
    background: cardBg,
    border: cardBorder,
    borderRadius: 12,
    boxShadow: isDark ? '0 2px 6px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.18)',
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
    color: btnColor,
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
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={btnColor} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.5" fill={btnColor} stroke="none"/>
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
          style={{ ...btn, borderBottom: isDark ? '1px solid #374151' : '1px solid #e8e8e8' }}
          onClick={zoomIn}
          aria-label="Zoom in"
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          +
        </button>
        <button
          style={btn}
          onClick={zoomOut}
          aria-label="Zoom out"
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
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
  userStatuses?: Record<string, LocationStatus>
  onDeleteLocation: (id: string) => void
  onAddFromPoi?: (place: { name: string; address: string; lat: number; lng: number; placeId: string; googleMapsUrl: string }) => void
  onCreateEventFromPoi?: (place: { name: string; address: string; lat: number; lng: number; placeId: string; googleMapsUrl: string }) => void
  showNeonOverlay: boolean
  filters: FilterState
}

function StatusBadge({ status }: { status: 'want_to_go' | 'been_here' }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 6,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: status === 'been_here' ? '#10b981' : '#f59e0b',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 8,
        lineHeight: 1,
        zIndex: 2,
      }}
    >
      {status === 'been_here' ? '✓' : '🔖'}
    </div>
  )
}

function CategoryPin({ emoji, color, isNeon = false, status }: { emoji: string; color: string; isNeon?: boolean; status?: LocationStatus }) {
  return (
    <div style={{ width: 44, height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
      <div
        className={isNeon ? 'neon-pin-inner' : undefined}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: isNeon
            ? 'linear-gradient(135deg, #F59E0B, #EF4444)'
            : color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isNeon
            ? '0 2px 12px rgba(245,158,11,0.6)'
            : '0 2px 8px rgba(0,0,0,0.25)',
          border: '2px solid rgba(255,255,255,0.9)',
        }}
      >
        <span style={{ transform: 'rotate(45deg)', fontSize: 16, lineHeight: 1 }}>{emoji}</span>
      </div>
      {/* Pin tip shadow */}
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,0,0,0.15)', marginTop: 1, filter: 'blur(2px)' }} />
      {status && <StatusBadge status={status} />}
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
  userStatuses = {},
  onDeleteLocation,
  onAddFromPoi,
  onCreateEventFromPoi,
  showNeonOverlay,
  filters,
}: MapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedPoi, setSelectedPoi] = useState<PoiClick | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventWithMeta | null>(null)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

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

  const visibleLocations = locations.filter(loc => {
    const isNeon = loc.added_by === NEON_USER_ID

    // Show/hide toggle for Neon layer
    if (isNeon && !showNeonOverlay) return false

    // "show" filter
    if (filters.show === 'neon' && !isNeon) return false
    if (filters.show === 'user' && isNeon) return false

    // Neighborhood filter (applies to all pins)
    if (filters.neighborhoods.length > 0 && loc.neighborhood) {
      if (!filters.neighborhoods.includes(loc.neighborhood)) return false
    }

    // Category filter (applies to all pins)
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(loc.category)) return false
    }

    return true
  })

  const selectedPosition = selectedLocation
    ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
    : selectedEvent
      ? { lat: selectedEvent.lat, lng: selectedEvent.lng }
      : null

  return (
    <>
      <PanToMarker position={selectedPosition} />
      <GoogleMap
        defaultCenter={getInitialCenter()}
        defaultZoom={12}
        mapId="we-should-go-map"
        gestureHandling="greedy"
        disableDefaultUI={true}
        style={{ width: '100%', height: '100%' }}
        onClick={handleMapClick}
        styles={isDark ? DARK_MAP_STYLES : undefined}
      >
        <GeolocationHandler />
        <MapControls />

        {/* Location pins */}
        {visibleLocations.map((loc) => {
          const isNeon = loc.added_by === NEON_USER_ID
          const meta = getCategoryMeta(loc.category)
          const locStatus = userStatuses[loc.id] ?? undefined
          return (
            <AdvancedMarker
              key={loc.id}
              position={{ lat: loc.lat, lng: loc.lng }}
              onClick={() => handleMarkerClick(loc)}
              title={loc.name}
              zIndex={isNeon ? 5 : 1}
            >
              {isNeon ? (
                <CategoryPin emoji="✨" color="" isNeon={true} />
              ) : (
                <CategoryPin emoji={meta.emoji} color={meta.color} status={locStatus} />
              )}
            </AdvancedMarker>
          )
        })}

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

      {/* Empty state — shown when a signed-in user has no saved locations of their own.
          Never shown to signed-out visitors (e.g. /demo): every location they can see
          is a Neon curated pin, so this condition would otherwise always be true. */}
      {currentUserId && locations.filter(l => l.added_by !== NEON_USER_ID).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-2xl shadow-lg px-6 py-5 text-center max-w-xs pointer-events-auto mx-4">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">No spots saved yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Tap any place on the map or use the search bar to save your first spot.
            </p>
          </div>
        </div>
      )}

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
          onAdd={onAddFromPoi ? (place) => { onAddFromPoi(place); handleClose() } : undefined}
          onCreateEvent={onCreateEventFromPoi ? (place) => { onCreateEventFromPoi(place); handleClose() } : undefined}
          alreadySaved={locations.some(l => l.place_id === selectedPoi.placeId)}
        />
      )}
    </>
  )
}
