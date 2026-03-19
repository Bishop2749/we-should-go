'use client'

import { useState } from 'react'
import { CATEGORIES, type Category } from '@/types'

interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
  placeId: string
  googleMapsUrl: string
}

interface AddLocationModalProps {
  place: PlaceResult
  onAdd: (data: {
    name: string
    description: string
    category: Category
    lat: number
    lng: number
    place_id: string
    address: string
    google_maps_url: string
    added_by_name: string
  }) => Promise<void>
  onClose: () => void
  userName: string
}

export default function AddLocationModal({ place, onAdd, onClose, userName }: AddLocationModalProps) {
  const [category, setCategory] = useState<Category>('restaurant')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onAdd({
        name: place.name,
        description,
        category,
        lat: place.lat,
        lng: place.lng,
        place_id: place.placeId,
        address: place.address,
        google_maps_url: place.googleMapsUrl,
        added_by_name: userName,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{place.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{place.address}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Category
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
                  ([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all text-xs font-medium ${
                        category === key
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-base">{meta.emoji}</span>
                      <span className="truncate w-full text-center leading-tight">{meta.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Notes <span className="font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why do you want to go? Any tips?"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
              >
                {saving ? 'Saving…' : 'Add place'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
