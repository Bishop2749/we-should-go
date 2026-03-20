'use client'

import { useEffect, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

interface PoiInfo {
  name: string
  address: string
  lat: number
  lng: number
  placeId: string
  googleMapsUrl: string
}

interface PoiCardProps {
  placeId: string
  lat: number
  lng: number
  onClose: () => void
  onAdd: (place: PoiInfo) => void
  alreadySaved: boolean
}

export default function PoiCard({ placeId, lat, lng, onClose, onAdd, alreadySaved }: PoiCardProps) {
  const placesLib = useMapsLibrary('places')
  const [info, setInfo] = useState<PoiInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!placesLib) return

    const service = new placesLib.PlacesService(document.createElement('div'))
    service.getDetails(
      { placeId, fields: ['name', 'formatted_address', 'geometry', 'url', 'place_id'] },
      (place, status) => {
        if (status === placesLib.PlacesServiceStatus.OK && place) {
          setInfo({
            name: place.name ?? '',
            address: place.formatted_address ?? '',
            lat: place.geometry?.location?.lat() ?? lat,
            lng: place.geometry?.location?.lng() ?? lng,
            placeId: place.place_id ?? placeId,
            googleMapsUrl: place.url ?? `https://www.google.com/maps/place/?q=place_id:${placeId}`,
          })
        }
        setLoading(false)
      }
    )
  }, [placesLib, placeId, lat, lng])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-2xl mx-auto max-w-lg overflow-hidden">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="px-5 pt-3 pb-8">
            {loading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading place info…</span>
              </div>
            ) : info ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{info.name}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{info.address}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors flex-shrink-0"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2.5">
                  {/* Add to We Should Go */}
                  {alreadySaved ? (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-50 text-emerald-600 font-semibold text-sm">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                      Already saved
                    </div>
                  ) : (
                    <button
                      onClick={() => info && onAdd(info)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Add to We Should Go
                    </button>
                  )}

                  {/* Open in Maps */}
                  <a
                    href={info.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Maps
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 py-4">Couldn't load place details.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
