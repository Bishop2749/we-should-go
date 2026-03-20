'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/events'

interface PlacePreset {
  name: string
  address: string
  lat: number
  lng: number
  placeId: string
  googleMapsUrl: string
}

interface CreateEventModalProps {
  user: User
  /** Pre-fill the location when triggered from a map tap */
  preset?: PlacePreset | null
  onClose: () => void
  onCreated: (eventId: string) => void
}

interface FriendRow {
  profile: Profile
  selected: boolean
}

export default function CreateEventModal({ user, preset, onClose, onCreated }: CreateEventModalProps) {
  const supabase = createClient()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationName, setLocationName] = useState(preset?.name ?? '')
  const [locationAddress, setLocationAddress] = useState(preset?.address ?? '')
  const [locationLat, setLocationLat] = useState<number | null>(preset?.lat ?? null)
  const [locationLng, setLocationLng] = useState<number | null>(preset?.lng ?? null)
  const [locationPlaceId, setLocationPlaceId] = useState(preset?.placeId ?? '')
  const [locationMapsUrl, setLocationMapsUrl] = useState(preset?.googleMapsUrl ?? '')
  const [startsDate, setStartsDate] = useState('')
  const [startsTime, setStartsTime] = useState('')
  const [endsTime, setEndsTime] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [maxAttendees, setMaxAttendees] = useState('')

  // Invite state
  const [friends, setFriends] = useState<FriendRow[]>([])
  const [extraName, setExtraName] = useState('')
  const [extraPhone, setExtraPhone] = useState('')
  const [extraEmail, setExtraEmail] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Places autocomplete ref
  const locationInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Load friends from profiles (all other users for now)
  useEffect(() => {
    async function loadFriends() {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, phone')
        .neq('id', user.id)
        .limit(50)
      if (data) {
        setFriends((data as Profile[]).map(p => ({ profile: p, selected: false })))
      }
    }
    loadFriends()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Set up Places Autocomplete (only if no preset)
  useEffect(() => {
    if (preset || !locationInputRef.current || typeof google === 'undefined') return
    try {
      const ac = new google.maps.places.Autocomplete(locationInputRef.current, {
        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'url'],
      })
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return
        setLocationName(place.name ?? '')
        setLocationAddress(place.formatted_address ?? '')
        setLocationLat(place.geometry.location.lat())
        setLocationLng(place.geometry.location.lng())
        setLocationPlaceId(place.place_id ?? '')
        setLocationMapsUrl(place.url ?? '')
      })
      autocompleteRef.current = ac
    } catch {
      // google maps not ready
    }
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [preset])

  const toggleFriend = (id: string) => {
    setFriends(prev => prev.map(f => f.profile.id === id ? { ...f, selected: !f.selected } : f))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError('Title is required'); return }
    if (!locationName.trim()) { setError('Location is required'); return }
    if (!startsDate || !startsTime) { setError('Start date and time are required'); return }
    if (locationLat === null || locationLng === null) { setError('Please select a location from the suggestions'); return }

    const startsAt = new Date(`${startsDate}T${startsTime}`).toISOString()
    const endsAt = endsTime ? new Date(`${startsDate}T${endsTime}`).toISOString() : undefined

    setSaving(true)
    try {
      // Create the event
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          location_name: locationName.trim(),
          address: locationAddress || undefined,
          lat: locationLat,
          lng: locationLng,
          place_id: locationPlaceId || undefined,
          google_maps_url: locationMapsUrl || undefined,
          starts_at: startsAt,
          ends_at: endsAt,
          visibility,
          max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        }),
      })

      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Failed to create event')
      }

      const { event } = await res.json() as { event: { id: string } }

      // Build attendees list
      const attendees: { display_name: string; phone?: string; email?: string; user_id?: string }[] = []

      for (const f of friends.filter(f => f.selected)) {
        attendees.push({
          display_name: f.profile.display_name ?? 'Friend',
          phone: f.profile.phone ?? undefined,
          user_id: f.profile.id,
        })
      }

      if (extraName.trim()) {
        attendees.push({
          display_name: extraName.trim(),
          phone: extraPhone.trim() || undefined,
          email: extraEmail.trim() || undefined,
        })
      }

      if (attendees.length > 0) {
        const inviteRes = await fetch(`/api/events/${event.id}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendees }),
        })
        if (!inviteRes.ok) {
          console.warn('Event created but invite failed')
        }
      }

      onCreated(event.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h2 className="text-lg font-bold text-gray-900">Create Event</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <form id="create-event-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Event Title *
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Dinner at Chez Pierre, Hike to the summit…"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Location *
              </label>
              {preset ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-indigo-900 truncate">{preset.name}</p>
                    <p className="text-xs text-indigo-600 truncate">{preset.address}</p>
                  </div>
                </div>
              ) : (
                <input
                  ref={locationInputRef}
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="Search for a place…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              )}
            </div>

            {/* Date + Start time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  value={startsDate}
                  onChange={e => setStartsDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startsTime}
                  onChange={e => setStartsTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </div>
            </div>

            {/* End time (optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                End Time <span className="font-normal normal-case">(optional)</span>
              </label>
              <input
                type="time"
                value={endsTime}
                onChange={e => setEndsTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Description <span className="font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What's the plan? Any details for your guests…"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none"
              />
            </div>

            {/* Visibility toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    visibility === 'private'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>🔒</span>
                    <span className={`text-sm font-semibold ${visibility === 'private' ? 'text-indigo-700' : 'text-gray-700'}`}>
                      Private
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Only invited people can see this</p>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    visibility === 'public'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>🌐</span>
                    <span className={`text-sm font-semibold ${visibility === 'public' ? 'text-indigo-700' : 'text-gray-700'}`}>
                      Public
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Anyone in the app can see it</p>
                </button>
              </div>
            </div>

            {/* Max attendees */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Max Attendees <span className="font-normal normal-case">(optional)</span>
              </label>
              <input
                type="number"
                value={maxAttendees}
                onChange={e => setMaxAttendees(e.target.value)}
                placeholder="Unlimited"
                min={1}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>

            {/* Invite friends from profiles */}
            {friends.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Invite Friends
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {friends.map(f => (
                    <button
                      key={f.profile.id}
                      type="button"
                      onClick={() => toggleFriend(f.profile.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                        f.selected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        f.selected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {f.selected ? '✓' : (f.profile.display_name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {f.profile.display_name ?? 'User'}
                        </p>
                        {f.profile.phone && (
                          <p className="text-xs text-gray-400 truncate">{f.profile.phone}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invite non-user by name/phone/email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Invite Someone Else <span className="font-normal normal-case">(optional)</span>
              </label>
              <div className="space-y-2 p-3 rounded-xl border border-gray-200 bg-gray-50">
                <input
                  value={extraName}
                  onChange={e => setExtraName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
                />
                <input
                  value={extraPhone}
                  onChange={e => setExtraPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  type="tel"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
                />
                <input
                  value={extraEmail}
                  onChange={e => setExtraEmail(e.target.value)}
                  placeholder="Email (optional)"
                  type="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>

        {/* Footer actions — sticky */}
        <div className="flex-shrink-0 px-5 pb-8 pt-3 border-t border-gray-100 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-event-form"
              disabled={saving}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm disabled:opacity-50 shadow-sm transition-colors"
            >
              {saving ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
