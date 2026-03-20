import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    title,
    description,
    location_name,
    address,
    lat,
    lng,
    place_id,
    google_maps_url,
    starts_at,
    ends_at,
    visibility,
    max_attendees,
  } = body as Record<string, unknown>

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!location_name || typeof location_name !== 'string') {
    return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat/lng must be numbers' }, { status: 400 })
  }
  if (!starts_at || typeof starts_at !== 'string') {
    return NextResponse.json({ error: 'starts_at is required' }, { status: 400 })
  }

  const organizerName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Someone'

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: (title as string).trim(),
      description: description ?? null,
      location_name,
      address: address ?? null,
      lat,
      lng,
      place_id: place_id ?? null,
      google_maps_url: google_maps_url ?? null,
      starts_at,
      ends_at: ends_at ?? null,
      organizer_id: user.id,
      organizer_name: organizerName,
      visibility: visibility ?? 'private',
      max_attendees: max_attendees ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  return NextResponse.json({ event: data })
}
