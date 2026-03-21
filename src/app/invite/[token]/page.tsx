import { createClient } from '@/lib/supabase/server'
import InviteSignInButton from './_components/InviteSignInButton'

interface PageProps {
  params: Promise<{ token: string }>
}

interface Invite {
  token: string
  created_by_name: string
  created_by_avatar: string | null
  used_by: string | null
  expires_at: string
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  const { data: invite, error } = await supabase
    .from('invites')
    .select('token, created_by_name, created_by_avatar, used_by, expires_at')
    .eq('token', token)
    .single()

  const isExpired = invite ? new Date(invite.expires_at) < new Date() : false
  const isUsed = invite ? invite.used_by !== null : false
  const isInvalid = error || !invite || isExpired || isUsed

  const inviteData = invite as Invite | null

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 shadow-lg mb-3">
            <span className="text-2xl">📍</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">We Should Go</h1>
        </div>

        {isInvalid ? (
          /* Error state */
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl dark:shadow-black/30 border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="text-5xl mb-4">
              {isUsed ? '🤝' : isExpired ? '⏰' : '🔍'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isUsed
                ? 'This invite has been used'
                : isExpired
                ? 'This invite has expired'
                : 'Invite not found'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              {isUsed
                ? 'This link has already been accepted. Ask your friend to send you a new one!'
                : isExpired
                ? 'Invite links expire after 7 days. Ask your friend to send you a fresh link.'
                : "We couldn't find this invite. Double-check the link or ask your friend to resend it."}
            </p>
          </div>
        ) : (
          /* Valid invite state */
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl dark:shadow-black/30 border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Decorative header band */}
            <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400" />

            <div className="p-8 text-center">
              {/* Sender avatar */}
              <div className="flex justify-center mb-5">
                {inviteData?.created_by_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inviteData.created_by_avatar}
                    alt={inviteData.created_by_name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-100 dark:ring-emerald-900/30 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-emerald-100 dark:ring-emerald-900/30 shadow-md">
                    {inviteData?.created_by_name.charAt(0).toUpperCase() ?? '?'}
                  </div>
                )}
              </div>

              {/* Headline */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                <span className="text-emerald-600 dark:text-emerald-400">{inviteData?.created_by_name}</span>
                <br />wants to explore the city with you
              </h2>

              {/* Subtext */}
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                Join We Should Go — a shared map where friends save places worth visiting together.
              </p>

              {/* Sign in button */}
              <InviteSignInButton token={token} />

              <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                By signing in, you agree to explore great places 📍
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          We Should Go · Save places, explore together
        </p>
      </div>
    </div>
  )
}
