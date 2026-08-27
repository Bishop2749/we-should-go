'use client'

import { useRouter } from 'next/navigation'
import type { Event, EventAttendee } from '@/types/events'
import { formatEventDate } from '@/types/events'

interface EventCardProps {
  event: Event
  attendeeCount?: number
  myStatus?: EventAttendee['status']
  onClose: () => void
  signedIn?: boolean
}

export default function EventCard({ event, attendeeCount = 0, myStatus, onClose, signedIn = true }: EventCardProps) {
  const router = useRouter()
  const mapsUrl = event.google_maps_url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_name)}`

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl dark:shadow-black/30 mx-auto max-w-lg overflow-hidden">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Purple accent bar */}
          <div className="h-1 mx-5 rounded-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

          <div className="px-5 pt-3 pb-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">📅</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                    Event
                  </span>
                  {event.visibility === 'private' && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">🔒</span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">{event.title}</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 truncate">{event.location_name}</p>
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

            {/* Date/time */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 mb-3">
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">{formatEventDate(event.starts_at)}</p>
              {event.ends_at && (
                <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">
                  Ends {new Date(event.ends_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* Organizer + attendees */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {event.organizer_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                By <span className="font-medium text-gray-600 dark:text-gray-300">{event.organizer_name}</span>
              </span>
              {attendeeCount > 0 && (
                <>
                  <span className="text-gray-200 dark:text-gray-700">·</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">👥 {attendeeCount} going</span>
                </>
              )}
              {myStatus && (
                <>
                  <span className="text-gray-200 dark:text-gray-700">·</span>
                  <span className={`text-xs font-semibold ${myStatus === 'accepted' ? 'text-emerald-600' : myStatus === 'declined' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {myStatus === 'accepted' ? '✓ Going' : myStatus === 'declined' ? '✗ Declined' : 'Invited'}
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              {signedIn ? (
                <button
                  onClick={() => { onClose(); router.push(`/event/${event.id}`) }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  View event
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  Sign in to RSVP
                </a>
              )}

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Open in Maps"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
