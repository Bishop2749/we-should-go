'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Friend {
  id: string
  display_name: string
  avatar_url?: string
  location_count: number
  friendship_id: string
}

interface FriendsPanelProps {
  currentUserId: string
  onClose: () => void
  onInvite: () => void
}

function Avatar({ name, url, size = 40 }: { name: string; url?: string; size?: number }) {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-pink-500', 'bg-amber-500', 'bg-cyan-500',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function FriendsPanel({ currentUserId, onClose, onInvite }: FriendsPanelProps) {
  const supabase = createClient()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFriends()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  async function loadFriends() {
    setLoading(true)

    // Get all friendships for current user
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, user_a, user_b')
      .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)

    if (!friendships?.length) {
      setFriends([])
      setLoading(false)
      return
    }

    // Collect friend IDs
    const friendIds = friendships.map(f =>
      f.user_a === currentUserId ? f.user_b : f.user_a
    )

    // Load profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', friendIds)

    // Load location counts per friend
    const { data: locations } = await supabase
      .from('locations')
      .select('added_by')
      .in('added_by', friendIds)

    const countMap: Record<string, number> = {}
    locations?.forEach(l => {
      countMap[l.added_by] = (countMap[l.added_by] ?? 0) + 1
    })

    const result: Friend[] = friendIds.map(id => {
      const profile = profiles?.find(p => p.id === id)
      const friendship = friendships.find(
        f => f.user_a === id || f.user_b === id
      )
      return {
        id,
        display_name: profile?.display_name ?? 'Unknown',
        avatar_url: profile?.avatar_url ?? undefined,
        location_count: countMap[id] ?? 0,
        friendship_id: friendship?.id ?? '',
      }
    })

    setFriends(result)
    setLoading(false)
  }

  async function removeFriend(friendshipId: string) {
    setRemoving(friendshipId)
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
    setRemoving(null)
  }

  return (
    <div
      ref={panelRef}
      className="absolute top-14 right-0 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-black/30 border border-gray-100 dark:border-gray-700 overflow-hidden"
      style={{ margin: '8px 12px 0 0' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-base">Friends</h2>
          {!loading && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {friends.length === 0 ? 'No friends yet' : `${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
            </p>
          )}
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

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No friends yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Invite someone to get started</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {friends.map(friend => (
              <li key={friend.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors">
                <Avatar name={friend.display_name} url={friend.avatar_url} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{friend.display_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {friend.location_count === 0
                      ? 'No locations saved yet'
                      : `${friend.location_count} location${friend.location_count !== 1 ? 's' : ''} saved`}
                  </p>
                </div>
                <button
                  onClick={() => removeFriend(friend.friendship_id)}
                  disabled={removing === friend.friendship_id}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                  title="Remove friend"
                >
                  {removing === friend.friendship_id ? (
                    <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800">
        <button
          onClick={onInvite}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Invite a friend
        </button>
      </div>
    </div>
  )
}
