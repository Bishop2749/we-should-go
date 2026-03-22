'use client'

import { useState, useRef } from 'react'
import { type Location, getCategoryMeta, NEON_USER_ID } from '@/types'

interface LocationCardProps {
  location: Location
  currentUserId: string | null
  onClose: () => void
  onDelete: (id: string) => void
}

export default function LocationCard({ location, currentUserId, onClose, onDelete }: LocationCardProps) {
  const meta = getCategoryMeta(location.category)
  const isNeon = location.added_by === NEON_USER_ID
  const isOwner = !isNeon && currentUserId === location.added_by
  const formattedDate = new Date(location.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  const [dragY, setDragY] = useState(0)
  const startY = useRef(0)
  const [copied, setCopied] = useState(false)

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY }
  const onTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) setDragY(delta)
  }
  const onTouchEnd = () => {
    if (dragY > 80) onClose()
    else setDragY(0)
  }

  const handleShare = async () => {
    const text = `We should go to ${location.name}! 📍`
    const url = location.google_maps_url || `https://www.google.com/maps/place/?q=place_id:${location.place_id ?? ''}`
    if (navigator.share) {
      await navigator.share({ title: location.name, text, url })
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform 0.2s' : 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Sheet */}
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl dark:shadow-black/30 mx-auto max-w-lg overflow-hidden">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Color bar — amber gradient for Neon, category color for others */}
          {isNeon ? (
            <div className="h-1 mx-5 rounded-full mt-2" style={{ background: 'linear-gradient(90deg, #F59E0B, #EF4444)' }} />
          ) : (
            <div className="h-1 mx-5 rounded-full mt-2" style={{ backgroundColor: meta.color }} />
          )}

          <div className="px-5 pt-3 pb-8">
            {/* Neon recommends header */}
            {isNeon && (
              <div className="flex items-center gap-1.5 mb-3 py-2 px-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <span className="text-base">✨</span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Neon recommends</span>
                <span className="ml-auto text-xs text-amber-400 dark:text-amber-500 italic">Your LA city guide</span>
              </div>
            )}

            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                {/* Category badge + neighborhood */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-sm">{meta.emoji}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: isNeon ? '#D97706' : meta.color }}>
                    {meta.label}
                  </span>
                  {isNeon && location.neighborhood && (
                    <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-full px-2 py-0.5 font-medium">
                      {location.neighborhood}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                  {location.name}
                </h2>

                {/* Address */}
                {location.address && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 truncate">{location.address}</p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-white transition-colors flex-shrink-0 mt-0.5"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Notes */}
            {location.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 mb-3 leading-relaxed">
                &ldquo;{location.description}&rdquo;
              </p>
            )}

            {/* Source attribution (Neon only) */}
            {isNeon && location.source_name && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-3">
                — {location.source_url ? (
                  <a href={location.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {location.source_name}
                  </a>
                ) : location.source_name}
              </p>
            )}

            {/* Added by + date (non-Neon only) */}
            {!isNeon && (
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {(location.added_by_name ?? '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Added by <span className="font-medium text-gray-600 dark:text-gray-300">{location.added_by_name ?? 'Someone'}</span> · {formattedDate}
                </span>
              </div>
            )}

            {/* Spacing for Neon cards before actions */}
            {isNeon && <div className="mb-4" />}

            {/* Actions */}
            <div className="flex gap-2.5">
              {/* Open in Google Maps — primary */}
              <a
                href={location.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}&query_place_id=${location.place_id ?? ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-white font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
                style={{ backgroundColor: isNeon ? '#F59E0B' : meta.color }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Open in Maps
              </a>

              {/* Directions */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address || location.name)}&destination_place_id=${location.place_id ?? ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/>
                </svg>
                Directions
              </a>

              {/* Street View */}
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Street View"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#F9A825">
                  <circle cx="12" cy="4.5" r="2.5"/>
                  <path d="M12 8.5c-1.2 0-2.1.5-2.8 1.2L7.2 12.5l1.6 1.1 1.2-1.6V17l-1.5 4h2l1-3h1l1 3h2L14 17v-5l1.2 1.6 1.6-1.1-2-2.8c-.7-.7-1.6-1.2-2.8-1.2z"/>
                </svg>
                Street View
              </a>

              {/* Delete (owner only, never for Neon) */}
              {isOwner && (
                <button
                  onClick={() => onDelete(location.id)}
                  className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                  title="Remove location"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                </button>
              )}
            </div>

            {/* We Should Go! share button */}
            <div className="relative mt-1">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors"
              >
                📍 We Should Go!
              </button>
              {copied && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-fade-in whitespace-nowrap">
                  Copied link!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
