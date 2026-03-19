export interface Location {
  id: string
  created_at: string
  name: string
  description: string | null
  category: string
  lat: number
  lng: number
  place_id: string | null
  address: string | null
  google_maps_url: string | null
  added_by: string | null
  added_by_name: string | null
}

export type Category = 'restaurant' | 'bar' | 'activity' | 'event' | 'other'

export interface CategoryMeta {
  label: string
  emoji: string
  color: string
  bgColor: string
  textColor: string
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  restaurant: {
    label: 'Restaurant',
    emoji: '🍽️',
    color: '#ef4444',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
  },
  bar: {
    label: 'Bar',
    emoji: '🍺',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600',
  },
  activity: {
    label: 'Activity',
    emoji: '🎯',
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
  },
  event: {
    label: 'Event',
    emoji: '🎉',
    color: '#a855f7',
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-600',
  },
  other: {
    label: 'Other',
    emoji: '📍',
    color: '#6b7280',
    bgColor: 'bg-gray-500',
    textColor: 'text-gray-600',
  },
}

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORIES[category as Category] ?? CATEGORIES.other
}
