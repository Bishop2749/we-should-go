'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReactionType } from '@/types'

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'check', emoji: '✅', label: 'Been here' },
  { type: 'hundred', emoji: '💯', label: '100' },
]

interface ReactionBarProps {
  locationId: string
  currentUserId: string | null
}

/**
 * Reaction chips for a location. Read-only counts for signed-out visitors
 * (there is no identity to attach a click to); clickable single-select for
 * signed-in users — reacting again with the same emoji clears it, reacting
 * with a different one replaces it, matching the one-reaction-per-user-per-
 * location unique constraint on pin_reactions.
 */
export default function ReactionBar({ locationId, currentUserId }: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<ReactionType, number>>({ fire: 0, check: 0, hundred: 0 })
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      const { data } = await supabase
        .from('pin_reactions')
        .select('user_id, reaction')
        .eq('location_id', locationId)

      if (cancelled) return

      const next: Record<ReactionType, number> = { fire: 0, check: 0, hundred: 0 }
      let mine: ReactionType | null = null
      for (const row of (data ?? []) as { user_id: string; reaction: ReactionType }[]) {
        next[row.reaction] += 1
        if (currentUserId && row.user_id === currentUserId) mine = row.reaction
      }
      setCounts(next)
      setMyReaction(mine)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [locationId, currentUserId])

  const toggle = useCallback(async (type: ReactionType) => {
    if (!currentUserId) return
    const supabase = createClient()
    const prev = myReaction

    if (prev === type) {
      setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }))
      setMyReaction(null)
      await supabase.from('pin_reactions').delete().eq('location_id', locationId).eq('user_id', currentUserId)
      return
    }

    setCounts((c) => {
      const next = { ...c }
      if (prev) next[prev] = Math.max(0, next[prev] - 1)
      next[type] += 1
      return next
    })
    setMyReaction(type)
    await supabase
      .from('pin_reactions')
      .upsert(
        { location_id: locationId, user_id: currentUserId, reaction: type },
        { onConflict: 'location_id,user_id' }
      )
  }, [currentUserId, locationId, myReaction])

  if (loading) return null

  const total = counts.fire + counts.check + counts.hundred
  // Signed out and nothing to show: no reactions exist and no way to add one.
  if (!currentUserId && total === 0) return null

  return (
    <div className="flex items-center gap-2 mb-4">
      {REACTIONS.map((r) => {
        const count = counts[r.type]
        const active = myReaction === r.type
        const interactive = !!currentUserId

        return (
          <button
            key={r.type}
            type="button"
            disabled={!interactive}
            onClick={() => toggle(r.type)}
            title={interactive ? r.label : r.label + ' (sign in to react)'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              active
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            } ${interactive ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'cursor-default'}`}
          >
            <span>{r.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
