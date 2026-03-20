import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { status } = body as Record<string, unknown>

  if (status !== 'accepted' && status !== 'declined') {
    return NextResponse.json(
      { error: 'status must be "accepted" or "declined"' },
      { status: 400 }
    )
  }

  // Find the attendee record for this user on this event
  const { data: attendee, error: findError } = await supabase
    .from('event_attendees')
    .select('id, user_id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (findError || !attendee) {
    return NextResponse.json({ error: 'Attendee record not found' }, { status: 404 })
  }

  // Validate the user owns this attendee record
  if (attendee.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('event_attendees')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', attendee.id)
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to update RSVP:', error)
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 })
  }

  return NextResponse.json({ attendee: data })
}
