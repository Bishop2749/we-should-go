'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Event, EventAttendee } from '@/types/events'
import { formatEventDate } from '@/types/events'
import Link from 'next/link'

function InitialAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initial = (name ?? '?').charAt(0).toUpperCase()
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sizeClass} rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 flex-shrink-0`}>
      {initial}
    </div>
  )
}

function StatusBadge({ status }: { status: EventAttendee['status'] }) {
  if (status === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Going
      </span>
    )
  }
  if (status === 'declined') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Can't go
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Invited
    </span>
  )
}

interface InviteSheetProps {
  eventId: string
  onClose: () => void
  onInvited: () => void
}

function InviteSheet({ eventId, onClose, onInvited }: InviteSheetProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendees: [{ display_name: name.trim(), phone: phone || undefined, email: email || undefined }],
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Failed to invite')
      }
      onInvited()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-2xl mx-auto max-w-lg overflow-hidden">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="px-5 pt-3 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Invite someone</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Friend's name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone <span className="font-normal normal-case">(optional)</span></label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+12135550100"
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email <span className="font-normal normal-case">(optional)</span></label>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !name.trim()} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 shadow-sm">
                  {saving ? 'Inviting…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [myAttendee, setMyAttendee] = useState<EventAttendee | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvping, setRsvping] = useState(false)
  const [showInviteSheet, setShowInviteSheet] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      setError("Event not found or you don't have access.")
      setLoading(false)
      return
    }

    setEvent(eventData as Event)

    const { data: attendeeData } = await supabase
      .from('event_attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    const allAttendees = (attendeeData ?? []) as EventAttendee[]
    setAttendees(allAttendees)

    if (user) {
      const mine = allAttendees.find(a => a.user_id === user.id)
      setMyAttendee(mine ?? null)
    }

    setLoading(false)
  }, [eventId, supabase])

  useEffect(() => { loadData() }, [loadData])

  const handleRsvp = async (status: 'accepted' | 'declined') => {
    if (!event) return
    setRsvping(true)
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      await loadData()
    } catch {
      // silent
    } finally {
      setRsvping(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading event…</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-5xl">🗓️</div>
          <h2 className="text-xl font-bold text-gray-900">{error ?? 'Event not found'}</h2>
          <Link href="/map" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold text-sm">
            Back to map
          </Link>
        </div>
      </div>
    )
  }

  const isOrganizer = user?.id === event.organizer_id
  const acceptedCount = attendees.filter(a => a.status === 'accepted').length
  const mapsUrl = event.google_maps_url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_name)}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back nav */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="font-semibold text-gray-900 truncate flex-1">{event.title}</span>
          {event.visibility === 'private' && (
            <span title="Private event" className="text-gray-400">🔒</span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Hero card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Purple gradient hero */}
          <div className="h-36 bg-gradient-to-br from-indigo-500 to-purple-600 relative flex items-end p-5">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/80 text-2xl">📅</span>
                {event.visibility === 'private' && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">🔒 Private</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">{event.title}</h1>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Date/time */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{formatEventDate(event.starts_at)}</p>
                {event.ends_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ends {new Date(event.ends_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-600" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{event.location_name}</p>
                {event.address && <p className="text-xs text-gray-400 mt-0.5">{event.address}</p>}
              </div>
            </div>

            {/* Organizer */}
            <div className="flex items-center gap-3">
              <InitialAvatar name={event.organizer_name} />
              <div>
                <p className="text-xs text-gray-400">Organized by</p>
                <p className="text-sm font-semibold text-gray-900">{event.organizer_name}</p>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Open in Maps */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Open in Maps
            </a>
          </div>
        </div>

        {/* RSVP section — shown if invited and not organizer */}
        {myAttendee && !isOrganizer && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Your RSVP</h3>
            <div className="flex items-center justify-between">
              <StatusBadge status={myAttendee.status} />
              <div className="flex gap-2">
                <button
                  onClick={() => handleRsvp('accepted')}
                  disabled={rsvping || myAttendee.status === 'accepted'}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm disabled:opacity-40 transition-colors"
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => handleRsvp('declined')}
                  disabled={rsvping || myAttendee.status === 'declined'}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm disabled:opacity-40 transition-colors"
                >
                  ✗ Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attendees */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">
              Attendees
              {attendees.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {acceptedCount} going · {attendees.length} invited
                </span>
              )}
            </h3>
            {isOrganizer && (
              <button
                onClick={() => setShowInviteSheet(true)}
                className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-700"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Invite more
              </button>
            )}
          </div>

          {attendees.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No one invited yet.</p>
          ) : (
            <ul className="space-y-2">
              {attendees.map(a => (
                <li key={a.id} className="flex items-center gap-3">
                  <InitialAvatar name={a.display_name} size="sm" />
                  <span className="flex-1 text-sm font-medium text-gray-900">{a.display_name}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}

          {event.max_attendees && (
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
              Max {event.max_attendees} attendees · {Math.max(0, event.max_attendees - acceptedCount)} spots left
            </p>
          )}
        </div>
      </div>

      {showInviteSheet && (
        <InviteSheet
          eventId={event.id}
          onClose={() => setShowInviteSheet(false)}
          onInvited={loadData}
        />
      )}
    </div>
  )
}
