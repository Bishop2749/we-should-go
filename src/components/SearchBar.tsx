'use client'

import { useEffect, useRef } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
  placeId: string
  googleMapsUrl: string
}

interface SearchBarProps {
  onPlaceSelected: (place: PlaceResult) => void
}

export default function SearchBar({ onPlaceSelected }: SearchBarProps) {
  const placesLib = useMapsLibrary('places')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!placesLib || !inputRef.current) return

    const ac = new placesLib.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address', 'place_id', 'url'],
    })

    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return

      onPlaceSelected({
        name: place.name ?? '',
        address: place.formatted_address ?? '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id ?? '',
        googleMapsUrl: place.url ?? '',
      })

      // Clear the input after selection
      if (inputRef.current) inputRef.current.value = ''
    })

    return () => {
      google.maps.event.clearInstanceListeners(ac)
    }
  }, [placesLib, onPlaceSelected])

  return (
    <div className="relative flex-1 max-w-sm">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a place to add…"
        className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 border border-transparent dark:border-gray-600 focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
      />
    </div>
  )
}
