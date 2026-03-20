import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

interface InviteAttendee {
  display_name: string
  phone?: string
  email?: string
  user_id?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params

  // Verify the event exists and the caller has access
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Only organizer (or invited users who want to forward) can invite
  // For now, restrict to organizer only
  if (event.organizer_id !== user.id) {
    return NextResponse.json({ error: 'Only the organizer can invite attendees' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { attendees } = body as { attendees: InviteAttendee[] }

  if (!Array.isArray(attendees) || attendees.length === 0) {
    return NextResponse.json({ error: 'attendees array is required' }, { status: 400 })
  }

  // Validate each attendee has a display_name
  for (const a of attendees) {
    if (!a.display_name || typeof a.display_name !== 'string') {
      return NextResponse.json({ error: 'Each attendee must have a display_name' }, { status: 400 })
    }
  }

  const rows = attendees.map((a) => ({
    event_id: eventId,
    user_id: a.user_id ?? null,
    display_name: a.display_name,
    phone: a.phone ?? null,
    email: a.email ?? null,
    status: 'invited' as const,
    invited_by: user.id,
  }))

  const { data, error } = await supabase
    .from('event_attendees')
    .insert(rows)
    .select()

  if (error || !data) {
    console.error('Failed to invite attendees:', error)
    return NextResponse.json({ error: 'Failed to invite attendees' }, { status: 500 })
  }

  // Send SMS stubs for attendees with phone numbers
  // TODO: Replace sendSms stub with real Twilio integration (see src/lib/sms.ts)
  for (const a of attendees) {
    if (a.phone) {
      await sendSms(
        a.phone,
        `You're invited to ${event.title}! Open the link to RSVP: ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://we-should-go.app'}/event/${eventId}`
      )
    }
  }

  return NextResponse.json({ attendees: data })
}
