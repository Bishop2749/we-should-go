'use client'

import { useCallback, useEffect, useState } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { type Location, type Category } from '@/types'
import MapComponent from '@/components/Map'
import AddLocationModal from '@/components/AddLocationModal'
import SearchBar from '@/components/SearchBar'
import InviteModal from '@/components/InviteModal'
import { useRouter } from 'next/navigation'

interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
  placeId: string
  googleMapsUrl: string
}

export default function MapPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [pendingPlace, setPendingPlace] = useState<PlaceResult | null>(null)

  const handlePlaceSelected = useCallback((place: PlaceResult) => {
    setPendingPlace(place)
    setShowAddModal(true)
  }, [])
  const [loading, setLoading] = useState(true)

  // Load user + locations on mount
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

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setLocations(data as Location[])
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
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading map…</p>
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
      <header className="flex-shrink-0 h-14 bg-white border-b border-gray-100 shadow-sm flex items-center gap-3 px-4 z-20">
        {/* Logo */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xl">📍</span>
          <h1 className="font-bold text-gray-900 text-base tracking-tight hidden sm:block">We Should Go</h1>
        </div>

        {/* Search bar — primary action */}
        <SearchBar onPlaceSelected={handlePlaceSelected} />

        {/* Right: invite + avatar + sign out */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Invite a friend button */}
          <button
            onClick={() => setShowInviteModal(true)}
            title="Invite a friend"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-emerald-50"
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

          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 hidden sm:block"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
          <MapComponent
            locations={locations}
            currentUserId={user?.id ?? null}
            onDeleteLocation={handleDeleteLocation}
            onAddFromPoi={(place) => {
              setPendingPlace({ ...place, placeId: place.placeId })
              setShowAddModal(true)
            }}
          />

          {/* Category legend */}
          <div className="absolute bottom-6 left-4 sm:left-6 z-10">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-white/50 px-3 py-2 hidden sm:block">
              <div className="flex flex-col gap-1">
                {[
                  { emoji: '🍽️', label: 'Restaurant', color: '#ef4444' },
                  { emoji: '🍺', label: 'Bar', color: '#f59e0b' },
                  { emoji: '🎯', label: 'Activity', color: '#3b82f6' },
                  { emoji: '🎉', label: 'Event', color: '#a855f7' },
                  { emoji: '📍', label: 'Other', color: '#6b7280' },
                ].map(({ emoji, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-600">{emoji} {label}</span>
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

          {/* Invite modal */}
          {showInviteModal && (
            <InviteModal onClose={() => setShowInviteModal(false)} />
          )}
      </div>
    </div>
    </APIProvider>
  )
}
