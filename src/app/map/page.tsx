'use client'

import { useCallback, useEffect, useState } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { type Location, type Category, type LocationStatus } from '@/types'
import type { Event, EventAttendee } from '@/types/events'
import MapComponent from '@/components/Map'
import FilterPanel, { type FilterState } from '@/components/FilterPanel'
import AddLocationModal from '@/components/AddLocationModal'
import SearchBar from '@/components/SearchBar'
import InviteModal from '@/components/InviteModal'
import CreateEventModal from '@/components/CreateEventModal'
import ProfileModal from '@/components/ProfileModal'
import FriendsPanel from '@/components/FriendsPanel'
import ActivityFeed from '@/components/ActivityFeed'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
  placeId: string
  googleMapsUrl: string
}

interface EventWithMeta extends Event {
  myStatus?: EventAttendee['status']
  attendeeCount?: number
}

export default function MapPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [events, setEvents] = useState<EventWithMeta[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showFriendsPanel, setShowFriendsPanel] = useState(false)
  const [pendingPlace, setPendingPlace] = useState<PlaceResult | null>(null)
  const [pendingEventPlace, setPendingEventPlace] = useState<PlaceResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNeonOverlay, setShowNeonOverlay] = useState(true)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    neighborhoods: [],
    categories: [],
    show: 'all',
  })
  const [showActivityFeed, setShowActivityFeed] = useState(false)
  const [userStatuses, setUserStatuses] = useState<Record<string, LocationStatus>>({})

  const handlePlaceSelected = useCallback((place: PlaceResult) => {
    setPendingPlace(place)
    setShowAddModal(true)
  }, [])

  // Load user + locations + events on mount
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load locations
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (!locationError && locationData) {
        setLocations(locationData as Location[])
      }

      // Load user's location statuses (graceful degradation if table doesn't exist)
      try {
        const { data: statusData } = await supabase
          .from('location_user_status')
          .select('location_id, status')
          .eq('user_id', user.id)

        if (statusData) {
          const statusMap: Record<string, LocationStatus> = {}
          for (const s of statusData as { location_id: string; status: LocationStatus }[]) {
            statusMap[s.location_id] = s.status
          }
          setUserStatuses(statusMap)
        }
      } catch {
        // Table may not exist yet
      }

      // Load events (public + mine + invited)
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .order('starts_at', { ascending: true })

      if (eventData) {
        const evts = eventData as Event[]

        // Get my attendee records for status
        const { data: myAttendees } = await supabase
          .from('event_attendees')
          .select('event_id, status')
          .eq('user_id', user.id)

        const statusMap: Record<string, EventAttendee['status']> = {}
        for (const a of (myAttendees ?? []) as { event_id: string; status: EventAttendee['status'] }[]) {
          statusMap[a.event_id] = a.status
        }

        // Get attendee counts
        const countMap: Record<string, number> = {}
        if (evts.length > 0) {
          const { data: countData } = await supabase
            .from('event_attendees')
            .select('event_id')
            .in('event_id', evts.map(e => e.id))
            .eq('status', 'accepted')
          for (const row of (countData ?? []) as { event_id: string }[]) {
            countMap[row.event_id] = (countMap[row.event_id] ?? 0) + 1
          }
        }

        setEvents(evts.map(e => ({
          ...e,
          myStatus: statusMap[e.id],
          attendeeCount: countMap[e.id] ?? 0,
        })))
      }

      setLoading(false)
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddLocation = useCallback(
    async (data: {
      name: string
      description: string
      category: Category
      lat: number
      lng: number
      place_id: string
      address: string
      google_maps_url: string
      added_by_name: string
    }) => {
      if (!user) return

      const { data: inserted, error } = await supabase
        .from('locations')
        .insert({
          ...data,
          added_by: user.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      if (inserted) {
        setLocations((prev) => [inserted as Location, ...prev])
      }
      setShowAddModal(false)
    },
    [user, supabase]
  )

  const handleDeleteLocation = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('locations').delete().eq('id', id)
      if (!error) {
        setLocations((prev) => prev.filter((l) => l.id !== id))
      }
    },
    [supabase]
  )

  const handleEventCreated = useCallback((eventId: string) => {
    // Reload events after creation
    async function reload() {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .order('starts_at', { ascending: true })
      if (eventData) {
        const evts = eventData as Event[]
        if (!user) return
        const { data: myAttendees } = await supabase
          .from('event_attendees')
          .select('event_id, status')
          .eq('user_id', user.id)
        const statusMap: Record<string, EventAttendee['status']> = {}
        for (const a of (myAttendees ?? []) as { event_id: string; status: EventAttendee['status'] }[]) {
          statusMap[a.event_id] = a.status
        }
        const countMap: Record<string, number> = {}
        if (evts.length > 0) {
          const { data: countData } = await supabase
            .from('event_attendees')
            .select('event_id')
            .in('event_id', evts.map(e => e.id))
            .eq('status', 'accepted')
          for (const row of (countData ?? []) as { event_id: string }[]) {
            countMap[row.event_id] = (countMap[row.event_id] ?? 0) + 1
          }
        }
        setEvents(evts.map(e => ({
          ...e,
          myStatus: statusMap[e.id],
          attendeeCount: countMap[e.id] ?? 0,
        })))
      }
    }
    reload()
    void eventId // will navigate on click in EventCard
  }, [user, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    'Someone'

  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading map…</p>
        </div>
      </div>
    )
  }

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={['places']}
    >
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/50 shadow-sm flex items-center gap-3 px-4 z-20">
        {/* Logo */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xl">📍</span>
          <h1 className="font-bold text-gray-900 dark:text-white text-base tracking-tight hidden sm:block">We Should Go</h1>
        </div>

        {/* Search bar — primary action */}
        <SearchBar onPlaceSelected={handlePlaceSelected} />

        {/* Right: calendar + invite + create event + avatar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Neon toggle */}
          <button
            onClick={() => setShowNeonOverlay(v => !v)}
            className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1.5 rounded-lg ${
              showNeonOverlay
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                : 'text-gray-500 dark:text-gray-200 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }`}
            title="Neon city guide"
          >
            <span>✨</span>
            <span className="hidden sm:block">Neon</span>
          </button>

          {/* Filters button */}
          {(() => {
            const activeFilterCount =
              filters.neighborhoods.length +
              filters.categories.length +
              (filters.show !== 'all' ? 1 : 0)
            return (
              <button
                onClick={() => setShowFilterPanel(true)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2 py-1.5 rounded-lg ${
                  activeFilterCount > 0
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-gray-600 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                <span className="hidden sm:block">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )
          })()}

          {/* Calendar */}
          <Link
            href="/calendar"
            title="My Calendar"
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-200 hover:text-indigo-400 dark:hover:text-indigo-400 font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="hidden sm:block">Calendar</span>
          </Link>

          {/* Create Event */}
          <button
            onClick={() => { setPendingEventPlace(null); setShowCreateEventModal(true) }}
            title="Create an event"
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-200 hover:text-indigo-400 dark:hover:text-indigo-400 font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/>
            </svg>
            <span className="hidden sm:block">Event</span>
          </button>

          {/* Activity Feed */}
          <button
            onClick={() => setShowActivityFeed(v => !v)}
            title="Recent Activity"
            className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1.5 rounded-lg ${
              showActivityFeed
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                : 'text-gray-500 dark:text-gray-200 hover:text-emerald-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="hidden sm:block">Activity</span>
          </button>

          {/* Friends */}
          <div className="relative">
            <button
              onClick={() => setShowFriendsPanel(v => !v)}
              title="Friends"
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-200 hover:text-emerald-400 dark:hover:text-emerald-400 font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="hidden sm:block">Friends</span>
            </button>
            {showFriendsPanel && user && (
              <FriendsPanel
                currentUserId={user.id}
                onClose={() => setShowFriendsPanel(false)}
                onInvite={() => { setShowFriendsPanel(false); setShowInviteModal(true) }}
              />
            )}
          </div>

          {/* Invite a friend button */}
          <button
            onClick={() => setShowInviteModal(true)}
            title="Invite a friend"
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-200 hover:text-emerald-400 dark:hover:text-emerald-400 font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <span className="hidden sm:block">Invite</span>
          </button>

          {/* Avatar / Profile */}
          <button
            onClick={() => setShowProfileModal(true)}
            title="Edit profile"
            className="flex items-center"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 hover:bg-emerald-600 transition-colors">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:block"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
          <MapComponent
            locations={locations}
            events={events}
            currentUserId={user?.id ?? null}
            userStatuses={userStatuses}
            onDeleteLocation={handleDeleteLocation}
            onAddFromPoi={(place) => {
              setPendingPlace({ ...place, placeId: place.placeId })
              setShowAddModal(true)
            }}
            onCreateEventFromPoi={(place) => {
              setPendingEventPlace(place)
              setShowCreateEventModal(true)
            }}
            showNeonOverlay={showNeonOverlay}
            filters={filters}
          />

          {/* Category legend */}
          <div className="absolute bottom-6 left-4 sm:left-6 z-10">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-md dark:shadow-black/30 border border-white/50 dark:border-gray-700/50 px-3 py-2 hidden sm:block">
              <div className="flex flex-col gap-1">
                {[
                  { emoji: '🍽️', label: 'Restaurant', color: '#ef4444' },
                  { emoji: '🍺', label: 'Bar', color: '#f59e0b' },
                  { emoji: '🎯', label: 'Activity', color: '#3b82f6' },
                  { emoji: '🎉', label: 'Saved Event', color: '#a855f7' },
                  { emoji: '📍', label: 'Other', color: '#6b7280' },
                  { emoji: '📅', label: 'Event Pin', color: '#6366f1' },
                  { emoji: '✨', label: 'Neon Pick', color: '#F59E0B' },
                ].map(({ emoji, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{emoji} {label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add location modal */}
          {showAddModal && pendingPlace && (
            <AddLocationModal
              place={pendingPlace}
              onAdd={handleAddLocation}
              onClose={() => { setShowAddModal(false); setPendingPlace(null) }}
              userName={userName}
            />
          )}

          {/* Create Event modal */}
          {showCreateEventModal && user && (
            <CreateEventModal
              user={user}
              preset={pendingEventPlace}
              onClose={() => { setShowCreateEventModal(false); setPendingEventPlace(null) }}
              onCreated={handleEventCreated}
            />
          )}

          {/* Invite modal */}
          {showInviteModal && (
            <InviteModal onClose={() => setShowInviteModal(false)} />
          )}

          {/* Profile modal */}
          {showProfileModal && user && (
            <ProfileModal
              user={user}
              onClose={() => setShowProfileModal(false)}
            />
          )}

          {/* Activity Feed */}
          {showActivityFeed && user && (
            <ActivityFeed
              currentUserId={user.id}
              onClose={() => setShowActivityFeed(false)}
            />
          )}

          {/* Filter Panel */}
          {showFilterPanel && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClose={() => setShowFilterPanel(false)}
            />
          )}
      </div>
    </div>
    </APIProvider>
  )
}
