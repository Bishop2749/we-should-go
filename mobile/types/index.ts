export interface Location {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  category: string
  notes?: string
  place_id?: string
  added_by?: string
  created_at: string
  neighborhood?: string
  source_name?: string
  source_url?: string
}

export const CATEGORIES = [
  { value: 'restaurant', label: 'Food', emoji: '🍽️', color: '#EF4444' },
  { value: 'bar', label: 'Bar', emoji: '🍺', color: '#F59E0B' },
  { value: 'cafe', label: 'Cafe', emoji: '☕', color: '#8B5CF6' },
  { value: 'activity', label: 'Activity', emoji: '🎯', color: '#3B82F6' },
  { value: 'park', label: 'Park', emoji: '🌿', color: '#10B981' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#EC4899' },
  { value: 'event', label: 'Event', emoji: '🎉', color: '#6366F1' },
  { value: 'other', label: 'Other', emoji: '📍', color: '#6B7280' },
]

export const NEON_USER_ID = '00000000-0000-0000-0000-000000000099'
