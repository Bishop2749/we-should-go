'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Event, EventAttendee } from '@/types/events'
import { formatEventTime, formatEventShortDate } from '@/types/events'
import Link from 'next/link'

interface EventWithRsvp extends Event {
  myStatus?: EventAttendee['status']
  attendeeCount: number
}

function RsvpBadge({ status, isOrganizer }: { status?: EventAttendee['status']; isOrganizer?: boolean }) {
  if (isOrganizer) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
        Organizer
      </span>
    )
  }
  if (status === 'accepted') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">✓ Going</span>
  }
  if (status === 'declined') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">✗ Can't go</span>
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">Invited</span>
}

function groupEvents(events: EventWithRsvp[]): Record<string, EventWithRsvp[]> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart.getTime() + 86400000)
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000)

  const groups: Record<string, EventWithRsvp[]> = {
    Today: [],
    Tomorrow: [],
    'This Week': [],
    Later: [],
  }

  for (const event of events) {
    const d = new Date(event.starts_at)
    if (d < todayStart) continue // skip past events
    if (d < tomorrowStart) groups['Today'].push(event)
    else if (d < new Date(tomorrowStart.getTime() + 86400000)) groups['Tomorrow'].push(event)
    else if (d < weekEnd) groups['This Week'].push(event)
    else groups['Later'].push(event)
  }

  return groups
}

export default function CalendarPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<EventWithRsvp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Fetch events I'm organizing
      const { data: organized } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })

      // Fetch attendee records to find events I'm invited to
      const { data: myAttendees } = await supabase
        .from('event_attendees')
        .select('event_id, status')
        .eq('user_id', user.id)

      const attendeeEventIds = (myAttendees ?? []).map((a: { event_id: string }) => a.event_id)
      const statusByEventId: Record<string, EventAttendee['status']> = {}
      for (const a of (myAttendees ?? []) as { event_id: string; status: EventAttendee['status'] }[]) {
        statusByEventId[a.event_id] = a.status
      }

      let invitedEvents: Event[] = []
      if (attendeeEventIds.length > 0) {
        const { data } = await supabase
          .from('events')
          .select('*')
          .in('id', attendeeEventIds)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
        invitedEvents = (data ?? []) as Event[]
      }

      // Merge, deduplicate, get attendee counts
      const allEventIds = new Set<string>()
      const merged: Event[] = []
      for (const e of [...(organized ?? []), ...invitedEvents] as Event[]) {
        if (!allEventIds.has(e.id)) {
          allEventIds.add(e.id)
          merged.push(e)
        }
      }

      // Fetch attendee counts for all events
      const counts: Record<string, number> = {}
      if (merged.length > 0) {
        const { data: countData } = await supabase
          .from('event_attendees')
          .select('event_id')
          .in('event_id', merged.map(e => e.id))
          .eq('status', 'accepted')
        for (const row of (countData ?? []) as { event_id: string }[]) {
          counts[row.event_id] = (counts[row.event_id] ?? 0) + 1
        }
      }

      const withRsvp: EventWithRsvp[] = merged
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .map(e => ({
          ...e,
          myStatus: statusByEventId[e.id],
          attendeeCount: counts[e.id] ?? 0,
        }))

      setEvents(withRsvp)
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = groupEvents(events)
  const hasAny = events.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/map" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">🗓️</span>
            <h1 className="font-bold text-gray-900">My Calendar</h1>
          </div>
          {user && (
            <Link
              href="/map"
              className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-700 px-3 py-1.5 rounded-xl hover:bg-indigo-50"
            >
              + Create Event
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading events…</p>
            </div>
          </div>
        ) : !hasAny ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="text-6xl">🗓️</div>
            <h2 className="text-xl font-bold text-gray-900">No upcoming events</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              No upcoming events — create one from the map!
            </p>
            <Link
              href="/map"
              className="mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-sm transition-colors"
            >
              Open Map
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groups).map(([group, groupEvents]) => {
              if (groupEvents.length === 0) return null
              return (
                <div key={group}>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{group}</h2>
                  <div className="space-y-3">
                    {groupEvents.map(event => (
                      <Link
                        key={event.id}
                        href={`/event/${event.id}`}
                        className="block bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: date block */}
                          <div className="flex-shrink-0 w-12 text-center">
                            <div className="text-2xl font-bold text-indigo-600 leading-none">
                              {new Date(event.starts_at).getDate()}
                            </div>
                            <div className="text-xs text-gray-400 font-medium mt-0.5">
                              {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                          </div>

                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h3 className="text-sm font-bold text-gray-900 truncate">{event.title}</h3>
                              {event.visibility === 'private' && <span className="text-gray-400 text-xs">🔒</span>}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{event.location_name}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-400">
                                {formatEventTime(event.starts_at)}
                              </span>
                              {event.attendeeCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  👥 {event.attendeeCount} going
                                </span>
                              )}
                            </div>
                          </div>

                          {/* RSVP badge */}
                          <div className="flex-shrink-0">
                            <RsvpBadge
                              status={event.myStatus}
                              isOrganizer={event.organizer_id === user?.id}
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
