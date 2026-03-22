'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCategoryMeta } from '@/types'

interface ActivityItem {
  type: 'location_added'
  user_name: string
  location_name: string
  category: string
  neighborhood?: string
  created_at: string
  location_id: string
}

interface ActivityFeedProps {
  currentUserId: string
  onClose: () => void
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ActivityFeed({ currentUserId, onClose }: ActivityFeedProps) {
  const supabase = createClient()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      // Get friend IDs from friendships table
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq('status', 'accepted')

      const friendIds: string[] = []
      for (const f of (friendships ?? [])) {
        if (f.user_id === currentUserId) friendIds.push(f.friend_id)
        else friendIds.push(f.user_id)
      }

      if (friendIds.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      // Get recent locations added by friends
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, category, neighborhood, created_at, added_by, added_by_name')
        .in('added_by', friendIds)
        .order('created_at', { ascending: false })
        .limit(20)

      if (locations) {
        setItems(
          locations.map(loc => ({
            type: 'location_added' as const,
            user_name: loc.added_by_name ?? 'Someone',
            location_name: loc.name,
            category: loc.category,
            neighborhood: loc.neighborhood ?? undefined,
            created_at: loc.created_at,
            location_id: loc.id,
          }))
        )
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false)
    }
  }, [currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-14 bottom-0 z-40 w-full sm:w-80 bg-white dark:bg-gray-900 shadow-2xl dark:shadow-black/40 border-l border-gray-100 dark:border-gray-800 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Activity</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <span className="text-4xl">🗺️</span>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Nothing yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                Your friends haven&apos;t saved any spots yet — or you might not have any friends added. Invite someone!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {items.map(item => {
                const meta = getCategoryMeta(item.category)
                const initial = item.user_name.charAt(0).toUpperCase()

                return (
                  <li
                    key={item.location_id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-default"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{initial}</span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                        <span className="font-semibold">{item.user_name}</span>
                        {' saved '}
                        <span className="font-medium">{meta.emoji} {item.location_name}</span>
                      </p>
                      {item.neighborhood && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.neighborhood} · {meta.label}</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(item.created_at)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
