export interface Event {
  id: string
  title: string
  description?: string
  location_name: string
  address?: string
  lat: number
  lng: number
  place_id?: string
  google_maps_url?: string
  starts_at: string
  ends_at?: string
  organizer_id: string
  organizer_name: string
  visibility: 'public' | 'private'
  max_attendees?: number
  created_at: string
}

export interface EventAttendee {
  id: string
  event_id: string
  user_id?: string
  display_name: string
  phone?: string
  email?: string
  status: 'invited' | 'accepted' | 'declined'
  invited_by: string
  created_at: string
  responded_at?: string
}

export interface Profile {
  id: string
  display_name?: string
  avatar_url?: string
  phone?: string
}

/** Format a date string to human-friendly: "Saturday, Mar 22 · 7:00 PM" */
export function formatEventDate(isoString: string): string {
  const d = new Date(isoString)
  const day = d.toLocaleDateString('en-US', { weekday: 'long' })
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day}, ${date} · ${time}`
}

/** Format just the time portion */
export function formatEventTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Format just the short date */
export function formatEventShortDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
