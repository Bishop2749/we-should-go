'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type State =
  | { status: 'loading' }
  | { status: 'success'; friendName: string }
  | { status: 'already_friends'; friendName: string }
  | { status: 'error'; message: string }

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function accept() {
      // 1. Ensure user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace(`/invite/${token}`)
        return
      }

      // 2. Load the invite
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('id, token, created_by, created_by_name, used_by, expires_at')
        .eq('token', token)
        .single()

      if (inviteError || !invite) {
        if (!cancelled) setState({ status: 'error', message: "We couldn't find this invite. It may have been revoked." })
        return
      }

      // 3. Guard: expired or already used
      if (new Date(invite.expires_at) < new Date()) {
        if (!cancelled) setState({ status: 'error', message: 'This invite has expired. Ask your friend to send a new one.' })
        return
      }

      if (invite.used_by && invite.used_by !== user.id) {
        if (!cancelled) setState({ status: 'error', message: 'This invite has already been accepted by someone else.' })
        return
      }

      // 4. Don't let someone accept their own invite
      if (invite.created_by === user.id) {
        if (!cancelled) setState({ status: 'error', message: "You can't accept your own invite — share it with a friend instead!" })
        return
      }

      // 5. Build canonical (user_a, user_b) ordering
      const [user_a, user_b] = [user.id, invite.created_by].sort()

      // 6. Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_a', user_a)
        .eq('user_b', user_b)
        .maybeSingle()

      if (existing) {
        if (!cancelled) setState({ status: 'already_friends', friendName: invite.created_by_name })
        return
      }

      // 7. Create friendship
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert({ user_a, user_b })

      if (friendshipError) {
        console.error('Friendship insert error:', friendshipError)
        if (!cancelled) setState({ status: 'error', message: 'Something went wrong creating the friendship. Please try again.' })
        return
      }

      // 8. Mark invite as used
      await supabase
        .from('invites')
        .update({ used_by: user.id, used_at: new Date().toISOString() })
        .eq('token', token)
      // Non-fatal if this fails — friendship is already created

      if (!cancelled) setState({ status: 'success', friendName: invite.created_by_name })
    }

    accept()
    return () => { cancelled = true }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 shadow-lg mb-3">
            <span className="text-2xl">📍</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">We Should Go</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400" />

          <div className="p-8 text-center">
            {state.status === 'loading' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                </div>
                <p className="text-gray-500 text-sm">Setting up your friendship…</p>
              </>
            )}

            {state.status === 'success' && (
              <>
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  You&apos;re now friends!
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  You and <strong className="text-gray-700">{state.friendName}</strong> are now friends on We Should Go. Start exploring the map together!
                </p>
                <Link
                  href="/map"
                  className="block w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors shadow-sm text-center"
                >
                  View the map 🗺️
                </Link>
              </>
            )}

            {state.status === 'already_friends' && (
              <>
                <div className="text-5xl mb-4">🤝</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Already friends!
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  You&apos;re already friends with <strong className="text-gray-700">{state.friendName}</strong> on We Should Go.
                </p>
                <Link
                  href="/map"
                  className="block w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors shadow-sm text-center"
                >
                  View the map 🗺️
                </Link>
              </>
            )}

            {state.status === 'error' && (
              <>
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  {state.message}
                </p>
                <Link
                  href="/map"
                  className="block w-full py-3.5 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors text-center"
                >
                  Go to map
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
