'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { APIProvider } from '@vis.gl/react-google-maps'
import { createClient } from '@/lib/supabase/client'
import { NEON_USER_ID, type Location } from '@/types'
import type { Event } from '@/types/events'
import Map from '@/components/Map'

interface EventWithMeta extends Event {
  attendeeCount?: number
}

/**
 * Read-only public demo.
 *
 * Shows the curated "Neon" pins plus the handful of events/RSVPs/reactions
 * seeded onto the mock friend accounts (see supabase/demo-seed.sql) — all of
 * which anon is allowed to read (see supabase/demo-mode.sql). No auth, no
 * writes: onAddFromPoi is omitted so PoiCard shows a sign-in prompt instead
 * of a dead button, onDeleteLocation is an unreachable no-op since
 * currentUserId={null} means LocationCard never renders the delete button,
 * and EventCard's RSVP action becomes a sign-in link via signedIn={false}
 * on Map.
 */
export default function DemoPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [events, setEvents] = useState<EventWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('added_by', NEON_USER_ID)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setLocations(data ?? [])

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .order('starts_at', { ascending: true })

      if (eventData && eventData.length > 0) {
        const evts = eventData as Event[]
        const { data: countData } = await supabase
          .from('event_attendees')
          .select('event_id')
          .in('event_id', evts.map((e) => e.id))
          .eq('status', 'accepted')

        const countMap: Record<string, number> = {}
        for (const row of (countData ?? []) as { event_id: string }[]) {
          countMap[row.event_id] = (countMap[row.event_id] ?? 0) + 1
        }
        setEvents(evts.map((e) => ({ ...e, attendeeCount: countMap[e.id] ?? 0 })))
      }

      setLoading(false)
    })()
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Demo banner */}
      <div className="shrink-0 bg-emerald-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <p className="font-medium">
          Demo mode — a curated set of LA spots, read-only.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="underline underline-offset-2 hover:text-emerald-100">
            About
          </Link>
          <Link
            href="/login"
            className="bg-white text-emerald-700 font-semibold px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 grid place-items-center text-gray-500">
            Loading the map…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-red-500">
            Couldn’t load the demo map: {error}
          </div>
        )}
        {!loading && !error && (
          <APIProvider
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            libraries={['places']}
          >
            <Map
              locations={locations}
              events={events}
              currentUserId={null}
              onDeleteLocation={() => {}}
              showNeonOverlay
              filters={{ neighborhoods: [], categories: [], show: 'all' }}
            />
          </APIProvider>
        )}
      </div>
    </div>
  )
}
