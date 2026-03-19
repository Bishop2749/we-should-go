import { type Location, getCategoryMeta } from '@/types'

interface LocationCardProps {
  location: Location
  currentUserId: string | null
  onClose: () => void
  onDelete: (id: string) => void
}

export default function LocationCard({
  location,
  currentUserId,
  onClose,
  onDelete,
}: LocationCardProps) {
  const meta = getCategoryMeta(location.category)
  const isOwner = currentUserId && location.added_by === currentUserId

  const googleMapsUrl =
    location.google_maps_url ||
    (location.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${location.place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`)

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-72 overflow-hidden">
      {/* Header band */}
      <div className="h-1.5" style={{ backgroundColor: meta.color }} />

      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{meta.emoji}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                {location.name}
              </h3>
              {location.address && (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {location.address}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
          {location.added_by_name && (
            <span className="text-xs text-gray-400">
              added by <span className="font-medium text-gray-600">{location.added_by_name}</span>
            </span>
          )}
        </div>

        {/* Description */}
        {location.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
            {location.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Open in Maps
          </a>
          {isOwner && (
            <button
              onClick={() => onDelete(location.id)}
              className="py-2 px-3 text-red-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
